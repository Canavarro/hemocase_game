# HEMOCASE: Código Vermelho

## Do DNA ao Fenótipo

HEMOCASE é um jogo educacional presencial com interface web, criado para uma atividade da Liga de Genética Médica, LAGEM, após a aula de Proteínas de Interesse Médico, Hemoglobinopatias e Coagulopatias.

O jogo foi desenhado para uma janela total de 30 minutos. Um computador funciona como servidor e painel do facilitador. Cada equipe usa um único celular, entra na sessão por QR Code e recebe evidências, questões e desafios em tempo real.

## Estado atual do repositório

Este repositório começa pela especificação do produto e pelas instruções para desenvolvimento com Codex. Ainda não há aplicação implementada.

Leia primeiro:

1. `AGENTS.md`
2. `ARCHITECTURE.md`
3. `docs/PRODUCT_SPEC.md`
4. `docs/GAME_CONTENT.md`
5. `docs/ANTI_CHEAT.md`
6. `docs/UX_BRAND.md`
7. `docs/TEST_PLAN.md`
8. `docs/CODEX_BOOTSTRAP_PROMPT.md`

## Visão do produto

O HEMOCASE deve parecer uma experiência de investigação genética e hematológica, e não um formulário de perguntas.

O eixo conceitual é:

`DNA -> RNA -> proteína -> função -> fenótipo`

O jogador recebe pistas progressivas e precisa relacionar clínica, laboratório, proteína, gene e padrão hereditário.

## Arquitetura pretendida

A primeira versão deve rodar inteiramente em rede local:

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

A identidade visual deve trazer referência discreta à LAGEM, preferencialmente com a marca oficial em baixa opacidade no fundo das telas. Se o arquivo oficial da marca ainda não estiver disponível, o sistema deve usar apenas um placeholder neutro com o texto `LAGEM`. Não inventar uma logomarca oficial.

## Desenvolvimento com Codex

O repositório possui um `AGENTS.md` curto, usado como mapa, e documentação detalhada em `docs/` como fonte de verdade.

Para iniciar a implementação:

1. conecte o repositório ao Codex;
2. abra `docs/CODEX_BOOTSTRAP_PROMPT.md`;
3. copie o prompt da seção `Prompt principal`;
4. execute a tarefa no Codex;
5. responda às perguntas de esclarecimento que forem realmente necessárias;
6. revise a implementação e os testes antes de usar em sala.

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