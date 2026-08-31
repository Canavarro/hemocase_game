# Prompt para o Codex: integrar o banco médico ao HEMOCASE

Use este prompt em uma tarefa do Codex no repositório.

---

## PROMPT

Você está trabalhando no projeto **HEMOCASE: Código Vermelho | Do DNA ao Fenótipo**.

Antes de alterar código, leia:

1. `AGENTS.md`
2. `README.md`
3. `ARCHITECTURE.md`
4. `docs/PRODUCT_SPEC.md`
5. `docs/GAME_CONTENT.md`
6. `docs/MEDICAL_KNOWLEDGE_BASE.md`
7. `content/medical-knowledge.pt-BR.json`
8. `content/question-bank.pt-BR.json`
9. `content/game.pt-BR.json`

### Objetivo

Integrar o novo banco canônico de conhecimento médico e perguntas à aplicação sem quebrar o fluxo atual de 30 minutos.

### Requisitos

1. Trate `content/medical-knowledge.pt-BR.json` como fonte canônica de fatos médicos.
2. Trate `content/question-bank.pt-BR.json` como banco canônico de perguntas reutilizáveis.
3. Não envie `correctOptionId`, explicações, pistas futuras ou gabaritos ao cliente antes da fase apropriada.
4. Mantenha correção e pontuação autoritativas no servidor.
5. Permita ao Host escolher:
   - modo fixo de 30 minutos;
   - perguntas por dificuldade;
   - categorias de pergunta;
   - inclusão ou exclusão de doenças de expansão.
6. Preserve como trilhas principais:
   - doença falciforme;
   - β-talassemia;
   - hemofilia A/B;
   - VWD versus Bernard-Soulier.
7. Use as demais doenças em rodada relâmpago e futura expansão.
8. Implemente validação de schema na inicialização do servidor. Se o JSON tiver ID duplicado, resposta sem opção correspondente, doença inexistente ou estrutura inválida, falhe com mensagem clara para o Host/desenvolvedor.
9. Não duplique conteúdo médico dentro de componentes React. Componentes devem receber conteúdo por dados/tipos.
10. Se houver fatos divergentes no conteúdo antigo, normalize-os conforme `docs/MEDICAL_KNOWLEDGE_BASE.md` e documente a mudança.

### UX das pistas

Durante casos investigativos, mostrar evidências em progressão:

`fenótipo → laboratório/morfologia → proteína/processo → gene/variante → diagnóstico`

A pista decisiva deve aparecer mais tarde. A interface deve comunicar visualmente que cada evidência reduz o espaço diagnóstico.

### Questões e distratores

- Prefira distratores do mesmo domínio.
- Evite alternativas absurdas quando houver alternativas clinicamente plausíveis.
- Não faça perguntas que dependam de nomenclatura obscura sem que a informação tenha sido apresentada no jogo/aula.
- Exiba explicação educativa curta após o encerramento da questão.

### Conteúdo que exige cuidado

- VWD tem herança variável por subtipo, portanto não use “sempre autossômica dominante”.
- Hemofilia A e B precisam da dosagem de fator para diferenciação segura no jogo.
- Hb Bart = γ4; HbH = β4.
- Fator V Leiden e F2 20210G>A representam predisposição, não destino clínico certo.
- Bernard-Soulier: GPIb-IX-V/adesão/macroplaquetas.
- Glanzmann: GPIIbIIIa/agregação/plaquetas geralmente de tamanho e contagem normais.
- Wiskott-Aldrich: plaquetas pequenas + eczema + imunodeficiência.

### Entrega

Ao final:

1. rode testes existentes;
2. adicione testes para validação dos bancos;
3. teste pelo menos uma sessão completa com cada trilha principal;
4. teste que o cliente não recebe o gabarito antes da revelação;
5. atualize a documentação caso a arquitetura de conteúdo mude;
6. informe arquivos alterados e decisões tomadas.

Se alguma decisão de produto realmente não estiver documentada, faça perguntas objetivas antes de implementar. Não interrompa por questões já resolvidas nos arquivos.

---
