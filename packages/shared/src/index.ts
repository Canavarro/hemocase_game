import { z } from "zod";

export const phases = [
  "LOBBY", "FOCUS_CHECK", "WARMUP", "CASE_INVESTIGATION", "BLITZ",
  "FINAL_CHAIN", "REVEAL", "FINISHED", "PAUSED",
] as const;

export type Phase = (typeof phases)[number];
export type IntegrityPolicy = "OBSERVE_ONLY" | "WARNING" | "ZERO_ROUND" | "MANUAL_REVIEW";
export type TrackId = "A" | "B" | "C" | "D";

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
}

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
};
