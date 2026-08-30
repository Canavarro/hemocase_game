# Estado da implementação

Versão documentada: `0.1.0`.

## Entregue

| Área | Estado | Observação |
|---|---|---|
| Monorepo TypeScript | Completo | npm workspaces para server, web e shared. |
| Produção single-origin | Completo | Fastify serve frontend e Socket.IO na porta 3000. |
| Rede local | Completo | Bind em `0.0.0.0`, detecção de IPv4 e override por ambiente. |
| Sessões | Completo | Código hexadecimal, token Host e estado em memória. |
| QR Code | Completo | PNG gerado localmente com URL da equipe. |
| Entrada e reconexão | Completo | `teamToken` persistido em `localStorage`. |
| Máquina de estados | Completo | Lobby, foco, fases competitivas, revelação, final e pausa. |
| Relógio autoritativo | Completo | Servidor calcula prazo e avança automaticamente. |
| Conteúdo externo | Completo | Perguntas em `content/game.pt-BR.json`. |
| Distribuição de casos | Completo | A–D balanceados; variante A/B de hemofilia por sessão. |
| Respostas | Completo | Validação de fase, prazo, alternativa e duplicidade. |
| Pontuação | Completo | Base + bônus limitado a 20%, calculado no servidor. |
| Integridade | Completo | Detecção, classificação, política e reversão pelo Host. |
| Painel Host | Completo | Avançar, voltar, pausar, retomar, resetar, encerrar e ajustar score. |
| Projetor | Completo | Abertura, lobby, missão, progresso, revelação e ranking. |
| Mobile | Completo | Entrada, foco, pergunta, espera, pausa e resultado. |
| Motion design | Completo | Transições Remotion sob demanda, cronômetro circular e animações com redução de movimento. |
| Exportação | Completo | JSON detalhado e CSV resumido. |
| Offline | Completo | Sem dependências de runtime externas. |
| Identidade LAGEM/DNA | Completo | Fundo global animado e redução de movimento. |

## Parcial

| Área | Situação atual | Próxima melhoria |
|---|---|---|
| Seleção de interface de rede | Heurística prioriza Wi-Fi/Ethernet e evita adaptadores virtuais. | Interface Host para escolher entre múltiplos IPv4. |
| Configuração de duração | Durações ficam no conteúdo e no motor. | Controles Host para presets e edição segura. |
| Validação de conteúdo | JSON é parseado e tipado, sem schema runtime completo. | Schema Zod de `GameContent` com mensagens editoriais. |
| Registro de ajustes | Ajustes entram na exportação JSON. | Exibir histórico de ajustes no painel. |
| FocusGuard | Detecta sinais disponíveis no navegador. | Testes ampliados em aparelhos reais e telemetria de heartbeat. |

## Não implementado no MVP

- persistência SQLite e histórico entre reinícios;
- cadastro de usuários, e-mail ou autenticação institucional;
- seleção manual de IP no painel;
- PWA e instalação no aparelho;
- heartbeat dedicado além da conexão Socket.IO;
- rate limit específico por IP para criação/entrada;
- validação explícita de Origin;
- legendas WebVTT para o vídeo;
- painel editorial para perguntas;
- internacionalização além de pt-BR;
- analytics ou serviços em nuvem.

## Limites conhecidos

- reiniciar o servidor apaga toda sessão em andamento;
- o navegador não consegue impedir pesquisa externa de forma absoluta;
- fullscreen e Wake Lock dependem de suporte e permissão do navegador;
- `pagehide` pode ocorrer em navegação/recarregamento legítimo e deve permanecer reversível;
- o QR Code usa o endereço detectado no momento da criação da sessão;
- score com bônus pode ultrapassar as 100 bases pedagógicas;
- o painel Host existe somente no navegador que mantém o token em `sessionStorage`;
- não há remoção individual de equipe no MVP.

## Critérios antes de uso oficial

1. Revisão científica do JSON pelo professor/Liga.
2. Ensaio real de 30 minutos.
3. Teste do vídeo e áudio no computador do evento.
4. Teste de QR em Android e iPhone na rede escolhida.
5. Repetição do Playwright na máquina que será usada no evento.
6. Conferência do firewall e do IPv4 exibido.
7. Exportação de uma sessão simulada.
