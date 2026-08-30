import { randomBytes, randomUUID } from "node:crypto";
import {
  phaseLabels,
  type GameContent,
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
const competitivePhases = new Set<Phase>(["WARMUP", "CASE_INVESTIGATION", "BLITZ", "FINAL_CHAIN"]);
const tracks: TrackId[] = ["A", "B", "C", "D"];

interface TeamAnswer {
  choiceId: string;
  correct: boolean;
  potentialPoints: number;
  awardedPoints: number;
  submittedAt: number;
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
}

export interface SessionState {
  id: string;
  code: string;
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
}

export class GameEngine {
  readonly sessions = new Map<string, SessionState>();

  constructor(
    readonly content: GameContent,
    private readonly now: () => number = Date.now,
  ) {}

  createSession(baseUrl: string, integrityPolicy: IntegrityPolicy = "ZERO_ROUND") {
    let code: string;
    do code = randomBytes(3).toString("hex").toUpperCase(); while (this.sessions.has(code));
    const session: SessionState = {
      id: randomUUID(),
      code,
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
    };
    this.sessions.set(code, session);
    return session;
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
      score: 0,
      connected: true,
      answers: new Map(),
      earnedByPhase: new Map(),
      zeroedPhases: new Set(),
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
    if (session.phase === "BLITZ") return this.content.blitz[session.questionIndex];
    if (session.phase === "FINAL_CHAIN" && team) {
      const offset = (tracks.indexOf(team.track) + 1) % this.content.finalChains.length;
      return this.content.finalChains[offset];
    }
    return undefined;
  }

  questionCount(session: SessionState) {
    if (session.phase === "WARMUP") return this.content.warmup.length;
    if (session.phase === "CASE_INVESTIGATION") return this.content.cases.A.length;
    if (session.phase === "BLITZ") return this.content.blitz.length;
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
      }
    }
    return advanced;
  }

  applyHostAction(action: HostAction) {
    const session = this.requireHost(action.code, action.hostToken);
    if (action.action === "advance") this.advance(session);
    if (action.action === "back" && session.phase !== "PAUSED") {
      const previous = phaseOrder[Math.max(0, phaseOrder.indexOf(session.phase) - 1)] ?? "LOBBY";
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

  registerIntegrity(code: string, teamToken: string, type: string, hiddenDurationMs = 0) {
    const session = this.getSession(code);
    if (!session) throw new Error("Sessão não encontrada.");
    const team = this.findTeam(session, teamToken);
    if (!team) throw new Error("Equipe não encontrada.");
    const classification = type === "pagehide" || (type === "visibility_hidden" && hiddenDurationMs >= 1000)
      ? "confirmed" as const : "suspicious" as const;
    let deductedPoints = 0;
    if (classification === "confirmed" && session.integrityPolicy === "ZERO_ROUND" && competitivePhases.has(session.phase)) {
      deductedPoints = team.earnedByPhase.get(session.phase) ?? 0;
      team.score -= deductedPoints;
      team.earnedByPhase.set(session.phase, 0);
      team.zeroedPhases.add(session.phase);
      for (const [questionId, answer] of team.answers) {
        if (this.findQuestion(questionId)?.phase === session.phase && answer.awardedPoints > 0) answer.awardedPoints = 0;
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
      reveal: session.phase === "REVEAL" || session.phase === "FINISHED"
        ? this.revealRows() : undefined,
    };
  }

  exportSession(session: SessionState) {
    return {
      code: session.code,
      createdAt: new Date(session.createdAt).toISOString(),
      phase: session.phase,
      policy: session.integrityPolicy,
      teams: [...session.teams.values()].map((team) => ({
        id: team.id, name: team.name, track: team.track, score: team.score,
        answers: [...team.answers.entries()].map(([questionId, answer]) => ({ questionId, ...answer })),
      })),
      incidents: session.incidents,
      scoreAdjustments: session.scoreAdjustments,
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
    for (const team of session.teams.values()) {
      team.score = 0;
      team.answers.clear();
      team.earnedByPhase.clear();
      team.zeroedPhases.clear();
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
        const questionPhase = this.findQuestion(questionId)?.phase;
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

  private findQuestion(id: string) {
    const all = [
      ...this.content.warmup, ...Object.values(this.content.cases).flat(),
      ...this.content.blitz, ...this.content.finalChains,
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
