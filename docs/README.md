# Índice da documentação

Este diretório reúne produto, conteúdo científico, implementação, operação e validação do HEMOCASE. A documentação está dividida por público para evitar que uma decisão técnica seja confundida com uma regra pedagógica.

## Para operar a atividade

- `CLASSROOM_RUNBOOK.md`: preparação, execução, contingências e encerramento em sala.
- `USER_GUIDE.md`: telas, controles, fases e comportamento esperado para Host e equipes.
- `PRODUCT_SPEC.md`: objetivo, papéis, fluxo de 30 minutos, pontuação e critérios de produto.
- `GAME_CONTENT.md`: fonte editorial detalhada das perguntas e explicações científicas.
- `ANTI_CHEAT.md`: política de foco, classificação de eventos, penalidades e limites técnicos.

## Para desenvolver e manter

- `DEVELOPMENT.md`: instalação, comandos, estrutura do monorepo, variáveis de ambiente e fluxo de alteração.
- `API_PROTOCOL.md`: endpoints HTTP, eventos Socket.IO, autenticação e formato dos snapshots.
- `CONTENT_AUTHORING.md`: edição segura de perguntas, trilhos, pontos e conteúdo estruturado.
- `ASSETS.md`: vídeo, logo LAGEM, tratamento visual e regras para substituir ativos.
- `IMPLEMENTATION_STATUS.md`: funcionalidades entregues, limitações conhecidas e backlog técnico.
- `TEST_REPORT.md`: testes existentes, comandos, cobertura e pendências de validação.

## Planejamento aprovável

- `ESCAPE_MODE_SPEC.md`: planejamento completo da segunda modalidade (escape room "Protocolo Hélix"): salas, enigmas, curadoria de conteúdo pelo professor, viabilidade, riscos e roadmap. Aguarda aprovação antes da implementação.

## Direção visual e histórica

- `UX_BRAND.md`: design, identidade LAGEM, abertura audiovisual e comportamento responsivo.
- `CODEX_BOOTSTRAP_PROMPT.md`: briefing histórico usado para iniciar a primeira implementação. Não substitui o código nem o estado atual documentado.

## Documentos na raiz

- `README.md`: visão geral e início rápido.
- `ARCHITECTURE.md`: arquitetura atual, fronteiras de autoridade e decisões estruturais.
- `AGENTS.md`: ordem obrigatória de leitura e regras para agentes de código.

## Precedência

Em caso de dúvida:

1. comportamento médico e pedagógico: `GAME_CONTENT.md` e `PRODUCT_SPEC.md`;
2. integridade: `ANTI_CHEAT.md`;
3. comportamento implementado: código, `ARCHITECTURE.md` e `API_PROTOCOL.md`;
4. operação em sala: `CLASSROOM_RUNBOOK.md`;
5. diferenças entre especificação e código: `IMPLEMENTATION_STATUS.md`.

Conflitos científicos ou mudanças no fluxo de sala devem ser aprovados antes da alteração do código.
