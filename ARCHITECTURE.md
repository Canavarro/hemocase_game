# Arquitetura do HEMOCASE

## Objetivo arquitetural

Executar o jogo em uma única máquina anfitriã, dentro da sala de aula, com celulares conectando-se pela rede local através de QR Code. O sistema deve continuar funcional mesmo que a internet externa esteja indisponível.

## Stack recomendada para o MVP

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
- Tailwind CSS
- Lucide Icons

### Testes

- Vitest
- Testing Library
- Playwright

### Persistência

Para o MVP, o estado da partida pode permanecer em memória no servidor. Ao encerrar a sessão, permitir exportar relatório em JSON e CSV.

Se houver necessidade posterior de histórico entre execuções, introduzir SQLite em uma etapa separada.

## Por que uma aplicação de origem única

A versão de produção deve compilar o frontend e ser servida pelo próprio backend no mesmo host e porta. Isso reduz problemas de CORS, simplifica o QR Code e facilita a execução em sala.

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

O comando de produção deve ser simples, por exemplo:

```bash
npm run game
```

Fluxo esperado:

1. buildar o frontend se necessário;
2. iniciar servidor em `0.0.0.0`;
3. detectar interfaces IPv4 privadas válidas;
4. escolher automaticamente a melhor interface quando houver somente uma opção;
5. caso haja mais de uma opção plausível, mostrar seleção no painel Host;
6. criar a sessão;
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

Cada estado deve possuir:

- timestamp de início;
- duração prevista;
- duração restante calculada no servidor;
- conjunto de ações permitidas;
- regras de pontuação;
- política de foco ativa ou inativa.

## Relógio

O relógio oficial fica no servidor.

O cliente recebe sincronizações periódicas e apenas renderiza a contagem regressiva. Nunca decidir fim de rodada apenas com `setTimeout` local.

## Comunicação em tempo real

Use Socket.IO para:

- entrada e saída de equipes;
- progresso das equipes;
- liberação de evidências;
- respostas;
- alteração de fase;
- atualização de placar;
- eventos de foco;
- penalidades;
- reconexão.

Toda mensagem recebida deve ser validada com Zod.

## Identidade de equipe

Ao entrar, o servidor gera:

- `teamId`
- `teamToken` aleatório e não sequencial
- `sessionId`

O `teamToken` é armazenado localmente no aparelho e permite reconexão.

O token não deve conter pontuação ou informações de resposta.

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

O servidor deve distribuir os quatro trilhos de caso de forma equilibrada entre as equipes:

- A: anemia falciforme
- B: beta-talassemia
- C: hemofilia A ou B
- D: von Willebrand versus Bernard-Soulier

Se houver mais de quatro equipes, repetir os trilhos de forma balanceada.

A variante do Caso C pode ser sorteada por sessão ou configurada pelo Host.

## Conteúdo externo à lógica

Criar uma pasta semelhante a:

```text
content/
  game.pt-BR.json
  cases/
    sickle-cell.json
    beta-thalassemia.json
    hemophilia.json
    vwd-bss.json
  blitz.json
```

O código não deve depender de strings específicas das doenças.

## Painel Host

Deve permitir:

- criar sessão;
- exibir QR Code;
- visualizar equipes conectadas;
- iniciar e pausar jogo;
- avançar ou voltar fase quando seguro;
- visualizar respostas e pontuações;
- visualizar eventos de integridade;
- aplicar ou desfazer penalidade;
- ajustar pontos manualmente com justificativa;
- encerrar sessão;
- exportar resultados.

A área Host precisa de segredo temporário gerado ao iniciar o servidor ou autenticação local equivalente.

## Tela do projetor

Não pode revelar respostas antes da fase apropriada.

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

- bind somente nas interfaces locais desejadas;
- painel Host protegido por token;
- sanitização de nome de equipe;
- rate limit para tentativas de entrada;
- limite de tamanho de payload;
- validação de Origin quando aplicável;
- sem execução de HTML fornecido pelos jogadores;
- sem APIs de terceiros durante a partida.

## Compatibilidade mínima

Priorizar:

- Chrome recente em Android
- Safari recente em iOS
- Chrome ou Edge recente no computador Host

Recursos como fullscreen e Wake Lock devem ser implementados com detecção de suporte e fallback, nunca como requisito absoluto para o jogo funcionar.

## Estrutura sugerida do repositório

```text
hemocase_game/
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
```

O Codex pode ajustar detalhes internos sem alterar os limites de produto descritos acima.