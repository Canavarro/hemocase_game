import {
  escapeSmearKinds,
  type DiseaseKnowledge,
  type EscapeCase,
  type EscapeChoice,
  type EscapeSmearKind,
  type EscapeStep,
  type EscapeTopic,
} from "@hemocase/shared";
import type { EmergencyFileEntry } from "./medical-content.js";

/**
 * Gerador de casos: transforma um perfil da base de conhecimento
 * (`content/escape/diseases/*.json`) em um `EscapeCase` completo de seis salas.
 * Tudo que é sorteio (distratores, ordem das alternativas, identificação do
 * paciente, senhas) sai de um RNG semeado, então o mesmo seed reproduz o mesmo
 * caso — útil para auditoria e testes. Os distratores clínicos e do cofre vêm
 * das OUTRAS doenças instaladas, então a base cresce e os casos ficam mais
 * ricos sem mudança de código.
 */

/* ============================ RNG determinístico ============================ */

function mulberry32(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rng = () => number;

function shuffle<T>(rng: Rng, list: T[]): T[] {
  const copy = [...list];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(rng() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap]!, copy[index]!];
  }
  return copy;
}

function sample<T>(rng: Rng, list: T[], count: number): T[] {
  return shuffle(rng, list).slice(0, count);
}

function pick<T>(rng: Rng, list: T[]): T {
  return list[Math.floor(rng() * list.length)]!;
}

/* ========================= Validação da base editável ========================= */

/** Valida um perfil vindo do JSON editável e explica o problema ao professor. */
export function validateDisease(profile: DiseaseKnowledge) {
  const problems: string[] = [];
  if (!profile.id || !profile.name) problems.push("id e name são obrigatórios");
  if (profile.clinical.correct.length < 4) problems.push("clinical.correct precisa de pelo menos 4 achados");
  if (profile.clinical.distractors.length < 4) problems.push("clinical.distractors precisa de pelo menos 4 achados");
  if (profile.labs.altered.length < 2 || profile.labs.altered.length > 5) problems.push("labs.altered precisa de 2 a 5 exames");
  if (profile.labs.normal.length < 2 || profile.labs.normal.length > 7) problems.push("labs.normal precisa de 2 a 7 exames (a contagem vira um dígito do cadeado)");
  if (!escapeSmearKinds.includes(profile.smear.kind)) problems.push(`smear.kind inválido: ${profile.smear.kind}`);
  if (!profile.protein.assembly && !profile.protein.role) problems.push("protein precisa de assembly ou role");
  if (!["ar", "ad", "xr"].includes(profile.inheritance.pattern)) problems.push(`inheritance.pattern inválido: ${profile.inheritance.pattern}`);
  if (profile.inheritance.recurrence.wrong.length < 3) problems.push("inheritance.recurrence.wrong precisa de 3 alternativas");
  const overlap = (a: string[], b: string[]) => a.filter((text) => b.includes(text));
  const clinicalOverlap = overlap(profile.clinical.correct, profile.clinical.distractors);
  if (clinicalOverlap.length) problems.push(`clinical: mesmo texto em correct e distractors (${clinicalOverlap[0]})`);
  const labsOverlap = overlap(profile.labs.altered, profile.labs.normal);
  if (labsOverlap.length) problems.push(`labs: mesmo exame em altered e normal (${labsOverlap[0]})`);
  if (profile.protein.role && profile.protein.role.wrong.includes(profile.protein.role.correct)) problems.push("protein.role.wrong repete a resposta correta");
  if (profile.inheritance.recurrence.wrong.includes(profile.inheritance.recurrence.correct)) problems.push("inheritance.recurrence.wrong repete a resposta correta");
  if (profile.gene.sequence) {
    const { reference, sample: sampleSeq, divergentIndex } = profile.gene.sequence;
    if (reference.length !== sampleSeq.length) problems.push("gene.sequence: reference e sample precisam do mesmo tamanho");
    if (divergentIndex < 0 || divergentIndex >= sampleSeq.length) problems.push("gene.sequence.divergentIndex fora do intervalo");
    else if (reference[divergentIndex] === sampleSeq[divergentIndex]) problems.push("gene.sequence: o códon em divergentIndex precisa divergir");
  }
  if (problems.length) throw new Error(`Perfil de doença "${profile.id || "?"}" inválido: ${problems.join("; ")}.`);
}

/* ============================== Geração do caso ============================== */

const inheritanceChoices: EscapeChoice[] = [
  { id: "ar", text: "Autossômica recessiva" },
  { id: "ad", text: "Autossômica dominante" },
  { id: "xr", text: "Recessiva ligada ao X" },
  { id: "mito", text: "Herança mitocondrial" },
];

const smearLabels: Record<EscapeSmearKind, string> = {
  "normal": "esfregaço sem alterações morfológicas",
  "falciforme": "hemácias em foice (drepanócitos)",
  "microcitica-hipocromica": "microcitose e hipocromia com células em alvo",
  "plaquetas-gigantes": "plaquetas gigantes e escassas",
  "esferocitos": "esferócitos densos sem palidez central",
  "plaquetas-pequenas": "plaquetas pequenas e raras (microtrombocitopenia)",
  "celulas-alvo": "células em alvo abundantes com células densas ocasionais",
};

function generatePatientId(rng: Rng): string {
  const letter = pick(rng, [..."ABCDEFGHKM"]);
  return `${letter}${10 + Math.floor(rng() * 90)}`;
}

function generateDigits(rng: Rng, length: number): string {
  let code = String(1 + Math.floor(rng() * 9));
  while (code.length < length) code += String(Math.floor(rng() * 10));
  return code;
}

/** Alternativa correta + distratores embaralhados, com ids estáveis por posição. */
function buildChoices(rng: Rng, correctText: string, wrongTexts: string[], prefix: string) {
  const texts = shuffle(rng, [correctText, ...wrongTexts]);
  const choices: EscapeChoice[] = texts.map((text, index) => ({ id: `${prefix}${index}`, text }));
  const answer = choices.find((choice) => choice.text === correctText)!.id;
  return { choices, answer };
}

/**
 * Variante para lacunas de girar (chain-fill, mechanism-fill, dial-safe): a
 * opção correta nunca fica na primeira posição, senão um único toque em cada
 * seletor já entregaria a combinação.
 */
function buildCycleChoices(rng: Rng, correctText: string, wrongTexts: string[], prefix: string) {
  const built = buildChoices(rng, correctText, wrongTexts, prefix);
  const correctIndex = built.choices.findIndex((choice) => choice.id === built.answer);
  if (correctIndex === 0 && built.choices.length > 1) {
    const swap = 1 + Math.floor(rng() * (built.choices.length - 1));
    [built.choices[0], built.choices[swap]] = [built.choices[swap]!, built.choices[0]!];
  }
  return built;
}

/** Embaralha opções fixas de uma lacuna de girar mantendo a correta fora da 1ª posição. */
function shuffleCycle(rng: Rng, options: EscapeChoice[], correctId: string): EscapeChoice[] {
  const mixed = shuffle(rng, options);
  if (mixed[0]!.id === correctId && mixed.length > 1) {
    const swap = 1 + Math.floor(rng() * (mixed.length - 1));
    [mixed[0], mixed[swap]] = [mixed[swap]!, mixed[0]!];
  }
  return mixed;
}

/** Coleta valores de um campo de rota nas outras doenças, sem repetir texto. */
function routeDistractors(rng: Rng, others: DiseaseKnowledge[], field: keyof DiseaseKnowledge["route"], exclude: string, count: number) {
  const unique = [...new Set(others.map((other) => other.route[field]).filter((text) => text !== exclude))];
  return sample(rng, unique, count);
}

/**
 * Distratores vindos das outras doenças, NUNCA iguais ao texto correto —
 * várias doenças compartilham valores (ex.: protein.name "hemoglobina" em
 * falciforme, HbC e β-talassemia), e um distrator idêntico à resposta criaria
 * dois seletores iguais dos quais só um valeria.
 */
function fieldDistractors(rng: Rng, texts: string[], correct: string, count: number) {
  const normalize = (value: string) => value.trim().toLocaleLowerCase("pt-BR");
  const unique = [...new Set(texts)].filter((text) => normalize(text) !== normalize(correct));
  return sample(rng, unique, count);
}

export function generateEscapeCase(profile: DiseaseKnowledge, installed: DiseaseKnowledge[], seed: number, allowedTopics: EscapeTopic[], extraEmergency: EmergencyFileEntry[] = []): EscapeCase {
  validateDisease(profile);
  const rng = mulberry32(seed);
  const others = installed.filter((other) => other.id !== profile.id);
  const patientId = generatePatientId(rng);
  const allowed = new Set(allowedTopics);
  const steps: EscapeStep[] = [];
  const answers: Record<string, string[]> = {};
  const mainTag = profile.topicTags.find((tag) => tag !== "proteinas-funcoes") ?? profile.topicTags[0]!;

  /* ---------- R0 · Antecâmara (fixa: competência mínima) ---------- */

  steps.push({
    id: "R0-S1", roomId: "R0", type: "use-item", object: "armario-epi",
    title: "O crachá do plantonista",
    prompt: "O armário de EPI está entreaberto. Dentro dele, um crachá esquecido pelo plantonista anterior. Peguem o crachá e passem no leitor da porta.",
    grantsItem: "Crachá do plantonista", points: 2, tags: ["proteinas-funcoes"],
    hints: [
      "Toquem no armário entreaberto à direita.",
      "Com o crachá em mãos, toquem no leitor vermelho ao lado da porta.",
      "Peguem o crachá no armário de EPI e usem no leitor da porta.",
    ],
  });
  answers["R0-S1"] = ["usar"];

  steps.push({
    id: "R0-S2", roomId: "R0", type: "chain-fill", object: "painel-sentinela",
    title: "Calibração de competência",
    prompt: "O leitor recusou: 'Credencial sem registro de competência.' O painel exige completar o caminho da informação genética.",
    slots: ["DNA", "?", "PROTEÍNA", "?", "FENÓTIPO"],
    slotChoices: [
      [],
      shuffleCycle(rng, [{ id: "rna", text: "RNA" }, { id: "ribossomo", text: "RIBOSSOMO" }, { id: "lipidio", text: "LIPÍDIO" }], "rna"),
      [],
      shuffleCycle(rng, [{ id: "funcao", text: "FUNÇÃO" }, { id: "nucleo", text: "NÚCLEO" }, { id: "membrana", text: "MEMBRANA" }], "funcao"),
      [],
    ],
    points: 4, tags: ["proteinas-funcoes"],
    hints: [
      "O caminho começa na transcrição.",
      "Entre o DNA e a proteína existe uma molécula mensageira; entre a proteína e o fenótipo existe o que ela faz.",
      "DNA → RNA → PROTEÍNA → FUNÇÃO → FENÓTIPO.",
    ],
  });
  answers["R0-S2"] = ["rna", "funcao"];

  /* ---------- R1 · Ala de Triagem (senha + quadro clínico) ---------- */

  const printerCode = generateDigits(rng, 4);
  steps.push({
    id: "R1-S1", roomId: "R1", type: "code", object: "impressora",
    title: "A folha travada",
    prompt: "O computador do prontuário pede uma senha numérica. Há uma folha presa na impressora com o carimbo 'ACESSO TEMPORÁRIO'. Puxem a folha com cuidado e digitem a senha.",
    evidence: [`Folha da impressora: ACESSO TEMPORÁRIO · senha ${printerCode} · válida apenas para o plantão noturno.`],
    codeLength: 4, points: 2, tags: ["proteinas-funcoes"],
    hints: [
      "A senha está impressa em algum lugar da sala.",
      "Olhem a folha presa na impressora, ao lado do balcão.",
      `A senha é ${printerCode}.`,
    ],
  });
  answers["R1-S1"] = [printerCode];

  const clinicalCorrect = sample(rng, profile.clinical.correct, 4);
  const clinicalWrong = sample(rng, profile.clinical.distractors, 4);
  const clinicalChoices = shuffle(rng, [...clinicalCorrect, ...clinicalWrong]).map((text, index) => ({ id: `f${index}`, text }));
  steps.push({
    id: "R1-S2", roomId: "R1", type: "board-select", object: "quadro-branco",
    title: "Montar o quadro clínico",
    prompt: `O prontuário abriu: ${profile.patient.descriptor}. ${profile.patient.story} Marquem no quadro branco APENAS os 4 achados que pertencem a este paciente.`,
    evidence: profile.clinical.evidence,
    choices: clinicalChoices, selectCount: 4, points: 8, tags: [mainTag],
    hints: [
      "Nem tudo que está no quadro aconteceu com ESTE paciente — comparem cada achado com a história.",
      `Descartem, por exemplo: ${sample(rng, clinicalWrong, 2).join(" e ").toLocaleLowerCase("pt-BR")}.`,
      `Os 4 achados: ${clinicalCorrect.join("; ").toLocaleLowerCase("pt-BR")}.`,
    ],
  });
  answers["R1-S2"] = clinicalChoices.filter((choice) => clinicalCorrect.includes(choice.text)).map((choice) => choice.id);

  /* ---------- R2 · Laboratório (lâminas + painel + câmara fria) ---------- */

  const wrongKinds = sample(rng, escapeSmearKinds.filter((kind) => kind !== profile.smear.kind), 2);
  // IDs de lâmina únicos: uma colisão com o paciente real criaria duas lâminas
  // com o mesmo rótulo e a escolha deixaria de ter resposta única.
  const slideIds = new Set([patientId]);
  while (slideIds.size < 3) slideIds.add(generatePatientId(rng));
  const [wrongId1, wrongId2] = [...slideIds].filter((id) => id !== patientId);
  const slideEntries = shuffle(rng, [
    { id: patientId, smear: profile.smear.kind },
    { id: wrongId1!, smear: wrongKinds[0]! },
    { id: wrongId2!, smear: wrongKinds[1]! },
  ]);
  steps.push({
    id: "R2-S1", roomId: "R2", type: "microscope", object: "microscopio",
    title: "O sangue fala",
    prompt: "Três lâminas estão na estante, identificadas por paciente. Cada uma mostra um sangue diferente ao focar. Coloquem a lâmina do paciente CERTO no microscópio, ajustem o foco e registrem o achado.",
    evidence: [`Estante de lâminas: ${slideEntries.map((slide) => slide.id).join(" · ")}. Etiqueta da bancada: 'Confirme o paciente antes de laudar.'`],
    choices: slideEntries.map((slide) => ({ id: slide.id, text: `Lâmina ${slide.id}`, smear: slide.smear })),
    points: 4, tags: [mainTag],
    hints: [
      "O paciente desta investigação tem uma identificação — ela está no prontuário da Triagem.",
      `O prontuário pertence ao Paciente ${patientId}.`,
      `Usem a lâmina ${patientId}: ao focar, ${profile.smear.finding}.`,
    ],
  });
  answers["R2-S1"] = [patientId];

  const labChoices = shuffle(rng, [...profile.labs.altered, ...profile.labs.normal]).map((text, index) => ({ id: `l${index}`, text }));
  steps.push({
    id: "R2-S2", roomId: "R2", type: "board-select", object: "analisador",
    title: "Interpretar antes de abrir",
    prompt: `O analisador imprimiu o painel do Paciente ${patientId}. Marquem APENAS os exames ALTERADOS.`,
    choices: labChoices, selectCount: profile.labs.altered.length, points: 8, tags: [mainTag],
    hints: [
      `${profile.labs.altered.length} valores fogem da normalidade; ${profile.labs.normal.length} são tranquilizadores.`,
      `Estes estão dentro da faixa: ${profile.labs.normal.join("; ").toLocaleLowerCase("pt-BR")}.`,
      `Alterados: ${profile.labs.altered.join("; ").toLocaleLowerCase("pt-BR")}.`,
    ],
  });
  answers["R2-S2"] = labChoices.filter((choice) => profile.labs.altered.includes(choice.text)).map((choice) => choice.id);

  const fridgeCode = `${profile.labs.altered.length}${profile.labs.normal.length}34`;
  steps.push({
    id: "R2-S3", roomId: "R2", type: "code", object: "geladeira",
    title: "O cadeado da câmara fria",
    prompt: "A geladeira de amostras tem um cadeado de 4 dígitos. A luz UV revela no vidro: '1º dígito: nº de exames ALTERADOS no painel. 2º: nº de exames NORMAIS. 3º: nº de lâminas na estante. 4º: nº de achados fixados no quadro da Triagem.'",
    codeLength: 4, points: 6, tags: [mainTag],
    hints: [
      "Cada dígito vem de algo que vocês já contaram nesta investigação.",
      `Exames alterados: ${profile.labs.altered.length}. Normais: ${profile.labs.normal.length}. Lâminas: 3. Achados no quadro: 4.`,
      `O código é ${fridgeCode}.`,
    ],
  });
  answers["R2-S3"] = [fridgeCode];

  /* ---------- R3 · Bancada de Proteínas (estrutura/função + mecanismo) ---------- */

  if (profile.protein.assembly) {
    const assembly = profile.protein.assembly;
    steps.push({
      id: "R3-S1", roomId: "R3", type: "assemble", object: "modelo-molecular",
      title: "Montar a proteína",
      prompt: assembly.prompt,
      choices: shuffle(rng, assembly.pieces), slots: assembly.slots,
      points: 6, tags: profile.topicTags.includes("hemoglobina-estrutura") ? ["hemoglobina-estrutura"] : [mainTag],
      hints: assembly.hints,
    });
    answers["R3-S1"] = assembly.answer;
  } else {
    const role = profile.protein.role!;
    const built = buildChoices(rng, role.correct, sample(rng, role.wrong, 3), "r");
    steps.push({
      id: "R3-S1", roomId: "R3", type: "family-question", object: "modelo-molecular",
      title: "A função suspensa",
      prompt: `${role.prompt}`,
      choices: built.choices, points: 6, tags: [mainTag],
      hints: [
        "Pensem no que falta no paciente quando essa proteína falha.",
        `A resposta conversa com o mecanismo: ${profile.protein.consequence.toLocaleLowerCase("pt-BR")}.`,
        `Resposta: ${role.correct}.`,
      ],
    });
    answers["R3-S1"] = [built.answer];
  }

  const proteinSlot = buildCycleChoices(rng, profile.protein.name, fieldDistractors(rng, others.map((other) => other.protein.name), profile.protein.name, 2), "ma");
  const defectSlot = buildCycleChoices(rng, profile.protein.defect, fieldDistractors(rng, others.map((other) => other.protein.defect), profile.protein.defect, 2), "mb");
  const consequenceSlot = buildCycleChoices(rng, profile.protein.consequence, fieldDistractors(rng, others.map((other) => other.protein.consequence), profile.protein.consequence, 2), "mc");
  steps.push({
    id: "R3-S2", roomId: "R3", type: "mechanism-fill", object: "quadro-negro",
    title: "A frase-mecanismo",
    prompt: "No quadro-negro, completem a frase que conecta a proteína ao fenótipo deste paciente.",
    slots: ["A proteína", "está", `e, ${profile.protein.context}`],
    slotChoices: [proteinSlot.choices, defectSlot.choices, consequenceSlot.choices],
    points: 8, tags: [mainTag],
    hints: [
      "O esfregaço e o painel do laboratório mostraram a consequência do mecanismo.",
      `O defeito aqui: ${profile.protein.defect.toLocaleLowerCase("pt-BR")}.`,
      `${profile.protein.name} · ${profile.protein.defect} · ${profile.protein.consequence}.`,
    ],
  });
  answers["R3-S2"] = [proteinSlot.answer, defectSlot.answer, consequenceSlot.answer];

  /* ---------- R4 · Câmara de Sequenciamento (gene + herança + família) ---------- */

  if (profile.gene.sequence) {
    const sequence = profile.gene.sequence;
    steps.push({
      id: "R4-S1", roomId: "R4", type: "sequence-spot", object: "terminal",
      title: "Encontrar a troca",
      prompt: `O terminal alinhou o trecho suspeito do gene ${profile.gene.symbol} do paciente com a referência. Toquem no CÓDON divergente.`,
      sequence: { label: sequence.label, reference: sequence.reference, sample: sequence.sample },
      evidence: [`Cromatograma: ${sequence.chromatogram}`],
      points: 8, tags: [mainTag],
      hints: [
        "Comparem letra por letra, códon por códon.",
        `A divergência está no ${sequence.divergentIndex + 1}º códon exibido.`,
        sequence.chromatogram,
      ],
    });
    answers["R4-S1"] = [String(sequence.divergentIndex)];
  } else {
    const mutationWrong = fieldDistractors(rng, others.map((other) => other.gene.mutationSummary), profile.gene.mutationSummary, 3);
    const built = buildChoices(rng, profile.gene.mutationSummary, mutationWrong, "g");
    steps.push({
      id: "R4-S1", roomId: "R4", type: "family-question", object: "terminal",
      title: "O laudo truncado",
      prompt: `O terminal recuperou só o cabeçalho do laudo: 'Gene ${profile.gene.symbol} (${profile.gene.locus}) — alteração detectada'. Qual alteração molecular explica ESTE caso?`,
      choices: built.choices, points: 8, tags: [mainTag],
      hints: [
        `O gene é o ${profile.gene.symbol}, no locus ${profile.gene.locus}.`,
        "Cruzem com o mecanismo registrado na Bancada de Proteínas — quantidade, estrutura ou excesso?",
        `Resposta: ${profile.gene.mutationSummary}.`,
      ],
    });
    answers["R4-S1"] = [built.answer];
  }

  const inheritanceLabel = inheritanceChoices.find((choice) => choice.id === profile.inheritance.pattern)!.text;
  steps.push({
    id: "R4-S2", roomId: "R4", type: "inheritance", object: "heredograma",
    title: "O heredograma da parede",
    prompt: `O heredograma desenhado no vidro mostra: ${profile.inheritance.familyStory}. Qual padrão de herança explica a família?`,
    choices: shuffle(rng, inheritanceChoices),
    points: 6, tags: profile.topicTags.includes("heranca-ligada-x") ? ["heranca-ligada-x"] : ["heranca-autossomica"],
    hints: [
      "Observem quem adoece e quem apenas transmite, geração a geração.",
      profile.inheritance.pattern === "xr"
        ? "Só meninos adoecem e a doença viaja pela linha materna."
        : profile.inheritance.pattern === "ad"
          ? "Há afetados em todas as gerações, de ambos os sexos."
          : "Pais saudáveis podem ter filhos afetados de ambos os sexos.",
      `Resposta: ${inheritanceLabel}.`,
    ],
  });
  answers["R4-S2"] = [profile.inheritance.pattern];

  const recurrence = buildChoices(rng, profile.inheritance.recurrence.correct, sample(rng, profile.inheritance.recurrence.wrong, 3), "q");
  steps.push({
    id: "R4-S3", roomId: "R4", type: "family-question", object: "interfone",
    title: "A família pergunta",
    prompt: `Pelo interfone, a família pergunta: ${profile.inheritance.recurrence.prompt}`,
    choices: recurrence.choices, points: 6,
    tags: profile.topicTags.includes("heranca-ligada-x") ? ["heranca-ligada-x"] : ["heranca-autossomica"],
    hints: [
      "Montem o cruzamento com os genótipos dos pais.",
      profile.inheritance.pattern === "xr"
        ? "Portadora XX̄ × pai saudável: contem só os meninos."
        : profile.inheritance.pattern === "ad"
          ? "Heterozigoto afetado × não afetado: metade herda o alelo."
          : "Aa × Aa: quantos aa aparecem em quatro combinações?",
      `Resposta: ${profile.inheritance.recurrence.correct}.`,
    ],
  });
  answers["R4-S3"] = [recurrence.answer];

  /* ---------- Arquivos de emergência (opcionais, pool das outras doenças) ---------- */

  const pool = shuffle(rng, [
    ...installed.flatMap((disease) => (disease.emergencyFiles ?? []).map((file) => ({ ...file, from: disease.id }))),
    ...extraEmergency,
  ].filter((file) =>
    file.from !== profile.id
    && (!profile.medicalId || file.from !== profile.medicalId)
    && file.tags.every((tag) => allowed.has(tag)),
  ));
  const optionalSlots: Array<{ id: string; roomId: EscapeStep["roomId"]; object: string; title: string }> = [
    { id: "R2-F1", roomId: "R2", object: "arquivo-morto", title: "Arquivo de emergência: pasta esquecida" },
    { id: "R3-F1", roomId: "R3", object: "balanca", title: "Arquivo de emergência: o cartão na balança" },
    { id: "R4-F1", roomId: "R4", object: "freezer", title: "Arquivo de emergência: etiqueta no freezer" },
  ];
  // Um arquivo por sala opcional, sem repetir a mesma resposta correta no caso.
  const usedAnswers = new Set<string>();
  optionalSlots.forEach((slot, index) => {
    const fileIndex = pool.findIndex((entry) => !usedAnswers.has(entry.correct));
    if (fileIndex === -1) return;
    const file = pool.splice(fileIndex, 1)[0]!;
    usedAnswers.add(file.correct);
    const built = buildChoices(rng, file.correct, sample(rng, file.wrong, 3), `e${index}`);
    steps.push({
      id: slot.id, roomId: slot.roomId, type: "family-question", object: slot.object,
      title: slot.title, prompt: file.prompt, choices: built.choices,
      optional: true, points: 5, tags: file.tags,
      hints: [
        "Este arquivo fala de OUTRO paciente — comparem com o caso principal.",
        "Eliminem as alternativas que contradizem o padrão descrito.",
        `Resposta: ${file.correct}.`,
      ],
    });
    answers[slot.id] = [built.answer];
  });

  /* ---------- R5 · Cofre do Diagnóstico ---------- */

  const safeGene = buildCycleChoices(rng, profile.route.gene, routeDistractors(rng, others, "gene", profile.route.gene, 2), "sa");
  const safeProtein = buildCycleChoices(rng, profile.route.protein, routeDistractors(rng, others, "protein", profile.route.protein, 2), "sb");
  const safeMechanism = buildCycleChoices(rng, profile.route.mechanism, routeDistractors(rng, others, "mechanism", profile.route.mechanism, 2), "sc");
  const safePhenotype = buildCycleChoices(rng, profile.route.phenotype, routeDistractors(rng, others, "phenotype", profile.route.phenotype, 2), "sd");
  const safeInheritance = buildCycleChoices(rng, profile.route.inheritance, routeDistractors(rng, others, "inheritance", profile.route.inheritance, 2), "se");
  steps.push({
    id: "R5-S1", roomId: "R5", type: "dial-safe", object: "cofre",
    title: "A combinação final",
    prompt: `Girem cada seletor até a posição correta para o Paciente ${patientId}. A combinação completa abre o laboratório.`,
    slots: ["GENE", "PROTEÍNA", "MECANISMO", "FENÓTIPO", "HERANÇA"],
    slotChoices: [safeGene.choices, safeProtein.choices, safeMechanism.choices, safePhenotype.choices, safeInheritance.choices],
    points: 12, tags: [mainTag],
    hints: [
      "Tudo o que vocês registraram no prontuário digital aponta a combinação.",
      `Gene visto no terminal; proteína e mecanismo, na bancada; fenótipo, na triagem (${smearLabels[profile.smear.kind]} ao microscópio).`,
      `${profile.route.gene} · ${profile.route.protein} · ${profile.route.mechanism} · ${profile.route.phenotype} · ${profile.route.inheritance}.`,
    ],
  });
  answers["R5-S1"] = [safeGene.answer, safeProtein.answer, safeMechanism.answer, safePhenotype.answer, safeInheritance.answer];

  /* ---------- Montagem final ---------- */

  const byRoom = (roomId: EscapeStep["roomId"]) => steps.filter((step) => step.roomId === roomId);
  return {
    id: `gen-${profile.id}-${seed.toString(36)}`,
    title: `Código Vermelho: Paciente ${patientId}`,
    patientLabel: `Paciente ${patientId} · ${profile.patient.descriptor}`,
    briefing: `Uma alteração genética foi registrada no Paciente ${patientId} e nenhum diagnóstico foi entregue. ${profile.patient.story} O laboratório permanecerá selado até que a rota molecular esteja completa: gene, proteína, mecanismo, fenótipo e herança. O relógio de expurgo já está correndo.`,
    topicTags: profile.topicTags,
    rooms: [
      {
        id: "R0", name: "Antecâmara de Contenção",
        intro: "SENTINELA: Contenção ativada. Identifiquem-se e provem competência mínima para entrar na ala clínica.",
        unlockText: "Credencial validada. A porta da Ala de Triagem está aberta.",
        steps: byRoom("R0"),
      },
      {
        id: "R1", name: "Ala de Triagem",
        intro: "SENTINELA: O paciente está atrás do vidro. O prontuário está bloqueado. Comecem pelo que os olhos alcançam: o fenótipo.",
        unlockText: "Quadro clínico validado. A guia de exames foi impressa com o código do elevador de serviço.",
        steps: byRoom("R1"),
      },
      {
        id: "R2", name: "Laboratório de Hematologia",
        intro: "SENTINELA: O sangue fala. Escutem com as lentes e com os números antes de abrir qualquer porta fria.",
        unlockText: "Amostra-mestre liberada. O cartão de acesso à Bancada de Proteínas estava dentro da geladeira.",
        steps: byRoom("R2"),
      },
      {
        id: "R3", name: "Bancada de Proteínas",
        intro: "SENTINELA: A proteína suspeita está suspensa diante de vocês. Interroguem-na, e ela confessa.",
        unlockText: "Mecanismo registrado. A chave magnética da Câmara de Sequenciamento foi ejetada da bancada.",
        steps: byRoom("R3"),
      },
      {
        id: "R4", name: "Câmara de Sequenciamento",
        intro: "SENTINELA: O DNA entrega a resposta. Encontrem a alteração, expliquem a herança, respondam à família.",
        unlockText: "Rota genética confirmada. O corredor do Cofre do Diagnóstico está aberto.",
        steps: byRoom("R4"),
      },
      {
        id: "R5", name: "Cofre do Diagnóstico",
        intro: "SENTINELA: Cinco seletores. Uma rota molecular. Errar custa bases e tempo. Girem quando tiverem certeza.",
        unlockText: "Rota molecular completa. O prontuário foi carimbado e a porta do laboratório está aberta.",
        steps: byRoom("R5"),
      },
    ],
    answers,
    debrief: profile.debrief,
  };
}
