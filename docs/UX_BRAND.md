# UX, Interface e Identidade Visual

> Ativos em uso e procedimento de substituição: `docs/ASSETS.md`. Comportamento das telas: `docs/USER_GUIDE.md`.

## Princípio central

O design é parte do jogo, não acabamento posterior.

A interface deve transmitir:

- investigação genética;
- ambiente de laboratório;
- hematologia;
- confinamento e urgência;
- tecnologia analógica degradada;
- suspense psicológico;
- credibilidade acadêmica sob uma camada cinematográfica.

Evitar aparência de formulário escolar, quiz genérico ou template administrativo.

## Nome na interface

Título principal:

`HEMOCASE`

Assinatura:

`Código Vermelho`

Subtítulo:

`Do DNA ao Fenótipo`

## Referência à LAGEM

A LAGEM deve estar presente de forma elegante e discreta.

### Preferência

Usar o arquivo oficial fornecido pela Liga como marca d'água de fundo:

- opacidade aproximada entre 2% e 6%;
- sem comprometer leitura;
- posicionamento variável conforme tela;
- jamais distorcer a proporção do logo.

### Ativo oficial disponível

O ativo fornecido pela Liga está em `apps/web/public/assets/lagem-logo.png`. Ele deve ser exibido sem distorção, com recorte circular não destrutivo e baixa opacidade no fundo animado compartilhado entre Host, projetor e celulares.

### Se o logo precisar ser substituído no futuro

Não inventar símbolo oficial.

Usar temporariamente:

`LAGEM`

em marca d'água tipográfica discreta, acompanhada de um motivo visual genérico de DNA feito em CSS/SVG próprio.

O Codex deve perguntar ao responsável pelo projeto:

1. nome oficial completo da LAGEM;
2. arquivo oficial da logomarca;
3. cores institucionais, se existirem;
4. autorização para uso da marca no repositório público.

## Direção visual

Tema principal:

`escape room clínico + Jogos Mortais + genética + código vermelho`

As referências autorizadas à série podem ser diretas na abertura, na voz, no vídeo, na linguagem de Jigsaw e nas transições. A interface funcional deve continuar original, legível e adequada ao contexto acadêmico, sem depender de gore para produzir tensão.

### Paleta sugerida

Definir tokens, não cores espalhadas nos componentes.

- `--bg-0`: preto de sala sem iluminação
- `--bg-1`: grafite industrial
- `--surface`: metal escuro e vidro de monitor
- `--text`: branco envelhecido
- `--text-muted`: cinza de fita analógica
- `--accent-red`: vermelho sangue e emergência
- `--accent-signal`: verde dessaturado de monitor
- `--accent-green`: status conectado
- `--accent-yellow`: alerta de integridade

O vermelho não deve dominar todas as telas. Usá-lo para urgência, contagem final, alertas e identidade `Código Vermelho`.

## Tipografia

O jogo deve funcionar offline durante a partida.

Evitar fontes remotas do Google Fonts no MVP.

Usar pilha de sistema de alta qualidade, por exemplo:

```css
font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

Se uma fonte for incluída posteriormente, armazenar legalmente no projeto ou empacotar por dependência apropriada. Não depender de CDN.

## Elementos gráficos

Usar de forma controlada:

- hélice de DNA;
- pares de bases;
- pulsos de monitor;
- ruído de fita e falhas breves de transmissão;
- metal, azulejo clínico e mecanismos de contenção;
- células sanguíneas abstratas;
- linhas de sequenciamento;
- cartões de evidência;
- carimbo `EVIDÊNCIA LIBERADA`;
- marcador de `CÓDIGO VERMELHO`.

Não usar imagens médicas chocantes como decoração.

## Motion design

Animações devem reforçar a narrativa.

Exemplos:

- entrada de evidência com breve efeito de scanner;
- cadeia DNA -> RNA -> proteína se montando;
- contador de bases subindo;
- pulso vermelho nos últimos 5 segundos;
- transição de fase com 300 a 500 ms;
- ranking reorganizando suavemente.

Respeitar `prefers-reduced-motion`.

## Haptics

Quando suportado:

- vibração curta ao liberar evidência;
- vibração dupla nos últimos segundos;
- vibração curta ao confirmar resposta.

Nunca tornar vibração necessária para compreender o estado.

## Tela inicial Host

Deve ter impacto visual.

Elementos:

- HEMOCASE em destaque;
- `Código Vermelho`;
- botão `Criar sessão`;
- modo `30 minutos` predefinido;
- indicador de rede local;
- referência discreta à LAGEM;
- versão da aplicação.

## Abertura audiovisual pública

A primeira tela deve funcionar como o início da narrativa, antes do lobby:

- vídeo em tela cheia, nunca dentro de um cartão decorativo;
- ação explícita `Reproduzir a fita` para liberar áudio conforme as políticas do navegador;
- vídeo e áudio servidos localmente, sem CDN ou streaming externo;
- controles discretos para silenciar e pular disponíveis ao Host;
- tentativa de fullscreen com fallback silencioso;
- aviso breve sobre áudio e luzes intermitentes;
- transição ao briefing somente quando o vídeo terminar ou o Host o pular;
- cronômetro oficial iniciado apenas após a entrada na missão.

Se o vídeo falhar, a tela deve permitir nova tentativa e o Host deve conseguir prosseguir sem reiniciar a aplicação.

## Lobby público

Tela projetada:

- QR Code grande;
- código textual da sessão;
- URL local menor;
- contador `Equipes conectadas`;
- cartões das equipes aparecendo ao vivo;
- instrução de uma linha;
- fundo visual com DNA e watermark LAGEM.

Não mostrar token Host.

## Tela de entrada do jogador

Passos máximos:

1. escanear QR;
2. digitar nome da equipe;
3. confirmar `Somos uma equipe e usaremos este celular`;
4. tocar `Entrar`.

Depois mostrar sala de espera.

## Modo de foco

Tela antes da primeira rodada:

Título:

`Modo de foco`

Texto curto:

`Durante as rodadas, sair desta página pode zerar os pontos da rodada. Mantenha o HEMOCASE aberto até o cronômetro terminar.`

Botão principal:

`Entrar no modo de jogo`

Indicadores após ativação:

- conexão;
- foco;
- fullscreen, quando disponível;
- Wake Lock, quando disponível.

Não exibir detalhes técnicos ao jogador.

## Tela de questão

Hierarquia:

1. nome da fase;
2. cronômetro;
3. título da evidência;
4. conteúdo;
5. alternativas/ação;
6. pontos possíveis;
7. status de envio.

Evitar cabeçalhos altos e desperdício de espaço vertical.

## Cartão de evidência

A evidência deve parecer parte de uma investigação.

Exemplo visual:

`EVIDÊNCIA 03 / PROTEÍNA SUSPEITA`

Abaixo, informação curta e objetiva.

Após liberar, uma animação de scanner pode revelar o conteúdo.

## Resposta

Depois de enviar:

- bloquear alteração;
- mostrar `Resposta registrada`;
- não revelar se acertou até o momento definido pelo Host;
- mostrar que a equipe aguarda as demais.

## Cronômetro

- normal acima de 10 s;
- atenção entre 10 e 6 s;
- código vermelho em 5 s ou menos;
- quando zerar, bloquear submissões pelo servidor.

## Placar

Design deve lembrar painel de missão.

Cada equipe:

- posição;
- nome;
- bases;
- mudança de posição opcional;
- status discreto.

Não exibir publicamente `trapaceou`. Eventos de integridade ficam no Host.

## Painel Host

Visual mais informativo e menos cinematográfico.

Áreas:

- controle da sessão;
- cronômetro;
- equipes;
- respostas;
- ranking;
- integridade;
- log;
- exportação.

Usar atalhos claros, mas não depender de teclado.

## Acessibilidade

- contraste WCAG adequado sempre que possível;
- botões com área de toque mínima de 44 px;
- não depender apenas de cor para indicar estado;
- textos principais com pelo menos 16 px em celular;
- imagens didáticas com texto alternativo;
- foco de teclado visível no Host;
- reduced motion.

## Responsividade

Prioridade:

1. celular 360 x 640 ou superior;
2. tablets;
3. notebook Host;
4. projetor 16:9.

O jogo no celular deve funcionar em orientação vertical. Não exigir rotação.

## Assets

Estrutura sugerida:

```text
apps/web/public/brand/
  lagem-logo.svg
  README.md
apps/web/public/game/
  sickle-cells.webp
  thalassemia-smear.webp
  platelet-adhesion.svg
```

Não copiar imagens dos slides para o repositório público sem verificar direito de uso. Preferir gráficos próprios, SVGs didáticos ou ativos autorizados.

## Critério visual de aceite

A primeira reação desejada ao abrir o jogo deve ser:

`isso parece um jogo criado para esta aula`

E não:

`isso parece um formulário com tema escuro`.
