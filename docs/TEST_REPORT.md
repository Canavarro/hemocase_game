# Relatório de validação

Data da última execução documentada: 30 de agosto de 2026.

## Resultado

| Gate | Resultado |
|---|---|
| `npm run lint` | Passou |
| `npm run typecheck` | Passou |
| `npm test` | Passou, 10 testes |
| `npm run build` | Passou |
| `npm audit --omit=dev` | Passou, 0 vulnerabilidades |
| `npm run test:integration` | Passou |
| `npm run test:e2e` | Não executado nesta sessão |

## Testes unitários

Servidor, sete testes:

- distribuição equilibrada dos quatro trilhos;
- reconexão sem duplicar equipe;
- transição de estados e relógio oficial;
- resposta única e bônus limitado a 20%;
- recusa após prazo;
- penalidade ZERO_ROUND e reversão;
- blur isolado sem penalidade automática.

Shared, dois testes:

- normalização de código e limite de nome;
- rejeição de resposta sem token e duração inválida de integridade.

Frontend, um teste:

- formatação do relógio, incluindo arredondamento e limite zero.

## Teste integrado

`tests/session-flow.mjs` usa HTTP e Socket.IO reais contra o servidor em execução. Valida:

1. criação de sessão;
2. proteção de exportação sem token;
3. entrada de equipe;
4. conexão Host;
5. avanço até WARMUP;
6. submissão válida;
7. rejeição de duplicata;
8. desconexão e restauração por token;
9. exportação autenticada e score persistido em memória.

Última sessão integrada registrada na execução final: `ECB216`.

## Playwright

`apps/web/e2e/session.spec.ts` cobre:

- Host, projetor e equipe em contextos separados;
- entrada da equipe pelo formulário;
- renderização do QR;
- avanço para foco e aquecimento;
- submissão e bloqueio da resposta;
- rejeição de exportação sem token.

A execução visual não ocorreu porque nenhum navegador automatizado estava conectado/disponível no ambiente da sessão. O teste permanece versionado e deve ser executado antes do piloto real:

```bash
npx playwright install chromium webkit
npm run build
npm run test:e2e
```

## Testes manuais ainda necessários

- Android Chrome real;
- iPhone Safari real;
- projeção em resolução e distância da sala;
- áudio no sistema de som do evento;
- fullscreen e Wake Lock em aparelhos representativos;
- queda e retorno do Wi-Fi;
- 8 ou mais celulares simultâneos;
- ensaio completo de 30 minutos;
- legibilidade das animações com `prefers-reduced-motion`.

Os critérios detalhados permanecem em `docs/TEST_PLAN.md`.
