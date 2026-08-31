# Referência HTTP e Socket.IO

## Princípios

- backend e frontend compartilham a mesma origem em produção;
- o servidor é autoridade para fase, tempo, conteúdo liberado, resposta aceita, score e penalidade;
- payloads recebidos por Socket.IO são validados com schemas Zod compartilhados;
- respostas corretas e explicações não fazem parte de `ClientQuestion`;
- Host usa `hostToken`; equipe usa `teamToken` aleatório e não sequencial;
- tokens não contêm score nem respostas.

## HTTP

### `GET /api/health`

Verifica disponibilidade e informa endereço detectado.

Resposta `200`:

```json
{ "ok": true, "lanIp": "192.168.1.20", "port": 3000 }
```

### `POST /api/sessions`

Cria uma sessão em memória.

Corpo opcional:

```json
{ "integrityPolicy": "ZERO_ROUND" }
```

Resposta `201`:

```json
{
  "code": "A1B2C3",
  "hostToken": "token-aleatorio",
  "joinUrl": "http://192.168.1.20:3000/join/A1B2C3",
  "screenUrl": "http://192.168.1.20:3000/screen/A1B2C3"
}
```

O código possui seis caracteres hexadecimais maiúsculos. O token Host deve permanecer somente no computador facilitador.

### `GET /api/sessions/:code/public`

Retorna snapshot público sem respostas corretas. Responde `404` quando a sessão não existe.

### `GET /api/sessions/:code/qr`

Retorna PNG com o `joinUrl` da sessão. O endereço é calculado na criação; mudar a interface de rede depois exige nova sessão ou reinício com `HOST_IP`.

### `GET /api/sessions/:code/export`

Parâmetros:

- `token`: `hostToken` obrigatório;
- `format=csv`: exporta CSV com BOM UTF-8;
- sem `format`: exporta JSON completo.

Respostas: `200` no sucesso e `401` para token inválido.

## Rotas da aplicação

| Rota | Público | Função |
|---|---|---|
| `/host` | Facilitador | Criação e controle da sessão. |
| `/screen/:code` | Projetor | Abertura audiovisual, QR, missão, progresso e ranking. |
| `/join/:code` | Equipe | Nome e confirmação de aparelho compartilhado. |
| `/play/:code` | Equipe autenticada | Rodadas, respostas, foco e resultado. |

Rotas desconhecidas que não começam por `/api/` recebem `index.html` para suportar recarga direta.

## Socket.IO

Todos os eventos com confirmação retornam `{ ok: true, ... }` ou `{ ok: false, error }`.

### Cliente para servidor

#### `session:join`

Nova equipe:

```json
{ "code": "A1B2C3", "name": "Equipe HBB" }
```

Reconexão:

```json
{ "code": "A1B2C3", "teamToken": "token-da-equipe" }
```

O servidor sanitiza `<` e `>`, comprime espaços, limita nomes a 2–24 caracteres, evita nomes duplicados e distribui trilhos de forma balanceada.

#### `session:watch`

```json
{
  "code": "A1B2C3",
  "role": "host",
  "hostToken": "token-host"
}
```

Papéis: `host`, `screen` ou `team`. Host exige `hostToken`; team exige `teamToken`.

#### `answer:submit`

```json
{
  "code": "A1B2C3",
  "teamToken": "token-da-equipe",
  "questionId": "W1",
  "choiceId": "A"
}
```

O servidor rejeita questão inativa, alternativa inexistente, prazo encerrado e segunda submissão da mesma equipe.

#### `integrity:event`

```json
{
  "code": "A1B2C3",
  "teamToken": "token-da-equipe",
  "type": "visibility_hidden",
  "hiddenDurationMs": 1250
}
```

Tipos aceitos: `visibility_hidden`, `pagehide`, `blur`, `disconnect`.

#### `host:action`

Ações sem campos extras: `advance`, `back`, `pause`, `resume`, `reset`, `finish`.

Política:

```json
{ "code": "A1B2C3", "hostToken": "...", "action": "setPolicy", "policy": "ZERO_ROUND" }
```

Reversão:

```json
{ "code": "A1B2C3", "hostToken": "...", "action": "reverseIncident", "incidentId": "uuid", "reason": "Saída autorizada" }
```

Ajuste manual:

```json
{ "code": "A1B2C3", "hostToken": "...", "action": "adjustScore", "teamId": "uuid", "delta": 5, "reason": "Correção do facilitador" }
```

`delta` aceita inteiros de -100 a 100 e nunca reduz score abaixo de zero.

### Servidor para cliente

#### `session:update`

Emitido após entrada, resposta, ação Host, incidente, conexão/desconexão e a cada segundo durante relógios ativos.

Campos principais de `SessionSnapshot`:

- `code`, `phase`, `phaseLabel`;
- `remainingMs`, `questionIndex`, `questionCount`;
- `teams`, com conexão, score e estado de resposta;
- `question`, sem gabarito;
- dados privados da equipe somente no socket autenticado;
- `incidents` somente para Host;
- `reveal` somente em `REVEAL` e `FINISHED`.

## Armazenamento no navegador

- Host: `sessionStorage` com `hemocase:host-code` e `hemocase:host-token`;
- equipe: `localStorage` com `hemocase:team:CODIGO`;
- projetor: `sessionStorage` marca a transmissão já assistida por sessão.

Limpar esses valores remove a credencial local, mas não altera a sessão no servidor.

## Modo Escape (Protocolo Hélix)

### Criação de sessão

### Código Relâmpago pelo banco canônico (modo QUIZ)

`POST /api/sessions` com `mode: "QUIZ"` aceita o campo opcional `blitz`:

```json
{ "mode": "QUIZ", "blitz": { "source": "bank", "difficulties": ["medium", "hard"], "categories": ["genetics", "differential"], "includeExpansion": true, "count": 7 } }
```

- `source: "script"` (padrão) mantém o roteiro fixo de 30 minutos;
- `source: "bank"` sorteia a fase BLITZ de `content/question-bank.pt-BR.json` (fonte canônica), com pontuação do próprio banco (fácil 5, média 8, difícil 12) e duração por dificuldade (20/30/40 s);
- `difficulties`/`categories` vazios ou ausentes = todas; `includeExpansion: false` restringe às trilhas principais;
- filtros que deixem menos de 3 perguntas elegíveis retornam `422` com mensagem clara;
- perguntas e ordem das alternativas são embaralhadas por sessão; `correctOptionId` e `explanation` nunca chegam ao cliente antes do momento apropriado (o snapshot remove o gabarito como nas demais fases).

Os bancos canônicos (`medical-knowledge` + `question-bank`) são validados na inicialização do servidor: id duplicado, gabarito sem opção correspondente, doença inexistente, pontuação divergente da regra de scoring ou perfil do Escape divergente do canônico derrubam o servidor com mensagem apontando o problema.

`POST /api/sessions` aceita corpo validado por `createSessionSchema`:

```json
{ "mode": "ESCAPE", "integrityPolicy": "ZERO_ROUND", "allowedTopics": ["anemia-falciforme", "..."], "durationMin": 35, "caseId": "falciforme-a17" }
```

- `mode` padrão é `QUIZ` (fluxo antigo inalterado);
- em `ESCAPE` sem `caseId`, o servidor sorteia um caso elegível: todas as `topicTags` obrigatórias do caso precisam estar em `allowedTopics`, senão responde `422` listando os tópicos exigidos;
- com `caseId`, a sessão fica fixada naquele caso (jogo inteiro sobre uma única doença). Sem `allowedTopics`, os tópicos herdam as `topicTags` do próprio caso; com `allowedTopics`, os tópicos obrigatórios do caso precisam estar presentes, senão `422`;
- com `generator`, o servidor GERA um caso inédito a partir da base de conhecimento (`content/escape/diseases`):
  - `{ "generator": { "mode": "disease", "diseaseId": "hemofilia-a" } }` — todo o jogo sobre a doença escolhida;
  - `{ "generator": { "mode": "group", "group": "coagulopatias" } }` — sorteia uma doença do assunto;
  - `{ "generator": { "mode": "any" } }` — sorteia qualquer doença instalada (aula inteira).
  Em todos os modos, `allowedTopics` (quando enviado) filtra as doenças elegíveis e os arquivos de emergência; sem ele, os tópicos herdam os da doença sorteada. Paciente, senhas, distratores e ordem das alternativas mudam a cada geração (seed aleatório por sessão), e nos enigmas de girar a combinação correta nunca fica na primeira posição dos seletores;
- enigmas opcionais com tags não liberadas são removidos da cópia da sessão e nunca chegam a nenhum cliente.

`GET /api/escape/cases` lista os casos instalados para o Host escolher: `{ cases: [{ id, title, patientLabel, diagnosis, topicTags, roomCount }] }`.

`GET /api/escape/library` devolve a biblioteca completa para o Host: `{ cases: [...], diseases: [{ id, name, group, topicTags }] }`.

### Fases

`LOBBY -> BRIEFING (75 s) -> ESCAPE (durationMin) -> DEBRIEF (240 s) -> FINISHED`. O `tick` também encerra `ESCAPE` quando todas as equipes escapam.

### Cliente para servidor

- `escape:attempt` `{ code, teamToken, stepId, answer: string[] }` — resposta validada no servidor (`answers` do caso nunca vão ao cliente). Erro comum: −2 bases; erro no cofre (`dial-safe`): −5 bases e trava de 45 s. Ack: `{ ok, correct }`.
- `escape:hint` `{ code, teamToken, stepId, level: 1|2|3 }` — dicas sequenciais com custo 0/−3/−8 bases. Ack: `{ ok, hint, cost }`.
- `escape:note` `{ code, teamToken, roomId, text }` — prontuário da sala atual; salas R1–R4 exigem nota antes de a porta abrir.

### Ações Host adicionais

- `unlockDoor` `{ teamId }`: marca os enigmas obrigatórios da sala atual como resolvidos e avança a equipe (contingência).
- `extendTime` `{ minutes: 1..20 }`: estende o relógio da fase `ESCAPE`.

### Snapshot

Campos adicionais de `SessionSnapshot` no modo Escape:

- `mode`, `allowedTopics`, `durationMin`;
- `escape` (somente para a própria equipe): sala atual, passo atual sem gabarito, inventário, dicas reveladas, notas, trava do cofre, debrief após escapar;
- `escapeHost` (Host e projetor): sala, progresso, dicas e bases por equipe;
- `escapeEvents` (Host e projetor): últimos 30 eventos da SENTINELA.

### Integridade

Durante a fase `ESCAPE`, incidente confirmado sob política `ZERO_ROUND` deduz 10 bases (não existe "rodada" a zerar). Demais políticas apenas registram.
