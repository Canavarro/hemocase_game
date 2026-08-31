#!/usr/bin/env node
/**
 * Gera docs/GAME_MASTER_MANUAL.md a partir do conteúdo instalado (casos,
 * doenças, roteiro do quiz e bancos canônicos) e das constantes do motor.
 * Rode `npm run manual` sempre que o conteúdo mudar — NÃO edite o .md à mão.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const readDir = (dir) => fs.readdirSync(path.join(root, dir)).filter((f) => f.endsWith(".json"))
  .map((f) => read(path.join(dir, f)));

const game = read("content/game.pt-BR.json");
const cases = readDir("content/escape/cases");
const diseases = readDir("content/escape/diseases").sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
const bank = read("content/question-bank.pt-BR.json");

// Constantes do motor, extraídas da fonte para o manual nunca divergir.
const shared = fs.readFileSync(path.join(root, "packages/shared/src/index.ts"), "utf8");
const constant = (name) => Number(((shared.match(new RegExp(`${name} = ([\\d_]+)`)) ?? [])[1] ?? "").replaceAll("_", ""));
const hintCosts = (shared.match(/escapeHintCosts = \[([\d, ]+)\]/) ?? [])[1] ?? "0, 3, 8";
const C = {
  start: constant("ESCAPE_START_BASES"),
  wrong: constant("ESCAPE_WRONG_ATTEMPT_COST"),
  safeWrong: constant("ESCAPE_SAFE_WRONG_COST"),
  safeLockS: constant("ESCAPE_SAFE_LOCK_MS") / 1000,
  review: constant("ESCAPE_REVIEW_COST"),
};

const inheritanceLabels = { ar: "Autossômica recessiva", ad: "Autossômica dominante", xr: "Recessiva ligada ao X" };
const typeRules = {
  "use-item": "sempre aceita (interação de pegar/usar item)",
  "chain-fill": "comparação ORDENADA das lacunas preenchidas",
  "board-select": "comparação como CONJUNTO (ordem irrelevante)",
  "microscope": "id da lâmina escolhida após focar",
  "code": "dígitos exatos, em ordem",
  "assemble": "comparação como MULTICONJUNTO das peças",
  "mechanism-fill": "comparação ORDENADA das lacunas",
  "sequence-spot": "índice do códon tocado",
  "inheritance": "alternativa única",
  "family-question": "alternativa única",
  "dial-safe": `comparação ORDENADA dos seletores (erro: −${C.safeWrong} bases e trava de ${C.safeLockS} s)`,
};

const lines = [];
const w = (text = "") => lines.push(text);

/** Converte o gabarito de um passo em texto legível. */
function answerText(step, answer) {
  if (!answer) return "—";
  if (step.type === "use-item") return "usar o item no alvo";
  if (step.type === "sequence-spot") {
    const index = Number(answer[0]);
    return `códon ${index + 1} exibido (${step.sequence?.sample?.[index] ?? "?"})`;
  }
  const fromChoices = (id) => step.choices?.find((c) => c.id === id)?.text;
  if (step.slotChoices) {
    let cursor = 0;
    return step.slotChoices.map((options, slot) => {
      if (!options.length) return null;
      const id = answer[cursor++];
      return `${step.slots?.[slot] ?? `lacuna ${slot + 1}`}: ${options.find((o) => o.id === id)?.text ?? id}`;
    }).filter(Boolean).join(" · ");
  }
  return answer.map((id) => fromChoices(id) ?? id).join(", ");
}

w("# Manual do Mestre — HEMOCASE / Protocolo Hélix");
w();
w("> **Documento gerado automaticamente** a partir do conteúdo instalado (`npm run manual`).");
w("> Não edite à mão: qualquer mudança em casos, doenças ou questões deve regenerá-lo.");
w(`> Gerado em ${new Date().toISOString().slice(0, 10)}.`);
w();
w("## 1. Regras de pontuação do modo Escape");
w();
w(`- Cada equipe começa com **${C.start} bases**; escapar rende bônus de +2 por minuto restante (máx. +20).`);
w(`- Tentativa errada: **−${C.wrong} bases**; erro no cofre final: **−${C.safeWrong} bases** e trava de ${C.safeLockS} s.`);
w(`- Dicas por enigma (3 níveis, em ordem): custam **${hintCosts}** bases; o 3º nível entrega a resposta.`);
w(`- Voltar a uma sala já visitada (revisão): **−${C.review} bases** por retorno; retornar à sala atual é grátis.`);
w("- Saída de página/troca de aba confirmada (política Zerar rodada): −10 bases na corrida.");
w("- Salas R1–R4 só abrem a porta após registrar a hipótese no prontuário.");
w("- Nos enigmas de girar (cadeia, frase-mecanismo, cofre), a resposta nunca está na primeira posição dos seletores.");
w();
w("## 2. Validação por tipo de enigma");
w();
w("| Tipo | Validação (sempre no servidor) |");
w("|---|---|");
for (const [type, rule] of Object.entries(typeRules)) w(`| \`${type}\` | ${rule} |`);
w();

for (const escapeCase of cases) {
  w(`## 3. Caso pronto: ${escapeCase.title}`);
  w();
  w(`**Paciente**: ${escapeCase.patientLabel} · **Diagnóstico**: ${escapeCase.debrief.diagnosis}`);
  w();
  w(`**Rota molecular**: ${escapeCase.debrief.route}`);
  w();
  for (const room of escapeCase.rooms) {
    w(`### ${room.id} · ${room.name}`);
    w();
    w(`*${room.intro}*`);
    w();
    for (const step of room.steps) {
      w(`#### ${step.id} — ${step.title}${step.optional ? " (bônus opcional)" : ""}`);
      w();
      w(`- **Tipo/objeto**: \`${step.type}\` em "${step.object}" · **Pontos**: ${step.points}`);
      w(`- **Enunciado**: ${step.prompt}`);
      if (step.evidence?.length) w(`- **Evidências na tela**: ${step.evidence.join(" | ")}`);
      w(`- **Resposta**: ${answerText(step, escapeCase.answers[step.id])}`);
      w(`- **Dicas** (${hintCosts} bases): ${step.hints.map((h, i) => `(${i + 1}) ${h}`).join(" ")}`);
      w();
    }
  }
}

w(`## 4. Doenças geráveis (${diseases.length} perfis)`);
w();
w("O gerador monta as mesmas seis salas para qualquer doença: Antecâmara (crachá + cadeia DNA→RNA→PROTEÍNA→FUNÇÃO→FENÓTIPO), Triagem (senha da impressora sorteada + 4 achados clínicos entre 8), Laboratório (lâmina correta entre 3 morfologias distintas + exames alterados + cadeado derivado das contagens), Bancada (montagem OU função da proteína + frase-mecanismo), Sequenciamento (códon divergente OU alteração molecular + herança + pergunta da família) e Cofre (5 seletores da rota). Distratores vêm das demais doenças instaladas; paciente, senhas e ordem das alternativas mudam a cada sessão.");
w();
for (const d of diseases) {
  w(`### ${d.name} (\`${d.id}\`)`);
  w();
  w(`- **Grupo**: ${d.group} · **Herança**: ${inheritanceLabels[d.inheritance.pattern]} · **Tópicos**: ${d.topicTags.join(", ")}`);
  w(`- **Paciente**: ${d.patient.descriptor} — ${d.patient.story}`);
  w(`- **Achados corretos (sorteia 4)**: ${d.clinical.correct.join("; ")}`);
  w(`- **Exames alterados**: ${d.labs.altered.join("; ")} · **Normais**: ${d.labs.normal.join("; ")}`);
  w(`- **Lâmina correta**: \`${d.smear.kind}\` — ${d.smear.finding}`);
  if (d.protein.assembly) w(`- **Montagem**: ${d.protein.assembly.prompt} → ${d.protein.assembly.answer.join(", ")}`);
  else w(`- **Função da proteína**: ${d.protein.role.correct}`);
  w(`- **Frase-mecanismo**: A proteína **${d.protein.name}** está **${d.protein.defect}** e, ${d.protein.context} **${d.protein.consequence}**.`);
  w(`- **Gene**: ${d.gene.symbol} (${d.gene.locus}) — ${d.gene.sequence ? d.gene.sequence.chromatogram : d.gene.mutationSummary}`);
  w(`- **Pergunta da família**: ${d.inheritance.recurrence.prompt} → **${d.inheritance.recurrence.correct}**`);
  w(`- **Cofre**: ${d.route.gene} · ${d.route.protein} · ${d.route.mechanism} · ${d.route.phenotype} · ${d.route.inheritance}`);
  w(`- **Debrief**: ${d.debrief.route}`);
  w();
}

w("## 5. Rodadas ao vivo (QUIZ)");
w();
const quizBlock = (title, questions) => {
  w(`### ${title}`);
  w();
  for (const q of questions) {
    const correct = q.choices.find((c) => c.id === q.correctChoiceId)?.text ?? q.correctChoiceId;
    w(`- **${q.id} · ${q.title}** (${q.points} pts, ${q.durationSec} s): ${q.prompt}`);
    w(`  - **Resposta**: ${correct} — ${q.explanation}`);
  }
  w();
};
quizBlock("Desbloqueio molecular (warmup)", game.warmup);
for (const track of ["A", "B", "C", "D"]) quizBlock(`Investigação principal · Trilho ${track}`, game.cases[track]);
quizBlock("Código relâmpago (roteiro fixo)", game.blitz);
quizBlock("Mecanismo final (cadeias)", game.finalChains);

w("### Código relâmpago pelo banco canônico");
w();
const byCategory = {};
const byDifficulty = {};
for (const q of bank.questions) {
  byCategory[q.category] = (byCategory[q.category] ?? 0) + 1;
  byDifficulty[q.difficulty] = (byDifficulty[q.difficulty] ?? 0) + 1;
}
w(`O Host pode sortear a fase do banco canônico (${bank.questions.length} perguntas; pontuação fácil ${bank.rules.scoring.easy} / média ${bank.rules.scoring.medium} / difícil ${bank.rules.scoring.hard}; duração 20/30/40 s).`);
w(`Por categoria: ${Object.entries(byCategory).map(([k, v]) => `${k} ${v}`).join(" · ")}.`);
w(`Por dificuldade: ${Object.entries(byDifficulty).map(([k, v]) => `${k} ${v}`).join(" · ")}. Gabaritos no próprio \`content/question-bank.pt-BR.json\`.`);
w();
w("## 6. Atmosfera e condução");
w();
w("- **Transição de porta**: toda troca de sala tem animação de travessia (~2 s); retornos aparecem em âmbar (\"Revendo\").");
w("- **Ajuda visual**: na primeira visita a cada sala, uma mão espectral demonstra onde interagir; a equipe pode desligar no ícone de olho da barra inferior.");
w("- **Tensão**: o ambiente escurece a partir de 50% do tempo, ganha vinheta vermelha pulsante nos últimos 10% e contagem gigante nos 10 segundos finais.");
w("- **O Arquivista**: figura original do jogo; aparece UMA vez por partida, de relance, sem interação — apenas atmosfera. Nos últimos 10% do tempo, aparece para quem ainda não o viu.");
w("- **Erros**: cada tipo de enigma responde com uma consequência narrativa própria (contaminação da lâmina, teclado que trava etc.), nunca um \"errado\" seco.");

fs.writeFileSync(path.join(root, "docs/GAME_MASTER_MANUAL.md"), lines.join("\n") + "\n");
console.log(`docs/GAME_MASTER_MANUAL.md gerado: ${lines.length} linhas, ${cases.length} caso(s), ${diseases.length} doenças.`);
