# HEMOCASE Medical Knowledge Base

Este documento define como o conteúdo médico do HEMOCASE deve ser usado pelo jogo e pelo Codex.

## Arquivos canônicos

- `content/medical-knowledge.pt-BR.json`: fatos médicos, pistas progressivas, diferenciais e referências.
- `content/question-bank.pt-BR.json`: perguntas prontas, alternativas, respostas, explicações, dificuldade e pontuação.
- `content/game.pt-BR.json`: roteiro da sessão de 30 minutos. Ele pode selecionar ou adaptar itens dos bancos canônicos, mas não deve duplicar fatos médicos divergentes.

## Regra de precedência

Quando houver divergência entre conteúdo antigo do jogo e `medical-knowledge.pt-BR.json`, o banco médico novo deve ser tratado como a referência de conteúdo. Alterações médicas relevantes devem ser feitas primeiro nele e depois refletidas nas perguntas.

## Modelo de cada doença

Cada entidade contém:

- nome e aliases;
- categoria;
- proteína suspeita;
- gene(s) e localização cromossômica;
- tipos de variante;
- efeito molecular;
- processo alterado;
- alteração morfológica/microscópica/celular;
- manifestações clínicas;
- achados laboratoriais;
- padrão hereditário e ressalvas;
- evidências-chave;
- diagnósticos diferenciais;
- pistas progressivas;
- armadilhas pedagógicas;
- referências.

## Uso pedagógico

O jogo deve privilegiar raciocínio em camadas:

1. fenótipo clínico;
2. morfologia ou laboratório;
3. proteína/processo;
4. gene/variante;
5. herança;
6. diagnóstico ou diferencial.

Quanto mais cedo uma equipe acerta, maior pode ser a recompensa. A pista decisiva não deve ser exibida antes das pistas de menor especificidade em fases de investigação.

## Conteúdo principal para o modo de 30 minutos

### Trilha A: doença falciforme

Eixo: `HBB → β-globina/HbS → polimerização/falcização → vaso-oclusão/hemólise`.

### Trilha B: β-talassemia

Eixo: `HBB → redução de mRNA/síntese β → desequilíbrio de cadeias → microcitose/hipocromia`.

### Trilha C: hemofilia

Variar entre sessões:

- `F8 → FVIII → hemofilia A`;
- `F9 → FIX → hemofilia B`.

A clínica é deliberadamente semelhante. A dosagem específica do fator deve ser a pista decisiva.

### Trilha D: VWD versus Bernard-Soulier

Eixo comparativo:

- VWD: problema no **ligante VWF**;
- Bernard-Soulier: problema no **receptor GPIb-IX-V**.

## Conteúdo para rodada relâmpago e expansão

O banco também contém:

- HbC;
- α-talassemia;
- trombastenia de Glanzmann;
- Hermansky-Pudlak;
- Wiskott-Aldrich;
- telangiectasia hemorrágica hereditária;
- fator V Leiden;
- F2 20210G>A;
- deficiência de antitrombina;
- deficiência de proteína C;
- deficiência de proteína S.

Essas condições podem alimentar rodadas relâmpago, desafios de microscopia, genética, herança e diferenciais.

## Regras médicas importantes

1. **Talassemias** são classicamente autossômicas recessivas. Na α-talassemia, o raciocínio de risco é mais complexo pela presença de quatro alelos funcionais de α-globina.
2. **VWD não deve ser cadastrada como universalmente autossômica dominante.** O padrão varia por subtipo.
3. **Hemofilia A e B não devem ser diferenciadas somente pela clínica.** Usar FVIII versus FIX.
4. **Bernard-Soulier versus Glanzmann:** adesão/GPIb versus agregação/GPIIbIIIa.
5. **Bernard-Soulier versus Wiskott-Aldrich:** macroplaquetas versus plaquetas pequenas.
6. **Hb Bart é γ4**, enquanto **HbH é β4**. Não reproduzir a simplificação incorreta Hb Bart = β4.
7. **Fator V Leiden e F2 20210G>A são predisposições trombóticas**, não garantias de que o indivíduo terá trombose.
8. Quando não houver achado microscópico específico, o jogo deve dizer isso em vez de inventar uma morfologia.

## Segurança do gabarito

O cliente do jogador não deve receber:

- `correctOptionId` antes da resposta/revelação;
- explicação completa antes de a rodada terminar;
- pistas futuras;
- dados de outras trilhas que permitam inferir o gabarito.

O servidor deve ser a autoridade para correção e pontuação.

## Geração dinâmica de perguntas

Se o Codex implementar geração/seleção dinâmica, usar apenas os fatos do banco canônico. Não gerar automaticamente novas afirmações médicas usando um modelo em tempo de jogo.

Pode-se montar perguntas por template, por exemplo:

- `Qual gene está associado a {disease.name}?`
- `Qual proteína está alterada em {disease.name}?`
- `Qual achado diferencia {diseaseA} de {diseaseB}?`
- `Qual padrão hereditário é mais compatível?`
- `Qual alteração microscópica é esperada?`

Distratores devem vir preferencialmente de doenças da mesma categoria.

## Estado da integração

Os bancos canônicos estão integrados à aplicação:

- **Validação na inicialização**: `apps/server/src/medical-content.ts` valida os dois JSONs (ids únicos, gabarito com opção correspondente, doença existente, pontuação conforme scoring) e confere os perfis do Escape (`content/escape/diseases`) contra o canônico via `medicalId` — genes e herança divergentes derrubam o servidor com mensagem clara.
- **Código Relâmpago**: o Host pode sortear a fase BLITZ do `question-bank` com filtros de dificuldade, categoria e expansão (campo `blitz` em `POST /api/sessions`). Roteiro fixo de 30 minutos continua sendo o padrão.
- **Modo Escape**: os arquivos de emergência (bônus opcionais) são alimentados pelo `question-bank`, filtrados pelos tópicos liberados e excluindo a doença do caso principal.
- **Gabarito**: `correctOptionId` e `explanation` nunca são enviados ao cliente antes da fase apropriada (o servidor remove ambos do snapshot; correção e pontuação são autoritativas no servidor).

Divergências normalizadas no conteúdo do jogo conforme a precedência do banco: locus do VWF corrigido para 12p13.31; loci de GP1BA/GP1BB/GP9 detalhados (17p13.2/22q11.21/3q21.3). O perfil de VWD do Escape representa explicitamente o **tipo 1** (autossômico dominante), compatível com a nota canônica de herança mista por subtipo.

## Revisão científica

Antes de uma versão usada em avaliação formal, recomenda-se revisão final do banco por docente/orientador da Liga. O banco foi desenhado para atividade educacional e não substitui protocolos clínicos ou aconselhamento genético individual.
