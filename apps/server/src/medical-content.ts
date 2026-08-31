import {
  coreMedicalDiseaseIds,
  questionCategories,
  questionCategoryLabels,
  questionDifficulties,
  type BankQuestion,
  type DiseaseKnowledge,
  type EscapeTopic,
  type MedicalKnowledgeBase,
  type Question,
  type QuestionBank,
  type QuestionDifficulty,
} from "@hemocase/shared";

/**
 * Bancos canônicos (`content/medical-knowledge.pt-BR.json` e
 * `content/question-bank.pt-BR.json`): validação de estrutura na inicialização
 * e conversões para o jogo. Regra de precedência de
 * `docs/MEDICAL_KNOWLEDGE_BASE.md`: em divergência, o banco médico vence — a
 * validação cruzada com os perfis do Escape torna isso mecânico.
 */

export function validateMedicalContent(knowledge: MedicalKnowledgeBase, bank: QuestionBank) {
  const problems: string[] = [];
  const diseaseIds = new Set<string>();
  for (const disease of knowledge.diseases) {
    if (diseaseIds.has(disease.id)) problems.push(`medical-knowledge: id duplicado "${disease.id}"`);
    diseaseIds.add(disease.id);
    if (!disease.name || !disease.genes?.length) problems.push(`medical-knowledge: "${disease.id}" precisa de name e genes`);
    if (!disease.inheritance?.pattern) problems.push(`medical-knowledge: "${disease.id}" sem inheritance.pattern`);
    if (!disease.progressiveClues?.length) problems.push(`medical-knowledge: "${disease.id}" sem progressiveClues`);
    else {
      const orders = disease.progressiveClues.map((clue) => clue.order);
      if (new Set(orders).size !== orders.length) problems.push(`medical-knowledge: "${disease.id}" com order repetida nas progressiveClues`);
    }
  }
  for (const id of coreMedicalDiseaseIds) {
    if (!diseaseIds.has(id)) problems.push(`medical-knowledge: trilha principal "${id}" ausente do banco`);
  }

  const questionIds = new Set<string>();
  const scoring = bank.rules?.scoring;
  for (const question of bank.questions) {
    if (questionIds.has(question.id)) problems.push(`question-bank: id duplicado "${question.id}"`);
    questionIds.add(question.id);
    if (question.diseaseId && !diseaseIds.has(question.diseaseId)) {
      problems.push(`question-bank: "${question.id}" referencia doença inexistente "${question.diseaseId}"`);
    }
    if (!questionCategories.includes(question.category)) problems.push(`question-bank: "${question.id}" com category inválida "${question.category}"`);
    if (!questionDifficulties.includes(question.difficulty)) problems.push(`question-bank: "${question.id}" com difficulty inválida "${question.difficulty}"`);
    if (!question.options || question.options.length < 2) problems.push(`question-bank: "${question.id}" precisa de pelo menos 2 opções`);
    else {
      const optionIds = question.options.map((option) => option.id);
      if (new Set(optionIds).size !== optionIds.length) problems.push(`question-bank: "${question.id}" com opções de id duplicado`);
      if (!optionIds.includes(question.correctOptionId)) {
        problems.push(`question-bank: "${question.id}" com correctOptionId "${question.correctOptionId}" sem opção correspondente`);
      }
    }
    if (!question.explanation) problems.push(`question-bank: "${question.id}" sem explanation`);
    if (scoring && questionDifficulties.includes(question.difficulty) && question.points !== scoring[question.difficulty]) {
      problems.push(`question-bank: "${question.id}" com points ${question.points} divergente da regra ${question.difficulty}=${scoring[question.difficulty]}`);
    }
  }

  if (problems.length) {
    throw new Error(`Bancos canônicos inválidos:\n- ${problems.join("\n- ")}`);
  }
}

/**
 * Confere os perfis do Escape contra a fonte canônica: `medicalId` existente,
 * genes contidos nos genes canônicos e padrão de herança compatível.
 */
export function validateDiseaseAgainstCanon(profile: DiseaseKnowledge, knowledge: MedicalKnowledgeBase) {
  if (!profile.medicalId) return;
  const canon = knowledge.diseases.find((disease) => disease.id === profile.medicalId);
  if (!canon) throw new Error(`Perfil "${profile.id}": medicalId "${profile.medicalId}" não existe em medical-knowledge.`);
  const symbols = profile.gene.symbol.split("/").map((symbol) => symbol.trim());
  for (const symbol of symbols) {
    if (!canon.genes.includes(symbol)) {
      throw new Error(`Perfil "${profile.id}": gene "${symbol}" não consta nos genes canônicos de "${canon.id}" (${canon.genes.join(", ")}).`);
    }
  }
  const pattern = canon.inheritance.pattern.toLocaleLowerCase("pt-BR");
  if (!pattern.includes("mista")) {
    const expected = pattern.includes("ligada ao x") ? "xr" : pattern.includes("dominante") ? "ad" : pattern.includes("recessiv") ? "ar" : undefined;
    if (expected && profile.inheritance.pattern !== expected) {
      throw new Error(`Perfil "${profile.id}": herança "${profile.inheritance.pattern}" diverge do canônico "${canon.inheritance.pattern}".`);
    }
  }
}

/** Tópicos do Escape correspondentes a cada entidade canônica (para filtrar bônus). */
export const medicalTopicMap: Record<string, EscapeTopic[]> = {
  sickle_cell_disease: ["anemia-falciforme"],
  hemoglobin_c: ["hemoglobina-estrutura"],
  alpha_thalassemia: ["talassemias"],
  beta_thalassemia: ["talassemias"],
  von_willebrand_disease: ["von-willebrand"],
  hemophilia_a: ["hemofilias"],
  hemophilia_b: ["hemofilias"],
  bernard_soulier: ["bernard-soulier"],
  glanzmann_thrombasthenia: ["hemostasia-primaria"],
  hermansky_pudlak: ["hemostasia-primaria"],
  wiskott_aldrich: ["imunodeficiencias-plaquetarias"],
  hereditary_hemorrhagic_telangiectasia: ["hemostasia-primaria"],
  factor_v_leiden: ["trombofilias"],
  prothrombin_thrombophilia: ["trombofilias"],
  antithrombin_deficiency: ["trombofilias"],
  protein_c_deficiency: ["trombofilias"],
  protein_s_deficiency: ["trombofilias"],
};

const blitzDurations: Record<QuestionDifficulty, number> = { easy: 20, medium: 30, hard: 40 };

/** Converte uma pergunta do banco canônico para o formato interno do quiz. */
export function bankQuestionToBlitz(question: BankQuestion, index: number): Question {
  return {
    id: `QB-${question.id}`,
    phase: "BLITZ",
    title: `Código relâmpago ${String(index + 1).padStart(2, "0")} · ${questionCategoryLabels[question.category]}`,
    prompt: question.stem,
    choices: question.options.map((option) => ({ id: option.id, text: option.text })),
    correctChoiceId: question.correctOptionId,
    explanation: question.explanation,
    points: question.points,
    durationSec: blitzDurations[question.difficulty],
  };
}

export interface EmergencyFileEntry {
  prompt: string;
  correct: string;
  wrong: string[];
  tags: EscapeTopic[];
  /** Origem para exclusão no caso principal (id do perfil ou da entidade canônica). */
  from: string;
}

/** Converte o banco de perguntas em arquivos de emergência para o modo Escape. */
export function buildBankEmergencyFiles(bank: QuestionBank): EmergencyFileEntry[] {
  return bank.questions
    .filter((question) => question.options.length >= 4)
    .map((question) => {
      const correct = question.options.find((option) => option.id === question.correctOptionId)!;
      return {
        prompt: question.stem,
        correct: correct.text,
        wrong: question.options.filter((option) => option.id !== question.correctOptionId).map((option) => option.text),
        tags: (question.diseaseId && medicalTopicMap[question.diseaseId]) || ["proteinas-funcoes"],
        from: question.diseaseId ?? "cross",
      };
    });
}
