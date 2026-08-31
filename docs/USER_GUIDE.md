# Guia das interfaces

## Visão geral

Uma sessão usa quatro superfícies:

| Superfície | Endereço | Usuário |
|---|---|---|
| Host | `/host` | facilitador |
| Projetor | `/screen/CODIGO` | turma inteira |
| Entrada | `/join/CODIGO` | equipe antes de entrar |
| Jogo | `/play/CODIGO` | equipe autenticada |

O Host controla a sessão. O projetor nunca aceita respostas. Cada equipe compartilha um celular.

## Painel Host

### Criar sessão

`Criar sessão` gera:

- código público de seis caracteres;
- token privado armazenado somente naquela aba;
- URL de entrada;
- tela de projetor associada.

Recarregar a aba mantém a sessão enquanto `sessionStorage` existir e o servidor não for reiniciado. `Nova sessão` remove a credencial local e volta à criação; não apaga a sessão anterior do servidor.

### Resumo

O topo mostra fase, relógio oficial, quantidade de equipes e posição da questão. O indicador de conexão confirma o canal em tempo real.

### Controles

- `Voltar fase`: retorna ao início da fase anterior.
- `Pausar`: guarda exatamente o tempo restante e entra em `PAUSED`.
- `Retomar`: continua a contagem preservada.
- `Avançar`: passa à próxima questão ou fase.
- `Reiniciar`: volta ao lobby, zera score, respostas e incidentes, mantendo equipes conectadas.
- `Abrir projetor`: abre a tela pública em outra janela.
- `Encerrar`: vai diretamente a `FINISHED` e exibe resultado.

O servidor também avança automaticamente quando o relógio da questão chega a zero.

### Equipes

Cada linha informa conexão, trilho, resposta atual e bases. O ícone de ajuste permite acrescentar ou remover até 100 bases por operação. Toda alteração exige justificativa e aparece na exportação JSON.

### Integridade

A política pode ser alterada durante a sessão:

- `Zerar rodada`: incidente confirmado zera os pontos da fase atual;
- `Aviso`: registra sem desconto automático;
- `Revisão manual`: registra para decisão do facilitador;
- `Somente observar`: registra sem intervenção.

`Desfazer` exige justificativa. Quando não resta outro incidente confirmado ativo na fase, o motor recalcula os pontos potenciais das respostas daquela equipe.

### Exportação

- CSV: equipe, trilho, pontuação e estado de conexão;
- JSON: sessão, respostas, incidentes, ajustes e metadados.

Exporte antes de interromper o servidor.

## Tela do projetor

### Transmissão

`Reproduzir a fita` libera áudio e tenta fullscreen. O Host pode silenciar ou pular. Se o MP4 falhar, `Continuar sem vídeo` abre o lobby.

O navegador registra a transmissão como assistida no `sessionStorage` daquela aba. Para reproduzir novamente, feche a aba ou limpe o item `hemocase:intro:CODIGO`.

### Lobby

Exibe QR Code, código, URL local e equipes conectadas. O relógio competitivo ainda não está correndo.

### Rodadas

Em fases comuns, o projetor mostra título e pergunta. Durante casos diferentes por equipe, mostra narrativa e progresso sem expor conteúdo privado. Score e ranking aparecem somente na revelação/final.

## Entrada da equipe

A equipe informa um nome de 2 a 24 caracteres e confirma o uso de um único aparelho. Nomes iguais na mesma sessão são recusados.

Depois da entrada, o token é salvo localmente e o navegador navega para `/play/CODIGO`.

## Jogo da equipe

### Espera

Mostra nome, conexão, trilho e score. A equipe deve manter a página aberta.

### Modo de foco

`Entrar no modo de jogo` tenta fullscreen e Wake Lock. Falha ou ausência dessas APIs não impede a partida.

### Questão

1. Leia evidências e pergunta.
2. Selecione uma alternativa.
3. Toque `Confirmar resposta`.
4. Aguarde `Resposta lacrada`.

Depois de aceita, a resposta não pode ser trocada nem enviada novamente. O cliente não recebe gabarito durante a rodada.

### Reconexão

Ao recarregar ou retornar à URL no mesmo navegador, o `teamToken` restaura equipe, fase, resposta e score. Se o armazenamento local for apagado, será necessário entrar como nova equipe, e isso só é permitido no lobby.

## Fases

| Fase | Conteúdo | Relógio |
|---|---|---|
| `LOBBY` | entrada e QR | não |
| `FOCUS_CHECK` | ativação do foco | 60 s |
| `WARMUP` | duas questões coletivas | por questão |
| `CASE_INVESTIGATION` | cinco questões por trilho | por questão |
| `BLITZ` | sete questões rápidas | por questão |
| `FINAL_CHAIN` | cadeia diferente do caso principal | 90 s |
| `REVEAL` | soluções e ranking | 180 s |
| `FINISHED` | resultado final | não |
| `PAUSED` | suspensão temporária | preservado |

As durações competitivas vêm de `content/game.pt-BR.json`.

## Fundo e acessibilidade

Todas as superfícies usam logo LAGEM e DNA animado em baixa opacidade. Sistemas com `prefers-reduced-motion` reduzem animações e transições. Informação importante nunca depende apenas de vibração, cor ou movimento.

## Código Relâmpago pelo banco canônico (Rodadas ao vivo)

Ao criar uma sessão de **Rodadas ao vivo**, o facilitador escolhe a origem do Código Relâmpago:

- **Roteiro fixo de 30 minutos**: as 7 perguntas revisadas do roteiro;
- **Sortear do banco canônico**: perguntas sorteadas de `question-bank.pt-BR.json`, com filtros de **dificuldade** (fácil/média/difícil), **categoria** (genética, microscopia, clínica, laboratório, molecular, herança, diferencial), **quantidade** e a opção de **incluir doenças de expansão** (HbC, α-talassemia, Glanzmann, Hermansky-Pudlak, Wiskott-Aldrich, HHT e trombofilias). A pontuação segue o banco (5/8/12) e o tempo por pergunta cresce com a dificuldade.

## Modo Escape: Protocolo Hélix

Ao criar a sessão, o facilitador escolhe entre **Rodadas ao vivo** (fluxo clássico) e **Escape: Protocolo Hélix**. No modo Escape:

1. o facilitador marca a duração (25/35/45 min) e os **tópicos já vistos pela turma** — nada fora deles entra no jogo. Em **Origem do caso**, ele escolhe entre as variações:
   - **Sortear caso pronto** pelos tópicos liberados (roteiro fixo, revisado);
   - **Gerar caso inédito · aula inteira**: a SENTINELA sorteia qualquer doença da base de conhecimento;
   - **Gerar por assunto**: sorteia uma doença do grupo escolhido (hemoglobinopatias, coagulopatias, plaquetopatias, trombofilias);
   - **Gerar por doença específica**: todo o jogo gira em torno daquela doença (paciente, senhas e alternativas mudam a cada sessão);
   - **Caso pronto específico**: fixa um caso autoral.
   Em todas as variações os tópicos são pré-ajustados e continuam editáveis — desmarcar um tópico tira do sorteio as doenças que dependem dele e filtra os enigmas-bônus;
2. as equipes entram pelo mesmo QR Code; ao avançar, veem o briefing da SENTINELA e depois o laboratório em primeira pessoa;
3. cada sala tem objetos interativos (hotspots). Tocar aproxima a câmera e abre o enigma; as mãos do personagem aparecem nas interações;
4. as salas seguem a rota fenótipo -> laboratório -> proteína -> gene -> diagnóstico. Salas 1 a 4 exigem registrar a hipótese no **prontuário digital** antes de a porta abrir;
5. dicas custam 0/−3/−8 bases; tentativas erradas custam 2 bases; errar o cofre final custa 5 bases e trava o cofre por 45 s;
6. o painel Host mostra o **mapa do laboratório** (sala, progresso, dicas e bases por equipe), permite destravar porta, dar +5 min, pausar e encerrar;
7. o projetor exibe a planta com o avanço das equipes, o cronômetro de expurgo e o registro de eventos da SENTINELA;
8. a equipe que abre o cofre escapa e ganha bônus pelo tempo restante; a exportação JSON inclui prontuários, dicas e eventos.
