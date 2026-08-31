# Implantação online

## Render

O arquivo `render.yaml` define uma implantação de origem única no Render. O mesmo processo Node serve frontend, API e Socket.IO.

Implantação:

1. acesse `https://render.com/deploy?repo=https://github.com/Canavarro/genetic_game`;
2. autorize o Render a ler o repositório;
3. confirme o Blueprint;
4. aguarde o health check em `/api/health`;
5. abra a URL do serviço acrescentando `/host`.

Os jogadores não precisam de conta. O QR Code usa automaticamente `RENDER_EXTERNAL_HOSTNAME`, portanto aponta para o domínio HTTPS público do serviço.

## Limitações do plano gratuito

- o serviço pode suspender após um período sem tráfego;
- a primeira abertura após a suspensão pode demorar;
- o estado das partidas fica em memória e é perdido quando a instância reinicia ou suspende;
- uma partida em andamento não deve ser interrompida por deploy manual.

Para um ensaio, abra o Host alguns minutos antes e crie uma sessão nova. Para uso contínuo ou retenção entre reinícios, use uma instância sem suspensão e adicione persistência antes do evento oficial.

## Outras plataformas

Em qualquer host Node compatível:

- build: `npm ci && npm run build`;
- start: `npm run start -w @hemocase/server`;
- health check: `/api/health`;
- porta: variável `PORT` fornecida pela plataforma;
- URL pública: variável `PUBLIC_URL`, quando a plataforma não fornecer `RENDER_EXTERNAL_HOSTNAME`.

O proxy deve aceitar conexões WebSocket no mesmo domínio da aplicação.

## Nome do repositório

O repositório foi renomeado de `hemocase_scape` para **`genetic_game`** (GitHub redireciona a URL antiga, mas atualize seus remotes: `git remote set-url origin https://github.com/Canavarro/genetic_game`). O `name: hemocase-scape` do `render.yaml` foi mantido de propósito: ele identifica o serviço existente no Render (`srv-daac15lg1s2s73coato0`), e mudá-lo faria o blueprint criar um serviço novo em vez de atualizar o atual. Confirme no dashboard do Render (Settings → Repository) que o serviço passou a apontar para `Canavarro/genetic_game` — o app do GitHub costuma seguir o rename sozinho.

## Banco de dados (Neon · Lakebase Postgres)

A persistência é **opcional**: sem `DATABASE_URL`, o jogo roda 100% em memória como sempre. Com ela, o servidor cria o schema sozinho na inicialização, grava cada sessão encerrada (`game_sessions` + `team_results`) e passa a servir `GET /api/rankings?limit=20`. Falha de banco nunca derruba o jogo — ele loga e segue em memória.

Vínculo do projeto:

- Organização **LAGEM** (`org-late-hall-61778496`), projeto **LAGEM** (`rapid-glitter-95673289`);
- o arquivo `.neon` na raiz (commitado de propósito — os IDs não são segredos) já vincula o workspace; com o CLI autenticado, `neon env pull` preenche o `.env` local;
- `.mcp.json` registra o servidor MCP do Neon (`https://mcp.neon.tech/mcp`) para agentes;
- as skills do Neon vivem em `.agents/skills/` (atualize com `npx skills update`).

Para ativar em produção (Render): defina `DATABASE_URL` no serviço (`srv-...` → Environment) com a connection string **pooled** do branch de produção do projeto LAGEM. O Neon suspende o compute ocioso e acorda sozinho na primeira conexão — não precisa de keep-alive.

Para agentes (Claude) operarem o Neon: o ambiente precisa de `NEON_API_KEY` (variável) e da liberação de rede para `console.neon.tech`, `mcp.neon.tech` e `*.neon.tech`.
