# Desenvolvimento e manutenção

## Requisitos

- Node.js 20 ou superior;
- npm 10 ou superior;
- Windows, macOS ou Linux;
- rede local para ensaios com celulares;
- Chrome ou Edge no Host e Chrome Android/Safari iOS nos jogadores.

Nenhuma conexão com internet é necessária durante uma partida depois que dependências e build estiverem disponíveis.

## Instalação

Na raiz do repositório:

```bash
npm install
```

O projeto usa npm workspaces. Não execute instalações separadas dentro de `apps/server`, `apps/web` ou `packages/shared`.

## Comandos

| Comando | Finalidade |
|---|---|
| `npm run dev` | Compila o pacote compartilhado e inicia servidor e Vite com recarga automática. |
| `npm run build` | Compila shared, frontend e backend na ordem correta. |
| `npm run game` | Faz o build e inicia a aplicação single-origin na porta 3000. |
| `npm run lint` | Executa ESLint sobre TypeScript, TSX, JavaScript e MJS. |
| `npm run typecheck` | Recompila tipos compartilhados e verifica todos os workspaces. |
| `npm test` | Executa testes Vitest de servidor, frontend e schemas. |
| `npm run test:integration` | Testa o fluxo HTTP/WebSocket contra um servidor já iniciado. |
| `npm run test:e2e` | Executa os cenários Playwright configurados para desktop e mobile. |

Para E2E em uma máquina nova:

```bash
npx playwright install chromium webkit
npm run build
npm run test:e2e
```

## Desenvolvimento local

`npm run dev` inicia:

- backend em `http://127.0.0.1:3000`;
- Vite em `http://127.0.0.1:5173`;
- proxy de `/api` e `/socket.io` do Vite para o backend.

Na produção, o backend serve `apps/web/dist` e todas as rotas usam a porta 3000.

## Variáveis de ambiente

| Variável | Padrão | Uso |
|---|---|---|
| `PORT` | `3000` | Porta HTTP e Socket.IO. |
| `HOST_IP` | detecção automática | IPv4 incluído no QR Code e nas URLs de entrada. |
| `PUBLIC_URL` | `http://HOST_IP:PORT` | URL pública completa quando há proxy ou configuração especial. |
| `TEST_BASE_URL` | `http://127.0.0.1:3000` | Base usada por `tests/session-flow.mjs`. |

PowerShell:

```powershell
$env:HOST_IP = "192.168.1.20"
npm run game
```

Bash:

```bash
HOST_IP=192.168.1.20 npm run game
```

## Estrutura

```text
apps/server/           Fastify, Socket.IO e motor autoritativo
apps/web/              React, Vite e as quatro superfícies de interface
packages/shared/       tipos, schemas Zod e contratos de rede
content/               perguntas carregadas em runtime
assets/                ativos-fonte recebidos pelo projeto
docs/                  produto, operação e referência técnica
tests/                 fluxo integrado externo ao servidor
```

Arquivos principais:

- `apps/server/src/index.ts`: bootstrap HTTP, endpoints e eventos Socket.IO;
- `apps/server/src/game-engine.ts`: sessões, fases, respostas, score e integridade;
- `apps/web/src/App.tsx`: roteamento das superfícies;
- `apps/web/src/pages/HostPage.tsx`: console do facilitador;
- `apps/web/src/pages/ScreenPage.tsx`: projeção pública;
- `apps/web/src/pages/JoinPage.tsx`: entrada da equipe;
- `apps/web/src/pages/PlayPage.tsx`: experiência competitiva e FocusGuard;
- `apps/web/src/components/BrandBackground.tsx`: fundo animado LAGEM/DNA;
- `apps/web/src/components/StingerOverlay.tsx`: transição curta entre fases;
- `apps/web/src/components/RevealCinema.tsx`: player da revelação final;
- `apps/web/src/remotion/compositions.tsx`: composições Remotion locais;
- `content/game.pt-BR.json`: conteúdo consumido pelo motor.

## Fluxo de uma alteração

1. Leia `AGENTS.md` e os documentos associados à mudança.
2. Altere contratos em `packages/shared` antes de consumidores.
3. Mantenha conteúdo médico em `content/`, nunca em componentes React.
4. Recompile shared com `npm run build -w @hemocase/shared` quando contratos mudarem.
5. Adicione ou atualize testes proporcionais ao risco.
6. Execute lint, typecheck, testes, build e integração.
7. Atualize `IMPLEMENTATION_STATUS.md` se o comportamento entregue mudar.

## Estado local e persistência

Sessões ficam somente na memória do processo Node. Reiniciar o servidor elimina equipes, tokens, respostas, incidentes e placar. Exporte JSON/CSV antes de encerrar uma atividade.

Não há banco de dados, PWA, serviço em nuvem, analytics ou autenticação externa no MVP.
