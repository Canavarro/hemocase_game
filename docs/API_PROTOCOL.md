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
