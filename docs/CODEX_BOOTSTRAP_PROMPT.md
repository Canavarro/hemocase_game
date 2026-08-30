# Prompt de Bootstrap para Codex

## Como usar

Abra este repositório no Codex e envie o texto da seção `Prompt principal` como primeira tarefa de implementação.

O repositório foi estruturado para que `AGENTS.md` funcione como mapa e os documentos em `docs/` sejam a fonte de verdade.

## Prompt principal

```text
Você é o engenheiro principal e product designer responsável por implementar a primeira versão funcional do HEMOCASE: Código Vermelho, subtítulo Do DNA ao Fenótipo.

CONTEXTO

Este repositório pertence a um jogo educacional da Liga de Genética Médica, LAGEM. A atividade será executada presencialmente em sala após uma aula sobre proteínas de interesse médico, hemoglobinopatias e coagulopatias. O professor disponibilizou somente 30 minutos para toda a dinâmica.

Um computador será o servidor local e painel do facilitador. As equipes se conectarão pelo próprio celular através de QR Code. Cada equipe terá apenas um celular.

A experiência visual e a sensação de jogo são requisitos de primeira classe. Não crie um formulário escolar com um tema escuro.

FASE 0: LEITURA OBRIGATÓRIA

Antes de escrever código:

1. leia AGENTS.md;
2. leia README.md;
3. leia ARCHITECTURE.md;
4. leia docs/PRODUCT_SPEC.md;
5. leia docs/GAME_CONTENT.md;
6. leia docs/ANTI_CHEAT.md;
7. leia docs/UX_BRAND.md;
8. leia docs/TEST_PLAN.md.

Considere esses arquivos a fonte de verdade do produto.

FASE 1: PERGUNTAS DE ESCLARECIMENTO

Antes de iniciar a implementação, avalie o que ainda não está decidido.

Faça perguntas somente quando a resposta realmente alterar arquitetura, UX, operação em sala ou conteúdo. Não repita perguntas que os documentos já respondem.

Se as informações abaixo ainda não estiverem no repositório ou na conversa, confirme:

1. Qual é o nome oficial completo da LAGEM?
2. Existe logomarca oficial? Se sim, peça que o arquivo SVG ou PNG seja adicionado ao repositório. Não invente uma logomarca oficial.
3. Existem cores institucionais obrigatórias da LAGEM?
4. Qual será o sistema operacional do computador servidor no dia da aula, Windows, macOS ou Linux?
5. Qual é a quantidade aproximada máxima de equipes?
6. Os celulares serão majoritariamente Android/Chrome, iPhone/Safari ou uma mistura?
7. A rede será Wi-Fi institucional, roteador próprio ou hotspot criado pelo computador/celular?
8. A política anti-cheat desejada continua sendo ZERO_ROUND no primeiro evento confirmado ou o responsável prefere WARNING/MANUAL_REVIEW?

Agrupe as perguntas em uma única mensagem curta. Não faça uma entrevista longa.

Se o usuário disser para usar os padrões, adote:

- 4 a 12 equipes;
- Android Chrome e iOS Safari;
- todos na mesma LAN;
- política ZERO_ROUND;
- grace period de 1000 ms;
- Host com possibilidade de desfazer penalidade;
- português do Brasil;
- estado da sessão em memória;
- exportação JSON e CSV;
- nenhuma dependência de internet durante a partida;
- marca LAGEM como placeholder textual até o ativo oficial ser fornecido.

FASE 2: PLANO

Depois de receber respostas, apresente um plano curto de implementação contendo:

- estrutura de pastas;
- principais módulos;
- máquina de estados;
- eventos WebSocket;
- estratégia de FocusGuard;
- estratégia de testes;
- riscos específicos de Safari iOS e rede local.

Não espere aprovação para detalhes triviais. Se não houver mudança material em relação aos documentos, avance para a implementação.

ARQUITETURA DO MVP

Use a arquitetura definida em ARCHITECTURE.md.

Preferência:

- Node.js LTS;
- TypeScript ponta a ponta;
- Fastify;
- Socket.IO;
- Zod;
- React + Vite;
- Tailwind CSS;
- Lucide;
- Vitest;
- Playwright.

A versão de produção deve ser single-origin. O backend serve os arquivos compilados do frontend e os WebSockets na mesma origem.

O comando de uso em sala deve ser muito simples. Meta:

npm install
npm run game

O servidor deve escutar em 0.0.0.0 e detectar IPs privados de LAN.

ROTAS OBRIGATÓRIAS

/host
/screen/:sessionCode
/join/:sessionCode
/play/:sessionCode

HOST

Implemente painel funcional para:

- criar sessão;
- escolher modo 30 minutos;
- configurar política anti-cheat;
- mostrar QR Code;
- listar equipes conectadas;
- iniciar, pausar e avançar fases;
- mostrar respostas e status;
- mostrar ranking;
- visualizar incidentes de integridade;
- desfazer penalidade;
- ajustar pontuação com justificativa;
- finalizar sessão;
- exportar JSON e CSV.

Proteja ações Host com token local temporário. Não exponha esse token na tela pública.

PLAYER

O fluxo deve exigir no máximo:

1. escanear QR;
2. informar nome da equipe;
3. confirmar que este é o único celular da equipe;
4. entrar;
5. ativar modo de foco.

O jogador deve receber apenas a fase e a evidência liberadas. Não envie respostas corretas nem conteúdo futuro ao cliente antes do momento necessário.

SCREEN

A tela do projetor deve ser cinematográfica, clara e segura para exibição pública.

Mostrar:

- HEMOCASE;
- Código Vermelho;
- fase;
- cronômetro;
- narrativa;
- QR no lobby;
- quantidade de respostas recebidas;
- ranking nos momentos adequados;
- revelação final.

Não mostrar respostas das equipes durante uma questão.

CONTEÚDO

Transforme docs/GAME_CONTENT.md em arquivos estruturados sob content/.

O código deve tratar o conteúdo de forma genérica. Não espalhe nomes de doenças e respostas corretas por componentes React.

Implemente todos os trilhos:

A: anemia falciforme
B: beta-talassemia
C: hemofilia A ou B
D: von Willebrand versus Bernard-Soulier

Implemente também:

- desbloqueio molecular;
- Código Relâmpago;
- cadeia final;
- revelação.

Distribua os quatro trilhos de forma equilibrada entre equipes.

MÁQUINA DE ESTADOS

Implemente explicitamente:

LOBBY
FOCUS_CHECK
WARMUP
CASE_INVESTIGATION
BLITZ
FINAL_CHAIN
REVEAL
FINISHED
PAUSED

O relógio oficial e a validade das respostas ficam no servidor.

PONTUAÇÃO

O cliente nunca envia pontos calculados.

O servidor recebe a resposta, valida o prazo, corrige e calcula a pontuação.

Implemente 100 bases no modo padrão:

- warmup: 10
- investigação: 50
- blitz: 20
- cadeia final: 20

Se implementar bônus de tempo, ele nunca pode valer mais de 20% da questão.

ANTI-CHEAT / FOCUSGUARD

Esta parte é obrigatória e deve seguir docs/ANTI_CHEAT.md.

Não prometa segurança impossível.

Implemente:

- aviso claro ao jogador antes de iniciar;
- requestFullscreen quando suportado;
- Screen Wake Lock quando suportado;
- visibilitychange;
- pagehide;
- blur somente como sinal auxiliar;
- heartbeat/reconexão via Socket.IO;
- grace period configurável;
- incidentes info/suspicious/confirmed;
- ZERO_ROUND;
- WARNING;
- OBSERVE_ONLY;
- MANUAL_REVIEW;
- painel Host de incidentes;
- reversão de penalidade;
- log auditável.

Regra padrão:

- hidden < 1000 ms: suspicious;
- hidden >= 1000 ms: confirmed;
- pagehide durante rodada ativa: confirmed;
- blur sozinho: não penaliza;
- disconnect sozinho: não penaliza automaticamente;
- confirmed + ZERO_ROUND: zerar somente a rodada atual.

Ao retornar de uma violação confirmada, o jogador deve ver mensagem neutra e possibilidade de falar com o facilitador.

RECONEXÃO

Crie teamToken aleatório armazenado localmente.

Após refresh ou queda de rede:

- reautenticar a equipe;
- restaurar fase;
- restaurar resposta já enviada;
- restaurar score;
- não permitir resposta duplicada;
- registrar incidente técnico.

DESIGN

Leia docs/UX_BRAND.md com atenção.

O design é uma das estrelas do produto.

A direção visual deve combinar:

- genética;
- hematologia;
- investigação clínica;
- laboratório futurista sóbrio;
- Código Vermelho.

Use um tema escuro premium com vermelho hematologia e ciano molecular como acentos.

Use tokens de design.

Inclua:

- cartões de evidência;
- microanimação de scanner;
- transições de fase;
- DNA como motivo gráfico;
- feedback de pontos;
- pulso de urgência nos últimos 5 segundos;
- reduced motion;
- responsividade real em 360 px.

LAGEM

Se o ativo oficial não existir, use apenas watermark tipográfico LAGEM em baixa opacidade e um motivo genérico de DNA próprio.

Não invente escudo, brasão ou símbolo oficial.

Quando o logo oficial for fornecido, a arquitetura deve permitir substituí-lo em um único local.

OFFLINE EM RUNTIME

Depois de npm install e build, a partida deve funcionar sem buscar:

- Google Fonts;
- CDN de JavaScript;
- imagens remotas;
- APIs externas;
- serviços de analytics;
- OpenAI API.

Todos os assets necessários à partida devem estar no projeto.

Não copie imagens dos slides para o repositório público sem autorização. Crie SVGs didáticos próprios ou placeholders claramente identificados para substituição.

SEGURANÇA

- validar payloads com Zod;
- sanitizar nomes;
- rate limit em join;
- limitar tamanho de payload;
- servidor autoritativo;
- tokens aleatórios;
- não renderizar HTML arbitrário de jogador;
- não expor gabarito antes da hora;
- validar permissões Host.

TESTES

Implemente os testes descritos em docs/TEST_PLAN.md.

No mínimo:

- state machine;
- score engine;
- penalty engine;
- distribuição de casos;
- reconexão;
- submissão duplicada;
- resposta fora do prazo;
- Host authorization;
- E2E reduzido com quatro equipes.

Adicione scripts:

npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
npm run game

DOCUMENTAÇÃO

Ao terminar, atualize README.md com instruções reais e testadas para:

- Windows;
- macOS;
- Linux, se viável;
- firewall;
- descoberta do IP;
- criação da sessão;
- conexão dos celulares;
- uso do projetor;
- troubleshooting.

Crie também um checklist `docs/CLASSROOM_RUNBOOK.md` com preparação 15 minutos antes da aula e execução dos 30 minutos.

CRITÉRIOS DE CONCLUSÃO

Não considere a tarefa concluída com telas estáticas.

A entrega precisa ser uma aplicação funcional de ponta a ponta que permita:

1. iniciar servidor local;
2. criar sessão;
3. mostrar QR;
4. entrar com pelo menos quatro clientes;
5. executar o fluxo do jogo;
6. sincronizar cronômetro;
7. calcular score no servidor;
8. detectar saída da página;
9. aplicar ZERO_ROUND;
10. desfazer penalidade no Host;
11. reconectar uma equipe;
12. exibir ranking;
13. exportar resultado;
14. concluir build e testes.

ANTES DE ENCERRAR

Execute todos os checks disponíveis.

Faça uma revisão visual das principais rotas em viewport móvel e desktop.

Procure por conteúdo médico hardcoded fora de content/.

Procure por respostas corretas expostas prematuramente no bundle ou payload da rodada.

Verifique que o Host é a autoridade do score.

Verifique que FocusGuard não penaliza blur isolado.

Verifique que a UI não depende de internet em runtime.

No relatório final, informe:

- o que foi implementado;
- como executar;
- testes executados e resultados;
- limitações conhecidas, especialmente iOS e anti-cheat;
- perguntas ainda pendentes;
- próximos passos recomendados.
```

## Prompt de continuação após o MVP

Depois que a primeira implementação estiver funcional, pode-se usar:

```text
Leia AGENTS.md e toda a documentação aplicável. Faça uma auditoria do MVP do HEMOCASE como engenheiro sênior, product designer e facilitador de sala de aula.

Não comece reescrevendo a aplicação.

Primeiro execute a suíte de testes, rode a aplicação e inspecione as rotas /host, /screen, /join e /play em desktop e viewport móvel.

Depois produza uma lista priorizada de problemas P0, P1 e P2 nas áreas:

- confiabilidade de rede local;
- reconexão;
- FocusGuard e falsos positivos;
- segurança do score;
- vazamento de respostas;
- tempo total de 30 minutos;
- clareza da UX;
- qualidade visual;
- acessibilidade;
- operação pelo facilitador;
- compatibilidade Android/iOS.

Corrija todos os P0 e P1 que puderem ser resolvidos sem mudar a especificação do produto. Para mudanças de comportamento de jogo, faça perguntas antes.

Atualize testes e documentação. Finalize com um relatório objetivo do que mudou e do que ainda precisa de validação em aparelhos físicos.
```

## Observação sobre o anti-cheat

O objetivo é tornar a pesquisa externa inconveniente, detectável e penalizável. Navegadores não oferecem um modo confiável de impedir totalmente que o usuário troque de aplicativo. O jogo deve comunicar isso de forma correta e fornecer revisão manual pelo facilitador.