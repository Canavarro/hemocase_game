# Manual do Mestre — HEMOCASE / Protocolo Hélix

> **Documento gerado automaticamente** a partir do conteúdo instalado (`npm run manual`).
> Não edite à mão: qualquer mudança em casos, doenças ou questões deve regenerá-lo.
> Gerado em 2026-08-31.

## 1. Regras de pontuação do modo Escape

- Cada equipe começa com **100 bases**; escapar rende bônus de +2 por minuto restante (máx. +20).
- Tentativa errada: **−2 bases**; erro no cofre final: **−5 bases** e trava de 45 s.
- Dicas por enigma (3 níveis, em ordem): custam **0, 3, 8** bases; o 3º nível entrega a resposta.
- Voltar a uma sala já visitada (revisão): **−2 bases** por retorno; retornar à sala atual é grátis.
- Saída de página/troca de aba confirmada (política Zerar rodada): −10 bases na corrida.
- Salas R1–R4 só abrem a porta após registrar a hipótese no prontuário.
- Nos enigmas de girar (cadeia, frase-mecanismo, cofre), a resposta nunca está na primeira posição dos seletores.

## 2. Validação por tipo de enigma

| Tipo | Validação (sempre no servidor) |
|---|---|
| `use-item` | sempre aceita (interação de pegar/usar item) |
| `chain-fill` | comparação ORDENADA das lacunas preenchidas |
| `board-select` | comparação como CONJUNTO (ordem irrelevante) |
| `microscope` | id da lâmina escolhida após focar |
| `code` | dígitos exatos, em ordem |
| `assemble` | comparação como MULTICONJUNTO das peças |
| `mechanism-fill` | comparação ORDENADA das lacunas |
| `sequence-spot` | índice do códon tocado |
| `inheritance` | alternativa única |
| `family-question` | alternativa única |
| `dial-safe` | comparação ORDENADA dos seletores (erro: −5 bases e trava de 45 s) |

## 3. Caso pronto: Código Vermelho: Paciente A17

**Paciente**: Paciente A17 · lactente, 8 meses · **Diagnóstico**: Anemia falciforme

**Rota molecular**: HBB com troca Glu6Val → HbS → polimerização em baixa oxigenação → falcização e hemólise → anemia + crises vaso-oclusivas → herança autossômica recessiva

### R0 · Antecâmara de Contenção

*SENTINELA: Contenção ativada. Identifiquem-se e provem competência mínima para entrar na ala clínica.*

#### R0-S1 — O crachá do plantonista

- **Tipo/objeto**: `use-item` em "armario-epi" · **Pontos**: 2
- **Enunciado**: O armário de EPI está entreaberto. Dentro dele, um crachá esquecido pelo plantonista anterior. Peguem o crachá e passem no leitor da porta.
- **Resposta**: usar o item no alvo
- **Dicas** (0, 3, 8 bases): (1) Toquem no armário entreaberto à direita. (2) Com o crachá em mãos, toquem no leitor vermelho ao lado da porta. (3) Peguem o crachá no armário de EPI e usem no leitor da porta.

#### R0-S2 — Calibração de competência

- **Tipo/objeto**: `chain-fill` em "painel-sentinela" · **Pontos**: 4
- **Enunciado**: O leitor recusou: 'Credencial sem registro de competência.' O painel exige completar o caminho da informação genética.
- **Resposta**: ?: RNA · ?: FUNÇÃO
- **Dicas** (0, 3, 8 bases): (1) O caminho começa na transcrição. (2) Entre o DNA e a proteína existe uma molécula mensageira; entre a proteína e o fenótipo existe o que ela faz. (3) DNA → RNA → PROTEÍNA → FUNÇÃO → FENÓTIPO.

### R1 · Ala de Triagem

*SENTINELA: O paciente está atrás do vidro. O prontuário está bloqueado. Comecem pelo que os olhos alcançam: o fenótipo.*

#### R1-S1 — A folha travada

- **Tipo/objeto**: `code` em "impressora" · **Pontos**: 2
- **Enunciado**: O computador do prontuário pede uma senha numérica. Há uma folha presa na impressora com o carimbo 'ACESSO TEMPORÁRIO'. Puxem a folha com cuidado e digitem a senha.
- **Evidências na tela**: Folha da impressora: ACESSO TEMPORÁRIO · senha 7264 · válida apenas para o plantão noturno.
- **Resposta**: 7264
- **Dicas** (0, 3, 8 bases): (1) A senha está impressa em algum lugar da sala. (2) Olhem a folha presa na impressora, ao lado do balcão. (3) A senha é 7264.

#### R1-S2 — Montar o quadro clínico

- **Tipo/objeto**: `board-select` em "quadro-branco" · **Pontos**: 8
- **Enunciado**: O prontuário abriu: lactente de 8 meses, palidez intensa, choro à manipulação das mãos e dos pés, fígado e baço palpáveis. Os pais relatam doença falcêmica na família. Marquem no quadro branco APENAS os 4 achados que pertencem a este paciente.
- **Evidências na tela**: Hemoglobina: 7,5 g/dL | Reticulócitos: 12% | Bilirrubina indireta discretamente elevada
- **Resposta**: Crises de dor em mãos e pés, Palidez cutaneomucosa intensa, Icterícia discreta, História familiar de doença falcêmica
- **Dicas** (0, 3, 8 bases): (1) O padrão deste paciente é de anemia com hemólise, não de sangramento. (2) Descartem tudo que aponta para hemostasia: hematomas, epistaxe, gengiva e plaquetas gigantes. (3) Dor em mãos e pés, palidez, icterícia discreta e história familiar.

### R2 · Laboratório de Hematologia

*SENTINELA: O sangue fala. Escutem com as lentes e com os números antes de abrir qualquer porta fria.*

#### R2-S1 — O sangue fala

- **Tipo/objeto**: `microscope` em "microscopio" · **Pontos**: 4
- **Enunciado**: Três lâminas estão na estante, identificadas por paciente. Cada uma mostra um sangue diferente ao focar. Coloquem a lâmina do paciente CERTO no microscópio, ajustem o foco e registrem o achado.
- **Evidências na tela**: Estante de lâminas: B22 · A17 · D09. Etiqueta da bancada: 'Confirme o paciente antes de laudar.'
- **Resposta**: Lâmina A17
- **Dicas** (0, 3, 8 bases): (1) O paciente desta investigação tem uma identificação. (2) O prontuário da Triagem pertence ao Paciente A17. (3) Usem a lâmina A17 e girem o foco até a imagem ficar nítida.

#### R2-S2 — Interpretar antes de abrir

- **Tipo/objeto**: `board-select` em "analisador" · **Pontos**: 8
- **Enunciado**: O analisador imprimiu o painel do Paciente A17. Marquem APENAS os exames ALTERADOS.
- **Resposta**: Hemoglobina 7,5 g/dL, Reticulócitos 12%, Bilirrubina indireta elevada
- **Dicas** (0, 3, 8 bases): (1) Três valores fogem da normalidade; três são tranquilizadores. (2) VCM, plaquetas e TTPa estão dentro da faixa normal. (3) Alterados: hemoglobina baixa, reticulócitos altos e bilirrubina indireta elevada — o retrato da hemólise.

#### R2-S3 — O cadeado da câmara fria

- **Tipo/objeto**: `code` em "geladeira" · **Pontos**: 6
- **Enunciado**: A geladeira de amostras tem um cadeado de 4 dígitos. A luz UV revela no vidro: '1º dígito: nº de exames ALTERADOS no painel. 2º: primeiro algarismo da hemoglobina. 3º: dezena dos reticulócitos. 4º: nº de lâminas na estante.'
- **Resposta**: 3713
- **Dicas** (0, 3, 8 bases): (1) Cada dígito vem de algo que vocês já leram nesta sala. (2) Exames alterados: 3. Hemoglobina: 7,5. Reticulócitos: 12%. Lâminas: 3. (3) O código é 3713.

#### R2-F1 — Arquivo de emergência: o paciente que não sangra (bônus opcional)

- **Tipo/objeto**: `family-question` em "arquivo-morto" · **Pontos**: 5
- **Enunciado**: Um arquivo antigo caiu atrás do analisador: 'Paciente com trombose venosa de repetição. Identificada variante que AUMENTA a produção de protrombina.' Qual é a variante?
- **Resposta**: Mutação G20210A da protrombina
- **Dicas** (0, 3, 8 bases): (1) O problema é o oposto do sangramento. (2) A variante fica na região 3' não traduzida do gene da protrombina. (3) G20210A da protrombina.

### R3 · Bancada de Proteínas

*SENTINELA: A proteína suspeita está suspensa diante de vocês. Montem-na, e ela confessa.*

#### R3-S1 — Montar o tetrâmero

- **Tipo/objeto**: `assemble` em "modelo-molecular" · **Pontos**: 6
- **Enunciado**: O modelo molecular da hemoglobina adulta (HbA) está desmontado. Encaixem as QUATRO cadeias corretas nos quatro suportes.
- **Resposta**: Cadeia α, Cadeia α, Cadeia β, Cadeia β
- **Dicas** (0, 3, 8 bases): (1) A HbA predominante do adulto tem duas cadeias de cada tipo. (2) γ pertence à hemoglobina fetal; δ, à HbA2 minoritária. (3) α, α, β, β — o tetrâmero α2β2.

#### R3-S2 — A frase-mecanismo

- **Tipo/objeto**: `mechanism-fill` em "quadro-negro" · **Pontos**: 8
- **Enunciado**: No quadro-negro, completem a frase que conecta a proteína ao fenótipo deste paciente.
- **Resposta**: A proteína: hemoglobina · está: estruturalmente alterada · e, em baixa oxigenação,: polimeriza e deforma a hemácia
- **Dicas** (0, 3, 8 bases): (1) O esfregaço mostrou a consequência celular do mecanismo. (2) O problema aqui é de qualidade da proteína, não de quantidade. (3) Hemoglobina · estruturalmente alterada · polimeriza e deforma a hemácia.

#### R3-F1 — Arquivo de emergência: a balança que não equilibra (bônus opcional)

- **Tipo/objeto**: `family-question` em "balanca" · **Pontos**: 5
- **Enunciado**: A balança de dois pratos guarda um cartão: 'Outro paciente produz cadeias β em quantidade insuficiente, com cadeias α em excesso precipitando na célula.' Qual é o grupo de doenças?
- **Resposta**: Talassemias (defeito quantitativo)
- **Dicas** (0, 3, 8 bases): (1) A pergunta fala de quantidade, não de estrutura. (2) Compare com o caso principal: lá a proteína é anormal; aqui ela é normal, porém escassa. (3) Talassemias.

### R4 · Câmara de Sequenciamento

*SENTINELA: O DNA entrega a resposta. Encontrem a troca, expliquem a herança, respondam à família.*

#### R4-S1 — Encontrar a troca

- **Tipo/objeto**: `sequence-spot` em "terminal" · **Pontos**: 8
- **Enunciado**: O terminal alinhou o início da cadeia β do paciente com a referência. Toquem no CÓDON divergente.
- **Evidências na tela**: Cromatograma: troca de A por T no segundo nucleotídeo do códon 6 (GAG → GTG).
- **Resposta**: códon 3 exibido (GTG)
- **Dicas** (0, 3, 8 bases): (1) Comparem letra por letra, códon por códon. (2) A divergência está no terceiro códon exibido. (3) GAG virou GTG: glutamato → valina na posição 6.

#### R4-S2 — O heredograma da parede

- **Tipo/objeto**: `inheritance` em "heredograma" · **Pontos**: 6
- **Enunciado**: O heredograma desenhado no vidro mostra: pais saudáveis (ambos com traço falcêmico), paciente afetado, um tio materno afetado. Qual padrão de herança explica a família?
- **Resposta**: Autossômica recessiva
- **Dicas** (0, 3, 8 bases): (1) Os pais são saudáveis e o filho é afetado. (2) Meninas e meninos podem ser igualmente afetados; o gene HBB fica no cromossomo 11. (3) Autossômica recessiva.

#### R4-S3 — A família pergunta

- **Tipo/objeto**: `family-question` em "interfone" · **Pontos**: 6
- **Enunciado**: Pelo interfone, a mãe pergunta: 'Nós dois temos o traço. Qual a chance de um próximo filho nascer com a doença?'
- **Resposta**: 25%
- **Dicas** (0, 3, 8 bases): (1) Montem o quadrado de Punnett com dois heterozigotos. (2) Aa × Aa: quantos aa aparecem em quatro combinações? (3) 1 em 4 — 25%.

#### R4-F1 — Arquivo de emergência: o menino do eczema (bônus opcional)

- **Tipo/objeto**: `family-question` em "freezer" · **Pontos**: 5
- **Enunciado**: Etiqueta esquecida no freezer −80 °C: 'Menino com plaquetas PEQUENAS e baixas, eczema e infecções de repetição.' Qual é a síndrome?
- **Resposta**: Síndrome de Wiskott-Aldrich
- **Dicas** (0, 3, 8 bases): (1) A tríade é hematológica, cutânea e imunológica. (2) Bernard-Soulier tem plaquetas GIGANTES; aqui elas são pequenas. (3) Wiskott-Aldrich, ligada ao X.

### R5 · Cofre do Diagnóstico

*SENTINELA: Cinco seletores. Uma rota molecular. Errar custa bases e tempo. Girem quando tiverem certeza.*

#### R5-S1 — A combinação final

- **Tipo/objeto**: `dial-safe` em "cofre" · **Pontos**: 12
- **Enunciado**: Girem cada seletor até a posição correta para o Paciente A17. A combinação completa abre o laboratório.
- **Resposta**: GENE: HBB (11p) · PROTEÍNA: HbS · MECANISMO: Polimerização e falcização · FENÓTIPO: Anemia hemolítica + crises vaso-oclusivas · HERANÇA: Autossômica recessiva
- **Dicas** (0, 3, 8 bases): (1) Tudo o que vocês registraram no prontuário digital aponta a combinação. (2) Gene no cromossomo 11; proteína vista na eletroforese; mecanismo visto no microscópio. (3) HBB · HbS · polimerização e falcização · anemia hemolítica com crises vaso-oclusivas · autossômica recessiva.

## 4. Doenças geráveis (17 perfis)

O gerador monta as mesmas seis salas para qualquer doença: Antecâmara (crachá + cadeia DNA→RNA→PROTEÍNA→FUNÇÃO→FENÓTIPO), Triagem (senha da impressora sorteada + 4 achados clínicos entre 8), Laboratório (lâmina correta entre 3 morfologias distintas + exames alterados + cadeado derivado das contagens), Bancada (montagem OU função da proteína + frase-mecanismo), Sequenciamento (códon divergente OU alteração molecular + herança + pergunta da família) e Cofre (5 seletores da rota). Distratores vêm das demais doenças instaladas; paciente, senhas e ordem das alternativas mudam a cada sessão.

### Anemia falciforme (`anemia-falciforme`)

- **Grupo**: hemoglobinopatias · **Herança**: Autossômica recessiva · **Tópicos**: proteinas-funcoes, hemoglobina-estrutura, anemia-falciforme, mutacoes-ponto, heranca-autossomica
- **Paciente**: lactente, 8 meses — Desde os 6 meses chora à manipulação das mãos e dos pés, está pálido e o baço cresceu; um tio materno tem 'doença do sangue' desde criança.
- **Achados corretos (sorteia 4)**: Crises de dor em mãos e pés (dactilite); Palidez cutaneomucosa intensa; Icterícia discreta; Esplenomegalia palpável; História familiar de doença falcêmica
- **Exames alterados**: Hemoglobina 7,5 g/dL; Reticulócitos 12%; Bilirrubina indireta 2,1 mg/dL · **Normais**: VCM 84 fL; Plaquetas 260.000/µL; TTPa 31 s
- **Lâmina correta**: `falciforme` — aparecem numerosas hemácias alongadas em forma de foice (drepanócitos) entre hemácias normais
- **Montagem**: O modelo molecular da hemoglobina adulta (HbA) está desmontado. Encaixem as QUATRO cadeias corretas nos quatro suportes. → alfa, alfa, beta, beta
- **Frase-mecanismo**: A proteína **hemoglobina** está **estruturalmente alterada (HbS)** e, em baixa oxigenação, **polimeriza e deforma a hemácia em foice**.
- **Gene**: HBB (11p15.4) — troca de A por T no segundo nucleotídeo do códon 6 (GAG → GTG): glutamato → valina
- **Pergunta da família**: 'Nós dois temos o traço. Qual a chance de um próximo filho nascer com a doença?' → **25%**
- **Cofre**: HBB (11p) · HbS · Polimerização e falcização · Anemia hemolítica + crises vaso-oclusivas · Autossômica recessiva
- **Debrief**: HBB com troca Glu6Val → HbS → polimerização em baixa oxigenação → falcização e hemólise → anemia + crises vaso-oclusivas → herança autossômica recessiva

### Beta-talassemia maior (`talassemia-beta`)

- **Grupo**: hemoglobinopatias · **Herança**: Autossômica recessiva · **Tópicos**: proteinas-funcoes, hemoglobina-estrutura, talassemias, splicing-promotor, heranca-autossomica
- **Paciente**: lactente, 10 meses — Palidez progressiva desde os 6 meses, abdome crescendo à custa do baço e ganho de peso insuficiente; a família, de origem mediterrânea, lembra de primos com anemia grave na infância.
- **Achados corretos (sorteia 4)**: Palidez progressiva desde o primeiro semestre; Esplenomegalia volumosa; Atraso de crescimento e ganho ponderal; Icterícia leve; História familiar de anemia na infância
- **Exames alterados**: Hemoglobina 6,8 g/dL; VCM 58 fL (microcitose); HbF 65% na eletroforese · **Normais**: Plaquetas 310.000/µL; TTPa 30 s; Leucócitos 9.200/µL
- **Lâmina correta**: `microcitica-hipocromica` — as hemácias são pequenas e pálidas (microcitose e hipocromia), com células em alvo
- **Montagem**: A eletroforese deste paciente mostra predomínio de HbF. Montem no modelo a hemoglobina PREDOMINANTE neste sangue. → alfa, alfa, gama, gama
- **Frase-mecanismo**: A proteína **hemoglobina** está **produzida em quantidade muito reduzida (cadeias β escassas)** e, no desequilíbrio de cadeias, **deixa cadeias α em excesso precipitarem, destruindo os precursores na medula**.
- **Gene**: HBB (11p15.4) — Mutação de splicing no gene HBB (ex.: IVS-I-110 G→A) que reduz o RNA mensageiro maduro
- **Pergunta da família**: 'Nós dois temos o traço talassêmico. Qual a chance em CADA gestação de o bebê ter a forma grave?' → **25%**
- **Cofre**: HBB (11p) · Cadeia β em quantidade reduzida · Desequilíbrio de cadeias e eritropoese ineficaz · Anemia microcítica grave + esplenomegalia · Autossômica recessiva
- **Debrief**: HBB com mutação de splicing → cadeias β escassas → excesso de cadeias α precipita → eritropoese ineficaz e hemólise → anemia microcítica grave + esplenomegalia → herança autossômica recessiva

### Deficiência hereditária de antitrombina (`deficiencia-antitrombina`)

- **Grupo**: trombofilias · **Herança**: Autossômica dominante · **Tópicos**: proteinas-funcoes, hemostasia-secundaria, trombofilias, heranca-autossomica
- **Paciente**: mulher, 22 anos — Trombose extensa na veia ilíaca sem nenhum fator desencadeante, aos 22 anos; a mãe teve trombose na primeira gestação e o avô materno, embolia pulmonar aos 45.
- **Achados corretos (sorteia 4)**: Trombose venosa extensa em idade jovem; Evento sem fator desencadeante claro; Mãe com trombose na gestação; Avô materno com embolia pulmonar
- **Exames alterados**: Atividade de antitrombina 45% (persistentemente baixa); D-dímero elevado; Doppler: trombose em veia ilíaca · **Normais**: Plaquetas 250.000/µL; TP/INR 1,0; Hemoglobina 14,1 g/dL
- **Lâmina correta**: `normal` — o esfregaço é normal — falta um ANTICOAGULANTE natural do plasma, nada muda nas células
- **Função da proteína**: Inibir a trombina e outros fatores ativados — o principal freio da cascata
- **Frase-mecanismo**: A proteína **antitrombina** está **com atividade muito reduzida (o freio principal falha)** e, no controle da coagulação, **a trombina circula sem seu inibidor mais importante**.
- **Gene**: SERPINC1 (1q25.1) — Variantes em SERPINC1: quantitativas (tipo I) ou qualitativas (tipo II)
- **Pergunta da família**: 'Tenho a deficiência (heterozigota). Qual a chance de CADA filho herdá-la?' → **50%**
- **Cofre**: SERPINC1 (1q25.1) · Antitrombina · Trombina sem inibição adequada · Trombose venosa precoce e recorrente · Autossômica dominante
- **Debrief**: SERPINC1 mutado → antitrombina reduzida ou disfuncional → trombina e fatores ativados sem freio → trombose venosa precoce/recorrente → herança autossômica dominante

### Deficiência hereditária de proteína C (`deficiencia-proteina-c`)

- **Grupo**: trombofilias · **Herança**: Autossômica dominante · **Tópicos**: proteinas-funcoes, hemostasia-secundaria, trombofilias, heranca-autossomica
- **Paciente**: homem, 35 anos — Segunda trombose venosa em três anos, agora na veia poplítea direita, sem cirurgia nem imobilização; a irmã também já teve tromboflebite e o pai é anticoagulado.
- **Achados corretos (sorteia 4)**: Trombose venosa recorrente; Eventos sem fator desencadeante; Irmã com tromboflebite; Pai em anticoagulação crônica
- **Exames alterados**: Atividade de proteína C 38%; D-dímero elevado; Doppler: trombo em veia poplítea direita · **Normais**: Antitrombina 98%; Plaquetas 265.000/µL; TP/INR 1,0
- **Lâmina correta**: `normal` — o esfregaço é normal — a falha está na via ANTICOAGULANTE que desliga os fatores Va e VIIIa
- **Função da proteína**: Inativar os fatores Va e VIIIa, limitando a coagulação
- **Frase-mecanismo**: A proteína **proteína C** está **reduzida ou disfuncional** e, na via anticoagulante, **os fatores Va e VIIIa escapam da inativação e a coagulação se prolonga**.
- **Gene**: PROC (2q14.3) — Variantes em PROC reduzindo quantidade ou função da proteína C
- **Pergunta da família**: 'Sou heterozigoto para a deficiência. Qual a chance de CADA filho herdar?' → **50%**
- **Cofre**: PROC (2q14.3) · Proteína C · Fatores Va e VIIIa escapam da inativação · Trombose venosa recorrente (púrpura fulminante se bialélica) · Autossômica dominante
- **Debrief**: PROC mutado → proteína C reduzida → fatores Va e VIIIa não são desligados → coagulação prolongada e trombose venosa → herança autossômica dominante (bialélica = púrpura fulminante neonatal)

### Deficiência hereditária de proteína S (`deficiencia-proteina-s`)

- **Grupo**: trombofilias · **Herança**: Autossômica dominante · **Tópicos**: proteinas-funcoes, hemostasia-secundaria, trombofilias, heranca-autossomica
- **Paciente**: mulher, 27 anos — Trombose femoropoplítea confirmada no Doppler, fora de gestação e sem uso de estrogênio; o pai teve trombose aos 38 e uma prima paterna, embolia pulmonar.
- **Achados corretos (sorteia 4)**: Trombose venosa profunda confirmada; Evento fora de gestação e sem estrogênio; Pai com trombose antes dos 40; Prima paterna com embolia pulmonar
- **Exames alterados**: Proteína S livre 30%; D-dímero elevado; Doppler: trombose femoropoplítea · **Normais**: Proteína C 95%; Antitrombina 102%; Plaquetas 255.000/µL
- **Lâmina correta**: `normal` — o esfregaço é normal — falta o COFATOR da via da proteína C, invisível à morfologia
- **Função da proteína**: Ser o COFATOR da proteína C ativada na inativação dos fatores Va e VIIIa
- **Frase-mecanismo**: A proteína **proteína S** está **reduzida (o cofator falta)** e, na via da proteína C, **a proteína C ativada trabalha sem cofator e inativa mal os fatores Va e VIIIa**.
- **Gene**: PROS1 (3q11.1) — Variantes em PROS1 reduzindo a proteína S livre ou sua função
- **Pergunta da família**: 'Sou heterozigota para a deficiência. Qual a chance de CADA filho herdá-la?' → **50%**
- **Cofre**: PROS1 (3q11.1) · Proteína S · Via da proteína C sem cofator · Trombose venosa em contexto familiar · Autossômica dominante
- **Debrief**: PROS1 mutado → proteína S livre reduzida → proteína C ativada sem cofator → fatores Va e VIIIa mal inativados → trombose venosa familiar → herança autossômica dominante

### Doença da hemoglobina C (HbCC) (`hemoglobina-c`)

- **Grupo**: hemoglobinopatias · **Herança**: Autossômica recessiva · **Tópicos**: proteinas-funcoes, hemoglobina-estrutura, mutacoes-ponto, heranca-autossomica
- **Paciente**: menina, 7 anos — Consulta de rotina revelou baço discretamente aumentado e anemia leve que nunca precisou de transfusão; os pais, assintomáticos, têm 'traço de hemoglobina' anotado em exames antigos.
- **Achados corretos (sorteia 4)**: Anemia leve, sem transfusões; Esplenomegalia discreta; Icterícia leve intermitente; Pais assintomáticos com traço de hemoglobina (HbAC)
- **Exames alterados**: Hemoglobina 10,5 g/dL (anemia leve); Reticulócitos 6%; Eletroforese: HbC predominante · **Normais**: Plaquetas 290.000/µL; TTPa 30 s; TP/INR 1,0
- **Lâmina correta**: `celulas-alvo` — predominam células em alvo, com células densas ocasionais — a HbC cristaliza e desidrata a hemácia
- **Montagem**: A HbC mantém a composição de cadeias da hemoglobina adulta — a troca é de UM aminoácido na cadeia β. Montem o tetrâmero da hemoglobina deste paciente. → alfa, alfa, beta, beta
- **Frase-mecanismo**: A proteína **hemoglobina** está **estruturalmente alterada (HbC, com lisina no lugar do glutamato)** e, dentro da hemácia, **tende a cristalizar e desidratar a hemácia, encurtando sua vida**.
- **Gene**: HBB (11p15.4) — Missense no HBB trocando glutamato por lisina (Glu6Lys tradicional), gerando HbC
- **Pergunta da família**: 'Nós dois temos o traço HbAC. Qual a chance de um próximo filho ter HbCC?' → **25%**
- **Cofre**: HBB (11p, variante C) · HbC · Cristalização da hemoglobina na hemácia · Anemia hemolítica leve + células em alvo · Autossômica recessiva
- **Debrief**: HBB com troca Glu6Lys → HbC → cristalização e desidratação da hemácia → hemólise leve com células em alvo → herança autossômica recessiva

### Doença de von Willebrand (tipo 1) (`von-willebrand`)

- **Grupo**: coagulopatias · **Herança**: Autossômica dominante · **Tópicos**: proteinas-funcoes, hemostasia-primaria, von-willebrand, heranca-autossomica
- **Paciente**: menina, 9 anos — Epistaxes de repetição desde pequena e um sangramento que não parava depois da extração de um dente de leite; a mãe sempre teve fluxo menstrual muito aumentado.
- **Achados corretos (sorteia 4)**: Epistaxes de repetição; Sangramento gengival ao escovar os dentes; Sangramento prolongado após extração dentária; Mãe com sangramentos mucosos (menorragia)
- **Exames alterados**: Antígeno do FvW 18% (reduzido); Cofator de ristocetina reduzido; TTPa 42 s (discretamente alargado) · **Normais**: Plaquetas 250.000/µL (número normal); TP/INR 1,0; Hemoglobina 12,8 g/dL
- **Lâmina correta**: `normal` — o esfregaço é normal, com plaquetas de número e tamanho preservados — o defeito é de uma proteína adesiva do plasma
- **Função da proteína**: Ponte de adesão entre a GPIb da plaqueta e o colágeno, além de transportar o fator VIII
- **Frase-mecanismo**: A proteína **fator de von Willebrand** está **produzido em quantidade reduzida** e, na lesão vascular, **a plaqueta não adere ao colágeno exposto e o fator VIII circula desprotegido**.
- **Gene**: VWF (12p13.31) — Variantes no gene VWF que reduzem a quantidade de fator de von Willebrand (tipo 1)
- **Pergunta da família**: 'Eu tenho a doença (sou heterozigota). Qual a chance de CADA filho herdar a condição?' → **50%**
- **Cofre**: VWF (12p13.31) · Fator de von Willebrand · Falha de adesão plaquetária + FVIII instável · Sangramento mucocutâneo · Autossômica dominante
- **Debrief**: VWF (12p13.3) com variante quantitativa → FvW reduzido → adesão plaquetária falha e FVIII instável → sangramento mucocutâneo → herança autossômica dominante

### Hemofilia A (`hemofilia-a`)

- **Grupo**: coagulopatias · **Herança**: Recessiva ligada ao X · **Tópicos**: proteinas-funcoes, hemostasia-secundaria, hemofilias, heranca-ligada-x
- **Paciente**: menino, 4 anos — Depois de uma queda leve no parquinho, o joelho inchou e dói há dois dias; a mãe lembra que o avô materno recebia 'transfusões de fator' desde jovem.
- **Achados corretos (sorteia 4)**: Hemartrose de joelho após trauma leve; Hematomas musculares profundos e desproporcionais; Sangramento prolongado após punção venosa; Avô materno com sangramentos graves (linha materna)
- **Exames alterados**: TTPa 68 s (alargado); Fator VIII 2% (muito reduzido); TTPa corrige na mistura com plasma normal · **Normais**: TP/INR 1,0; Plaquetas 280.000/µL; Tempo de sangramento 5 min
- **Lâmina correta**: `normal` — o esfregaço é normal — o problema não está nas células, está nos fatores solúveis do plasma
- **Função da proteína**: Cofator que acelera a ativação do fator X pelo fator IXa (complexo tenase)
- **Frase-mecanismo**: A proteína **fator VIII** está **deficiente (atividade muito reduzida)** e, na hemostasia secundária, **derruba a geração de trombina e o coágulo de fibrina não se sustenta**.
- **Gene**: F8 (Xq28) — Inversão do íntron 22 do gene F8, rompendo o gene do fator VIII
- **Pergunta da família**: 'Descobri que sou portadora. Qual a chance de um próximo MENINO nascer afetado?' → **50%**
- **Cofre**: F8 (Xq28) · Fator VIII · Falha da hemostasia secundária (tenase) · Hemartroses e hematomas profundos · Recessiva ligada ao X
- **Debrief**: F8 (Xq28) rompido → fator VIII deficiente → tenase falha e a trombina despenca → coágulo de fibrina instável → hemartroses e hematomas profundos → herança recessiva ligada ao X

### Hemofilia B (`hemofilia-b`)

- **Grupo**: coagulopatias · **Herança**: Recessiva ligada ao X · **Tópicos**: proteinas-funcoes, hemostasia-secundaria, hemofilias, heranca-ligada-x
- **Paciente**: menino, 6 anos — Após uma vacina intramuscular, formou-se um hematoma volumoso e endurecido na coxa; um tio materno tem 'problema nas juntas' desde a infância.
- **Achados corretos (sorteia 4)**: Hematoma muscular volumoso após injeção; Episódio prévio de hemartrose de tornozelo; Sangramento prolongado após corte pequeno; Tio materno com sangramentos articulares
- **Exames alterados**: TTPa 62 s (alargado); Fator IX 4% (muito reduzido); TTPa corrige na mistura com plasma normal · **Normais**: TP/INR 1,0; Plaquetas 300.000/µL; Fator VIII 95%
- **Lâmina correta**: `normal` — o esfregaço é normal — células íntegras apontam para um defeito de fator plasmático
- **Função da proteína**: Serinoprotease que, ativada, forma a tenase com o fator VIIIa para ativar o fator X
- **Frase-mecanismo**: A proteína **fator IX** está **deficiente (atividade muito reduzida)** e, na hemostasia secundária, **impede a formação da tenase e a ativação eficiente do fator X**.
- **Gene**: F9 (Xq27.1) — Mutações de ponto no gene F9 reduzindo a atividade do fator IX
- **Pergunta da família**: 'Se eu for portadora, qual a chance de um próximo MENINO nascer afetado?' → **50%**
- **Cofre**: F9 (Xq27.1) · Fator IX · Falha da hemostasia secundária (tenase incompleta) · Hematomas profundos e hemartroses · Recessiva ligada ao X
- **Debrief**: F9 (Xq27.1) mutado → fator IX deficiente → tenase incompleta → geração de trombina insuficiente → hematomas profundos e hemartroses → herança recessiva ligada ao X

### Síndrome de Bernard-Soulier (`bernard-soulier`)

- **Grupo**: plaquetopatias · **Herança**: Autossômica recessiva · **Tópicos**: proteinas-funcoes, hemostasia-primaria, bernard-soulier, heranca-autossomica
- **Paciente**: menino, 3 anos — Púrpura e epistaxes desde o primeiro ano de vida, com um sangramento nasal que precisou de tamponamento; os pais são primos entre si.
- **Achados corretos (sorteia 4)**: Epistaxes graves de repetição; Petéquias e púrpura; Sangramento gengival; Pais consanguíneos
- **Exames alterados**: Plaquetas 45.000/µL (reduzidas); Plaquetas GIGANTES no esfregaço; Agregação ausente com ristocetina, SEM correção com plasma · **Normais**: TP/INR 1,0; TTPa 32 s; Fator de von Willebrand 95%
- **Lâmina correta**: `plaquetas-gigantes` — as plaquetas são gigantes (do tamanho de hemácias) e estão em número reduzido
- **Função da proteína**: Receptor da plaqueta que se liga ao fator de von Willebrand para aderir ao subendotélio
- **Frase-mecanismo**: A proteína **complexo GPIb-IX-V** está **ausente ou disfuncional na membrana da plaqueta** e, no vaso lesado, **a plaqueta não se liga ao FvW e não adere à parede lesada**.
- **Gene**: GP1BA/GP1BB/GP9 (17p13.2 / 22q11.21 / 3q21.3) — Mutações bialélicas em GP1BA, GP1BB ou GP9, desmontando o complexo GPIb-IX-V
- **Pergunta da família**: 'Somos primos e nosso filho nasceu com a síndrome. Qual a chance em um próximo filho?' → **25%**
- **Cofre**: GP1BA/GP9 · Complexo GPIb-IX-V · Falha de adesão plaquetária ao FvW · Sangramento mucocutâneo + plaquetas gigantes · Autossômica recessiva
- **Debrief**: GP1BA/GP1BB/GP9 mutados → complexo GPIb-IX-V ausente → plaqueta não adere ao FvW → sangramento mucocutâneo com plaquetas gigantes → herança autossômica recessiva

### Síndrome de Hermansky-Pudlak (`hermansky-pudlak`)

- **Grupo**: plaquetopatias · **Herança**: Autossômica recessiva · **Tópicos**: proteinas-funcoes, hemostasia-primaria, heranca-autossomica
- **Paciente**: menino, 8 anos — Pele e cabelos muito claros desde o nascimento, baixa visão com nistagmo, e um histórico de equimoses e epistaxes desproporcionais; a família procurou o serviço após um sangramento prolongado em extração dentária.
- **Achados corretos (sorteia 4)**: Hipopigmentação de pele e cabelos (albinismo oculocutâneo); Baixa visão com nistagmo; Equimoses e epistaxes desproporcionais; Sangramento prolongado após procedimento dentário
- **Exames alterados**: Tempo de sangramento prolongado; Agregação: segunda onda ausente (defeito de secreção); Microscopia eletrônica: ausência de corpos densos plaquetários · **Normais**: Plaquetas 210.000/µL (contagem normal); TP/INR 1,0; TTPa 30 s
- **Lâmina correta**: `normal` — à microscopia ÓPTICA o esfregaço parece normal — a ausência dos grânulos densos só aparece na microscopia eletrônica
- **Função da proteína**: Construir organelas relacionadas a lisossomos: grânulos densos das plaquetas e melanossomos
- **Frase-mecanismo**: A proteína **proteínas HPS (biogênese de organelas)** está **sem grânulos densos para secretar** e, após a adesão inicial, **a ativação plaquetária não se amplifica e o tampão fica frouxo**.
- **Gene**: HPS1 (múltiplos loci (HPS1 em 10q24)) — Variantes bialélicas em genes HPS (ex.: HPS1) da biogênese de organelas
- **Pergunta da família**: 'Nosso filho tem a síndrome. Qual o risco de um próximo filho também ter?' → **25%**
- **Cofre**: Genes HPS (ex.: HPS1) · Maquinaria dos grânulos densos · Falha de secreção plaquetária (pool de armazenamento) · Sangramento mucocutâneo + albinismo oculocutâneo · Autossômica recessiva
- **Debrief**: Genes HPS mutados → organelas relacionadas a lisossomos defeituosas → plaquetas sem grânulos densos + melanossomos falhos → sangramento mucocutâneo com albinismo → herança autossômica recessiva

### Síndrome de Wiskott-Aldrich (`wiskott-aldrich`)

- **Grupo**: plaquetopatias · **Herança**: Recessiva ligada ao X · **Tópicos**: proteinas-funcoes, hemostasia-primaria, imunodeficiencias-plaquetarias, heranca-ligada-x
- **Paciente**: menino, 18 meses — Eczema difícil de controlar desde os primeiros meses, três otites e uma pneumonia no último ano, e agora petéquias espalhadas; um primo da mãe morreu pequeno 'de infecção e sangramento'.
- **Achados corretos (sorteia 4)**: Eczema de difícil controle; Infecções de repetição (otites, pneumonia); Petéquias e sangramentos fáceis; Primo materno com quadro semelhante
- **Exames alterados**: Plaquetas 30.000/µL (reduzidas); Volume plaquetário médio BAIXO (plaquetas pequenas); Imunoglobulinas com padrão alterado · **Normais**: TP/INR 1,0; TTPa 31 s; Hemoglobina 11,8 g/dL
- **Lâmina correta**: `plaquetas-pequenas` — as plaquetas são PEQUENAS e raras — o oposto das macroplaquetas de Bernard-Soulier
- **Função da proteína**: Organizar o citoesqueleto de ACTINA das células hematopoéticas
- **Frase-mecanismo**: A proteína **WASp (proteína da síndrome de Wiskott-Aldrich)** está **deficiente, com o citoesqueleto de actina desorganizado** e, nas células hematopoéticas, **gera plaquetas pequenas e escassas e linfócitos que funcionam mal**.
- **Gene**: WAS (Xp11.23) — Variantes no gene WAS (Xp11.23) comprometendo a WASp
- **Pergunta da família**: 'Sou portadora da variante no WAS. Qual a chance de um próximo MENINO nascer afetado?' → **50%**
- **Cofre**: WAS (Xp11.23) · WASp (citoesqueleto de actina) · Plaquetas pequenas e imunidade deficiente · Microtrombocitopenia + eczema + infecções · Recessiva ligada ao X
- **Debrief**: WAS (Xp11.23) mutado → WASp deficiente → citoesqueleto de actina desorganizado → microtrombocitopenia + eczema + imunodeficiência → herança recessiva ligada ao X

### Telangiectasia hemorrágica hereditária (Osler-Weber-Rendu) (`telangiectasia-hemorragica`)

- **Grupo**: vasculopatias · **Herança**: Autossômica dominante · **Tópicos**: proteinas-funcoes, hemostasia-primaria, heranca-autossomica
- **Paciente**: homem, 32 anos — Epistaxes espontâneas desde a adolescência, agora quase semanais, e pontinhos vermelhos nos lábios e na língua; o pai e a avó sempre tiveram 'nariz que sangra' e uma tia investigou uma malformação no pulmão.
- **Achados corretos (sorteia 4)**: Epistaxes espontâneas e recorrentes desde a adolescência; Telangiectasias em lábios, língua e dedos; Familiares com epistaxes em várias gerações; Tia com malformação arteriovenosa pulmonar
- **Exames alterados**: Hemoglobina 9,8 g/dL (anemia ferropriva); Ferritina 8 ng/mL (baixa); TC de tórax: malformação arteriovenosa pulmonar · **Normais**: Plaquetas 280.000/µL; TTPa 30 s; Fator de von Willebrand 100%
- **Lâmina correta**: `normal` — não há alteração típica no esfregaço — o problema é da PAREDE do vaso, não do sangue (a anemia é por perda crônica)
- **Função da proteína**: Receptores da sinalização TGF-β/BMP que guiam o desenvolvimento correto dos vasos
- **Frase-mecanismo**: A proteína **endoglina/ALK1 (via TGF-β vascular)** está **com sinalização vascular TGF-β/BMP deficiente** e, na parede dos vasos, **os capilares se malformam em telangiectasias e fístulas arteriovenosas frágeis**.
- **Gene**: ENG/ACVRL1 (9q34.11 / 12q13.13) — Perda de função heterozigota em ENG ou ACVRL1 da via TGF-β/BMP vascular
- **Pergunta da família**: 'Tenho a doença. Qual a chance de CADA filho herdar a variante?' → **50%**
- **Cofre**: ENG/ACVRL1 · Endoglina/ALK1 (via TGF-β) · Malformação vascular (telangiectasias e fístulas) · Epistaxes + telangiectasias + MAVs viscerais · Autossômica dominante
- **Debrief**: ENG/ACVRL1 com perda de função → sinalização TGF-β/BMP falha → telangiectasias e malformações arteriovenosas → epistaxes e sangramentos com hemostasia normal → herança autossômica dominante

### Trombastenia de Glanzmann (`glanzmann`)

- **Grupo**: plaquetopatias · **Herança**: Autossômica recessiva · **Tópicos**: proteinas-funcoes, hemostasia-primaria, heranca-autossomica
- **Paciente**: menina, 6 anos — Sangramentos de mucosa desde o primeiro ano — gengiva, nariz, pequenos cortes que demoram a parar — com hemograma repetidamente NORMAL; os pais são primos de segundo grau.
- **Achados corretos (sorteia 4)**: Epistaxes e gengivorragia de repetição; Púrpura e equimoses fáceis; Sangramento prolongado em pequenos cortes; Pais consanguíneos
- **Exames alterados**: Agregação ausente com ADP, colágeno e epinefrina; Citometria: GPIIb/IIIa ausente na superfície; Tempo de sangramento prolongado · **Normais**: Plaquetas 240.000/µL, de tamanho normal; Aglutinação com ristocetina PRESERVADA; TP/INR 1,0
- **Lâmina correta**: `normal` — o esfregaço é normal — plaquetas em número e tamanho preservados; o defeito é funcional, invisível à morfologia
- **Função da proteína**: Receptor de fibrinogênio que liga uma plaqueta à outra na AGREGAÇÃO
- **Frase-mecanismo**: A proteína **integrina GPIIb/IIIa (αIIbβ3)** está **sem a integrina de agregação funcional na membrana** e, na formação do tampão, **as plaquetas aderem ao vaso, mas não se agregam entre si**.
- **Gene**: ITGA2B/ITGB3 (17q21.31) — Variantes bialélicas em ITGA2B ou ITGB3, desmontando a integrina αIIbβ3
- **Pergunta da família**: 'Somos primos e nossa filha tem a doença. Qual o risco em cada nova gestação?' → **25%**
- **Cofre**: ITGA2B/ITGB3 (17q) · Integrina GPIIb/IIIa · Falha de agregação plaquetária · Sangramento mucocutâneo com plaquetas normais · Autossômica recessiva
- **Debrief**: ITGA2B/ITGB3 mutados → integrina αIIbβ3 ausente/disfuncional → plaquetas aderem mas não agregam → sangramento mucocutâneo com contagem normal → herança autossômica recessiva

### Trombofilia por fator V Leiden (`fator-v-leiden`)

- **Grupo**: trombofilias · **Herança**: Autossômica dominante · **Tópicos**: proteinas-funcoes, hemostasia-secundaria, trombofilias, mutacoes-ponto, heranca-autossomica
- **Paciente**: homem, 28 anos — Trombose venosa profunda na perna direita depois de um voo longo — mas o irmão teve o mesmo aos 30 anos, sem viagem nenhuma; o pai usa anticoagulante desde uma embolia pulmonar.
- **Achados corretos (sorteia 4)**: Trombose venosa profunda em adulto jovem; Irmão com trombose sem fator desencadeante; Pai anticoagulado após embolia pulmonar; Edema e dor assimétricos na perna
- **Exames alterados**: Resistência à proteína C ativada detectada; D-dímero elevado; Doppler: trombo em veia femoral superficial · **Normais**: Plaquetas 260.000/µL; TTPa 29 s; TP/INR 1,0
- **Lâmina correta**: `normal` — o esfregaço é normal — a doença mora na REGULAÇÃO da coagulação, não nas células
- **Função da proteína**: Cofator da protrombinase, normalmente DESLIGADO pela proteína C ativada
- **Frase-mecanismo**: A proteína **fator V** está **resistente à inativação pela proteína C ativada (variante Leiden)** e, quando o freio anticoagulante atua, **continua ativo e sustenta a geração de trombina além do necessário**.
- **Gene**: F5 (1q24.2) — F5 c.1601G>A (Arg506Gln tradicional) — o fator V Leiden
- **Pergunta da família**: 'Sou heterozigoto para o fator V Leiden. O que acontece com meus filhos?' → **Cada filho tem 50% de chance de herdar a variante — e herdar significa predisposição, não certeza de trombose**
- **Cofre**: F5 (1q24.2) · Fator V resistente à proteína C ativada · Freio anticoagulante ineficaz sobre o fator Va · Predisposição a trombose venosa · Autossômica dominante (predisposição)
- **Debrief**: F5 com Arg506Gln → fator Va resistente à proteína C ativada → geração de trombina prolongada → predisposição a trombose venosa (penetrância incompleta) → herança autossômica dominante

### Trombofilia por protrombina G20210A (`trombofilia-protrombina`)

- **Grupo**: trombofilias · **Herança**: Autossômica dominante · **Tópicos**: proteinas-funcoes, hemostasia-secundaria, trombofilias, mutacoes-ponto, heranca-autossomica
- **Paciente**: mulher jovem, 24 anos — Acordou com dor e inchaço na panturrilha esquerda, sem trauma nem imobilização; a mãe teve embolia pulmonar aos 40 anos.
- **Achados corretos (sorteia 4)**: Edema e dor assimétricos na panturrilha; Trombose venosa sem fator desencadeante claro; História familiar de tromboembolismo; Episódio prévio de tromboflebite superficial
- **Exames alterados**: D-dímero elevado; Doppler: trombo em veia poplítea; Protrombina funcional aumentada · **Normais**: Plaquetas 270.000/µL; TTPa 30 s; Hemoglobina 13,5 g/dL
- **Lâmina correta**: `normal` — o esfregaço é normal — a pista está no excesso de coagulação, não nas células
- **Função da proteína**: Zimogênio que, ativado a trombina, converte fibrinogênio em fibrina
- **Frase-mecanismo**: A proteína **protrombina (fator II)** está **produzida em EXCESSO (ganho de função)** e, na regulação da coagulação, **a geração de trombina aumenta e o sangue tende a coagular demais**.
- **Gene**: F2 (11p11.2) — G20210A na região 3' não traduzida do F2, aumentando o RNA mensageiro e a protrombina
- **Pergunta da família**: 'Sou heterozigota para a variante. Qual a chance de CADA filho herdá-la?' → **50%**
- **Cofre**: F2 (11p11.2) · Protrombina em excesso · Ganho de função pró-coagulante · Trombose venosa de repetição · Autossômica dominante
- **Debrief**: F2 com G20210A na 3'UTR → protrombina em excesso → mais trombina gerada → estado pró-coagulante → trombose venosa de repetição → herança autossômica dominante

### α-talassemia (doença de HbH) (`alfa-talassemia`)

- **Grupo**: hemoglobinopatias · **Herança**: Autossômica recessiva · **Tópicos**: proteinas-funcoes, hemoglobina-estrutura, talassemias, heranca-autossomica
- **Paciente**: menino, 5 anos — Anemia conhecida desde o primeiro ano, com palidez que piora em infecções e baço palpável; os pais têm microcitose leve em hemogramas antigos, sem ferro baixo.
- **Achados corretos (sorteia 4)**: Anemia crônica desde o primeiro ano; Palidez que piora durante infecções; Esplenomegalia palpável; Pais com microcitose leve sem deficiência de ferro
- **Exames alterados**: Hemoglobina 9,2 g/dL; VCM 62 fL (microcitose); Eletroforese: HbH presente · **Normais**: Ferritina 80 ng/mL; Plaquetas 300.000/µL; TTPa 30 s
- **Lâmina correta**: `microcitica-hipocromica` — as hemácias são pequenas e pálidas, com células em alvo — e a coloração supravital revela inclusões de HbH
- **Montagem**: A eletroforese revela HbH. Montem a hemoglobina ANÔMALA que se acumula quando faltam cadeias α depois do nascimento. → beta, beta, beta, beta
- **Frase-mecanismo**: A proteína **cadeias α da globina** está **produzidas em quantidade reduzida (deleções de genes α)** e, no desequilíbrio de cadeias, **deixa cadeias β sobrarem e formarem HbH (β4), que precipita e hemolisa**.
- **Gene**: HBA1/HBA2 (16p13.3) — Deleções de HBA1/HBA2 no cromossomo 16 reduzindo a produção de cadeias α
- **Pergunta da família**: 'Nosso filho tem doença de HbH. Quantos dos QUATRO genes α ele perdeu?' → **Três dos quatro genes α**
- **Cofre**: HBA1/HBA2 (16p) · Cadeias α em quantidade reduzida · Excesso de cadeias β forma HbH (β4) · Anemia microcítica + hemólise (doença de HbH) · Autossômica recessiva
- **Debrief**: Deleções em HBA1/HBA2 → cadeias α escassas → excesso de β forma HbH (β4) → precipitação e hemólise com microcitose → herança autossômica recessiva de quatro alelos

## 5. Rodadas ao vivo (QUIZ)

### Desbloqueio molecular (warmup)

- **W1 · Sequência de ativação** (5 pts, 40 s): Qual sequência representa corretamente o caminho da informação genética ao quadro clínico?
  - **Resposta**: DNA → RNA → proteína → função → fenótipo — A informação no DNA é transcrita em RNA, traduzida em proteína e afeta função e fenótipo.
- **W2 · Estrutura sob pressão** (5 pts, 35 s): Qual combinação corresponde à hemoglobina adulta HbA?
  - **Resposta**: α2β2 — A HbA predominante no adulto é formada por duas cadeias alfa e duas beta.

### Investigação principal · Trilho A

- **A1 · A paciente** (8 pts, 60 s): O conjunto de achados sugere principalmente qual processo?
  - **Resposta**: Hemólise e alteração das hemácias — Anemia crônica, icterícia e crises dolorosas apontam para hemólise e falcização.
- **A2 · O sangue fala** (8 pts, 55 s): Em baixa oxigenação, qual alteração explica a forma das hemácias?
  - **Resposta**: Polimerização da HbS — A desoxigenação favorece a polimerização da HbS e a falcização.
- **A3 · A proteína suspeita** (10 pts, 60 s): Qual cadeia conecta corretamente a alteração molecular ao sintoma?
  - **Resposta**: Beta-globina alterada → HbS → falcização → vaso-oclusão — A HbS altera as propriedades da hemoglobina e leva à falcização e vaso-oclusão.
- **A4 · O DNA entrega a resposta** (14 pts, 55 s): Na posição 6 da cadeia beta, glutamato foi substituído por valina. Qual o diagnóstico?
  - **Resposta**: Anemia falciforme — A substituição Glu6Val na beta-globina origina a HbS.
- **A5 · Fechadura molecular** (10 pts, 45 s): Qual é o elo funcional imediatamente anterior à vaso-oclusão?
  - **Resposta**: Falcização das hemácias — A falcização favorece obstrução microvascular e crises dolorosas.

### Investigação principal · Trilho B

- **B1 · A fábrica produz pouco** (8 pts, 55 s): Microcitose e hipocromia apontam necessariamente para deficiência de ferro?
  - **Resposta**: Não, hemoglobinopatias quantitativas também causam esse padrão — Talassemias reduzem a síntese de cadeias globínicas e podem causar microcitose e hipocromia.
- **B2 · A síntese falha** (8 pts, 50 s): Qual conceito melhor se relaciona ao caso?
  - **Resposta**: Redução da síntese de uma cadeia de globina — O problema central das talassemias é quantitativo.
- **B3 · A proteína incompleta** (10 pts, 50 s): Na beta-talassemia, qual é o defeito central?
  - **Resposta**: Produção reduzida de beta-globina — Há redução ou ausência da produção de cadeias beta.
- **B4 · O RNA denuncia** (14 pts, 55 s): Mutação na beta-globina reduziu a quantidade de mRNA. Qual diagnóstico é mais compatível?
  - **Resposta**: Beta-talassemia — Menos mRNA pode reduzir a síntese de beta-globina e produzir beta-talassemia.
- **B5 · Diferença molecular** (10 pts, 60 s): Qual frase diferencia beta-talassemia de doença falciforme?
  - **Resposta**: Talassemia é quantitativa; falciforme altera a estrutura da beta-globina — Uma reduz a produção; a outra produz uma variante estrutural, HbS.

### Investigação principal · Trilho C

- **C1 · O coágulo que nunca termina** (8 pts, 55 s): Hematomas profundos e hemartroses sugerem alteração de:
  - **Resposta**: Hemostasia secundária — Sangramento profundo e hemartrose são típicos de defeitos da coagulação.
- **C2 · Laboratório** (8 pts, 50 s): Plaquetas normais, TP normal e TTPa prolongado sugerem:
  - **Resposta**: Deficiência de fator da coagulação — O TTPa prolongado direciona para a via intrínseca, incluindo FVIII e FIX.
- **C3 · A família** (10 pts, 50 s): Pai saudável e tio materno afetado sugerem qual herança?
  - **Resposta**: Recessiva ligada ao X — Hemofilias A e B seguem padrão recessivo ligado ao X.
- **C4A · O fator ausente** (14 pts, 55 s): FVIII em 2% e FIX normal indicam:
  - **Resposta**: Hemofilia A moderada — FVIII reduzido identifica hemofilia A; 1% a 5% corresponde à forma moderada no recorte da aula.
- **C4B · O fator ausente** (14 pts, 55 s): FVIII normal e FIX em 3% indicam:
  - **Resposta**: Hemofilia B moderada — FIX reduzido identifica hemofilia B; 3% corresponde à forma moderada no recorte da aula.
- **C5A · Código do cromossomo** (10 pts, 55 s): Qual cadeia corresponde à hemofilia A?
  - **Resposta**: F8 → FVIII → hemostasia secundária → hemartrose — F8 codifica o fator VIII, essencial à hemostasia secundária.
- **C5B · Código do cromossomo** (10 pts, 55 s): Qual cadeia corresponde à hemofilia B?
  - **Resposta**: F9 → FIX → hemostasia secundária → hemartrose — F9 codifica o fator IX, essencial à hemostasia secundária.

### Investigação principal · Trilho D

- **D1 · A plaqueta não consegue segurar** (8 pts, 50 s): Epistaxe, sangramento gengival e após procedimentos formam padrão:
  - **Resposta**: Mucocutâneo — O padrão mucocutâneo sugere defeito de hemostasia primária.
- **D2 · A interação** (8 pts, 50 s): Colágeno → vWF → GPIb-IX-V → plaqueta participa de qual função?
  - **Resposta**: Adesão plaquetária à lesão — O vWF liga o colágeno ao receptor plaquetário GPIb-IX-V.
- **D3 · Dois pacientes** (10 pts, 65 s): X tem vWF reduzido. Y tem macrotrombocitopenia e GPIb reduzida. Qual associação está correta?
  - **Resposta**: X = von Willebrand; Y = Bernard-Soulier — O ligante está reduzido em von Willebrand; o receptor está alterado em Bernard-Soulier.
- **D4 · Ligante e receptor** (14 pts, 55 s): Por que alterações diferentes causam sangramento mucocutâneo semelhante?
  - **Resposta**: Ligante e receptor atuam na mesma etapa de adesão — vWF e GPIb-IX-V são parceiros funcionais na adesão plaquetária.
- **D5 · Cadeia do receptor** (10 pts, 60 s): Qual cadeia representa Bernard-Soulier?
  - **Resposta**: Gene do complexo GPIb → receptor deficiente → adesão prejudicada → sangramento — Bernard-Soulier decorre de defeitos no complexo receptor GPIb-IX-V.

### Código relâmpago (roteiro fixo)

- **R1 · Código relâmpago 01** (3 pts, 25 s): Menino com microtrombocitopenia, eczema e imunodeficiência.
  - **Resposta**: Wiskott-Aldrich — A tríade é característica da síndrome de Wiskott-Aldrich.
- **R2 · Código relâmpago 02** (3 pts, 25 s): Epistaxe crônica, hemorragia digestiva e malformações vasculares autossômicas dominantes.
  - **Resposta**: Osler-Weber-Rendu — O quadro descreve telangiectasia hemorrágica hereditária.
- **R3 · Código relâmpago 03** (3 pts, 25 s): Variante associada a maior produção de protrombina e tendência à coagulação.
  - **Resposta**: G20210A da protrombina — A variante G20210A está associada a níveis elevados de protrombina e trombofilia.
- **R4 · Classifique a pista** (3 pts, 20 s): F8 em Xq28 corresponde a:
  - **Resposta**: DNA / gene — F8 e sua localização cromossômica descrevem o nível genético.
- **R5 · Classifique a pista** (3 pts, 20 s): FVIII reduzido corresponde a:
  - **Resposta**: Proteína / fator — FVIII é o produto proteico funcional.
- **R6 · Classifique a pista** (2 pts, 20 s): Hemartrose corresponde a:
  - **Resposta**: Fenótipo — Hemartrose é uma manifestação clínica.
- **R7 · Último pulso** (3 pts, 20 s): Qual combinação corresponde à HbA?
  - **Resposta**: α2β2 — HbA é α2β2.

### Mecanismo final (cadeias)

- **F1 · Mecanismo final** (20 pts, 90 s): Escolha a cadeia correta para anemia falciforme.
  - **Resposta**: Beta-globina alterada → HbS → falcização → vaso-oclusão — A alteração estrutural da beta-globina produz HbS e falcização.
- **F2 · Mecanismo final** (20 pts, 90 s): Escolha a cadeia correta para beta-talassemia.
  - **Resposta**: Mutação beta-globina → menos síntese → desequilíbrio de globinas → anemia microcítica — A redução quantitativa da cadeia beta causa desequilíbrio e anemia.
- **F3 · Mecanismo final** (20 pts, 90 s): Escolha a cadeia correta para hemofilia A.
  - **Resposta**: F8 → FVIII reduzido → hemostasia secundária comprometida → hemartrose — A deficiência de FVIII compromete a coagulação e causa sangramentos profundos.
- **F4 · Mecanismo final** (20 pts, 90 s): Escolha a cadeia correta para Bernard-Soulier.
  - **Resposta**: Genes GPIb-IX-V → receptor alterado → adesão prejudicada → sangramento mucocutâneo — O receptor plaquetário defeituoso impede adesão eficiente.

### Código relâmpago pelo banco canônico

O Host pode sortear a fase do banco canônico (37 perguntas; pontuação fácil 5 / média 8 / difícil 12; duração 20/30/40 s).
Por categoria: genetics 4 · microscopy 4 · differential 7 · molecular 8 · clinical 6 · inheritance 4 · laboratory 4.
Por dificuldade: medium 23 · easy 7 · hard 7. Gabaritos no próprio `content/question-bank.pt-BR.json`.

## 6. Atmosfera e condução

- **Transição de porta**: toda troca de sala tem animação de travessia (~2 s); retornos aparecem em âmbar ("Revendo").
- **Ajuda visual**: na primeira visita a cada sala, uma mão espectral demonstra onde interagir; a equipe pode desligar no ícone de olho da barra inferior.
- **Tensão**: o ambiente escurece a partir de 50% do tempo, ganha vinheta vermelha pulsante nos últimos 10% e contagem gigante nos 10 segundos finais.
- **O Arquivista**: figura original do jogo; aparece UMA vez por partida, de relance, sem interação — apenas atmosfera. Nos últimos 10% do tempo, aparece para quem ainda não o viu.
- **Erros**: cada tipo de enigma responde com uma consequência narrativa própria (contaminação da lâmina, teclado que trava etc.), nunca um "errado" seco.
