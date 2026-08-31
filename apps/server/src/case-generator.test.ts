import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { DiseaseKnowledge, GameContent } from "@hemocase/shared";
import { generateEscapeCase, validateDisease } from "./case-generator.js";
import { GameEngine } from "./game-engine.js";

const diseasesDir = path.resolve(process.cwd(), "../../content/escape/diseases");
const diseases = fs.readdirSync(diseasesDir).filter((file) => file.endsWith(".json"))
  .map((file) => JSON.parse(fs.readFileSync(path.join(diseasesDir, file), "utf8")) as DiseaseKnowledge);
const content = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "../../content/game.pt-BR.json"), "utf8")) as GameContent;

describe("Base de conhecimento de doenças", () => {
  it("instala pelo menos 4 doenças válidas em mais de um grupo", () => {
    expect(diseases.length).toBeGreaterThanOrEqual(4);
    for (const disease of diseases) validateDisease(disease);
    expect(new Set(diseases.map((disease) => disease.group)).size).toBeGreaterThan(1);
  });
});

describe("generateEscapeCase", () => {
  for (const profile of diseases) {
    it(`gera um caso completo e consistente para ${profile.id}`, () => {
      const generated = generateEscapeCase(profile, diseases, 42, [...profile.topicTags]);
      expect(generated.rooms).toHaveLength(6);
      expect(generated.debrief.diagnosis).toBe(profile.debrief.diagnosis);

      const steps = generated.rooms.flatMap((room) => room.steps);
      for (const step of steps) {
        const answer = generated.answers[step.id];
        expect(answer, `gabarito ausente em ${step.id}`).toBeDefined();
        expect(step.hints).toHaveLength(3);
        if (step.choices && step.type !== "microscope") {
          for (const id of answer!) {
            if (step.type === "assemble") continue;
            expect(step.choices.map((choice) => choice.id), `resposta fora das alternativas em ${step.id}`).toContain(id);
          }
        }
        if (step.slotChoices && step.type !== "chain-fill") {
          answer!.forEach((id, index) => {
            expect(step.slotChoices![index]!.map((choice) => choice.id)).toContain(id);
          });
        }
      }

      // Microscópio: três lâminas com morfologias DISTINTAS e a correta com o esfregaço da doença.
      const scope = steps.find((step) => step.type === "microscope")!;
      const kinds = scope.choices!.map((choice) => choice.smear);
      expect(new Set(kinds).size).toBe(3);
      const correctSlide = scope.choices!.find((choice) => choice.id === generated.answers["R2-S1"]![0]);
      expect(correctSlide?.smear).toBe(profile.smear.kind);

      // Códigos: 4 dígitos e o da geladeira derivado das contagens reais.
      expect(generated.answers["R1-S1"]![0]).toMatch(/^\d{4}$/);
      expect(generated.answers["R2-S3"]![0]).toBe(`${profile.labs.altered.length}${profile.labs.normal.length}34`);

      // Quadro clínico: 4 achados corretos entre 8 alternativas.
      const board = steps.find((step) => step.id === "R1-S2")!;
      expect(board.choices).toHaveLength(8);
      expect(generated.answers["R1-S2"]).toHaveLength(4);

      // Cofre: 5 seletores com 3 posições cada.
      const safe = steps.find((step) => step.type === "dial-safe")!;
      expect(safe.slotChoices).toHaveLength(5);
      for (const options of safe.slotChoices!) expect(options).toHaveLength(3);
    });

    it(`nos enigmas de girar de ${profile.id}, a combinação correta nunca é o primeiro giro`, () => {
      for (const seed of [1, 7, 42, 999]) {
        const generated = generateEscapeCase(profile, diseases, seed, [...profile.topicTags]);
        const steps = generated.rooms.flatMap((room) => room.steps);
        for (const step of steps) {
          if (!step.slotChoices || step.type === "assemble") continue;
          const answer = generated.answers[step.id]!;
          let cursor = 0;
          for (const options of step.slotChoices) {
            if (!options.length) continue;
            expect(options[0]!.id, `${step.id} entregaria a resposta no primeiro giro (seed ${seed})`).not.toBe(answer[cursor]);
            cursor += 1;
          }
        }
      }
    });
  }

  it("é determinístico por seed e varia entre seeds", () => {
    const profile = diseases[0]!;
    const first = generateEscapeCase(profile, diseases, 123, [...profile.topicTags]);
    const second = generateEscapeCase(profile, diseases, 123, [...profile.topicTags]);
    const third = generateEscapeCase(profile, diseases, 124, [...profile.topicTags]);
    expect(second).toEqual(first);
    expect(third.id).not.toBe(first.id);
  });

  it("só inclui arquivos de emergência dentro dos tópicos liberados e de outras doenças", () => {
    for (const profile of diseases) {
      const generated = generateEscapeCase(profile, diseases, 42, [...profile.topicTags]);
      const optional = generated.rooms.flatMap((room) => room.steps).filter((step) => step.optional);
      for (const step of optional) {
        for (const tag of step.tags) expect(profile.topicTags).toContain(tag);
      }
    }
  });
});

describe("GameEngine · gerador por doença/assunto/aula", () => {
  it("gera sessão fixada em uma doença, herdando os tópicos dela", () => {
    const engine = new GameEngine(content, [], diseases);
    const session = engine.createSession("http://x", "ZERO_ROUND", {
      mode: "ESCAPE",
      generator: { mode: "disease", diseaseId: "hemofilia-a" },
    });
    expect(session.escapeCase!.id).toMatch(/^gen-hemofilia-a-/);
    const profile = diseases.find((disease) => disease.id === "hemofilia-a")!;
    expect(session.allowedTopics).toEqual(profile.topicTags);
  });

  it("gera por assunto sorteando somente doenças do grupo", () => {
    const engine = new GameEngine(content, [], diseases);
    const session = engine.createSession("http://x", "ZERO_ROUND", {
      mode: "ESCAPE",
      generator: { mode: "group", group: "hemoglobinopatias" },
    });
    const generatedFrom = session.escapeCase!.id.replace(/^gen-/, "").replace(/-[a-z0-9]+$/, "");
    const profile = diseases.find((disease) => disease.id === generatedFrom)!;
    expect(profile.group).toBe("hemoglobinopatias");
  });

  it("gera pela aula inteira respeitando os tópicos liberados", () => {
    const engine = new GameEngine(content, [], diseases);
    const hemofilia = diseases.find((disease) => disease.id === "hemofilia-a")!;
    const session = engine.createSession("http://x", "ZERO_ROUND", {
      mode: "ESCAPE",
      generator: { mode: "any" },
      allowedTopics: [...hemofilia.topicTags],
    });
    // Só hemofilias cabem nesses tópicos, então o sorteio precisa cair nelas.
    expect(session.escapeCase!.id).toMatch(/^gen-hemofilia-/);
  });

  it("recusa doença desconhecida e grupo vazio", () => {
    const engine = new GameEngine(content, [], diseases);
    expect(() => engine.createSession("http://x", "ZERO_ROUND", { mode: "ESCAPE", generator: { mode: "disease", diseaseId: "doenca-fantasma" } }))
      .toThrowError(/não está instalada/i);
  });

  it("expõe a biblioteca completa para o Host", () => {
    const engine = new GameEngine(content, [], diseases);
    const library = engine.listLibrary();
    expect(library.diseases.length).toBe(diseases.length);
    expect(library.diseases[0]).toHaveProperty("group");
  });
});
