import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { GameContent } from "@hemocase/shared";
import { GameEngine } from "./game-engine.js";

const content = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "../../content/game.pt-BR.json"), "utf8")) as GameContent;

function setup() {
  let now = 1_000_000;
  const engine = new GameEngine(content, () => now);
  const session = engine.createSession("http://192.168.0.2:3000");
  const joined = engine.join(session.code, "Equipe Alfa");
  return { engine, session, team: joined.team, now: () => now, elapse: (ms: number) => { now += ms; } };
}

describe("GameEngine", () => {
  it("distribui os quatro trilhos de forma equilibrada", () => {
    const { engine, session } = setup();
    for (let index = 1; index < 8; index += 1) engine.join(session.code, `Equipe ${index}`);
    const counts = [...session.teams.values()].reduce<Record<string, number>>((acc, team) => {
      acc[team.track] = (acc[team.track] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts).toEqual({ A: 2, B: 2, C: 2, D: 2 });
  });

  it("restaura uma equipe pelo token sem duplicá-la", () => {
    const { engine, session, team } = setup();
    engine.disconnect(session.code, team.token);
    const restored = engine.join(session.code, undefined, team.token);
    expect(restored.restored).toBe(true);
    expect(restored.team.id).toBe(team.id);
    expect(session.teams.size).toBe(1);
    expect(team.connected).toBe(true);
  });

  it("percorre a máquina de estados e inicia o relógio no servidor", () => {
    const { engine, session } = setup();
    engine.advance(session);
    expect(session.phase).toBe("FOCUS_CHECK");
    expect(engine.remainingMs(session)).toBe(60_000);
    engine.advance(session);
    expect(session.phase).toBe("WARMUP");
    expect(engine.currentQuestion(session)?.id).toBe("W1");
  });

  it("aceita uma resposta uma única vez e limita o bônus a 20%", () => {
    const { engine, session, team } = setup();
    engine.advance(session);
    engine.advance(session);
    const question = engine.currentQuestion(session, team)!;
    const result = engine.submitAnswer(session.code, team.token, question.id, question.correctChoiceId);
    expect(result.awardedPoints).toBeGreaterThanOrEqual(question.points);
    expect(result.awardedPoints).toBeLessThanOrEqual(Math.ceil(question.points * 1.2));
    expect(() => engine.submitAnswer(session.code, team.token, question.id, question.correctChoiceId)).toThrow(/já foi registrada/i);
  });

  it("recusa respostas depois do prazo", () => {
    const { engine, session, team, elapse } = setup();
    engine.advance(session);
    engine.advance(session);
    const question = engine.currentQuestion(session, team)!;
    elapse(question.durationSec * 1000 + 1);
    expect(() => engine.submitAnswer(session.code, team.token, question.id, question.correctChoiceId)).toThrow(/prazo/i);
  });

  it("zera somente a rodada atual e restaura pontos após reversão", () => {
    const { engine, session, team } = setup();
    engine.advance(session);
    engine.advance(session);
    const question = engine.currentQuestion(session, team)!;
    engine.submitAnswer(session.code, team.token, question.id, question.correctChoiceId);
    const previousScore = team.score;
    const { incident } = engine.registerIntegrity(session.code, team.token, "visibility_hidden", 1_200);
    expect(team.score).toBe(0);
    expect(team.zeroedPhases.has("WARMUP")).toBe(true);
    engine.applyHostAction({ code: session.code, hostToken: session.hostToken, action: "reverseIncident", incidentId: incident.id, reason: "Saída autorizada pelo facilitador" });
    expect(team.score).toBe(previousScore);
    expect(team.zeroedPhases.has("WARMUP")).toBe(false);
  });

  it("não penaliza blur isolado", () => {
    const { engine, session, team } = setup();
    engine.advance(session);
    engine.advance(session);
    const incident = engine.registerIntegrity(session.code, team.token, "blur").incident;
    expect(incident.classification).toBe("suspicious");
    expect(incident.deductedPoints).toBe(0);
  });
});
