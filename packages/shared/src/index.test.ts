import { describe, expect, it } from "vitest";
import { answerSchema, integritySchema, joinSessionSchema } from "./index.js";

describe("schemas de rede", () => {
  it("normaliza o código e limita o nome da equipe", () => {
    expect(joinSessionSchema.parse({ code: "ab12cd", name: "  Equipe HBB  " }).code).toBe("AB12CD");
    expect(() => joinSessionSchema.parse({ code: "AB12CD", name: "A" })).toThrow();
  });

  it("rejeita respostas sem token e durações de integridade absurdas", () => {
    expect(() => answerSchema.parse({ code: "AB12CD", questionId: "W1", choiceId: "A" })).toThrow();
    expect(() => integritySchema.parse({ code: "AB12CD", teamToken: "x".repeat(20), type: "visibility_hidden", hiddenDurationMs: 900_000 })).toThrow();
  });
});
