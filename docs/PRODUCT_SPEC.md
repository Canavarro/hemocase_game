# Especificação de Produto

> Estado de implementação e diferenças do MVP: `docs/IMPLEMENTATION_STATUS.md`. Guia das telas: `docs/USER_GUIDE.md`.

## Nome

**HEMOCASE: Código Vermelho**

Subtítulo: **Do DNA ao Fenótipo**

## Contexto

O jogo é uma atividade da Liga de Genética Médica, LAGEM, aplicada imediatamente após uma aula sobre proteínas de interesse médico, hemoglobinopatias e coagulopatias. Sua apresentação é um escape room audiovisual com referências autorizadas à série *Jogos Mortais*.

A duração total disponível é de 30 minutos, incluindo entrada dos jogadores.

Cada equipe possui apenas um celular.

## Objetivo pedagógico

Fazer o estudante percorrer a cadeia de raciocínio:

`fenótipo -> laboratório -> proteína -> alteração genética -> herança -> diagnóstico`

A experiência deve integrar o conteúdo da aula e usar os artigos científicos como aprofundamento, sem transformar a atividade em uma prova extensa.

## Objetivo de experiência

O aluno deve sentir que foi colocado dentro de uma investigação clínica e genética em tempo real, conduzida por uma transmissão de Jigsaw. Casos e perguntas são tratados como mecanismos, pistas e códigos necessários para escapar.

A narrativa deve:

- começar com uma fita em vídeo e áudio antes do cronômetro competitivo;
- usar suspense psicológico, urgência e consequências de jogo;
- transformar cada resposta em uma ação sobre a sala, e não apenas em pontuação;
- manter o raciocínio científico como única forma de avançar;
- evitar violência gráfica como elemento obrigatório para compreender ou resolver desafios.

O produto deve ser:

- competitivo sem ser hostil;
- visualmente marcante;
- rápido de aprender;
- simples de operar pelo facilitador;
- legível em celular;
- adequado a uma sala de aula;
- capaz de funcionar em rede local.

## Público

Estudantes da disciplina, organizados em equipes de 4 a 7 pessoas, com um celular por equipe.

O sistema deve permitir número dinâmico de equipes. Faixa de referência do MVP: 4 a 12 equipes.

## Papéis

### Host

Membro da Liga responsável por criar e controlar a sessão.

### Facilitador

Pode ser o mesmo Host ou outro membro da Liga. Observa a turma e resolve exceções.

### Equipe

Grupo de alunos usando um único celular.

### Tela pública

Projetor com cronômetro, narrativa e ranking.

## Fluxo de 30 minutos

A duração abaixo é referência e deve ser configurável no painel Host.

### Prelúdio, transmissão inicial

- A tela pública apresenta `HEMOCASE: Código Vermelho` e o comando `Reproduzir a fita`.
- O comando inicia o vídeo com áudio fornecido pelo projeto e tenta ativar fullscreen quando suportado.
- A reprodução não inicia automaticamente, devido às políticas de áudio dos navegadores.
- Ao terminar ou ser pulada pelo Host, a transmissão revela a missão e libera o lobby.
- O cronômetro de 30 minutos ainda não está correndo nesta etapa.

### 00:00 a 02:30, entrada por QR Code

- Host já deve estar aberto antes do término da aula.
- QR Code projetado.
- Equipe escaneia e informa nome curto.
- Sistema confirma conexão.

### 02:30 a 04:00, modo de foco

- explicação curta da regra de integridade;
- botão `Entrar no modo de jogo`;
- tentativa de fullscreen quando suportado;
- Wake Lock quando suportado;
- teste do canal WebSocket;
- indicador `Modo de foco ativo`.

### 04:00 a 06:00, desbloqueio molecular

Desafio coletivo rápido para ordenar:

`DNA -> RNA -> proteína -> função -> fenótipo`

Serve para conectar o jogo à abertura conceitual da aula.

### 06:00 a 16:00, investigação principal

Cada equipe recebe um dos quatro trilhos de caso.

Quatro evidências são liberadas em sequência. A equipe responde após cada evidência e termina com um diagnóstico e uma cadeia molecular.

### 16:00 a 21:00, Código Relâmpago

Todos respondem às mesmas questões rápidas sobre:

- Wiskott-Aldrich;
- telangiectasia hemorrágica hereditária;
- mutação G20210A da protrombina;
- DNA, proteína ou fenótipo;
- hemoglobinas e coagulação.

### 21:00 a 25:00, cadeia final

A equipe precisa montar corretamente uma cadeia do tipo:

`gene/alteração -> proteína -> função afetada -> manifestação`

### 25:00 a 28:00, revelação e ranking

A tela pública apresenta as soluções dos quatro casos e o ranking.

O Host pode convidar uma ou duas equipes para justificar em até 30 segundos a pista mais importante.

### 28:00 a 30:00, fechamento

Mensagem final:

`DNA -> RNA -> proteína -> função -> fenótipo`

O jogo termina com a ideia de que a doença genética não começa no sintoma.

## Regras de pontuação

A unidade visual pode ser chamada de `bases`.

Total sugerido: 100 bases.

- Desbloqueio molecular: 10
- Investigação principal: 50
- Código Relâmpago: 20
- Cadeia final: 20

A pontuação deve considerar acerto e, quando configurado, velocidade.

### Velocidade

Não tornar a velocidade mais importante que o raciocínio. O bônus de tempo de uma questão não deve ultrapassar 20% dos pontos daquela questão.

## Penalidades de integridade

Durante fases competitivas, o modo de foco fica ativo.

Políticas configuráveis:

- `OBSERVE_ONLY`: apenas registra eventos;
- `WARNING`: primeira violação confirmada gera aviso;
- `ZERO_ROUND`: violação confirmada zera a pontuação da rodada atual;
- `MANUAL_REVIEW`: evento aparece ao Host, que decide.

Padrão recomendado para atividade oficial: `ZERO_ROUND`, com possibilidade de desfazer pelo Host.

Detalhes em `docs/ANTI_CHEAT.md`.

## Entrada na sessão

O QR Code aponta diretamente para:

`http://IP_LOCAL:PORTA/join/CODIGO`

Tela de entrada pede somente:

- nome da equipe;
- confirmação de que é o único celular usado pela equipe.

Não pedir cadastro.

## Lobby

A tela pública deve mostrar equipes entrando em tempo real.

No celular:

- nome da missão;
- nome da equipe;
- status `Conectado`;
- mensagem `Aguardando início`;
- indicador discreto da LAGEM.

## Evidências

Cada evidência deve surgir como uma revelação visual curta.

Tipos suportados:

- texto clínico;
- resultado de laboratório;
- imagem didática local;
- fragmento de sequência ou informação molecular;
- heredograma simplificado;
- associação arrastar e soltar;
- múltipla escolha;
- seleção múltipla;
- ordenação.

Evitar respostas abertas longas no MVP. Para 30 minutos, priorizar interações objetivas.

## Painel Host

Obrigatório:

- criar sessão;
- selecionar configuração de 30 minutos;
- escolher política anti-cheat;
- QR Code grande;
- lista de equipes;
- status de conexão;
- status de foco;
- iniciar;
- pausar;
- pular fase;
- encerrar fase;
- visualizar respostas;
- ver pontuação;
- ver violações;
- desfazer penalidade;
- ajustar pontuação manualmente;
- exportar resultados.

## Tela pública

A tela pública deve ser segura para projeção.

Durante questões:

- não mostrar resposta correta;
- não mostrar resposta individual de equipe;
- mostrar cronômetro;
- mostrar número de equipes que já responderam, sem revelar quais alternativas escolheram.

Após fechar a questão:

- mostrar resposta e explicação breve quando apropriado;
- atualizar ranking em momentos definidos, não necessariamente após toda pergunta.

## Ranking

Exibir no máximo as primeiras posições em destaque e permitir rolagem automática caso existam muitas equipes.

Em fases iniciais, o Host pode ocultar o ranking para reduzir distração.

## Conteúdo editável

O conteúdo deve ficar em arquivos estruturados fora do código.

Campos desejados por questão:

- id;
- phase;
- caseTrack;
- title;
- prompt;
- type;
- options;
- correctAnswer;
- explanation;
- points;
- duration;
- sourceNote;
- media opcional.

## Requisitos não funcionais

- primeira pintura rápida em celular de rede local;
- atualização em tempo real com baixa latência;
- layout adaptável a 360 px de largura;
- suporte a orientação vertical;
- botões grandes;
- contraste adequado;
- `prefers-reduced-motion` respeitado;
- sem necessidade de conta;
- funcionamento sem CDN em tempo de jogo;
- mensagens de erro compreensíveis.

## Fora do escopo do MVP

- login institucional;
- banco de dados em nuvem;
- multiplayer pela internet;
- aplicativo nativo;
- IA gerando perguntas em tempo real;
- análise biométrica;
- bloqueio de sistema operacional;
- garantia absoluta contra consulta externa;
- CMS completo para criar novas aulas.

## Critério de sucesso

Uma sessão de teste com pelo menos quatro celulares deve conseguir:

1. entrar pelo QR Code;
2. permanecer sincronizada;
3. responder a todas as fases;
4. receber pontuação correta;
5. registrar evento de saída da página;
6. aplicar a penalidade configurada;
7. permitir correção pelo Host;
8. terminar em menos de 30 minutos;
9. exportar o resultado.
