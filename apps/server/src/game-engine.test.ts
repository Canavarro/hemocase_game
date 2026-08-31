import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { EscapeCase, GameContent } from "@hemocase/shared";
import { GameEngine } from "./game-engine.js";

const content = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "../../content/game.pt-BR.json"), "utf8")) as GameContent;
const escapeCase = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "../../content/escape/cases/falciforme-a17.json"), "utf8")) as EscapeCase;

function setup() {
  let now = 1_000_000;
  const engine = new GameEngine(content, [escapeCase], [], undefined, () => now);
  const session = engine.createSession("http://192.168.0.2:3000");
  const joined = engine.join(session.code, "Equipe Alfa");
  return { engine, session, team: joined.team, now: () => now, elapse: (ms: number) => { now += ms; } };
}

function setupEscape() {
  let now = 1_000_000;
  const engine = new GameEngine(content, [escapeCase], [], undefined, () => now);
  const session = engine.createSession("http://192.168.0.2:3000", "ZERO_ROUND", {
    mode: "ESCAPE",
    allowedTopics: [...escapeCase.topicTags, "trombofilias", "talassemias", "imunodeficiencias-plaquetarias"],
    durationMin: 35,
  });
  const joined = engine.join(session.code, "Equipe Hélix");
  // LOBBY -> BRIEFING -> ESCAPE
  engine.advance(session);
  engine.advance(session);
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

describe("GameEngine · modo Escape", () => {
  it("recusa criar sessão Escape sem os tópicos exigidos pelo caso", () => {
    const engine = new GameEngine(content, [escapeCase]);
    expect(() => engine.createSession("http://x", "ZERO_ROUND", { mode: "ESCAPE", allowedTopics: ["hemofilias"] }))
      .toThrowError(/tópicos/i);
  });

  it("remove enigmas opcionais cujas tags não foram liberadas", () => {
    const engine = new GameEngine(content, [escapeCase]);
    const session = engine.createSession("http://x", "ZERO_ROUND", {
      mode: "ESCAPE",
      allowedTopics: [...escapeCase.topicTags],
    });
    const allSteps = session.escapeCase!.rooms.flatMap((room) => room.steps);
    expect(allSteps.some((step) => step.id === "R2-F1")).toBe(false);
    expect(allSteps.some((step) => step.id === "R2-S3")).toBe(true);
  });

  it("fixa a sessão em um único caso por caseId, herdando os tópicos do próprio caso", () => {
    const engine = new GameEngine(content, [escapeCase]);
    const session = engine.createSession("http://x", "ZERO_ROUND", { mode: "ESCAPE", caseId: escapeCase.id });
    expect(session.escapeCase!.id).toBe(escapeCase.id);
    expect(session.allowedTopics).toEqual(escapeCase.topicTags);
    // Jogo inteiro sobre uma única doença: opcionais de outros temas ficam de fora.
    const allSteps = session.escapeCase!.rooms.flatMap((room) => room.steps);
    expect(allSteps.some((step) => step.optional)).toBe(false);
  });

  it("recusa caseId que não está instalado", () => {
    const engine = new GameEngine(content, [escapeCase]);
    expect(() => engine.createSession("http://x", "ZERO_ROUND", { mode: "ESCAPE", caseId: "caso-fantasma" }))
      .toThrowError(/não está instalado/i);
  });

  it("tópicos marcados nunca vetam um caso escolhido explicitamente; só limitam os bônus", () => {
    const engine = new GameEngine(content, [escapeCase]);
    const session = engine.createSession("http://x", "ZERO_ROUND", { mode: "ESCAPE", caseId: escapeCase.id, allowedTopics: ["hemofilias"] });
    expect(session.escapeCase!.id).toBe(escapeCase.id);
    // Sessão registra a união (marcações + tópicos do caso).
    for (const tag of escapeCase.topicTags) expect(session.allowedTopics).toContain(tag);
    expect(session.allowedTopics).toContain("hemofilias");
    // Bônus fora das marcações da turma ficam de fora.
    const optional = session.escapeCase!.rooms.flatMap((room) => room.steps).filter((step) => step.optional);
    expect(optional).toHaveLength(0);
  });

  it("equipe começa com 100 bases e resolve enigmas com validação no servidor", () => {
    const { engine, session, team } = setupEscape();
    expect(session.phase).toBe("ESCAPE");
    expect(team.score).toBe(100);
    const wrong = engine.escapeAttempt(session.code, team.token, "R0-S1", ["usar"]);
    expect(wrong.correct).toBe(true);
    const view = engine.escapeView(session, team)!;
    expect(view.inventory).toContain("Crachá do plantonista");
    expect(view.step?.id).toBe("R0-S2");
  });

  it("penaliza tentativa errada e avança de sala com prontuário preenchido", () => {
    const { engine, session, team } = setupEscape();
    engine.escapeAttempt(session.code, team.token, "R0-S1", ["usar"]);
    const miss = engine.escapeAttempt(session.code, team.token, "R0-S2", ["ribossomo", "funcao"]);
    expect(miss.correct).toBe(false);
    expect(team.score).toBe(100); // 100 + 2 do R0-S1 - 2 do erro
    engine.escapeAttempt(session.code, team.token, "R0-S2", ["rna", "funcao"]);
    expect(engine.escapeView(session, team)!.roomId).toBe("R1"); // R0 dispensa prontuário
    engine.escapeAttempt(session.code, team.token, "R1-S1", ["7264"]);
    engine.escapeAttempt(session.code, team.token, "R1-S2", ["familia", "dor", "ictericia", "palidez"]);
    // Sala concluída, mas porta espera o prontuário.
    expect(engine.escapeView(session, team)!.roomId).toBe("R1");
    expect(engine.escapeView(session, team)!.noteRequired).toBe(true);
    engine.escapeNote(session.code, team.token, "R1", "Hipótese: hemólise com dor óssea. Investigar hemoglobina.");
    expect(engine.escapeView(session, team)!.roomId).toBe("R2");
  });

  it("dicas saem em ordem com custo crescente e o cofre trava ao errar", () => {
    const { engine, session, team } = setupEscape();
    expect(() => engine.escapeHint(session.code, team.token, "R0-S1", 2)).toThrowError(/ordem/i);
    const h1 = engine.escapeHint(session.code, team.token, "R0-S1", 1);
    expect(h1.cost).toBe(0);
    const h2 = engine.escapeHint(session.code, team.token, "R0-S1", 2);
    expect(h2.cost).toBe(3);
    expect(team.score).toBe(97);

    // Caminho direto até o cofre para testar a trava.
    for (const [stepId, answer] of [
      ["R0-S1", ["usar"]], ["R0-S2", ["rna", "funcao"]],
      ["R1-S1", ["7264"]], ["R1-S2", ["dor", "palidez", "ictericia", "familia"]],
    ] as const) engine.escapeAttempt(session.code, team.token, stepId, [...answer]);
    engine.escapeNote(session.code, team.token, "R1", "nota r1 ok");
    for (const [stepId, answer] of [
      ["R2-S1", ["A17"]], ["R2-S2", ["hb", "retic", "bili"]], ["R2-S3", ["3713"]],
    ] as const) engine.escapeAttempt(session.code, team.token, stepId, [...answer]);
    engine.escapeNote(session.code, team.token, "R2", "nota r2 ok");
    for (const [stepId, answer] of [
      ["R3-S1", ["beta", "alfa", "beta", "alfa"]], ["R3-S2", ["hb", "qualitativa", "polimeriza"]],
    ] as const) engine.escapeAttempt(session.code, team.token, stepId, [...answer]);
    engine.escapeNote(session.code, team.token, "R3", "nota r3 ok");
    for (const [stepId, answer] of [
      ["R4-S1", ["2"]], ["R4-S2", ["ar"]], ["R4-S3", ["p25"]],
    ] as const) engine.escapeAttempt(session.code, team.token, stepId, [...answer]);
    engine.escapeNote(session.code, team.token, "R4", "nota r4 ok");
    expect(engine.escapeView(session, team)!.roomId).toBe("R5");

    const beforeSafe = team.score;
    const wrongSafe = engine.escapeAttempt(session.code, team.token, "R5-S1", ["f8", "hbs", "polimerizacao", "hemolise", "ar"]);
    expect(wrongSafe.correct).toBe(false);
    expect(team.score).toBe(beforeSafe - 5);
    expect(() => engine.escapeAttempt(session.code, team.token, "R5-S1", ["hbb", "hbs", "polimerizacao", "hemolise", "ar"]))
      .toThrowError(/travado/i);
  });

  it("abre o cofre, registra fuga e soma bônus de tempo", () => {
    const { engine, session, team, elapse } = setupEscape();
    for (const [stepId, answer] of [
      ["R0-S1", ["usar"]], ["R0-S2", ["rna", "funcao"]],
      ["R1-S1", ["7264"]], ["R1-S2", ["dor", "palidez", "ictericia", "familia"]],
    ] as const) engine.escapeAttempt(session.code, team.token, stepId, [...answer]);
    engine.escapeNote(session.code, team.token, "R1", "nota r1 ok");
    for (const [stepId, answer] of [
      ["R2-S1", ["A17"]], ["R2-S2", ["hb", "retic", "bili"]], ["R2-S3", ["3713"]],
    ] as const) engine.escapeAttempt(session.code, team.token, stepId, [...answer]);
    engine.escapeNote(session.code, team.token, "R2", "nota r2 ok");
    for (const [stepId, answer] of [
      ["R3-S1", ["alfa", "alfa", "beta", "beta"]], ["R3-S2", ["hb", "qualitativa", "polimeriza"]],
    ] as const) engine.escapeAttempt(session.code, team.token, stepId, [...answer]);
    engine.escapeNote(session.code, team.token, "R3", "nota r3 ok");
    for (const [stepId, answer] of [
      ["R4-S1", ["2"]], ["R4-S2", ["ar"]], ["R4-S3", ["p25"]],
    ] as const) engine.escapeAttempt(session.code, team.token, stepId, [...answer]);
    engine.escapeNote(session.code, team.token, "R4", "nota r4 ok");
    elapse(10 * 60_000); // 10 minutos de partida
    engine.escapeAttempt(session.code, team.token, "R5-S1", ["hbb", "hbs", "polimerizacao", "hemolise", "ar"]);
    const view = engine.escapeView(session, team)!;
    expect(view.finishedAt).toBeTruthy();
    expect(view.debrief?.diagnosis).toBe("Anemia falciforme");
    expect(team.score).toBeGreaterThan(100);
    // Todas as equipes escaparam: o tick encerra a corrida.
    const advanced = engine.tick();
    expect(advanced).toContain(session);
    expect(session.phase).toBe("DEBRIEF");
  });
});
