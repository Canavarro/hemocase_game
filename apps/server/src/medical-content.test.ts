import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { DiseaseKnowledge, GameContent, MedicalKnowledgeBase, QuestionBank } from "@hemocase/shared";
import { generateEscapeCase } from "./case-generator.js";
import { GameEngine } from "./game-engine.js";
import { buildBankEmergencyFiles, validateDiseaseAgainstCanon, validateMedicalContent } from "./medical-content.js";

const root = path.resolve(process.cwd(), "../..");
const knowledge = JSON.parse(fs.readFileSync(path.join(root, "content/medical-knowledge.pt-BR.json"), "utf8")) as MedicalKnowledgeBase;
const bank = JSON.parse(fs.readFileSync(path.join(root, "content/question-bank.pt-BR.json"), "utf8")) as QuestionBank;
const content = JSON.parse(fs.readFileSync(path.join(root, "content/game.pt-BR.json"), "utf8")) as GameContent;
const diseasesDir = path.join(root, "content/escape/diseases");
const diseases = fs.readdirSync(diseasesDir).filter((file) => file.endsWith(".json"))
  .map((file) => JSON.parse(fs.readFileSync(path.join(diseasesDir, file), "utf8")) as DiseaseKnowledge);

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

describe("validateMedicalContent", () => {
  it("aceita os bancos canônicos instalados", () => {
    expect(() => validateMedicalContent(knowledge, bank)).not.toThrow();
  });

  it("recusa id de doença duplicado", () => {
    const broken = clone(knowledge);
    broken.diseases.push(clone(broken.diseases[0]!));
    expect(() => validateMedicalContent(broken, bank)).toThrowError(/id duplicado/i);
  });

  it("recusa pergunta com correctOptionId sem opção correspondente", () => {
    const broken = clone(bank);
    broken.questions[0]!.correctOptionId = "Z";
    expect(() => validateMedicalContent(knowledge, broken)).toThrowError(/sem opção correspondente/i);
  });

  it("recusa pergunta apontando doença inexistente", () => {
    const broken = clone(bank);
    broken.questions[0]!.diseaseId = "doenca_fantasma";
    expect(() => validateMedicalContent(knowledge, broken)).toThrowError(/doença inexistente/i);
  });

  it("recusa pontuação divergente da regra de scoring", () => {
    const broken = clone(bank);
    broken.questions[0]!.points = 99;
    expect(() => validateMedicalContent(knowledge, broken)).toThrowError(/divergente da regra/i);
  });
});

describe("validateDiseaseAgainstCanon", () => {
  it("todos os perfis do Escape estão vinculados e coerentes com o canônico", () => {
    for (const profile of diseases) {
      expect(profile.medicalId, `perfil ${profile.id} sem medicalId`).toBeDefined();
      expect(() => validateDiseaseAgainstCanon(profile, knowledge)).not.toThrow();
    }
  });

  it("recusa perfil com gene fora dos genes canônicos", () => {
    const broken = clone(diseases.find((disease) => disease.id === "hemofilia-a")!);
    broken.gene.symbol = "F9";
    expect(() => validateDiseaseAgainstCanon(broken, knowledge)).toThrowError(/genes canônicos/i);
  });

  it("recusa herança divergente do canônico", () => {
    const broken = clone(diseases.find((disease) => disease.id === "anemia-falciforme")!);
    broken.inheritance.pattern = "ad";
    expect(() => validateDiseaseAgainstCanon(broken, knowledge)).toThrowError(/diverge do canônico/i);
  });
});

describe("Código Relâmpago pelo banco canônico", () => {
  const engine = () => new GameEngine(content, [], diseases, { knowledge, bank });

  it("sorteia perguntas filtradas por dificuldade com pontuação do banco", () => {
    const session = engine().createSession("http://x", "ZERO_ROUND", {
      mode: "QUIZ",
      blitz: { source: "bank", difficulties: ["hard"], includeExpansion: true, count: 4 },
    });
    expect(session.blitzQuestions!.length).toBeGreaterThanOrEqual(3);
    for (const question of session.blitzQuestions!) {
      expect(question.id).toMatch(/^QB-/);
      expect(question.points).toBe(12);
      expect(question.phase).toBe("BLITZ");
    }
  });

  it("sem expansão, usa apenas as trilhas principais (ou integração)", () => {
    const session = engine().createSession("http://x", "ZERO_ROUND", {
      mode: "QUIZ",
      blitz: { source: "bank", includeExpansion: false, count: 15 },
    });
    const core = new Set(["sickle_cell_disease", "beta_thalassemia", "hemophilia_a", "hemophilia_b", "von_willebrand_disease", "bernard_soulier"]);
    for (const question of session.blitzQuestions!) {
      const original = bank.questions.find((item) => `QB-${item.id}` === question.id)!;
      if (original.diseaseId) expect(core.has(original.diseaseId)).toBe(true);
    }
  });

  it("recusa filtros que deixam menos de 3 perguntas", () => {
    expect(() => engine().createSession("http://x", "ZERO_ROUND", {
      mode: "QUIZ",
      blitz: { source: "bank", categories: ["microscopy"], difficulties: ["hard"], includeExpansion: true, count: 7 },
    })).toThrowError(/atendem aos filtros/i);
  });

  it("nunca envia gabarito ou explicação ao cliente", () => {
    const instance = engine();
    const session = instance.createSession("http://x", "ZERO_ROUND", {
      mode: "QUIZ",
      blitz: { source: "bank", includeExpansion: true, count: 7 },
    });
    const { team } = instance.join(session.code, "Equipe Canon");
    session.phase = "BLITZ";
    session.questionIndex = 0;
    const snapshot = instance.snapshot(session, "team", team.token);
    expect(snapshot.question).toBeDefined();
    expect(snapshot.question).not.toHaveProperty("correctChoiceId");
    expect(snapshot.question).not.toHaveProperty("explanation");
  });
});

describe("arquivos de emergência vindos do banco canônico", () => {
  it("o pool exclui a doença principal e respeita os tópicos liberados", () => {
    const profile = diseases.find((disease) => disease.id === "hemofilia-a")!;
    const extra = buildBankEmergencyFiles(bank);
    expect(extra.length).toBeGreaterThan(10);
    const generated = generateEscapeCase(profile, diseases, 42, [...profile.topicTags], extra);
    const optional = generated.rooms.flatMap((room) => room.steps).filter((step) => step.optional);
    expect(optional.length).toBeGreaterThan(0);
    for (const step of optional) {
      for (const tag of step.tags) expect(profile.topicTags).toContain(tag);
      // Nenhum bônus pode ser sobre a própria hemofilia A.
      const answer = generated.answers[step.id]![0]!;
      const correctText = step.choices!.find((choice) => choice.id === answer)!.text;
      expect(correctText.toLocaleLowerCase("pt-BR")).not.toContain("hemofilia a");
    }
  });
});
