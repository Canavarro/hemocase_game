import { randomBytes, randomInt, randomUUID } from "node:crypto";
import { generateEscapeCase, validateDisease } from "./case-generator.js";
import {
  bankQuestionToBlitz, buildBankEmergencyFiles, validateDiseaseAgainstCanon, validateMedicalContent,
  type EmergencyFileEntry,
} from "./medical-content.js";
import {
  coreMedicalDiseaseIds,
  type BlitzOptions,
  type MedicalKnowledgeBase,
  type QuestionBank,
  ESCAPE_SAFE_LOCK_MS,
  ESCAPE_SAFE_WRONG_COST,
  ESCAPE_START_BASES,
  ESCAPE_WRONG_ATTEMPT_COST,
  escapeHintCosts,
  phaseLabels,
  type EscapeCase,
  type EscapeEvent,
  type EscapeHostTeamRow,
  type EscapeRoomContent,
  type EscapeRoomId,
  type DiseaseKnowledge,
  type EscapeGeneratorRequest,
  type EscapeLibrary,
  type EscapeStep,
  type EscapeTeamView,
  type EscapeTopic,
  type GameContent,
  type GameMode,
  type HostAction,
  type IntegrityIncident,
  type IntegrityPolicy,
  type Phase,
  type PublicTeam,
  type Question,
  type SessionSnapshot,
  type TrackId,
} from "@hemocase/shared";

const phaseOrder: Phase[] = [
  "LOBBY", "FOCUS_CHECK", "WARMUP", "CASE_INVESTIGATION", "BLITZ",
  "FINAL_CHAIN", "REVEAL", "FINISHED",
];
const escapePhaseOrder: Phase[] = ["LOBBY", "BRIEFING", "ESCAPE", "DEBRIEF", "FINISHED"];
const competitivePhases = new Set<Phase>(["WARMUP", "CASE_INVESTIGATION", "BLITZ", "FINAL_CHAIN"]);
const tracks: TrackId[] = ["A", "B", "C", "D"];
/** Tipos de enigma cuja resposta depende da ordem dos elementos. */
const orderedAnswerTypes = new Set(["chain-fill", "mechanism-fill", "dial-safe", "code"]);
const ESCAPE_INTEGRITY_COST = 10;

interface TeamAnswer {
  choiceId: string;
  correct: boolean;
  potentialPoints: number;
  awardedPoints: number;
  submittedAt: number;
}

export interface TeamEscapeState {
  roomIndex: number;
  solved: Set<string>;
  inventory: string[];
  hintsUsed: Map<string, number>;
  notes: Map<EscapeRoomId, string>;
  lockedUntil?: number;
  finishedAt?: number;
}

export interface TeamState {
  id: string;
  token: string;
  name: string;
  track: TrackId;
  score: number;
  connected: boolean;
  answers: Map<string, TeamAnswer>;
  earnedByPhase: Map<Phase, number>;
  zeroedPhases: Set<Phase>;
  escape?: TeamEscapeState;
}

export interface SessionState {
  id: string;
  code: string;
  mode: GameMode;
  hostToken: string;
  joinUrl: string;
  phase: Phase;
  pausedFrom?: Phase;
  pausedRemainingMs?: number;
  phaseStartedAt?: number;
  phaseDurationMs?: number;
  questionIndex: number;
  teams: Map<string, TeamState>;
  incidents: IntegrityIncident[];
  scoreAdjustments: Array<{ teamId: string; delta: number; reason: string; createdAt: number }>;
  integrityPolicy: IntegrityPolicy;
  hemophiliaVariant: "A" | "B";
  createdAt: number;
  allowedTopics: EscapeTopic[];
  durationMin: number;
  escapeCase?: EscapeCase;
  escapeEvents: EscapeEvent[];
  /** Código Relâmpago sorteado do banco canônico (ausente = roteiro fixo). */
  blitzQuestions?: Question[];
}

export interface CreateSessionOptions {
  mode?: GameMode;
  allowedTopics?: EscapeTopic[];
  durationMin?: number;
  /** Fixa a sessão neste caso: o jogo inteiro gira em torno de uma única doença. */
  caseId?: string;
  /** Gera o caso a partir da base de conhecimento (aula inteira, por assunto ou por doença). */
  generator?: EscapeGeneratorRequest;
  /** Configuração do Código Relâmpago (modo QUIZ): roteiro fixo ou banco canônico filtrado. */
  blitz?: BlitzOptions;
}

export class GameEngine {
  readonly sessions = new Map<string, SessionState>();

  private readonly bankEmergencyFiles: EmergencyFileEntry[] = [];

  constructor(
    readonly content: GameContent,
    readonly escapeCases: EscapeCase[] = [],
    readonly diseases: DiseaseKnowledge[] = [],
    readonly medical?: { knowledge: MedicalKnowledgeBase; bank: QuestionBank },
    private readonly now: () => number = Date.now,
  ) {
    for (const disease of diseases) validateDisease(disease);
    if (medical) {
      validateMedicalContent(medical.knowledge, medical.bank);
      for (const disease of diseases) validateDiseaseAgainstCanon(disease, medical.knowledge);
      this.bankEmergencyFiles = buildBankEmergencyFiles(medical.bank);
    }
  }

  createSession(baseUrl: string, integrityPolicy: IntegrityPolicy = "ZERO_ROUND", options: CreateSessionOptions = {}) {
    const mode = options.mode ?? "QUIZ";
    let allowedTopics = options.allowedTopics ?? [];
    let escapeCase: EscapeCase | undefined;
    if (mode === "ESCAPE") {
      ({ escapeCase, allowedTopics } = options.generator?.mode === "auto"
        ? this.autoCase(allowedTopics)
        : options.generator
          ? this.generateCase(options.generator, allowedTopics)
          : this.pickEscapeCase(allowedTopics, options.caseId));
    }
    let blitzQuestions: Question[] | undefined;
    if (mode === "QUIZ" && options.blitz?.source === "bank") {
      blitzQuestions = this.pickBlitzFromBank(options.blitz);
    }
    let code: string;
    do code = randomBytes(3).toString("hex").toUpperCase(); while (this.sessions.has(code));
    const session: SessionState = {
      id: randomUUID(),
      code,
      mode,
      hostToken: randomBytes(24).toString("base64url"),
      joinUrl: `${baseUrl}/join/${code}`,
      phase: "LOBBY",
      questionIndex: 0,
      teams: new Map(),
      incidents: [],
      scoreAdjustments: [],
      integrityPolicy,
      hemophiliaVariant: randomBytes(1)[0]! % 2 === 0 ? "A" : "B",
      createdAt: this.now(),
      allowedTopics,
      durationMin: options.durationMin ?? 35,
      escapeCase,
      escapeEvents: [],
      blitzQuestions,
    };
    this.sessions.set(code, session);
    return session;
  }

  /**
   * Seleciona o caso da sessão. Com `caseId`, a sessão fica fixada naquele caso
   * (sem tópicos explícitos, herda os tópicos do próprio caso — o jogo inteiro
   * sobre uma única doença). Sem `caseId`, sorteia um caso cujas tags
   * obrigatórias foram todas liberadas pelo professor.
   */
  private pickEscapeCase(allowedTopics: EscapeTopic[], caseId?: string): { escapeCase: EscapeCase; allowedTopics: EscapeTopic[] } {
    if (!this.escapeCases.length) throw new Error("Nenhum caso do modo Escape está instalado em content/escape/cases.");
    let pick: EscapeCase;
    if (caseId) {
      // Escolha explícita do professor: os tópicos marcados nunca a vetam.
      const found = this.escapeCases.find((candidate) => candidate.id === caseId);
      if (!found) throw new Error(`O caso "${caseId}" não está instalado em content/escape/cases.`);
      pick = found;
    } else {
      const allowed = new Set(allowedTopics);
      const eligible = this.escapeCases.filter((candidate) => candidate.topicTags.every((tag) => allowed.has(tag)));
      if (!eligible.length) {
        const missing = new Set<string>();
        for (const candidate of this.escapeCases) {
          for (const tag of candidate.topicTags) if (!allowed.has(tag)) missing.add(tag);
        }
        throw new Error(`Nenhum caso pronto cabe nos tópicos liberados. Tópicos exigidos pelos casos disponíveis: ${[...missing].join(", ")}.`);
      }
      pick = eligible[randomBytes(1)[0]! % eligible.length]!;
    }
    // Bônus (enigmas opcionais) continuam limitados ao que a turma já viu.
    const marks = allowedTopics.length ? allowedTopics : [...pick.topicTags];
    const bonusAllowed = new Set(marks);
    return {
      allowedTopics: [...new Set([...marks, ...pick.topicTags])],
      escapeCase: {
        ...pick,
        rooms: pick.rooms.map((room) => ({
          ...room,
          steps: room.steps.filter((step) => !step.optional || step.tags.every((tag) => bonusAllowed.has(tag))),
        })),
      },
    };
  }

  /**
   * Origem automática: usa um caso pronto quando ele cabe integralmente nos
   * tópicos marcados; senão, gera um caso da doença mais bem coberta por eles.
   */
  private autoCase(allowedTopics: EscapeTopic[]): { escapeCase: EscapeCase; allowedTopics: EscapeTopic[] } {
    if (this.escapeCases.length && allowedTopics.length) {
      const allowed = new Set(allowedTopics);
      if (this.escapeCases.some((candidate) => candidate.topicTags.every((tag) => allowed.has(tag)))) {
        return this.pickEscapeCase(allowedTopics);
      }
    }
    if (this.diseases.length) return this.generateCase({ mode: "any" }, allowedTopics);
    return this.pickEscapeCase(allowedTopics);
  }

  /**
   * Gera um caso a partir da base de conhecimento de doenças, conforme o modo:
   * - `disease`: todo o jogo sobre a doença escolhida;
   * - `diseases`: sorteia entre as doenças LISTADAS pelo professor (uma ou mais);
   * - `group`: sorteia uma doença do assunto (grupo) escolhido;
   * - `any`: sorteia entre todas as doenças instaladas (aula inteira).
   * Os tópicos marcados nunca vetam uma escolha explícita; nos sorteios, eles
   * apenas priorizam as doenças mais bem cobertas pelo que a turma já viu.
   * Sem tópicos marcados, os tópicos herdam os da doença sorteada.
   */
  private generateCase(request: EscapeGeneratorRequest, allowedTopics: EscapeTopic[]): { escapeCase: EscapeCase; allowedTopics: EscapeTopic[] } {
    if (!this.diseases.length) throw new Error("Nenhuma doença está instalada em content/escape/diseases.");
    let candidates = this.diseases;
    let explicitChoice = false;
    if (request.mode === "disease") {
      if (!request.diseaseId) throw new Error("Informe a doença (diseaseId) para gerar o caso.");
      candidates = this.diseases.filter((disease) => disease.id === request.diseaseId);
      if (!candidates.length) throw new Error(`A doença "${request.diseaseId}" não está instalada em content/escape/diseases.`);
      explicitChoice = true;
    }
    if (request.mode === "diseases") {
      const ids = request.diseaseIds ?? [];
      if (!ids.length) throw new Error("Informe ao menos uma doença (diseaseIds) para gerar o caso.");
      candidates = this.diseases.filter((disease) => ids.includes(disease.id));
      if (!candidates.length) throw new Error(`Nenhuma das doenças escolhidas está instalada: ${ids.join(", ")}.`);
      explicitChoice = true;
    }
    if (request.mode === "group") {
      if (!request.group) throw new Error("Informe o assunto (group) para gerar o caso.");
      candidates = this.diseases.filter((disease) => disease.group === request.group);
      if (!candidates.length) throw new Error(`Nenhuma doença do assunto "${request.group}" está instalada.`);
    }
    if (!explicitChoice && allowedTopics.length) {
      const allowed = new Set(allowedTopics);
      const coverage = (disease: DiseaseKnowledge) =>
        disease.topicTags.filter((tag) => allowed.has(tag)).length / disease.topicTags.length;
      const best = Math.max(...candidates.map(coverage));
      candidates = candidates.filter((disease) => coverage(disease) === best);
    }
    const profile = candidates[randomBytes(1)[0]! % candidates.length]!;
    // Marcações da turma limitam apenas os bônus; a sessão registra a união real.
    const marks = allowedTopics.length ? allowedTopics : [...profile.topicTags];
    const seed = randomBytes(4).readUInt32LE(0);
    return {
      allowedTopics: [...new Set([...marks, ...profile.topicTags])],
      escapeCase: generateEscapeCase(profile, this.diseases, seed, marks, this.bankEmergencyFiles),
    };
  }

  /**
   * Sorteia o Código Relâmpago no banco canônico, respeitando os filtros do
   * Host: categorias, dificuldades e inclusão das doenças de expansão.
   */
  private pickBlitzFromBank(options: BlitzOptions): Question[] {
    if (!this.medical) throw new Error("O banco canônico de perguntas não está instalado (content/question-bank.pt-BR.json).");
    const core = new Set<string>(coreMedicalDiseaseIds);
    let eligible = this.medical.bank.questions.filter((question) =>
      (!options.categories?.length || options.categories.includes(question.category))
      && (!options.difficulties?.length || options.difficulties.includes(question.difficulty))
      && (options.includeExpansion || !question.diseaseId || core.has(question.diseaseId)),
    );
    if (eligible.length < 3) {
      throw new Error(`Apenas ${eligible.length} pergunta(s) do banco atendem aos filtros escolhidos. Ampliem categorias, dificuldades ou incluam a expansão.`);
    }
    // Embaralha perguntas e a ordem das alternativas; o gabarito segue o id da opção.
    eligible = [...eligible];
    for (let index = eligible.length - 1; index > 0; index -= 1) {
      const swap = randomInt(index + 1);
      [eligible[index], eligible[swap]] = [eligible[swap]!, eligible[index]!];
    }
    return eligible.slice(0, options.count).map((question, index) => {
      const blitz = bankQuestionToBlitz(question, index);
      const choices = [...blitz.choices];
      for (let position = choices.length - 1; position > 0; position -= 1) {
        const swap = randomInt(position + 1);
        [choices[position], choices[swap]] = [choices[swap]!, choices[position]!];
      }
      return { ...blitz, choices };
    });
  }

  /** Casos instalados, para o Host fixar a sessão em um único caso. */
  listEscapeCases() {
    return this.escapeCases.map((candidate) => ({
      id: candidate.id,
      title: candidate.title,
      patientLabel: candidate.patientLabel,
      diagnosis: candidate.debrief.diagnosis,
      topicTags: candidate.topicTags,
      roomCount: candidate.rooms.length,
    }));
  }

  /** Biblioteca completa para o Host montar a sessão: casos prontos + doenças geráveis. */
  listLibrary(): EscapeLibrary {
    return {
      cases: this.listEscapeCases(),
      diseases: this.diseases.map((disease) => ({
        id: disease.id,
        name: disease.name,
        group: disease.group,
        topicTags: disease.topicTags,
      })),
    };
  }

  getSession(code: string) {
    return this.sessions.get(code.toUpperCase());
  }

  requireHost(code: string, hostToken: string) {
    const session = this.getSession(code);
    if (!session || session.hostToken !== hostToken) throw new Error("Acesso de Host inválido.");
    return session;
  }

  join(code: string, name?: string, teamToken?: string) {
    const session = this.getSession(code);
    if (!session) throw new Error("Sessão não encontrada.");

    if (teamToken) {
      const restored = [...session.teams.values()].find((team) => team.token === teamToken);
      if (!restored) throw new Error("Credencial de equipe inválida.");
      restored.connected = true;
      return { session, team: restored, restored: true };
    }

    if (session.phase !== "LOBBY") throw new Error("A entrada de novas equipes já foi encerrada.");
    if (!name) throw new Error("Informe o nome da equipe.");
    const normalized = name.replace(/[<>]/g, "").replace(/\s+/g, " ").trim();
    if (normalized.length < 2 || normalized.length > 24) throw new Error("O nome deve ter entre 2 e 24 caracteres.");
    if ([...session.teams.values()].some((team) => team.name.toLocaleLowerCase("pt-BR") === normalized.toLocaleLowerCase("pt-BR"))) {
      throw new Error("Este nome de equipe já está em uso.");
    }

    const trackCounts = new Map(tracks.map((track) => [track, 0]));
    for (const team of session.teams.values()) trackCounts.set(team.track, (trackCounts.get(team.track) ?? 0) + 1);
    const track = [...tracks].sort((a, b) => (trackCounts.get(a) ?? 0) - (trackCounts.get(b) ?? 0))[0] ?? "A";
    const team: TeamState = {
      id: randomUUID(),
      token: randomBytes(24).toString("base64url"),
      name: normalized,
      track,
      score: session.mode === "ESCAPE" ? ESCAPE_START_BASES : 0,
      connected: true,
      answers: new Map(),
      earnedByPhase: new Map(),
      zeroedPhases: new Set(),
      escape: session.mode === "ESCAPE"
        ? { roomIndex: 0, solved: new Set(), inventory: [], hintsUsed: new Map(), notes: new Map() }
        : undefined,
    };
    session.teams.set(team.id, team);
    return { session, team, restored: false };
  }

  disconnect(code: string, teamToken: string) {
    const session = this.getSession(code);
    const team = session && this.findTeam(session, teamToken);
    if (team) team.connected = false;
  }

  currentQuestion(session: SessionState, team?: TeamState): Question | undefined {
    if (session.phase === "WARMUP") return this.content.warmup[session.questionIndex];
    if (session.phase === "CASE_INVESTIGATION" && team) {
      const questions = this.content.cases[team.track];
      if (team.track !== "C") return questions[session.questionIndex];
      if (session.questionIndex < 3) return questions[session.questionIndex];
      if (session.questionIndex === 3) return questions[session.hemophiliaVariant === "A" ? 3 : 4];
      return questions[session.hemophiliaVariant === "A" ? 5 : 6];
    }
    if (session.phase === "BLITZ") return (session.blitzQuestions ?? this.content.blitz)[session.questionIndex];
    if (session.phase === "FINAL_CHAIN" && team) {
      const offset = (tracks.indexOf(team.track) + 1) % this.content.finalChains.length;
      return this.content.finalChains[offset];
    }
    return undefined;
  }

  questionCount(session: SessionState) {
    if (session.phase === "WARMUP") return this.content.warmup.length;
    if (session.phase === "CASE_INVESTIGATION") return this.content.cases.A.length;
    if (session.phase === "BLITZ") return (session.blitzQuestions ?? this.content.blitz).length;
    if (session.phase === "FINAL_CHAIN") return 1;
    return 0;
  }

  remainingMs(session: SessionState) {
    if (session.phase === "PAUSED") return session.pausedRemainingMs ?? null;
    if (session.phaseStartedAt === undefined || session.phaseDurationMs === undefined) return null;
    return Math.max(0, session.phaseDurationMs - (this.now() - session.phaseStartedAt));
  }

  advance(session: SessionState) {
    if (session.phase === "PAUSED" || session.phase === "FINISHED") return;
    if (session.mode === "ESCAPE") {
      const order = escapePhaseOrder;
      const next = order[order.indexOf(session.phase) + 1] ?? "FINISHED";
      session.phase = next;
      session.questionIndex = 0;
      this.startClock(session);
      return;
    }
    const count = this.questionCount(session);
    if (count > 0 && session.questionIndex + 1 < count) {
      session.questionIndex += 1;
      this.startClock(session);
      return;
    }
    const next = phaseOrder[phaseOrder.indexOf(session.phase) + 1] ?? "FINISHED";
    session.phase = next;
    session.questionIndex = 0;
    this.startClock(session);
  }

  tick() {
    const advanced: SessionState[] = [];
    for (const session of this.sessions.values()) {
      if (this.remainingMs(session) === 0 && session.phase !== "FINISHED" && session.phase !== "PAUSED") {
        this.advance(session);
        advanced.push(session);
        continue;
      }
      // No escape, encerra a corrida assim que todas as equipes escapam.
      if (session.mode === "ESCAPE" && session.phase === "ESCAPE" && session.teams.size > 0) {
        const everyoneOut = [...session.teams.values()].every((team) => team.escape?.finishedAt);
        if (everyoneOut) {
          this.advance(session);
          advanced.push(session);
        }
      }
    }
    return advanced;
  }

  applyHostAction(action: HostAction) {
    const session = this.requireHost(action.code, action.hostToken);
    if (action.action === "advance") this.advance(session);
    if (action.action === "back" && session.phase !== "PAUSED") {
      const order = session.mode === "ESCAPE" ? escapePhaseOrder : phaseOrder;
      const previous = order[Math.max(0, order.indexOf(session.phase) - 1)] ?? "LOBBY";
      session.phase = previous;
      session.questionIndex = 0;
      this.startClock(session);
    }
    if (action.action === "pause" && session.phase !== "PAUSED" && session.phase !== "FINISHED") {
      session.pausedFrom = session.phase;
      session.pausedRemainingMs = this.remainingMs(session) ?? undefined;
      session.phase = "PAUSED";
    }
    if (action.action === "resume" && session.phase === "PAUSED" && session.pausedFrom) {
      session.phase = session.pausedFrom;
      session.phaseDurationMs = session.pausedRemainingMs;
      session.phaseStartedAt = this.now();
      session.pausedFrom = undefined;
      session.pausedRemainingMs = undefined;
    }
    if (action.action === "reset") this.reset(session);
    if (action.action === "finish") {
      session.phase = "FINISHED";
      session.questionIndex = 0;
      this.startClock(session);
    }
    if (action.action === "adjustScore") {
      const team = session.teams.get(action.teamId);
      if (!team) throw new Error("Equipe não encontrada.");
      const applied = Math.max(-team.score, action.delta);
      team.score += applied;
      session.scoreAdjustments.unshift({ teamId: team.id, delta: applied, reason: action.reason, createdAt: this.now() });
    }
    if (action.action === "setPolicy") session.integrityPolicy = action.policy;
    if (action.action === "reverseIncident") this.reverseIncident(session, action.incidentId, action.reason);
    if (action.action === "unlockDoor") {
      const team = session.teams.get(action.teamId);
      if (!team?.escape || !session.escapeCase) throw new Error("Equipe não encontrada no modo Escape.");
      if (team.escape.roomIndex < session.escapeCase.rooms.length - 1) {
        const room = session.escapeCase.rooms[team.escape.roomIndex]!;
        for (const step of room.steps) if (!step.optional) team.escape.solved.add(step.id);
        team.escape.roomIndex += 1;
        this.pushEscapeEvent(session, `O Host destravou a porta para ${team.name}.`);
      }
    }
    if (action.action === "extendTime") {
      if (session.mode !== "ESCAPE" || session.phase !== "ESCAPE") throw new Error("Só é possível estender o tempo durante a corrida.");
      session.phaseDurationMs = (session.phaseDurationMs ?? 0) + action.minutes * 60_000;
      this.pushEscapeEvent(session, `O Host estendeu o tempo em ${action.minutes} min.`);
    }
    return session;
  }

  submitAnswer(code: string, teamToken: string, questionId: string, choiceId: string) {
    const session = this.getSession(code);
    if (!session) throw new Error("Sessão não encontrada.");
    const team = this.findTeam(session, teamToken);
    if (!team) throw new Error("Equipe não encontrada.");
    const question = this.currentQuestion(session, team);
    if (!question || !competitivePhases.has(session.phase)) throw new Error("Não há questão ativa.");
    if (question.id !== questionId) throw new Error("Esta questão não está mais ativa.");
    if (this.remainingMs(session) === 0) throw new Error("O prazo desta questão terminou.");
    if (team.answers.has(question.id)) throw new Error("A resposta desta questão já foi registrada.");
    if (!question.choices.some((choice) => choice.id === choiceId)) throw new Error("Alternativa inválida.");

    const correct = choiceId === question.correctChoiceId;
    const remaining = this.remainingMs(session) ?? 0;
    const duration = session.phaseDurationMs ?? question.durationSec * 1000;
    const timeBonus = correct ? Math.round(question.points * 0.2 * Math.min(1, remaining / duration)) : 0;
    const potentialPoints = correct ? question.points + timeBonus : 0;
    const awardedPoints = team.zeroedPhases.has(session.phase) ? 0 : potentialPoints;
    team.answers.set(question.id, { choiceId, correct, potentialPoints, awardedPoints, submittedAt: this.now() });
    team.score += awardedPoints;
    team.earnedByPhase.set(session.phase, (team.earnedByPhase.get(session.phase) ?? 0) + awardedPoints);
    return { session, team, correct, awardedPoints };
  }

  /* ===================== Modo Escape ===================== */

  private escapeRoom(session: SessionState, team: TeamState): EscapeRoomContent {
    if (!session.escapeCase || !team.escape) throw new Error("A sessão não está no modo Escape.");
    return session.escapeCase.rooms[Math.min(team.escape.roomIndex, session.escapeCase.rooms.length - 1)]!;
  }

  private mandatorySteps(room: EscapeRoomContent) {
    return room.steps.filter((step) => !step.optional);
  }

  private pushEscapeEvent(session: SessionState, text: string) {
    session.escapeEvents.unshift({ at: this.now(), text });
    if (session.escapeEvents.length > 30) session.escapeEvents.length = 30;
  }

  /** Compara a tentativa com o gabarito conforme o tipo do enigma. */
  private answerMatches(step: EscapeStep, expected: string[], attempt: string[]) {
    const normalize = (value: string) => value.trim().toLocaleLowerCase("pt-BR");
    const left = expected.map(normalize);
    const right = attempt.map(normalize);
    if (left.length !== right.length) return false;
    if (orderedAnswerTypes.has(step.type)) return left.every((value, index) => value === right[index]);
    if (step.type === "assemble" || step.type === "board-select") {
      return [...left].sort().join("|") === [...right].sort().join("|");
    }
    return left.every((value, index) => value === right[index]);
  }

  escapeAttempt(code: string, teamToken: string, stepId: string, attempt: string[]) {
    const session = this.getSession(code);
    if (!session) throw new Error("Sessão não encontrada.");
    if (session.mode !== "ESCAPE" || session.phase !== "ESCAPE") throw new Error("A corrida não está ativa.");
    const team = this.findTeam(session, teamToken);
    if (!team?.escape || !session.escapeCase) throw new Error("Equipe não encontrada.");
    if (team.escape.finishedAt) throw new Error("A equipe já escapou.");
    if ((this.remainingMs(session) ?? 1) === 0) throw new Error("O tempo do protocolo terminou.");
    const room = this.escapeRoom(session, team);
    const step = room.steps.find((item) => item.id === stepId);
    if (!step) throw new Error("Este enigma não está na sala atual.");
    if (team.escape.solved.has(step.id)) throw new Error("Este enigma já foi resolvido.");
    if (step.type === "dial-safe" && team.escape.lockedUntil && team.escape.lockedUntil > this.now()) {
      throw new Error("O cofre está travado. Aguardem a liberação.");
    }

    const expected = session.escapeCase.answers[step.id];
    if (!expected) throw new Error("Gabarito ausente para este enigma. Avise o Host.");
    const correct = step.type === "use-item" || this.answerMatches(step, expected, attempt);

    if (!correct) {
      const cost = step.type === "dial-safe" ? ESCAPE_SAFE_WRONG_COST : ESCAPE_WRONG_ATTEMPT_COST;
      team.score = Math.max(0, team.score - cost);
      if (step.type === "dial-safe") {
        team.escape.lockedUntil = this.now() + ESCAPE_SAFE_LOCK_MS;
        this.pushEscapeEvent(session, `${team.name} errou o cofre. MUTAÇÃO DELETÉRIA: −${cost} bases e trava de 45 s.`);
      }
      return { session, team, correct: false as const, cost };
    }

    team.escape.solved.add(step.id);
    team.score += step.points;
    if (step.grantsItem && !team.escape.inventory.includes(step.grantsItem)) team.escape.inventory.push(step.grantsItem);
    if (step.optional) this.pushEscapeEvent(session, `${team.name} resolveu um arquivo de emergência (+${step.points} bases).`);

    const mandatory = this.mandatorySteps(room);
    const roomDone = mandatory.every((item) => team.escape!.solved.has(item.id));
    if (roomDone) this.tryAdvanceRoom(session, team);
    return { session, team, correct: true as const, points: step.points, roomDone };
  }

  /** Avança a sala quando os enigmas obrigatórios foram resolvidos e o prontuário da sala foi preenchido. */
  private tryAdvanceRoom(session: SessionState, team: TeamState) {
    if (!team.escape || !session.escapeCase) return;
    const room = this.escapeRoom(session, team);
    const mandatoryDone = this.mandatorySteps(room).every((item) => team.escape!.solved.has(item.id));
    if (!mandatoryDone) return;
    const needsNote = room.id !== "R0" && room.id !== "R5" && !team.escape.notes.get(room.id);
    if (needsNote) return;
    if (team.escape.roomIndex >= session.escapeCase.rooms.length - 1) {
      // Cofre aberto: fim de jogo com bônus pelo tempo restante.
      if (!team.escape.finishedAt) {
        team.escape.finishedAt = this.now();
        const remainingMin = Math.floor((this.remainingMs(session) ?? 0) / 60_000);
        const bonus = Math.min(20, remainingMin * 2);
        team.score += bonus;
        this.pushEscapeEvent(session, `${team.name} ESCAPOU com ${team.score} bases (bônus de tempo: +${bonus}).`);
      }
      return;
    }
    team.escape.roomIndex += 1;
    const nextRoom = session.escapeCase.rooms[team.escape.roomIndex]!;
    this.pushEscapeEvent(session, `${team.name} entrou em: ${nextRoom.name}.`);
  }

  escapeHint(code: string, teamToken: string, stepId: string, level: number) {
    const session = this.getSession(code);
    if (!session) throw new Error("Sessão não encontrada.");
    if (session.mode !== "ESCAPE" || session.phase !== "ESCAPE") throw new Error("A corrida não está ativa.");
    const team = this.findTeam(session, teamToken);
    if (!team?.escape || !session.escapeCase) throw new Error("Equipe não encontrada.");
    const room = this.escapeRoom(session, team);
    const step = room.steps.find((item) => item.id === stepId);
    if (!step) throw new Error("Este enigma não está na sala atual.");
    const used = team.escape.hintsUsed.get(step.id) ?? 0;
    if (level !== used + 1) throw new Error("As dicas são liberadas em ordem.");
    const cost = escapeHintCosts[level - 1] ?? 0;
    team.score = Math.max(0, team.score - cost);
    team.escape.hintsUsed.set(step.id, level);
    if (level === 3) this.pushEscapeEvent(session, `${team.name} pediu a resposta de um enigma (−${cost} bases).`);
    return { session, team, hint: step.hints[level - 1]!, cost };
  }

  escapeNote(code: string, teamToken: string, roomId: EscapeRoomId, text: string) {
    const session = this.getSession(code);
    if (!session) throw new Error("Sessão não encontrada.");
    if (session.mode !== "ESCAPE") throw new Error("A sessão não está no modo Escape.");
    const team = this.findTeam(session, teamToken);
    if (!team?.escape) throw new Error("Equipe não encontrada.");
    const room = this.escapeRoom(session, team);
    if (room.id !== roomId) throw new Error("O prontuário só aceita a sala atual.");
    team.escape.notes.set(roomId, text);
    this.tryAdvanceRoom(session, team);
    return { session, team };
  }

  escapeView(session: SessionState, team: TeamState): EscapeTeamView | undefined {
    if (!session.escapeCase || !team.escape) return undefined;
    const room = this.escapeRoom(session, team);
    const mandatory = this.mandatorySteps(room);
    const step = mandatory.find((item) => !team.escape!.solved.has(item.id));
    const optionalStep = room.steps.find((item) => item.optional && !team.escape!.solved.has(item.id));
    const solvedMandatory = mandatory.filter((item) => team.escape!.solved.has(item.id)).length;
    const revealedHints: Partial<Record<string, string[]>> = {};
    for (const [hintStepId, level] of team.escape.hintsUsed) {
      const source = room.steps.find((item) => item.id === hintStepId);
      if (source) revealedHints[hintStepId] = source.hints.slice(0, level);
    }
    const noteRequired = room.id !== "R0" && room.id !== "R5"
      && mandatory.every((item) => team.escape!.solved.has(item.id))
      && !team.escape.notes.get(room.id);
    return {
      caseTitle: session.escapeCase.title,
      patientLabel: session.escapeCase.patientLabel,
      briefing: session.escapeCase.briefing,
      roomId: room.id,
      roomName: room.name,
      roomIntro: room.intro,
      roomUnlockText: room.unlockText,
      roomCount: session.escapeCase.rooms.length,
      roomIndex: team.escape.roomIndex,
      stepIndex: solvedMandatory,
      mandatoryCount: mandatory.length,
      step: step ? this.toClientStep(step) : undefined,
      optionalStep: optionalStep ? this.toClientStep(optionalStep) : undefined,
      solvedStepIds: [...team.escape.solved],
      inventory: [...team.escape.inventory],
      revealedHints,
      notes: Object.fromEntries(team.escape.notes) as Partial<Record<EscapeRoomId, string>>,
      noteRequired,
      lockedUntilMs: team.escape.lockedUntil && team.escape.lockedUntil > this.now()
        ? team.escape.lockedUntil - this.now() : undefined,
      finishedAt: team.escape.finishedAt,
      debrief: team.escape.finishedAt || session.phase === "DEBRIEF" || session.phase === "FINISHED"
        ? session.escapeCase.debrief : undefined,
    };
  }

  private toClientStep(step: EscapeStep) {
    const { hints: _hints, ...clientStep } = step;
    return clientStep;
  }

  private escapeHostRows(session: SessionState): EscapeHostTeamRow[] {
    if (!session.escapeCase) return [];
    return [...session.teams.values()].map((team) => {
      const room = team.escape ? this.escapeRoom(session, team) : session.escapeCase!.rooms[0]!;
      const mandatory = this.mandatorySteps(room);
      return {
        teamId: team.id,
        name: team.name,
        roomId: room.id,
        roomName: room.name,
        stepIndex: mandatory.filter((item) => team.escape?.solved.has(item.id)).length,
        mandatoryCount: mandatory.length,
        bases: team.score,
        hintsCount: team.escape ? [...team.escape.hintsUsed.values()].reduce((sum, level) => sum + level, 0) : 0,
        finishedAt: team.escape?.finishedAt,
      };
    }).sort((a, b) => (b.finishedAt ? 1 : 0) - (a.finishedAt ? 1 : 0) || b.bases - a.bases);
  }

  /* ======================================================= */

  registerIntegrity(code: string, teamToken: string, type: string, hiddenDurationMs = 0) {
    const session = this.getSession(code);
    if (!session) throw new Error("Sessão não encontrada.");
    const team = this.findTeam(session, teamToken);
    if (!team) throw new Error("Equipe não encontrada.");
    const classification = type === "pagehide" || (type === "visibility_hidden" && hiddenDurationMs >= 1000)
      ? "confirmed" as const : "suspicious" as const;
    let deductedPoints = 0;
    if (classification === "confirmed" && session.integrityPolicy === "ZERO_ROUND" && session.mode === "ESCAPE" && session.phase === "ESCAPE") {
      deductedPoints = Math.min(team.score, ESCAPE_INTEGRITY_COST);
      team.score -= deductedPoints;
    }
    if (classification === "confirmed" && session.integrityPolicy === "ZERO_ROUND" && competitivePhases.has(session.phase)) {
      deductedPoints = team.earnedByPhase.get(session.phase) ?? 0;
      team.score -= deductedPoints;
      team.earnedByPhase.set(session.phase, 0);
      team.zeroedPhases.add(session.phase);
      for (const [questionId, answer] of team.answers) {
        if (this.findQuestion(session, questionId)?.phase === session.phase && answer.awardedPoints > 0) answer.awardedPoints = 0;
      }
    }
    const incident: IntegrityIncident = {
      id: randomUUID(), teamId: team.id, teamName: team.name, phase: session.phase,
      type, classification, createdAt: this.now(), deductedPoints,
    };
    session.incidents.unshift(incident);
    return { session, incident };
  }

  snapshot(session: SessionState, role: "host" | "screen" | "team", teamToken?: string): SessionSnapshot {
    const team = teamToken ? this.findTeam(session, teamToken) : undefined;
    const question = this.currentQuestion(session, team);
    const answer = question && team ? team.answers.get(question.id) : undefined;
    const teams: PublicTeam[] = [...session.teams.values()]
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
      .map((item) => ({
        id: item.id, name: item.name, score: item.score, connected: item.connected,
        track: role === "host" ? item.track : undefined,
        answered: Boolean(this.currentQuestion(session, item) && item.answers.has(this.currentQuestion(session, item)!.id)),
      }));
    return {
      code: session.code,
      mode: session.mode,
      phase: session.phase,
      phaseLabel: phaseLabels[session.phase],
      pausedFrom: session.pausedFrom,
      remainingMs: this.remainingMs(session),
      questionIndex: session.questionIndex,
      questionCount: this.questionCount(session),
      teams,
      question: question ? this.toClientQuestion(question) : undefined,
      answeredChoiceId: answer?.choiceId,
      answerAccepted: Boolean(answer),
      score: team?.score,
      teamId: team?.id,
      teamName: team?.name,
      track: team?.track,
      integrityPolicy: session.integrityPolicy,
      incidents: role === "host" ? session.incidents : undefined,
      joinUrl: session.joinUrl,
      reveal: session.mode === "QUIZ" && (session.phase === "REVEAL" || session.phase === "FINISHED")
        ? this.revealRows() : undefined,
      allowedTopics: session.mode === "ESCAPE" ? session.allowedTopics : undefined,
      durationMin: session.mode === "ESCAPE" ? session.durationMin : undefined,
      escape: session.mode === "ESCAPE" && team ? this.escapeView(session, team) : undefined,
      escapeHost: session.mode === "ESCAPE" && role !== "team" ? this.escapeHostRows(session) : undefined,
      escapeEvents: session.mode === "ESCAPE" && role !== "team" ? session.escapeEvents : undefined,
    };
  }

  exportSession(session: SessionState) {
    return {
      code: session.code,
      createdAt: new Date(session.createdAt).toISOString(),
      mode: session.mode,
      phase: session.phase,
      policy: session.integrityPolicy,
      allowedTopics: session.mode === "ESCAPE" ? session.allowedTopics : undefined,
      escapeCaseId: session.escapeCase?.id,
      teams: [...session.teams.values()].map((team) => ({
        id: team.id, name: team.name, track: team.track, score: team.score,
        answers: [...team.answers.entries()].map(([questionId, answer]) => ({ questionId, ...answer })),
        escape: team.escape ? {
          roomIndex: team.escape.roomIndex,
          solvedSteps: [...team.escape.solved],
          hintsUsed: Object.fromEntries(team.escape.hintsUsed),
          notes: Object.fromEntries(team.escape.notes),
          inventory: team.escape.inventory,
          finishedAt: team.escape.finishedAt ? new Date(team.escape.finishedAt).toISOString() : undefined,
        } : undefined,
      })),
      incidents: session.incidents,
      scoreAdjustments: session.scoreAdjustments,
      escapeEvents: session.escapeEvents,
    };
  }

  exportCsv(session: SessionState) {
    const escape = (value: unknown) => `"${String(value).replaceAll('"', '""')}"`;
    return ["equipe,trilho,pontuacao,conectada", ...[...session.teams.values()].map((team) =>
      [team.name, team.track, team.score, team.connected ? "sim" : "não"].map(escape).join(","),
    )].join("\n");
  }

  private startClock(session: SessionState) {
    session.phaseStartedAt = undefined;
    session.phaseDurationMs = undefined;
    if (session.mode === "ESCAPE") {
      if (session.phase === "BRIEFING") session.phaseDurationMs = 75_000;
      if (session.phase === "ESCAPE") session.phaseDurationMs = session.durationMin * 60_000;
      if (session.phase === "DEBRIEF") session.phaseDurationMs = 240_000;
      if (session.phaseDurationMs !== undefined) session.phaseStartedAt = this.now();
      return;
    }
    if (session.phase === "FOCUS_CHECK") session.phaseDurationMs = 60_000;
    if (session.phase === "REVEAL") session.phaseDurationMs = 180_000;
    const sampleTeam = session.teams.values().next().value as TeamState | undefined;
    const question = this.currentQuestion(session, sampleTeam);
    if (question) session.phaseDurationMs = question.durationSec * 1000;
    if (session.phaseDurationMs !== undefined) session.phaseStartedAt = this.now();
  }

  private reset(session: SessionState) {
    session.phase = "LOBBY";
    session.questionIndex = 0;
    session.phaseStartedAt = undefined;
    session.phaseDurationMs = undefined;
    session.pausedFrom = undefined;
    session.incidents = [];
    session.escapeEvents = [];
    for (const team of session.teams.values()) {
      team.score = session.mode === "ESCAPE" ? ESCAPE_START_BASES : 0;
      team.answers.clear();
      team.earnedByPhase.clear();
      team.zeroedPhases.clear();
      if (team.escape) {
        team.escape = { roomIndex: 0, solved: new Set(), inventory: [], hintsUsed: new Map(), notes: new Map() };
      }
    }
  }

  private reverseIncident(session: SessionState, incidentId: string, reason: string) {
    const incident = session.incidents.find((item) => item.id === incidentId);
    if (!incident || incident.reversedAt) throw new Error("Incidente não encontrado ou já revertido.");
    incident.reversedAt = this.now();
    incident.reversalReason = reason;
    const team = session.teams.get(incident.teamId);
    if (!team) return;
    const hasAnother = session.incidents.some((item) =>
      item.id !== incident.id && item.teamId === team.id && item.phase === incident.phase &&
      item.classification === "confirmed" && !item.reversedAt,
    );
    if (!hasAnother) {
      team.zeroedPhases.delete(incident.phase);
      let restored = 0;
      for (const [questionId, answer] of team.answers) {
        const questionPhase = this.findQuestion(session, questionId)?.phase;
        if (questionPhase === incident.phase) {
          restored += answer.potentialPoints;
          answer.awardedPoints = answer.potentialPoints;
        }
      }
      const current = team.earnedByPhase.get(incident.phase) ?? 0;
      team.score += restored - current;
      team.earnedByPhase.set(incident.phase, restored);
    }
  }

  private findTeam(session: SessionState, token: string) {
    return [...session.teams.values()].find((team) => team.token === token);
  }

  private findQuestion(session: SessionState, id: string) {
    const all = [
      ...this.content.warmup, ...Object.values(this.content.cases).flat(),
      ...(session.blitzQuestions ?? this.content.blitz), ...this.content.finalChains,
    ];
    return all.find((question) => question.id === id);
  }

  private toClientQuestion(question: Question) {
    const { correctChoiceId: _correct, explanation: _explanation, ...clientQuestion } = question;
    return clientQuestion;
  }

  private revealRows() {
    const questions = [this.content.cases.A[3], this.content.cases.B[3], this.content.cases.C[3], this.content.cases.D[3]];
    return questions.filter((question): question is Question => Boolean(question)).map((question) => ({
      title: question.title,
      explanation: question.explanation,
    }));
  }
}
