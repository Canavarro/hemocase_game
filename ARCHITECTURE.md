# Arquitetura do HEMOCASE

## Estado

Esta arquitetura está implementada na versão `0.1.0`. Diferenças entre especificação, implementação parcial e backlog estão registradas em `docs/IMPLEMENTATION_STATUS.md`. Contratos de rede estão em `docs/API_PROTOCOL.md`.

## Objetivo arquitetural

Executar o jogo em uma única máquina anfitriã, dentro da sala de aula, com celulares conectando-se pela rede local através de QR Code. O sistema deve continuar funcional mesmo que a internet externa esteja indisponível.

## Stack implementada

### Backend

- Node.js LTS
- TypeScript
- Fastify
- Socket.IO
- Zod
- QRCode

### Frontend

- React
- Vite
- TypeScript
- CSS local com tokens e responsividade
- Lucide Icons

### Testes

- Vitest
- Playwright

### Persistência

O estado da partida permanece em memória no servidor. Ao encerrar a sessão, o Host pode exportar relatório em JSON e CSV.

Se houver necessidade posterior de histórico entre execuções, introduzir SQLite em uma etapa separada.

## Por que uma aplicação de origem única

A versão de produção compila o frontend e é servida pelo próprio backend no mesmo host e porta. Isso reduz problemas de CORS, simplifica o QR Code e facilita a execução em sala.

Exemplo:

`http://192.168.0.25:3000`

Rotas:

- `/host`: painel privado do facilitador
- `/screen/:sessionCode`: tela pública para projetor
- `/join/:sessionCode`: entrada de equipe
- `/play/:sessionCode`: experiência do jogador

## Topologia

```text
                    PROJETOR
                       |
                       v
             /screen/:sessionCode
                       |
                       |
CELULAR 1 --->         |
CELULAR 2 --->   SERVIDOR LOCAL   <--- PAINEL HOST
CELULAR 3 --->   Node + WebSocket       /host
CELULAR N --->         |
                       |
                  Estado da sessão
                  Pontuação
                  Temporização
                  Anti-cheat
```

## Inicialização da partida

O comando de produção é:

```bash
npm run game
```

Fluxo implementado:

1. compilar shared, frontend e backend;
2. iniciar servidor em `0.0.0.0`;
3. detectar interfaces IPv4 privadas válidas;
4. priorizar Wi-Fi/Ethernet e rebaixar interfaces virtuais;
5. permitir override por `HOST_IP` ou `PUBLIC_URL`;
6. criar a sessão no painel Host;
7. exibir URL local e QR Code;
8. permitir ao facilitador testar a conectividade antes de liberar a turma.

## Estado da sessão

O backend mantém uma máquina de estados explícita.

Estados mínimos:

- `LOBBY`
- `FOCUS_CHECK`
- `WARMUP`
- `CASE_INVESTIGATION`
- `BLITZ`
- `FINAL_CHAIN`
- `REVEAL`
- `FINISHED`
- `PAUSED`

O estado interno registra:

- timestamp e duração quando há relógio ativo;
- duração restante preservada durante `PAUSED`;
- índice da questão atual;
- política de integridade da sessão;
- respostas, score e incidentes sob autoridade do servidor.

## Relógio

O relógio oficial fica no servidor.

O cliente recebe sincronizações periódicas e apenas renderiza a contagem regressiva. Nunca decidir fim de rodada apenas com `setTimeout` local.

## Comunicação em tempo real

Socket.IO é usado para:

- entrada e saída de equipes;
- progresso das equipes;
- liberação de evidências;
- respostas;
- alteração de fase;
- atualização de placar;
- eventos de foco;
- penalidades;
- reconexão.

Toda mensagem de ação recebida por Socket.IO é validada com Zod. O protocolo completo está em `docs/API_PROTOCOL.md`.

## Identidade de equipe

Ao entrar, o servidor gera:

- `teamId`
- `teamToken` aleatório e não sequencial
- `sessionId`

O `teamToken` é armazenado localmente no aparelho e permite reconexão.

O token não contém pontuação ou informações de resposta.

## Autoridade do servidor

O servidor decide:

- em qual fase a partida está;
- qual conteúdo a equipe pode visualizar;
- se a resposta foi recebida dentro do prazo;
- se a resposta está correta;
- qual pontuação foi obtida;
- se ocorreu penalidade;
- se uma penalidade foi anulada pelo facilitador.

O cliente envia apenas ações e respostas.

## Distribuição de casos

O servidor distribui os quatro trilhos de caso de forma equilibrada entre as equipes:

- A: anemia falciforme
- B: beta-talassemia
- C: hemofilia A ou B
- D: von Willebrand versus Bernard-Soulier

Se houver mais de quatro equipes, os trilhos são repetidos de forma balanceada.

A variante do Caso C é sorteada por sessão. Configuração manual pelo Host permanece no backlog.

## Conteúdo externo à lógica

O conteúdo executável está em:

```text
content/
  game.pt-BR.json
```

O código não depende de strings médicas específicas. Regras editoriais estão em `docs/CONTENT_AUTHORING.md`.

## Painel Host

O painel permite:

- criar sessão;
- exibir QR Code;
- visualizar equipes conectadas;
- iniciar e pausar jogo;
- avançar ou voltar fase quando seguro;
- visualizar respostas e pontuações;
- visualizar eventos de integridade;
- acompanhar e desfazer penalidade automática;
- ajustar pontos manualmente com justificativa;
- encerrar sessão;
- exportar resultados.

A área Host usa um segredo aleatório por sessão, guardado em `sessionStorage`.

## Tela do projetor

A tela não revela respostas antes da fase apropriada.

Exibe:

- nome da fase;
- cronômetro;
- narrativa da missão;
- ranking quando permitido;
- equipes conectadas;
- animações de transição;
- revelação final.

## Reconexão

Ao perder conexão:

1. a UI informa `Reconectando...`;
2. mantém a última tela sem permitir novas submissões não confirmadas;
3. tenta reconectar automaticamente;
4. envia `teamToken` ao servidor;
5. servidor restaura fase, conteúdo liberado, respostas já enviadas e pontuação;
6. evento de desconexão entra no log de integridade.

A política de penalidade por desconexão está em `docs/ANTI_CHEAT.md`.

## Segurança local

Implementado:

- bind em `0.0.0.0` para permitir acesso pela LAN;
- painel Host protegido por token aleatório;
- sanitização e limite de nome de equipe;
- payload HTTP e Socket.IO limitado a 64 KiB;
- React escapa nomes fornecidos pelos jogadores;
- nenhuma API de terceiros durante a partida;
- resposta correta removida do payload da questão.

Pendente:

- rate limit específico por IP;
- validação explícita de Origin;
- seleção de interfaces permitidas em vez de bind global.

## Compatibilidade mínima

Compatibilidade priorizada:

- Chrome recente em Android
- Safari recente em iOS
- Chrome ou Edge recente no computador Host

Fullscreen e Wake Lock usam detecção de suporte e fallback e não são requisitos para o jogo funcionar.

## Estrutura do repositório

```text
hemocase_scape/
  AGENTS.md
  ARCHITECTURE.md
  README.md
  package.json
  apps/
    server/
    web/
  packages/
    shared/
  content/
  docs/
  tests/
  assets/
```

Mudanças de arquitetura devem preservar os limites de produto descritos em `AGENTS.md`.
