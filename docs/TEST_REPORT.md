# Relatório de validação

Data da última execução documentada: 31 de agosto de 2026.

## Resultado

| Gate | Resultado |
|---|---|
| `npm run lint` | Passou |
| `npm run typecheck` | Passou |
| `npm test` | Passou, 115 testes (112 servidor, 1 web, 2 shared) |
| `npm run build` | Passou |
| `npm audit --omit=dev` | Passou, 0 vulnerabilidades |
| `npm run test:integration` | Passou |
| `npm run test:e2e` | Passou, 4 cenários em desktop e mobile (Chromium) |

## Testes unitários

Servidor (112 testes), destaques:

- máquina de estados, trilhos, reconexão, prazos, ZERO_ROUND e reversão;
- modo Escape: pontuação, dicas em ordem, trava do cofre, revisão de salas com custo, prontuário obrigatório, fuga com bônus de tempo;
- gerador de casos: estrutura completa por doença, determinismo por seed, arquivos de emergência dentro dos tópicos, enigmas de girar sem resposta no primeiro giro;
- conteúdo médico: validação dos bancos canônicos, precedência do `medicalId`, BLITZ pelo banco de questões;
- **auditoria de continuidade** (`full-playthrough.test.ts`): para TODAS as doenças instaladas × 12 seeds (204 partidas), valida estrutura do caso gerado (sem alternativas duplicadas por id OU texto, lâminas com IDs únicos e morfologias distintas, resposta nunca no primeiro giro) e joga a partida INTEIRA no motor real até a fuga, provando que gabarito e validação nunca divergem; cruza ainda locus/herança de cada perfil com o banco médico canônico.

Shared, dois testes: normalização de código/nome e rejeições de payload. Frontend, um teste: formatação do relógio.

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

## Playwright

`apps/web/e2e/session.spec.ts` cobre:

- Host, projetor e equipe em contextos separados;
- entrada da equipe pelo formulário;
- renderização do QR;
- avanço para foco e aquecimento;
- submissão e bloqueio da resposta;
- rejeição de exportação sem token.

Os dois projetos (desktop e mobile) rodam em Chromium — o mobile emula iPhone 13 (viewport + toque). Em uma máquina nova:

```bash
npx playwright install chromium
npm run build
npm run test:e2e
```

Em ambientes gerenciados com Chromium pré-instalado (sem download do Playwright), aponte o binário com `PW_CHROMIUM_PATH=/caminho/do/chrome npm run test:e2e`.

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
