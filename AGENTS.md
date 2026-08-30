# AGENTS.md

Este arquivo é o mapa de trabalho para agentes de código neste repositório. As especificações detalhadas ficam em `docs/`.

## Ordem de leitura obrigatória

Antes de alterar código ou arquitetura, leia:

1. `README.md`
2. `ARCHITECTURE.md`
3. `docs/PRODUCT_SPEC.md`
4. `docs/GAME_CONTENT.md`
5. `docs/ANTI_CHEAT.md`
6. `docs/UX_BRAND.md`
7. `docs/TEST_PLAN.md`

Para a primeira implementação, leia também `docs/CODEX_BOOTSTRAP_PROMPT.md`.

## Fonte de verdade

- Regras do produto: `docs/PRODUCT_SPEC.md`
- Conteúdo do jogo: `docs/GAME_CONTENT.md`
- Integridade e penalidades: `docs/ANTI_CHEAT.md`
- Interface, design e marca: `docs/UX_BRAND.md`
- Arquitetura: `ARCHITECTURE.md`
- Critérios de validação: `docs/TEST_PLAN.md`

Em caso de conflito, pare e peça esclarecimento em vez de inventar comportamento.

## Regras de engenharia

- Use TypeScript em frontend, backend e tipos compartilhados.
- O MVP deve funcionar em rede local sem depender de internet durante a partida.
- O servidor é a autoridade de estado, tempo, respostas aceitas, penalidades e pontuação.
- Nunca confie em valores de pontuação enviados pelo cliente.
- Valide mensagens de rede com schemas compartilhados.
- Trate reconexão como requisito de primeira classe.
- Separe conteúdo científico da lógica do jogo.
- Mantenha perguntas, alternativas, respostas e explicações em arquivos de conteúdo estruturado.
- Não codifique conteúdo médico diretamente dentro de componentes de UI.
- Não adicione serviços externos, analytics ou APIs em nuvem no MVP sem autorização explícita.
- Não invente logomarca da LAGEM. Use o ativo oficial quando fornecido; na ausência, use placeholder textual neutro.
- Não prometa bloqueio absoluto contra pesquisa externa. Implemente o modelo de detecção e penalidade documentado.

## Qualidade mínima antes de concluir uma tarefa

Execute, quando existentes:

- lint;
- typecheck;
- testes unitários;
- testes de integração;
- build de produção;
- testes E2E relevantes.

Se algum teste não puder ser executado, informe claramente o motivo.

## Mudanças de arquitetura

Não substitua a arquitetura definida apenas por preferência pessoal. Caso identifique limitação concreta, documente a alternativa, impacto, migração e peça aprovação quando a mudança alterar fluxo de sala, rede, anti-cheat, persistência ou experiência dos jogadores.

## Experiência do jogador

O celular é compartilhado pela equipe. A interface deve:

- funcionar bem em telas pequenas;
- exigir poucos toques;
- manter texto legível;
- evitar rolagens longas durante rodadas cronometradas;
- mostrar estado de conexão e foco de forma discreta;
- impedir envio duplicado de resposta;
- recuperar sessão após reconexão quando possível.

## Privacidade

No MVP, colete apenas o necessário para a partida, por exemplo nome da equipe, identificador técnico da sessão e eventos de integridade. Não solicitar nome completo, e-mail, matrícula, telefone ou dados de saúde.