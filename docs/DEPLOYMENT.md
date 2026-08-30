# Implantação online

## Render

O arquivo `render.yaml` define uma implantação de origem única no Render. O mesmo processo Node serve frontend, API e Socket.IO.

Implantação:

1. acesse `https://render.com/deploy?repo=https://github.com/Canavarro/hemocase_scape`;
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
