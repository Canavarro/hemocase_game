# HEMOCASE: Código Vermelho

## Do DNA ao Fenótipo

HEMOCASE é um escape room educacional presencial com interface web, criado para uma atividade da Liga de Genética Médica, LAGEM, após a aula de Proteínas de Interesse Médico, Hemoglobinopatias e Coagulopatias. A experiência assume referências narrativas e audiovisuais autorizadas da série *Jogos Mortais*.

O jogo foi desenhado para uma janela total de 30 minutos. Um computador funciona como servidor e painel do facilitador. Cada equipe usa um único celular, entra na sessão por QR Code e recebe evidências, questões e desafios em tempo real.

## Estado atual do repositório

O MVP está implementado como aplicação TypeScript de origem única, com servidor local, WebSocket, painel Host, projetor, entrada por QR Code, experiência mobile, reconexão, pontuação autoritativa, integridade e exportação.

Mapa completo: `docs/README.md`.

Leitura inicial:

1. `AGENTS.md`
2. `ARCHITECTURE.md`
3. `docs/PRODUCT_SPEC.md`
4. `docs/GAME_CONTENT.md`
5. `docs/ANTI_CHEAT.md`
6. `docs/UX_BRAND.md`
7. `docs/TEST_PLAN.md`
8. `docs/IMPLEMENTATION_STATUS.md`
9. `docs/DEVELOPMENT.md`

## Visão do produto

O HEMOCASE deve parecer um escape room de investigação genética e hematológica conduzido por uma transmissão ameaçadora, e não um formulário de perguntas. A tensão vem da narrativa, do tempo e das consequências das escolhas; o conteúdo médico continua sendo o mecanismo real de progressão.

O eixo conceitual é:

`DNA -> RNA -> proteína -> função -> fenótipo`

O jogador recebe pistas progressivas e precisa relacionar clínica, laboratório, proteína, gene e padrão hereditário.

## Arquitetura implementada

O MVP roda inteiramente em rede local:

- computador do facilitador: servidor + painel Host;
- projetor: tela pública de missão, cronômetro e placar;
- celulares: clientes dos jogadores;
- entrada por QR Code contendo o endereço local e o código da sessão;
- comunicação em tempo real via WebSocket;
- pontuação e estado da partida sempre autoritativos no servidor;
- nenhuma dependência de internet durante a partida.

A arquitetura técnica detalhada está em `ARCHITECTURE.md`.

## Modo de foco e integridade da partida

Durante uma rodada ativa, o cliente monitora eventos que indicam saída da página, troca de aba ou troca de aplicativo. Violações confirmadas podem zerar a pontuação da rodada, conforme a política escolhida pelo facilitador.

Importante: uma aplicação web não consegue garantir tecnicamente que o participante nunca consultará outra fonte. O mecanismo é uma combinação de prevenção, detecção, auditoria e penalidade. O desenho completo e os limites reais estão em `docs/ANTI_CHEAT.md`.

## Identidade LAGEM

A marca oficial fornecida aparece como silhueta flutuante de destaque no fundo animado de todas as superfícies — derivada do ativo oficial apenas com filtros CSS, sem redesenho — acompanhada por uma hélice de DNA e hemácias em deriva construídas em CSS. Vinhetas de fase e a cadeia molecular da revelação são animadas com Remotion no projetor. Os ativos e o procedimento de substituição estão em `docs/ASSETS.md`.

## Duas modalidades

Ao criar a sessão, o organizador escolhe entre:

- **Rodadas ao vivo** (`QUIZ`): o fluxo clássico de fases sincronizadas com perguntas cronometradas;
- **Escape: Protocolo Hélix** (`ESCAPE`): escape room imersivo em primeira pessoa 2.5D — seis salas de laboratório, enigmas validados no servidor, mãos animadas, prontuário digital e cronômetro de expurgo. O professor marca os tópicos já vistos pela turma e nada fora deles entra no jogo.

A especificação completa do modo Escape (salas, enigmas, riscos e roadmap M2/M3) está em `docs/ESCAPE_MODE_SPEC.md`.

## Manutenção com agentes de código

O repositório possui um `AGENTS.md` curto, usado como mapa, e documentação detalhada em `docs/` como fonte de verdade.

O MVP já está implementado. `docs/CODEX_BOOTSTRAP_PROMPT.md` permanece apenas como briefing histórico. Novas alterações devem seguir `AGENTS.md`, `docs/DEVELOPMENT.md`, `docs/API_PROTOCOL.md` e as fontes de verdade da área modificada.

## Executar localmente

Requisitos: Node.js 20 ou superior e computadores/celulares na mesma rede local.

```bash
npm install
npm run game
```

Abra `http://127.0.0.1:3000/host`. O terminal também mostra o endereço IPv4 que deve ser acessível pelos celulares.

Para desenvolvimento com recarga automática:

```bash
npm run dev
```

Validação completa:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:integration
```

O roteiro de preparação e contingência está em `docs/CLASSROOM_RUNBOOK.md`. O funcionamento de cada tela e controle está em `docs/USER_GUIDE.md`.

Referência técnica: `docs/API_PROTOCOL.md`. Estado e limitações: `docs/IMPLEMENTATION_STATUS.md`. Validação executada: `docs/TEST_REPORT.md`.

## Princípios

- experiência mobile first;
- visual premium e coerente com genética, hematologia e investigação;
- interface em português do Brasil;
- fluxo simples para entrar na partida;
- professor e membros da Liga sempre com controle da sessão;
- conteúdo científico separado da lógica da aplicação;
- jogo funcional mesmo sem internet;
- acessibilidade e legibilidade em sala;
- nenhuma pontuação calculada apenas no cliente.

## Licença e marca

Antes de publicar uma versão final, definir a licença do código e anexar somente ativos de marca da LAGEM cujo uso esteja autorizado.
