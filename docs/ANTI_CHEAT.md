# Integridade da Partida e Modo de Foco

## Objetivo

Reduzir a possibilidade de uma equipe abandonar a página do jogo para pesquisar respostas durante uma rodada competitiva e criar uma regra clara, auditável e justa quando isso ocorrer.

## Limite técnico importante

Uma página web não possui controle total sobre o sistema operacional do celular.

Ela não consegue garantir que o participante:

- não use outro aparelho;
- não consulte outra pessoa;
- não use recursos externos fora do navegador;
- não receba ajuda por voz;
- não use mecanismos do sistema operacional que o navegador não expõe.

Portanto, o HEMOCASE não deve declarar `bloqueio absoluto`. O modelo correto é:

`prevenir -> detectar -> registrar -> penalizar -> permitir revisão`

## Estratégia em camadas

### Camada 1: regra explícita

Antes do início, o jogador vê:

`Durante rodadas ativas, sair desta página, trocar de aba ou trocar de aplicativo pode zerar a pontuação da rodada. O sistema registra eventos de integridade. Em caso de evento acidental, o facilitador poderá revisar.`

O botão `Entrar no modo de jogo` confirma ciência da regra.

### Camada 2: ambiente recomendado

O Host deve orientar:

1. usar somente um celular por equipe;
2. ativar `Não Perturbe` quando possível;
3. desativar dados móveis quando a sala estiver usando rede local isolada;
4. se necessário, ativar modo avião e reativar somente o Wi-Fi;
5. manter o navegador aberto na página do HEMOCASE;
6. evitar bloquear a tela durante rodada ativa.

A aplicação não consegue verificar de forma confiável se os dados móveis estão desligados.

### Camada 3: fullscreen

Ao tocar `Entrar no modo de jogo`, solicitar fullscreen quando suportado pelo navegador.

Regras:

- fullscreen é melhoria de experiência, não pré-requisito;
- se a API não existir, o jogo continua;
- saída de fullscreen sozinha não deve gerar penalidade automática em navegadores onde o suporte é inconsistente;
- o evento pode ser registrado como sinal auxiliar.

### Camada 4: Wake Lock

Solicitar `navigator.wakeLock.request('screen')` quando disponível para reduzir bloqueios de tela acidentais.

Ao recuperar visibilidade, tentar renovar o Wake Lock se necessário.

### Camada 5: Page Visibility

Evento principal:

```text
visibilitychange
```

Durante uma fase com `focusGuardActive = true`:

- se `document.visibilityState === 'hidden'`, iniciar evento de possível violação;
- registrar timestamp local;
- avisar o servidor imediatamente pelo WebSocket;
- usar `sendBeacon` como fallback quando apropriado;
- ao voltar a `visible`, enviar duração aproximada da ocultação.

### Camada 6: pagehide e ciclo de vida

Escutar:

- `pagehide`
- `visibilitychange`
- `beforeunload`, apenas como sinal auxiliar
- eventos de reconexão do socket

`pagehide` durante rodada ativa deve ser considerado sinal forte de abandono ou navegação.

Não depender de `beforeunload`, pois navegadores móveis podem não dispará-lo.

### Camada 7: blur

`window.blur` pode acontecer por motivos legítimos e gera falsos positivos.

Por isso:

- registrar como telemetria auxiliar;
- nunca zerar uma rodada apenas por `blur`;
- combinar com `visibilitychange`, `pagehide` ou desconexão quando necessário.

### Camada 8: heartbeat

Cliente e servidor mantêm heartbeat pelo Socket.IO.

O servidor registra:

- última mensagem;
- período desconectado;
- motivo de desconexão quando disponível;
- fase em que ocorreu.

Desconexão sozinha não deve ser tratada automaticamente como trapaça, porque a rede local pode oscilar.

## Classificação de eventos

### INFO

Exemplos:

- saída de fullscreen sem perda de visibilidade;
- `blur` isolado;
- latência temporária.

Não penaliza.

### SUSPICIOUS

Exemplos:

- página ficou oculta por menos do que a tolerância configurada;
- desconexão curta sem `pagehide`;
- múltiplos `blur` em sequência.

Registra e mostra em amarelo no Host.

### CONFIRMED

Exemplos:

- `visibilitychange` para hidden por período superior à tolerância;
- `pagehide` durante rodada ativa;
- tentativa de recarregar/navegar e perda confirmada da página;
- sequência coerente de hidden + disconnect durante rodada.

Aplica a política configurada.

## Tolerância

Criar configuração:

`focusGraceMs`

Padrão sugerido: `1000 ms`.

Comportamento:

- hidden por menos de 1 segundo: SUSPICIOUS;
- hidden por 1 segundo ou mais: CONFIRMED;
- `pagehide`: CONFIRMED imediatamente.

O Host pode configurar tolerância entre 0 e 3000 ms.

## Políticas de penalidade

### OBSERVE_ONLY

Somente registra.

### WARNING

Primeiro evento confirmado mostra aviso. Segundo evento confirmado na mesma rodada zera a rodada.

### ZERO_ROUND

Primeiro evento confirmado zera os pontos ganhos na rodada atual.

Não apaga pontos de rodadas anteriores.

### MANUAL_REVIEW

Nenhuma penalidade automática. Host recebe alerta e decide.

## Política padrão

Para a atividade oficial de 30 minutos:

`ZERO_ROUND`

O Host sempre pode desfazer a penalidade.

## Aplicação da penalidade

O servidor é o único responsável por aplicar a penalidade.

Fluxo:

1. cliente envia evento;
2. servidor valida fase e estado da equipe;
3. servidor classifica;
4. se confirmado, cria `integrityIncident`;
5. aplica política;
6. registra pontos antes/depois;
7. notifica Host;
8. notifica jogador com mensagem neutra;
9. atualiza tela pública somente se a configuração permitir.

## Mensagem ao jogador

Evitar acusação automática.

Usar:

`Foi detectada saída da página durante uma rodada ativa. Pela regra desta sessão, os pontos desta rodada foram zerados. Se o evento ocorreu por chamada, falha do aparelho ou outro motivo involuntário, avise o facilitador.`

## Host: painel de integridade

Cada equipe possui indicador:

- verde: foco normal;
- amarelo: evento suspeito;
- vermelho: incidente confirmado/penalizado;
- cinza: desconectado.

Ao abrir um incidente, mostrar:

- equipe;
- fase;
- questão;
- horário;
- tipo de evento;
- duração hidden;
- estado do socket;
- penalidade aplicada;
- pontos removidos;
- botão `Desfazer penalidade`;
- campo opcional de justificativa.

## Auditoria

Estrutura sugerida:

```ts
interface IntegrityIncident {
  id: string
  sessionId: string
  teamId: string
  roundId: string
  questionId?: string
  eventType: 'visibility_hidden' | 'pagehide' | 'disconnect' | 'fullscreen_exit' | 'blur'
  severity: 'info' | 'suspicious' | 'confirmed'
  startedAt: number
  endedAt?: number
  hiddenDurationMs?: number
  penalty?: 'none' | 'warning' | 'zero_round'
  pointsRemoved?: number
  reversedAt?: number
  reverseReason?: string
}
```

## Proteção contra manipulação simples do cliente

- score nunca vem do cliente;
- resposta correta não deve ser enviada ao cliente antes do fechamento da questão;
- conteúdo futuro não deve ser pré-carregado no HTML quando isso revelar respostas;
- o servidor libera cada evidência somente no momento correto;
- team tokens aleatórios;
- validar `sessionId`, `teamId` e token em toda ação sensível;
- ignorar submissões após prazo oficial do servidor;
- uma resposta final por questão, salvo se a regra permitir alteração antes do envio;
- registrar tentativas inválidas repetidas.

## Navegação interna

Durante rodada ativa:

- não renderizar links externos;
- interceptar navegação interna acidental;
- ao pressionar `voltar`, exibir barreira quando tecnicamente possível;
- não impedir recursos de acessibilidade do navegador.

## PWA

Instalação como PWA pode melhorar o modo de tela cheia, mas não deve ser requisito do MVP porque a entrada em sala precisa ser imediata por QR Code.

Pode ser considerada em versão futura.

## Casos de falso positivo que precisam de teste

- chamada telefônica recebida;
- painel de notificações;
- troca de orientação;
- teclado virtual;
- bloqueio automático de tela;
- permissão de fullscreen;
- permissão de Wake Lock;
- Safari iOS retornando do background;
- Chrome Android retornando do app switcher;
- oscilação de Wi-Fi;
- refresh acidental.

## Regra pedagógica

O anti-cheat deve funcionar como dissuasão e preservação da dinâmica, não como sistema disciplinar infalível.

Toda penalidade deve ser visível ao Host e reversível.