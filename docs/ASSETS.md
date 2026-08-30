# Ativos audiovisuais e identidade

## Ativos em uso

| Ativo | Origem de produção | Uso em runtime |
|---|---|---|
| `assets/videos/Use_o_som_da_do_video_para_a_browser.mp4` | vídeo-fonte fornecido ao projeto | copiado para `apps/web/public/assets/intro.mp4` |
| logo LAGEM fornecido na conversa | identidade oficial enviada pelo responsável | `apps/web/public/assets/lagem-logo.png` |

O build do Vite copia os arquivos de `apps/web/public` para `apps/web/dist/assets`. A partida não depende de CDN, streaming ou fontes remotas.

## Vídeo

Características verificadas:

- contêiner MP4;
- vídeo H.264/AVC;
- áudio AAC;
- metadados preparados para início rápido;
- MIME servido como `video/mp4`.

O navegador exige interação para liberar áudio. O botão `Reproduzir a fita` inicia a mídia e tenta ativar fullscreen. Fullscreen é opcional. O Host pode silenciar, pular ou continuar sem vídeo em caso de falha.

Para substituir:

1. mantenha o nome `apps/web/public/assets/intro.mp4` ou atualize `IntroTransmission.tsx`;
2. use H.264 + AAC para compatibilidade ampla;
3. preserve `playsInline` para iOS;
4. verifique volume, duração, enquadramento e legendas;
5. execute o teste manual em Chrome/Edge e Safari iOS.

## Logo LAGEM

O bitmap foi preparado com a ferramenta ImageGen embutida a partir da imagem oficial fornecida. Prompt operacional resumido: remover apenas o fundo externo, preservar integralmente símbolo, texto, acentos, cores, proporções e espaçamentos, sem redesenhar ou adicionar elementos.

A transparência produzida não ficou confiável. Por isso, o arquivo final é exibido com `clip-path: circle(...)` em `styles.css`, recortando apenas a área externa. Não remova esse recorte sem substituir o arquivo por PNG com alpha validado.

### Tratamento em silhueta

Por solicitação do responsável, o logo aparece como silhueta flutuante de destaque no fundo de todas as superfícies. O efeito é feito inteiramente em CSS sobre o arquivo oficial, sem gerar novo ativo:

- `filter: invert(1) grayscale(1) sepia(...) hue-rotate(...)` converte o interior branco em preto e os glifos escuros em traço claro com leve tom sanguíneo;
- `mix-blend-mode: screen` faz o interior preto desaparecer sobre o fundo escuro, restando apenas a silhueta dos glifos e do anel;
- o `clip-path` circular continua removendo a área externa não confiável do PNG.

Classes: `.brand-silhouette--primary` (grande, à direita, deriva lenta) e `.brand-silhouette--ghost` (menor, no canto oposto, oculta em telas pequenas). Este tratamento depende do fundo escuro; se o tema um dia ganhar superfícies claras, será necessário PNG com alpha real.

Uso visual:

- silhueta com opacidade discreta (≈ 7 % a 13 %), maior que a marca d'água anterior por decisão do responsável;
- animação lenta de flutuação e rotação sutil;
- sem distorção de aspecto;
- nunca sobre conteúdo clínico de alta prioridade;
- presente em Host, projetor, entrada e jogo mobile.

## DNA animado

O DNA é construído por HTML/CSS em `BrandBackground.tsx` e `styles.css`. Não é parte do logo. A animação usa baixa opacidade, deslocamento lento e fallback por `prefers-reduced-motion`.

## Motion design de interface

As transições cinematográficas de fase e a cadeia da revelação usam `@remotion/player` e composições locais em `apps/web/src/remotion/compositions.tsx`. Os players são carregados sob demanda pela tela pública para não pesar na entrada Host ou no celular.

O cronômetro circular e o contador de bases são componentes React/CSS próprios. Nenhuma animação busca mídia ou código externo durante a partida. Em dispositivos com `prefers-reduced-motion`, a revelação animada é substituída pelo título estático e as animações CSS são reduzidas.

## Direitos e distribuição

O responsável informou possuir autorização para uso das referências da série e dos materiais audiovisuais no contexto interno. Antes de publicar, distribuir ou hospedar externamente, confirme novamente licenças do vídeo, áudio, série e marca LAGEM.

Não acrescente ativos remotos, analytics, fontes CDN ou chamadas em nuvem sem aprovação explícita.
