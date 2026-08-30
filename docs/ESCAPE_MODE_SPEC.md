# HEMOCASE — Modo Escape: "Protocolo Hélix"

Planejamento completo da segunda modalidade do HEMOCASE. Este documento é a fonte de verdade do modo Escape enquanto ele não estiver implementado. Nada aqui substitui `PRODUCT_SPEC.md` para o modo Quiz, que permanece inalterado.

Status: **planejamento aguardando aprovação do responsável**. A implementação só começa após validação deste documento.

---

## 1. Resumo executivo

O HEMOCASE passa a oferecer duas modalidades, escolhidas pelo organizador ao criar a sessão:

| Modalidade | Nome interno | Experiência | Estado |
|---|---|---|---|
| Rodadas ao vivo | `QUIZ` | fluxo atual: fases sincronizadas, perguntas cronometradas, projetor com placar | implementada |
| Escape room | `ESCAPE` | investigação imersiva em primeira pessoa, salas com enigmas, progressão por equipe | este documento |

O modo Escape transforma a dinâmica física planejada pela Liga (HEMOCASE 2.0 / kit de impressão de 30 minutos) em um escape room digital jogado no celular ou notebook de cada equipe. A lógica pedagógica é preservada integralmente:

`fenótipo → laboratório → proteína → gene → herança → diagnóstico`

que é a mesma cadeia `DNA → RNA → proteína → função → fenótipo` percorrida em sentido investigativo.

---

## 2. Decisão de formato: primeira pessoa viável

### 2.1 O que foi pedido

Imersão em primeira pessoa, movimentação do personagem, possivelmente vendo apenas as mãos que interagem com os objetos.

### 2.2 Alternativas avaliadas

| Formato | Exemplo de referência | Viabilidade no contexto HEMOCASE |
|---|---|---|
| FPS 3D em tempo real (WebGL/three.js, andar livre) | jogos de terror indie | **Não recomendado.** Exige modelagem 3D de cinco ambientes, corre alto risco de travar em celulares antigos de alunos, drena bateria, provoca cinetose em parte da turma, infla os assets servidos pela LAN e multiplica o tempo de desenvolvimento por 5 a 10 vezes. |
| Panorama 360° por nó (foto/render equiretangular navegável) | tours virtuais | Possível como evolução (M3). Continua caro em autoria de arte e pesado nos assets, mas roda razoavelmente. |
| **Primeira pessoa por nós, 2.5D em camadas** | The Room, Rusty Lake, escape rooms point-and-click premium | **Recomendado.** Cada sala é composta por vistas fixas em camadas (SVG/PNG leves) com parallax, zoom cinematográfico em objetos, transições de câmera com blur e mãos animadas sobrepostas na base da tela. Roda em qualquer aparelho, funciona offline, pesa pouco na LAN e concentra o esforço onde o jogador realmente olha. |

### 2.3 Como a primeira pessoa funciona no formato recomendado

- Cada sala tem 2 a 4 **vistas** (nós de câmera). Tocar nas bordas laterais (ou arrastar, ou setas) gira a câmera com transição de parallax e leve motion blur — sensação de virar a cabeça.
- Atravessar uma porta dispara uma transição de avanço (dolly + fade) — sensação de caminhar.
- **As mãos do personagem** aparecem na base da tela como sprites SVG animados: apontar, pegar, girar chave, digitar no teclado numérico, segurar lâmina contra a luz. Elas entram em cena apenas durante interações, exatamente como o usuário sugeriu.
- Objetos interativos têm brilho sutil de contorno ao serem tocados pela lanterna do olhar (hotspot). Tocar aproxima a câmera para uma **vista de detalhe** onde o enigma acontece.
- Em notebook: mouse arrasta a panorâmica, clique interage; teclado opcional para códigos.
- Giroscópio do celular (quando existir) adiciona parallax de inclinação — imersão extra sem ser requisito.
- `prefers-reduced-motion` e um botão "modo estável" reduzem transições para cortes secos.

Este formato entrega a fantasia ("estou dentro do laboratório, vejo minhas mãos mexerem nas coisas") sem os riscos do 3D real.

---

## 3. Narrativa: Protocolo Hélix

### 3.1 Premissa

A equipe é a dupla de plantão do **Centro de Investigação Genética e Hematológica** da LAGEM. Durante a madrugada, o sistema de biossegurança do prédio — a **SENTINELA**, uma inteligência de contenção com voz fria e teatral (herdeira direta da transmissão do modo Quiz) — detecta uma inconsistência nos dados de um paciente internado e sela o laboratório com todos dentro.

> "Uma alteração genética foi registrada. Nenhum diagnóstico foi entregue. Até que a rota molecular esteja completa — gene, proteína, mecanismo e fenótipo — as portas permanecem fechadas. Vocês têm 35 minutos antes que o protocolo de expurgo apague o prontuário. O paciente não pode esperar mais que isso."

A única saída é fazer o trabalho: percorrer as cinco alas do laboratório, coletar evidências na ordem clínica correta e "discar" a rota molecular completa no Cofre do Diagnóstico.

### 3.2 Por que essa narrativa

- Mantém a identidade "Código Vermelho" e o tom autorizado de transmissão ameaçadora, sem gore.
- O antagonista (SENTINELA) é diegético: quem cobra respostas é o próprio sistema, o que justifica cada tranca, cada dica e cada penalidade.
- A vítima é um paciente — o que devolve o peso ético: a pressa tem motivo clínico, não apenas cronômetro.
- Cada partida sorteia **um caso da biblioteca** (ver §7), então a mesma narrativa suporta dezenas de rodadas.

### 3.3 Estrutura em atos

| Ato | Ambiente | Etapa da cadeia | Duração alvo |
|---|---|---|---|
| Prólogo | Antecâmara de Contenção | tutorial de interação | 2–3 min |
| Ato 1 | Ala de Triagem | fenótipo clínico | 5–6 min |
| Ato 2 | Laboratório de Hematologia | exames e laboratório | 6–7 min |
| Ato 3 | Bancada de Proteínas | proteína e mecanismo | 6–7 min |
| Ato 4 | Câmara de Sequenciamento | gene, mutação e herança | 6–7 min |
| Ato final | Cofre do Diagnóstico | síntese e diagnóstico | 4–5 min |
| Epílogo | Saída / Debriefing | revelação e placar | 3 min |

Total: 32 a 38 minutos, configurável pelo organizador (25/35/45 min). No modo de 25 minutos, a Antecâmara é encurtada e cada sala perde um enigma opcional.

---

## 4. Design dos ambientes

Direção de arte comum: realismo estilizado em camadas SVG, iluminação dramática de emergência, paleta base carvão `#060707` + vermelho sangue `#a71017` + teal cirúrgico `#19a7a6`, sinalização hospitalar em amarelo `#d5a940`. A silhueta da LAGEM aparece gravada em vidros e pisos. Todas as salas têm loop de som ambiente próprio (ver §10, áudio é asset local).

### 4.0 Antecâmara de Contenção (prólogo/tutorial)

**Cena.** Corredor curto e escuro. Luz giratória vermelha de emergência varre as paredes. Porta de aço selada à frente com o painel da SENTINELA piscando. À direita, um armário de EPI entreaberto; à esquerda, um quadro de avisos da Liga.

**Iluminação.** Apenas a luz giratória + o brilho do painel. As sombras giram com ela (animação CSS barata e de efeito enorme).

**Som.** Alarme distante abafado, zumbido elétrico, voz da SENTINELA.

**Interações-tutorial.**
1. Olhar ao redor (aprende a girar a câmera).
2. Pegar o **crachá do plantonista** dentro do armário de EPI (aprende inventário; a mão entra em cena pela primeira vez pegando o crachá).
3. Passar o crachá no leitor (aprende usar item em hotspot). O leitor recusa: "Credencial sem registro de competência. Prove que sabe o básico."
4. **Enigma de calibração** (fácil, conteúdo da aula): o painel mostra a cadeia `DNA → ? → PROTEÍNA → ? → FENÓTIPO` com peças arrastáveis. Completar abre a porta.

**Destrava:** Ala de Triagem.

### 4.1 Ala de Triagem (fenótipo)

**Cena.** Recepção de emergência vazia à meia-luz. Balcão com computador de prontuário em standby, cadeira caída (sinal de evacuação às pressas), vidro de observação para o leito do paciente — vê-se apenas a silhueta do paciente e o monitor multiparâmetro. Um quadro branco com anotações da equipe médica interrompidas no meio. Impressora com uma folha travada pela metade.

**Iluminação.** Luz fria do monitor + abajur de balcão quente. O contraste quente/frio guia o olhar.

**Som.** Bip regular do monitor do paciente (o bip é diegético e reage: acelera nos últimos 5 minutos da partida — pressão emocional sem nenhuma palavra).

**Objetos interativos.**
- Computador de prontuário: pede a senha que está na folha presa na impressora (mini-enigma físico: puxar a folha com cuidado — arrastar devagar, se rasgar espera 10 s).
- Prontuário aberto: apresenta a **Evidência 1 — O Paciente** do caso sorteado (anamnese, exame físico, história familiar).
- Monitor do paciente: sinais vitais coerentes com o caso.
- Quadro branco: espaço de anotação livre da equipe (persiste na partida e sai no prontuário exportado).

**Enigma principal — "Montar o quadro clínico".** A equipe arrasta para o quadro branco os 4 achados fenotípicos que pertencem ao caso, dentre 8 apresentados (os 4 distratores vêm de outros casos da biblioteca). Acertar imprime a **guia de exames** com o código do elevador de serviço.

**Destrava:** Laboratório de Hematologia (elevador de serviço com teclado numérico — a mão digita o código).

### 4.2 Laboratório de Hematologia (exames)

**Cena.** A sala mais rica visualmente. Bancada em U com microscópio no centro, centrífuga, estante de tubos coloridos por tampa, geladeira de amostras com cadeado de 4 dígitos, analisador hematológico com tela de resultados, negatoscópio na parede. Luz UV portátil pendurada num gancho.

**Iluminação.** Fluorescente falhando (flicker sutil), luz azul do analisador, círculo de luz quente da lente do microscópio.

**Som.** Centrífuga em rotação residual desacelerando, compressor da geladeira, gotejar de pia.

**Objetos interativos.**
- **Microscópio** (vista de detalhe): a equipe escolhe a lâmina certa na estante (identificada pelas iniciais do paciente), posiciona no charriot e ajusta o **foco girando o botão** (arrasto circular; a imagem sai do blur). O esfregaço revelado é a **Evidência 2 — O Sangue Fala** do caso: morfologia gerada a partir do conteúdo (drepanócitos, microcitose com hipocromia, esfregaço normal com plaquetas gigantes etc.).
- **Analisador hematológico**: imprime o hemograma/coagulograma do caso (TP, TTPa, plaquetas, VCM...). Os valores são conteúdo, não código.
- **Centrífuga**: contém um tubo esquecido com anotação no rótulo (dica de custo zero).
- **Luz UV**: revela no vidro da geladeira uma anotação apagada — necessária para o cadeado.
- **Geladeira de amostras**: cadeado de 4 dígitos cuja combinação é deduzida dos exames ("o dígito 1 é o número de exames alterados...", instruções geradas por template a partir do caso — sempre exige interpretar os exames, nunca chutar).

**Enigma principal — "Interpretar antes de abrir".** A combinação da geladeira só sai se a equipe classificar corretamente os exames (normal/alterado) no analisador. Dentro da geladeira: a **amostra-mestre** e o cartão de acesso à Bancada de Proteínas.

**Destrava:** Bancada de Proteínas.

### 4.3 Bancada de Proteínas (proteína e mecanismo)

**Cena.** Sala de bioquímica com um grande modelo molecular suspenso no centro (a hemoglobina tetramérica, quando o caso for de hemoglobina; o complexo GPIb-IX-V ou o fator de coagulação em 2.5D, nos demais). Cuba de eletroforese na bancada, quadro-negro com o desenho das estruturas proteicas (primária → quaternária), balança de dois pratos antiga — herança do professor fundador da Liga, diz a plaquinha.

**Iluminação.** Spot teatral sobre o modelo central; resto em penumbra teal.

**Som.** Borbulhar da cuba, ventilação.

**Objetos interativos.**
- **Modelo molecular central** (vista de detalhe): enigma de **montagem do tetrâmero** — arrastar cadeias α, α, β, β aos encaixes (caso A/B) ou acoplar ligante-receptor vWF↔GPIb (caso D) ou encaixar o fator na cascata (caso C). Versão digital fiel da dinâmica física de "montar a hemoglobina com cartões" do plano original.
- **Cuba de eletroforese**: correr a amostra-mestre gera o padrão de bandas do caso (Evidência 3 — **A Proteína Suspeita**). Comparação com a régua de padrões na parede.
- **Balança de dois pratos**: enigma da **talassemia** — equilibrar produção de cadeias (peças α e β); se o caso for quantitativo, a balança nunca equilibra e isso É a pista.
- **Quadro-negro**: consulta passiva com o conteúdo estrutural visto em aula (função de "material de apoio" controlado — só contém o que o professor liberou, ver §8).

**Enigma principal.** Fechar a frase-mecanismo em peças móveis: `A proteína ___ está ___ (alterada/reduzida/ausente), comprometendo ___`. Acertar ejeta a **chave magnética** da Câmara de Sequenciamento.

**Destrava:** Câmara de Sequenciamento.

### 4.4 Câmara de Sequenciamento (gene e herança)

**Cena.** Sala fria e azulada, quase silenciosa — contraste deliberado com o resto do jogo. Sequenciador com tela de cromatograma, terminal de bioinformática, parede-vidro com um **heredograma incompleto** desenhado a marcador, impressora térmica. No teto, a silhueta da LAGEM projetada pela luminária (easter egg de marca).

**Iluminação.** Azul gelo uniforme + verde fosforescente do terminal.

**Som.** Ronco grave do freezer −80 °C, cliques do sequenciador.

**Objetos interativos.**
- **Terminal de alinhamento** (vista de detalhe): a Evidência 4 — **O DNA Entrega a Resposta**. A equipe compara a sequência do paciente com a referência e **marca a posição divergente** (mutação de ponto, deleção, variante promotora — vem do caso). Interface de toque: deslizar pelas bases, tocar na divergência.
- **Cromatograma**: confirma visualmente a troca de base.
- **Heredograma na parede-vidro**: enigma de **herança** — arrastar os símbolos (afetado/portador) sobre a família descrita no prontuário; o padrão correto (ligado ao X, autossômico dominante/recessivo) acende o caminho de transmissão. Versão digital do heredograma a ser desenhado no jogo físico.
- **Impressora térmica**: imprime o **cartão-resposta genético** com o nome do gene e locus (ex.: `F8 — Xq28`), que vai ao inventário.

**Enigma principal.** Responder à **pergunta da família** (Evidência 5 do plano físico): a SENTINELA encarna um familiar por interfone — "A irmã do paciente terá a doença?" — com alternativas cuidadosas. Acertar libera o corredor final.

**Destrava:** Cofre do Diagnóstico.

### 4.5 Cofre do Diagnóstico (síntese)

**Cena.** Sala circular pequena, no centro um cofre antigo de banco reaproveitado pela Liga, com **cinco seletores rotativos**: GENE · PROTEÍNA · MECANISMO · FENÓTIPO · HERANÇA. Ao redor, os retratos dos casos históricos do Centro (visual de "arquivos não resolvidos"). Cronômetro de expurgo projetado na parede inteira.

**Iluminação.** Um único facho zenital sobre o cofre; vermelho crescente conforme o tempo acaba.

**Som.** Tique mecânico do cofre; coração acelerando por baixo (mix sutil).

**Mecânica final.** A equipe gira cada seletor até a opção correta (opções são distratores plausíveis dos outros casos — quem chutou nas salas anteriores sofre aqui). As mãos giram os discos com peso e cliques táteis (haptics via `navigator.vibrate` quando disponível). Combinação completa:

1. O cofre abre em cutscene (Remotion): dentro, o **prontuário do paciente carimbado com o diagnóstico** e a chave física da porta.
2. A SENTINELA se despede reconhecendo a rota molecular completa.
3. A porta abre para luz branca — fim de jogo, tempo registrado.

**Erro na combinação:** tranca de 45 s + penalidade "MUTAÇÃO DELETÉRIA −5 bases" (mesma regra e humor do jogo físico).

### 4.6 Epílogo — Debriefing

De volta ao projetor da sala de aula: ranking por tempo + bases, a cadeia `DNA → RNA → proteína → função → fenótipo` animada (Remotion, já implementada no modo Quiz), e o **prontuário genético digital** de cada equipe fica disponível para exportação do professor — a produção acadêmica concreta do plano físico, preservada.

---

## 5. Mecânicas transversais

- **Inventário**: máximo 6 itens, barra inferior discreta; itens têm vista de detalhe (girar objeto com o dedo).
- **Prontuário genético digital**: substitui a ficha impressa; a equipe registra hipótese após cada sala (campo curto obrigatório antes de abrir a porta seguinte — trava pedagógica do plano original "registrar a hipótese antes da próxima evidência"). Exportado em JSON/CSV no fim.
- **Dicas progressivas**: 3 níveis por enigma (orientação → pista direta → resposta), custando 0 / −3 / −8 bases. Sempre disponíveis: ninguém fica preso a ponto de abandonar o jogo. A SENTINELA entrega as dicas em sua voz.
- **Pontuação**: começa em 100 bases; dicas e erros graves debitam; enigmas opcionais (ver abaixo) creditam. Tempo restante vira bônus. Placar final combina bases + tempo.
- **Arquivos de emergência** (conversão dos "casos relâmpago" e das "cartas surpresa" do plano físico): em cada sala existe **um enigma opcional escondido** (um arquivo morto, um armário trancado secundário) com um mini-caso relâmpago (Wiskott-Aldrich, THH, G20210A da protrombina...). Vale bases extras e alimenta a variedade entre partidas.
- **Sincronização e ritmo**: cada equipe progride no seu ritmo dentro do tempo global da sessão. O professor vê tudo (§9) e pode conceder dica, pausar ou estender o tempo.
- **Integridade**: o modo de foco atual (detecção de troca de aba/app, políticas configuráveis) é reaproveitado sem mudança. Mas o Escape reduz naturalmente o incentivo à pesquisa externa: o que o Google devolve não abre um cadeado cuja combinação depende de exames daquele paciente sorteado.
- **Reconexão**: o servidor guarda a sala, o inventário e os enigmas resolvidos; ao reconectar, a equipe volta exatamente onde estava (mesma regra de `teamToken` atual).

---

## 6. Papéis dentro da equipe

O plano físico atribui funções (geneticista, hematologista, biólogo molecular, analista, porta-voz). No digital com um aparelho por equipe, os papéis viram **responsabilidades sugeridas na tela de entrada** (quem opera o aparelho alterna por sala; o porta-voz preenche o prontuário).

Evolução M3 — **modo multi-aparelho por papéis**: cada aluno entra com o próprio celular e cada papel enxerga uma camada diferente da mesma sala (o geneticista vê o terminal de sequências, o hematologista vê o microscópio) — cooperação obrigatória por comunicação verbal, o ápice pedagógico do formato. Registrado como evolução, não como requisito, porque multiplica o esforço de teste.

---

## 7. Biblioteca de conteúdo e não-repetição

### 7.1 Estrutura

```text
content/
  game.pt-BR.json          # modo Quiz (existente, intocado)
  escape/
    cases/                 # um arquivo por caso jogável
      falciforme-a17.json
      beta-tal-minor-b22.json
      hemofilia-a-c31.json
      hemofilia-b-c31.json
      vwd-d09.json
      bernard-soulier-d10.json
    flash/                 # arquivos de emergência (mini-casos opcionais)
      wiskott-aldrich.json
      thh.json
      g20210a.json
    puzzles.pt-BR.json     # templates de enigma (tetrâmero, balança, cadeado...)
    rooms.pt-BR.json       # cenografia: vistas, hotspots, posições (sem conteúdo médico)
```

Cada **caso** declara: identificação do paciente fictício, as 5 evidências (nos moldes do kit físico), os dados que alimentam cada enigma (achados, exames, bandas, sequências, heredograma), a combinação final do cofre, tags de tópico e distratores.

Separação estrita mantida: **cenografia e motor não contêm strings médicas**; casos não contêm posições de cena.

### 7.2 Como evitar repetição entre rodadas

1. **Sorteio de caso por equipe** (equipes diferentes na mesma sessão investigam pacientes diferentes — também elimina "olhar a tela do vizinho").
2. **Variantes por enigma**: cada template de enigma aceita N variações geradas dos dados do caso (a combinação da geladeira muda porque os exames mudam).
3. **Distratores rotativos**: os achados falsos da Triagem vêm dos outros casos da biblioteca, então mudam conforme a biblioteca cresce.
4. **Arquivos de emergência sorteados**: 1 de 3+ por sala, por partida.
5. **Meta de lançamento**: 6 casos principais × variantes ≥ **3 turmas completas sem repetição perceptível**; o formato de arquivo permite à Liga escrever novos casos sem tocar em código (`CONTENT_AUTHORING.md` ganhará uma seção Escape).

---

## 8. Curadoria do professor (gating de conteúdo)

Requisito central do pedido: o aluno nunca pode ser cobrado por conteúdo que ainda não viu.

### 8.1 Tags de tópico

Todo caso, enigma e arquivo de emergência declara tags de um vocabulário controlado:

```text
proteinas-funcoes, hemoglobina-estrutura, anemia-falciforme, talassemias,
hemostasia-primaria, hemostasia-secundaria, hemofilias, von-willebrand,
bernard-soulier, heranca-ligada-x, heranca-autossomica, mutacoes-ponto,
splicing-promotor, trombofilias, imunodeficiencias-plaquetarias
```

### 8.2 Fluxo do organizador

Ao criar a sessão em modo Escape, o Host:

1. escolhe a duração (25/35/45 min);
2. marca no **checklist de tópicos** o que a turma já estudou (com predefinições: "Aula completa de Hemoglobinopatias", "Somente coagulopatias");
3. o sistema exibe quais casos ficaram elegíveis e alerta se a biblioteca elegível for pequena demais para o número de equipes;
4. enigmas opcionais com tags não liberadas simplesmente não aparecem nas salas (o armário está trancado "para manutenção");
5. o quadro-negro de apoio (§4.3) só exibe material das tags liberadas;
6. a exportação final registra os tópicos usados — rastreabilidade pedagógica.

Regra dura no motor: **nenhum conteúdo com tag não liberada é sequer enviado ao cliente** (gating no servidor, não CSS escondido — coerente com a autoridade de servidor já existente).

---

## 9. Painel do professor e projetor no modo Escape

**Host** (além dos controles atuais de sessão): mapa das cinco salas com a posição de cada equipe em tempo real, tempo em sala, dicas consumidas, botão "conceder dica grátis", botão "destravar porta" (contingência), ajuste de tempo global.

**Projetor**: planta estilizada do laboratório com os avatares das equipes avançando (sem revelar respostas), cronômetro de expurgo global, feed de eventos ("Equipe HBB abriu a Câmara de Sequenciamento"), intervenções da SENTINELA sincronizadas — a sala inteira ouve quando alguém erra o cofre. Isso preserva a energia coletiva da versão física mesmo com equipes em ritmos diferentes.

---

## 10. Arquitetura técnica

### 10.1 O que é reaproveitado (sem mudança)

- Sessão, QR Code, `teamToken`, reconexão, Socket.IO, autoridade do servidor, exportação, política de integridade, painel Host base, projetor base, build de origem única, funcionamento 100 % offline/LAN.

### 10.2 O que é novo

| Peça | Descrição |
|---|---|
| `mode: "QUIZ" \| "ESCAPE"` | na criação da sessão; snapshot ganha o modo. |
| Máquina de fases Escape | `LOBBY → BRIEFING → ROOM_0..ROOM_5 → DEBRIEF → FINISHED` por equipe (progresso individual) + relógio global da sessão. |
| Motor de cenas | renderer React de vistas em camadas: JSON declarativo (`rooms.pt-BR.json`) com camadas, hotspots, transições e enigmas plugáveis. CSS 3D transforms + SVG; nenhuma dependência de WebGL. |
| Enigmas | componentes plugáveis (`tetramer`, `balance`, `padlock`, `microscope`, `sequence-align`, `pedigree`, `dial-safe`, `drag-board`), validados **no servidor** (o cliente envia tentativas, nunca o resultado). |
| Mãos | sprite sheet SVG com 6 gestos, animação por CSS steps; camada fixa na base da vista. |
| Cutscenes | Remotion Player (já no projeto) para abertura, portas e cofre final. |
| Áudio | loops locais em `apps/web/public/assets/escape/` (OGG+M4A), mixer simples com ducking para a voz da SENTINELA; tudo offline. |
| Conteúdo | `content/escape/` conforme §7, validado com Zod na subida do servidor. |

### 10.3 Orçamento de assets (restrição de LAN)

Alvo: **≤ 12 MB** somados (SVG comprime muito bem; áudio é o maior custo — loops de 20–30 s em 96 kbps). 30 celulares baixando 12 MB de um notebook em Wi-Fi de sala é aceitável (~360 MB agregados, servidos em ~1–2 min com cache do navegador; a entrada é escalonada naturalmente pelo QR).

---

## 11. Viabilidade, riscos e o que poderia inviabilizar

| # | Risco | Gravidade | Mitigação |
|---|---|---|---|
| 1 | **Esforço de desenvolvimento** — é um jogo inteiro, não uma feature. Estimativa honesta: M1 sozinho equivale a várias vezes o MVP do Quiz. | alta | Roadmap por marcos (§12) com corte viável em cada um; motor de cenas genérico para que salas novas sejam JSON + arte, não código. |
| 2 | Celulares fracos/antigos travarem | alta | formato 2.5D sem WebGL; testes em aparelho Android de entrada como critério de aceite; "modo estável" com cortes secos. |
| 3 | Peso dos assets na LAN | média | orçamento ≤ 12 MB, SVG, áudio comprimido, cache agressivo, pré-carregamento por sala (só baixa a sala seguinte). |
| 4 | Cinetose / desconforto | média | transições curtas, sem câmera contínua, `prefers-reduced-motion`, modo estável. |
| 5 | Autoplay de áudio bloqueado | certa | o toque em "INICIAR PLANTÃO" (interação inicial obrigatória) desbloqueia o áudio — mesmo padrão do vídeo atual. |
| 6 | Equipes presas em enigma (frustração) | alta | dicas em 3 níveis sempre disponíveis; professor pode destravar porta; telemetria de tempo por enigma para calibrar dificuldade nos ensaios. |
| 7 | Conteúdo científico incorreto | alta | casos revisados pelo professor antes da 1ª turma; separação conteúdo/código permite revisão sem build. |
| 8 | Um só aparelho por equipe limita participação | média | responsabilidades por sala + prontuário obrigatório; modo multi-aparelho como M3. |
| 9 | Produção de arte das 5 salas | média | direção 2.5D em SVG autoral (sem assets de terceiros/licenças); estilo "blueprint noir" deliberadamente estilizado é mais barato que realismo e envelhece melhor. |
| 10 | iOS Safari (fullscreen, 100dvh, wake lock) | média | já tratados no MVP atual com detecção e fallback; herdados. |
| 11 | Bateria em sessão de 35 min | baixa | sem WebGL, animações pausadas fora de viewport, wake lock opcional. |
| 12 | Anti-cheat não impede pesquisa externa | aceita | como no Quiz: prevenção + detecção + penalidade; e o desenho dos enigmas (dados do paciente sorteado) torna a pesquisa externa pouco útil. |

**Veredito de viabilidade:** o projeto é viável no formato recomendado. O único risco capaz de inviabilizar é o #1 (escopo) — mitigado pelo corte em marcos: cada marco entrega algo jogável em sala.

---

## 12. Roadmap proposto

| Marco | Entrega jogável | Conteúdo |
|---|---|---|
| **M1 — Fundação** | Seleção de modalidade no Host; motor de cenas; Antecâmara + 5 salas com 1 caso completo (anemia falciforme); gating de tópicos; prontuário digital; dicas; mapa do Host | 1 caso, 3 arquivos de emergência |
| **M2 — Biblioteca** | 6 casos principais, distratores rotativos, projetor com planta e feed, cutscenes Remotion, áudio completo, balanceamento com telemetria | biblioteca para 3+ turmas |
| **M3 — Cooperação** | modo multi-aparelho por papéis, editor de casos para a Liga, panorama 360 opcional | expansão contínua |

---

## 13. Critérios de aceite (M1)

1. Organizador cria sessão Escape, marca tópicos, e nenhum conteúdo fora deles chega a qualquer cliente (verificável no payload).
2. Equipe entra por QR, joga do prólogo ao cofre num Android de entrada e num iPhone sem travar (≥ 30 fps nas transições).
3. Queda de conexão no meio da Sala 3 → reconexão devolve sala, inventário e enigmas resolvidos.
4. Toda validação de enigma acontece no servidor; nenhum payload contém resposta antes do acerto.
5. Duas partidas seguidas com a mesma turma não repetem caso nem arquivos de emergência.
6. Prontuários digitais exportados em JSON/CSV com tópicos da sessão.
7. `npm run lint && npm run typecheck && npm test && npm run build && npm run test:integration` verdes.

---

## 14. Decisões que precisam do responsável

1. **Aprovação do formato 2.5D em primeira pessoa** (§2) — decisão estrutural; muda tudo se a resposta for "queremos 3D real".
2. Voz da SENTINELA: sintetizada, gravada por membro da Liga, ou somente texto no M1?
3. Ordem dos casos no M1 (proposta: anemia falciforme primeiro, por ser o caso-âncora da aula).
4. Duração padrão da sessão Escape (proposta: 35 min).
5. O modo Escape convive com o Quiz na mesma aula (uma turma em cada modo) ou são sessões separadas? (proposta M1: sessões separadas.)
