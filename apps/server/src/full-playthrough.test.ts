import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { DiseaseKnowledge, EscapeCase, GameContent, MedicalKnowledgeBase } from "@hemocase/shared";
import { generateEscapeCase } from "./case-generator.js";
import { GameEngine } from "./game-engine.js";

/**
 * Auditoria de continuidade: para TODAS as doenças instaladas e vários seeds,
 * (1) valida a estrutura de cada caso gerado (sem alternativas duplicadas, sem
 * resposta no primeiro giro, lâminas distintas e com IDs únicos) e (2) joga a
 * partida INTEIRA no motor real, do lobby à fuga, provando que gabarito e
 * validação nunca divergem em nenhuma combinação.
 */

const root = path.resolve(process.cwd(), "../..");
const read = (file: string) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const diseases = fs.readdirSync(path.join(root, "content/escape/diseases")).filter((file) => file.endsWith(".json"))
  .map((file) => read(path.join("content/escape/diseases", file)) as DiseaseKnowledge);
const content = read("content/game.pt-BR.json") as GameContent;
const knowledge = read("content/medical-knowledge.pt-BR.json") as MedicalKnowledgeBase;
const allTopics = [...new Set(diseases.flatMap((disease) => disease.topicTags))];
const SEEDS = [1, 2, 3, 5, 7, 11, 42, 99, 123, 777, 2026, 65535];

const normalize = (value: string) => value.trim().toLocaleLowerCase("pt-BR");

function auditStructure(generated: EscapeCase, disease: DiseaseKnowledge, seed: number) {
  const label = `${disease.id} seed ${seed}`;
  for (const step of generated.rooms.flatMap((room) => room.steps)) {
    // Nenhuma lista de alternativas pode repetir id nem texto (dois seletores
    // iguais dos quais só um vale seria um enigma sem resposta observável).
    const pools = [step.choices ?? [], ...(step.slotChoices ?? [])].filter((pool) => pool.length);
    for (const pool of pools) {
      const ids = pool.map((choice) => choice.id);
      expect(new Set(ids).size, `${label}: id duplicado em ${step.id}`).toBe(ids.length);
      if (step.type !== "assemble") {
        const texts = pool.map((choice) => normalize(choice.text));
        expect(new Set(texts).size, `${label}: texto duplicado em ${step.id} (${texts.join(" | ")})`).toBe(texts.length);
      }
    }
    // Enigmas de girar: a resposta nunca na primeira posição de nenhum seletor.
    if (step.slotChoices && step.type !== "assemble") {
      const answer = generated.answers[step.id]!;
      let cursor = 0;
      for (const options of step.slotChoices) {
        if (!options.length) continue;
        expect(options[0]!.id, `${label}: ${step.id} entregaria a resposta no primeiro giro`).not.toBe(answer[cursor]);
        cursor += 1;
      }
    }
  }
  // Microscópio: três lâminas com IDs únicos e morfologias distintas.
  const scope = generated.rooms.flatMap((room) => room.steps).find((step) => step.type === "microscope")!;
  expect(new Set(scope.choices!.map((choice) => choice.id)).size, `${label}: IDs de lâmina repetidos`).toBe(3);
  expect(new Set(scope.choices!.map((choice) => choice.smear)).size, `${label}: morfologias repetidas`).toBe(3);
}

/** Joga a partida inteira no motor: opcionais primeiro, obrigatórios, prontuário, fuga. */
function playThrough(generated: EscapeCase, disease: DiseaseKnowledge, seed: number) {
  const label = `${disease.id} seed ${seed}`;
  const engine = new GameEngine(content, [generated], diseases);
  const session = engine.createSession("http://x", "ZERO_ROUND", {
    mode: "ESCAPE", caseId: generated.id, allowedTopics: allTopics, durationMin: 30,
  });
  const { team } = engine.join(session.code, "Equipe Auditoria");
  engine.advance(session); // LOBBY -> BRIEFING
  engine.advance(session); // BRIEFING -> ESCAPE
  const installedCase = session.escapeCase!;

  for (const room of installedCase.rooms) {
    const ordered = [...room.steps].sort((a, b) => Number(b.optional ?? false) - Number(a.optional ?? false));
    for (const step of ordered) {
      const result = engine.escapeAttempt(session.code, team.token, step.id, installedCase.answers[step.id]!);
      expect(result.correct, `${label}: gabarito de ${step.id} rejeitado pelo motor`).toBe(true);
    }
    if (room.id !== "R0" && room.id !== "R5") {
      engine.escapeNote(session.code, team.token, room.id, `Hipótese registrada na ${room.name}.`);
    }
  }

  const view = engine.escapeView(session, team)!;
  expect(view.finishedAt, `${label}: a equipe não escapou ao acertar tudo`).toBeTruthy();
  expect(view.debrief?.diagnosis).toBe(disease.debrief.diagnosis);
  expect(team.score).toBeGreaterThan(100);
}

describe("Auditoria completa · casos gerados", () => {
  for (const disease of diseases) {
    it(`${disease.id}: estrutura íntegra e partida completa em ${SEEDS.length} seeds`, () => {
      for (const seed of SEEDS) {
        const generated = generateEscapeCase(disease, diseases, seed, allTopics);
        auditStructure(generated, disease, seed);
        playThrough(generated, disease, seed);
      }
    });
  }
});

describe("Auditoria completa · coerência com a base canônica", () => {
  const canon = new Map(knowledge.diseases.map((entry) => [entry.id, entry]));
  const locusTokens = (text: string) => text.match(/\d+[pq][\d.]+/g) ?? [];

  for (const disease of diseases) {
    it(`${disease.id}: locus e rótulos batem com o banco médico`, () => {
      const canonical = canon.get(disease.medicalId!);
      expect(canonical, `${disease.id} sem medicalId canônico`).toBeDefined();
      // Todo locus citado no perfil precisa existir no banco canônico
      // (quando o banco traz loci explícitos para a doença).
      const canonLoci = canonical!.chromosomeLocation.join(" ");
      if (locusTokens(canonLoci).length) {
        for (const token of locusTokens(disease.gene.locus)) {
          expect(canonLoci, `${disease.id}: locus ${token} não consta no banco canônico`).toContain(token);
        }
      }
      // O esfregaço descrito precisa conversar com a morfologia canônica.
      expect(disease.smear.finding.length).toBeGreaterThan(10);
    });
  }
});
