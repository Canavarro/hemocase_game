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

Uso visual:

- baixa opacidade;
- animação lenta de respiração;
- sem distorção de aspecto;
- nunca sobre conteúdo clínico de alta prioridade;
- presente em Host, projetor, entrada e jogo mobile.

## DNA animado

O DNA é construído por HTML/CSS em `BrandBackground.tsx` e `styles.css`. Não é parte do logo. A animação usa baixa opacidade, deslocamento lento e fallback por `prefers-reduced-motion`.

## Direitos e distribuição

O responsável informou possuir autorização para uso das referências da série e dos materiais audiovisuais no contexto interno. Antes de publicar, distribuir ou hospedar externamente, confirme novamente licenças do vídeo, áudio, série e marca LAGEM.

Não acrescente ativos remotos, analytics, fontes CDN ou chamadas em nuvem sem aprovação explícita.
