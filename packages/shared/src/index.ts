import { z } from "zod";

export const phases = [
  "LOBBY", "FOCUS_CHECK", "WARMUP", "CASE_INVESTIGATION", "BLITZ",
  "FINAL_CHAIN", "REVEAL", "FINISHED", "PAUSED",
  "BRIEFING", "ESCAPE", "DEBRIEF",
] as const;

export type Phase = (typeof phases)[number];
export type IntegrityPolicy = "OBSERVE_ONLY" | "WARNING" | "ZERO_ROUND" | "MANUAL_REVIEW";
export type TrackId = "A" | "B" | "C" | "D";
export type GameMode = "QUIZ" | "ESCAPE";

export interface Choice { id: string; text: string }
export interface Question {
  id: string;
  phase: Phase;
  title: string;
  prompt: string;
  evidence?: string[];
  choices: Choice[];
  correctChoiceId: string;
  explanation: string;
  points: number;
  durationSec: number;
  track?: TrackId;
}

export interface GameContent {
  warmup: Question[];
  cases: Record<TrackId, Question[]>;
  blitz: Question[];
  finalChains: Question[];
}

export interface PublicTeam {
  id: string;
  name: string;
  score: number;
  connected: boolean;
  track?: TrackId;
  answered: boolean;
}

export interface IntegrityIncident {
  id: string;
  teamId: string;
  teamName: string;
  phase: Phase;
  type: string;
  classification: "suspicious" | "confirmed";
  createdAt: number;
  deductedPoints: number;
  reversedAt?: number;
  reversalReason?: string;
}

export type ClientQuestion = Omit<Question, "correctChoiceId" | "explanation">;

export interface SessionSnapshot {
  code: string;
  mode: GameMode;
  phase: Phase;
  phaseLabel: string;
  pausedFrom?: Phase;
  remainingMs: number | null;
  questionIndex: number;
  questionCount: number;
  teams: PublicTeam[];
  question?: ClientQuestion;
  answeredChoiceId?: string;
  answerAccepted?: boolean;
  score?: number;
  teamId?: string;
  teamName?: string;
  track?: TrackId;
  integrityPolicy: IntegrityPolicy;
  incidents?: IntegrityIncident[];
  joinUrl: string;
  reveal?: Array<{ title: string; explanation: string }>;
  allowedTopics?: string[];
  durationMin?: number;
  escape?: EscapeTeamView;
  escapeHost?: EscapeHostTeamRow[];
  escapeEvents?: EscapeEvent[];
}

/* ===================== MODO ESCAPE: "Protocolo Hélix" ===================== */

export const escapeRoomIds = ["R0", "R1", "R2", "R3", "R4", "R5"] as const;
export type EscapeRoomId = (typeof escapeRoomIds)[number];

export const escapeTopics = [
  "proteinas-funcoes", "hemoglobina-estrutura", "anemia-falciforme", "talassemias",
  "hemostasia-primaria", "hemostasia-secundaria", "hemofilias", "von-willebrand",
  "bernard-soulier", "heranca-ligada-x", "heranca-autossomica", "mutacoes-ponto",
  "splicing-promotor", "trombofilias", "imunodeficiencias-plaquetarias",
] as const;
export type EscapeTopic = (typeof escapeTopics)[number];

export type EscapePuzzleType =
  | "use-item"        // usar item do inventário em um alvo da cena
  | "chain-fill"      // completar a cadeia com peças (slots ordenados)
  | "board-select"    // selecionar o conjunto correto entre opções
  | "microscope"      // escolher a lâmina correta e focar
  | "code"            // código numérico deduzido das evidências
  | "assemble"        // montar estrutura com peças (multiconjunto)
  | "mechanism-fill"  // frase-mecanismo com lacunas
  | "sequence-spot"   // apontar o códon divergente
  | "inheritance"     // padrão de herança
  | "family-question" // pergunta da família
  | "dial-safe";      // cofre final com seletores

/** Aparência do esfregaço exibido ao focar uma lâmina no enigma "microscope". */
export const escapeSmearKinds = [
  "normal", "falciforme", "microcitica-hipocromica", "plaquetas-gigantes", "esferocitos", "plaquetas-pequenas", "celulas-alvo",
] as const;
export type EscapeSmearKind = (typeof escapeSmearKinds)[number];

export interface EscapeChoice { id: string; text: string; smear?: EscapeSmearKind }

export interface EscapeStep {
  id: string;
  roomId: EscapeRoomId;
  type: EscapePuzzleType;
  object: string;
  title: string;
  prompt: string;
  evidence?: string[];
  choices?: EscapeChoice[];
  selectCount?: number;
  slots?: string[];
  slotChoices?: EscapeChoice[][];
  sequence?: { label: string; reference: string[]; sample: string[] };
  codeLength?: number;
  grantsItem?: string;
  requiresItem?: string;
  optional?: boolean;
  points: number;
  tags: EscapeTopic[];
  hints: [string, string, string];
}

export interface EscapeRoomContent {
  id: EscapeRoomId;
  name: string;
  intro: string;
  unlockText: string;
  steps: EscapeStep[];
}

export interface EscapeCase {
  id: string;
  title: string;
  patientLabel: string;
  briefing: string;
  topicTags: EscapeTopic[];
  rooms: EscapeRoomContent[];
  answers: Record<string, string[]>;
  debrief: { diagnosis: string; route: string };
}

/** Resumo de um caso instalado, exposto ao Host para fixar a sessão em um único caso. */
export interface EscapeCaseSummary {
  id: string;
  title: string;
  patientLabel: string;
  diagnosis: string;
  topicTags: EscapeTopic[];
  roomCount: number;
}

/* ============== Bancos canônicos de conteúdo médico (fonte de verdade) ============== */

export const questionCategories = ["genetics", "microscopy", "clinical", "laboratory", "molecular", "inheritance", "differential"] as const;
export type QuestionCategory = (typeof questionCategories)[number];

export const questionCategoryLabels: Record<QuestionCategory, string> = {
  genetics: "Genética", microscopy: "Microscopia", clinical: "Clínica", laboratory: "Laboratório",
  molecular: "Molecular", inheritance: "Herança", differential: "Diferencial",
};

export const questionDifficulties = ["easy", "medium", "hard"] as const;
export type QuestionDifficulty = (typeof questionDifficulties)[number];

export const questionDifficultyLabels: Record<QuestionDifficulty, string> = {
  easy: "Fácil", medium: "Média", hard: "Difícil",
};

/** Entidade de `content/medical-knowledge.pt-BR.json` — fonte canônica de fatos médicos. */
export interface MedicalDisease {
  id: string;
  name: string;
  aliases: string[];
  category: string;
  suspectedProtein: string;
  genes: string[];
  chromosomeLocation: string[];
  variantTypes: string[];
  molecularEffect: string;
  alteredProcess: string;
  morphologyMicroscopy: string[];
  clinicalManifestations: string[];
  laboratoryFindings: string[];
  inheritance: { pattern: string; notes?: string };
  keyEvidence: string[];
  differentials: string[];
  progressiveClues: Array<{ order: number; title: string; text: string; weight: number; decisive?: boolean }>;
  pitfalls: string[];
  references: Array<{ label: string; kind: string; url?: string }>;
}

export interface MedicalKnowledgeBase {
  version: string;
  language: string;
  purpose?: string;
  rules?: Record<string, unknown>;
  diseases: MedicalDisease[];
}

/** Pergunta de `content/question-bank.pt-BR.json` — banco canônico reutilizável. */
export interface BankQuestion {
  id: string;
  diseaseId?: string;
  category: QuestionCategory;
  difficulty: QuestionDifficulty;
  stem: string;
  options: Array<{ id: string; text: string }>;
  correctOptionId: string;
  explanation: string;
  points: number;
  tags: string[];
}

export interface QuestionBank {
  version: string;
  language: string;
  rules?: { scoring?: Record<QuestionDifficulty, number>; selection?: string; antiGuessing?: string };
  questions: BankQuestion[];
}

/** Trilhas principais do modo de 30 minutos; as demais doenças são expansão. */
export const coreMedicalDiseaseIds = [
  "sickle_cell_disease", "beta_thalassemia", "hemophilia_a", "hemophilia_b",
  "von_willebrand_disease", "bernard_soulier",
] as const;

/** Configuração do Código Relâmpago escolhida pelo Host na criação da sessão QUIZ. */
export const blitzOptionsSchema = z.object({
  source: z.enum(["script", "bank"]).default("script"),
  categories: z.array(z.enum(questionCategories)).optional(),
  difficulties: z.array(z.enum(questionDifficulties)).optional(),
  includeExpansion: z.boolean().default(true),
  count: z.number().int().min(3).max(15).default(7),
});
export type BlitzOptions = z.infer<typeof blitzOptionsSchema>;

/* ============ Base de conhecimento de doenças (gerador de casos) ============ */

export const diseaseGroups = ["hemoglobinopatias", "coagulopatias", "plaquetopatias", "trombofilias", "vasculopatias"] as const;
export type DiseaseGroup = (typeof diseaseGroups)[number];

export const diseaseGroupLabels: Record<DiseaseGroup, string> = {
  "hemoglobinopatias": "Hemoglobinopatias",
  "coagulopatias": "Coagulopatias",
  "plaquetopatias": "Plaquetopatias",
  "trombofilias": "Trombofilias",
  "vasculopatias": "Vasculopatias hereditárias",
};

/**
 * Perfil de uma doença na base de conhecimento (`content/escape/diseases/*.json`).
 * O gerador transforma um perfil em um `EscapeCase` completo, sorteando
 * distratores, ordem das alternativas, identificação do paciente e códigos.
 */
export interface DiseaseKnowledge {
  id: string;
  name: string;
  /** Id da entidade correspondente em `content/medical-knowledge.pt-BR.json` (fonte canônica). */
  medicalId?: string;
  group: DiseaseGroup;
  topicTags: EscapeTopic[];
  patient: {
    /** Ex.: "lactente, 8 meses" ou "menino, 4 anos". */
    descriptor: string;
    /** Frase do briefing que ancora a suspeita sem entregar o diagnóstico. */
    story: string;
  };
  clinical: {
    /** Achados verdadeiros do quadro (mínimo 4). */
    correct: string[];
    /** Achados que NÃO pertencem ao quadro (mínimo 4). */
    distractors: string[];
    /** Evidências laboratoriais mostradas junto do prontuário (opcional). */
    evidence?: string[];
  };
  labs: {
    /** Exames alterados, já com o valor (mínimo 3). */
    altered: string[];
    /** Exames normais, já com o valor (mínimo 3). */
    normal: string[];
  };
  smear: {
    /** Morfologia da lâmina do paciente. */
    kind: EscapeSmearKind;
    /** Descrição do achado, usada em dica e no debrief da sala. */
    finding: string;
  };
  protein: {
    /** Nome exibível da proteína (ex.: "hemoglobina"). */
    name: string;
    /** Enigma de montagem (ex.: tetrâmero da Hb). Ausente → vira pergunta de função. */
    assembly?: {
      prompt: string;
      pieces: Array<{ id: string; text: string }>;
      slots: string[];
      answer: string[];
      hints: [string, string, string];
    };
    /** Pergunta de função usada quando não há montagem. */
    role?: { prompt: string; correct: string; wrong: string[] };
    /** Frase-mecanismo: "A proteína X está DEFEITO e, CONTEXTO, CONSEQUÊNCIA." */
    defect: string;
    consequence: string;
    /** Contexto da consequência (ex.: "em baixa oxigenação,"). */
    context: string;
  };
  gene: {
    symbol: string;
    locus: string;
    /** Alinhamento para o enigma sequence-spot. Ausente → vira pergunta de mutação. */
    sequence?: {
      label: string;
      reference: string[];
      sample: string[];
      divergentIndex: number;
      chromatogram: string;
    };
    /** Resumo da alteração molecular (também usado como alternativa correta no fallback). */
    mutationSummary: string;
  };
  inheritance: {
    pattern: "ar" | "ad" | "xr";
    /** História familiar desenhada no heredograma. */
    familyStory: string;
    recurrence: { prompt: string; correct: string; wrong: string[] };
  };
  /** Entradas corretas do cofre final; distratores vêm dos demais perfis. */
  route: { gene: string; protein: string; mechanism: string; phenotype: string; inheritance: string };
  /** Perguntas-bônus que esta doença contribui para o pool de arquivos de emergência. */
  emergencyFiles?: Array<{ prompt: string; correct: string; wrong: string[]; tags: EscapeTopic[] }>;
  debrief: { diagnosis: string; route: string };
}

/** Resumo de uma doença instalada, para o Host montar a sessão. */
export interface DiseaseSummary {
  id: string;
  name: string;
  group: DiseaseGroup;
  topicTags: EscapeTopic[];
}

/** Biblioteca completa exposta ao Host: casos prontos + doenças geráveis. */
export interface EscapeLibrary {
  cases: EscapeCaseSummary[];
  diseases: DiseaseSummary[];
}

export const escapeGeneratorSchema = z.object({
  /**
   * auto: caso pronto se couber nos tópicos, senão gera da doença mais compatível;
   * any: gera sorteando entre todas; group: dentro do assunto; disease: uma doença;
   * diseases: sorteia entre as doenças listadas em diseaseIds (uma ou mais).
   */
  mode: z.enum(["auto", "any", "group", "disease", "diseases"]),
  group: z.enum(diseaseGroups).optional(),
  diseaseId: z.string().trim().min(1).max(64).optional(),
  diseaseIds: z.array(z.string().trim().min(1).max(64)).min(1).max(32).optional(),
});
export type EscapeGeneratorRequest = z.infer<typeof escapeGeneratorSchema>;

export type EscapeClientStep = Omit<EscapeStep, "hints">;

export interface EscapeTeamView {
  caseTitle: string;
  patientLabel: string;
  briefing: string;
  roomId: EscapeRoomId;
  roomName: string;
  roomIntro: string;
  roomUnlockText: string;
  roomCount: number;
  roomIndex: number;
  stepIndex: number;
  mandatoryCount: number;
  step?: EscapeClientStep;
  optionalStep?: EscapeClientStep;
  solvedStepIds: string[];
  inventory: string[];
  revealedHints: Partial<Record<string, string[]>>;
  notes: Partial<Record<EscapeRoomId, string>>;
  noteRequired: boolean;
  lockedUntilMs?: number;
  finishedAt?: number;
  debrief?: { diagnosis: string; route: string };
  /** Modo revisão: a equipe voltou a uma sala já visitada para rever evidências. */
  reviewing?: boolean;
  /** Enigmas já resolvidos da sala em revisão (somente leitura). */
  reviewSteps?: EscapeClientStep[];
  /** Salas visitadas (para a régua de navegação); `current` marca a sala do progresso. */
  visitedRooms?: Array<{ id: EscapeRoomId; name: string; current: boolean }>;
}

export interface EscapeHostTeamRow {
  teamId: string;
  name: string;
  roomId: EscapeRoomId;
  roomName: string;
  stepIndex: number;
  mandatoryCount: number;
  bases: number;
  hintsCount: number;
  finishedAt?: number;
}

export interface EscapeEvent { at: number; text: string }

export const escapeAttemptSchema = z.object({
  code: z.string().trim().min(4).max(8).transform((value) => value.toUpperCase()),
  teamToken: z.string().min(16),
  stepId: z.string().min(1).max(24),
  answer: z.array(z.string().trim().min(1).max(80)).min(1).max(8),
});

export const escapeHintSchema = z.object({
  code: z.string().trim().min(4).max(8).transform((value) => value.toUpperCase()),
  teamToken: z.string().min(16),
  stepId: z.string().min(1).max(24),
  level: z.number().int().min(1).max(3),
});

export const escapeReviewSchema = z.object({
  code: z.string().trim().min(4).max(8).transform((value) => value.toUpperCase()),
  teamToken: z.string().min(16),
  roomId: z.enum(escapeRoomIds),
});

export const escapeNoteSchema = z.object({
  code: z.string().trim().min(4).max(8).transform((value) => value.toUpperCase()),
  teamToken: z.string().min(16),
  roomId: z.enum(escapeRoomIds),
  text: z.string().trim().min(3).max(280),
});

export const createSessionSchema = z.object({
  mode: z.enum(["QUIZ", "ESCAPE"]).default("QUIZ"),
  integrityPolicy: z.enum(["OBSERVE_ONLY", "WARNING", "ZERO_ROUND", "MANUAL_REVIEW"]).default("ZERO_ROUND"),
  allowedTopics: z.array(z.enum(escapeTopics)).max(escapeTopics.length).optional(),
  durationMin: z.number().int().min(15).max(60).default(35),
  caseId: z.string().trim().min(1).max(64).optional(),
  generator: escapeGeneratorSchema.optional(),
  blitz: blitzOptionsSchema.optional(),
});

export const escapeHintCosts = [0, 3, 8] as const;
export const ESCAPE_START_BASES = 100;
export const ESCAPE_WRONG_ATTEMPT_COST = 2;
export const ESCAPE_SAFE_WRONG_COST = 5;
export const ESCAPE_SAFE_LOCK_MS = 45_000;
/** Custo de voltar a uma sala já visitada para rever evidências. */
export const ESCAPE_REVIEW_COST = 2;

export const escapeTopicLabels: Record<EscapeTopic, string> = {
  "proteinas-funcoes": "Proteínas e funções",
  "hemoglobina-estrutura": "Estrutura da hemoglobina",
  "anemia-falciforme": "Anemia falciforme",
  "talassemias": "Talassemias",
  "hemostasia-primaria": "Hemostasia primária",
  "hemostasia-secundaria": "Hemostasia secundária",
  "hemofilias": "Hemofilias A e B",
  "von-willebrand": "Doença de von Willebrand",
  "bernard-soulier": "Bernard-Soulier",
  "heranca-ligada-x": "Herança ligada ao X",
  "heranca-autossomica": "Herança autossômica",
  "mutacoes-ponto": "Mutações de ponto",
  "splicing-promotor": "Splicing e promotor",
  "trombofilias": "Trombofilias",
  "imunodeficiencias-plaquetarias": "Imunodeficiências com plaquetopenia",
};

/* ========================================================================= */

export const joinSessionSchema = z.object({
  code: z.string().trim().min(4).max(8).transform((value) => value.toUpperCase()),
  name: z.string().trim().min(2).max(24).optional(),
  teamToken: z.string().min(16).optional(),
});

export const watchSessionSchema = z.object({
  code: z.string().trim().min(4).max(8).transform((value) => value.toUpperCase()),
  role: z.enum(["host", "screen", "team"]),
  hostToken: z.string().min(16).optional(),
  teamToken: z.string().min(16).optional(),
});

export const answerSchema = z.object({
  code: z.string().trim().min(4).max(8).transform((value) => value.toUpperCase()),
  teamToken: z.string().min(16),
  questionId: z.string().min(1),
  choiceId: z.string().min(1).max(8),
});

export const integritySchema = z.object({
  code: z.string().trim().min(4).max(8).transform((value) => value.toUpperCase()),
  teamToken: z.string().min(16),
  type: z.enum(["visibility_hidden", "pagehide", "blur", "disconnect"]),
  hiddenDurationMs: z.number().int().min(0).max(600_000).optional(),
});

export const hostActionSchema = z.discriminatedUnion("action", [
  z.object({ code: z.string(), hostToken: z.string(), action: z.literal("advance") }),
  z.object({ code: z.string(), hostToken: z.string(), action: z.literal("back") }),
  z.object({ code: z.string(), hostToken: z.string(), action: z.literal("pause") }),
  z.object({ code: z.string(), hostToken: z.string(), action: z.literal("resume") }),
  z.object({ code: z.string(), hostToken: z.string(), action: z.literal("reset") }),
  z.object({ code: z.string(), hostToken: z.string(), action: z.literal("finish") }),
  z.object({ code: z.string(), hostToken: z.string(), action: z.literal("adjustScore"), teamId: z.string(), delta: z.number().int().min(-100).max(100), reason: z.string().trim().min(3).max(120) }),
  z.object({ code: z.string(), hostToken: z.string(), action: z.literal("setPolicy"), policy: z.enum(["OBSERVE_ONLY", "WARNING", "ZERO_ROUND", "MANUAL_REVIEW"]) }),
  z.object({ code: z.string(), hostToken: z.string(), action: z.literal("reverseIncident"), incidentId: z.string(), reason: z.string().trim().min(3).max(120) }),
  z.object({ code: z.string(), hostToken: z.string(), action: z.literal("unlockDoor"), teamId: z.string() }),
  z.object({ code: z.string(), hostToken: z.string(), action: z.literal("extendTime"), minutes: z.number().int().min(1).max(20) }),
]);

export type HostAction = z.infer<typeof hostActionSchema>;

export const phaseLabels: Record<Phase, string> = {
  LOBBY: "Sala de espera",
  FOCUS_CHECK: "Protocolo de foco",
  WARMUP: "Desbloqueio molecular",
  CASE_INVESTIGATION: "Investigação principal",
  BLITZ: "Código relâmpago",
  FINAL_CHAIN: "Mecanismo final",
  REVEAL: "A verdade",
  FINISHED: "Protocolo encerrado",
  PAUSED: "Tempo suspenso",
  BRIEFING: "Briefing da SENTINELA",
  ESCAPE: "Laboratório selado",
  DEBRIEF: "Debriefing",
};
