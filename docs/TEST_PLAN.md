# Plano de Testes e Critérios de Aceite

> Resultados da última validação e pendências manuais: `docs/TEST_REPORT.md`.

## Objetivo

Validar que o HEMOCASE funciona de ponta a ponta em uma sala real, com um computador servidor, projetor e vários celulares conectados pela mesma rede local.

## Gates automatizados

A implementação não deve ser considerada pronta sem:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Quando os testes E2E estiverem disponíveis:

```bash
npm run test:e2e
```

## Testes unitários obrigatórios

### Máquina de estados

Cobrir:

- criação de sessão;
- transição LOBBY -> FOCUS_CHECK;
- início da rodada;
- fechamento por tempo;
- pausa e retomada;
- finalização;
- impedir submissão em fase incorreta.

### Pontuação

Cobrir:

- resposta correta;
- resposta incorreta;
- bônus de velocidade;
- teto de bônus;
- não duplicar pontos em reenvio;
- cadeia final;
- ranking em empate.

### Penalidades

Cobrir:

- OBSERVE_ONLY;
- WARNING;
- ZERO_ROUND;
- MANUAL_REVIEW;
- desfazer penalidade;
- não remover pontos de rodadas anteriores;
- não aplicar penalidade quando focusGuard estiver inativo.

### Integridade

Cobrir:

- hidden menor que grace => suspicious;
- hidden igual/maior que grace => confirmed;
- pagehide => confirmed;
- blur isolado => info;
- disconnect isolado => não confirmado automaticamente;
- hidden + disconnect => incidente coerente;
- deduplicação de eventos.

### Distribuição de casos

- quatro equipes recebem A, B, C, D;
- cinco ou mais recebem distribuição equilibrada;
- variante C respeita configuração do Host.

## Testes de integração

### Entrada

- criar sessão;
- obter session code;
- gerar URL do QR;
- equipe entra;
- nome aparece no Host e Screen;
- token de equipe é criado.

### Resposta

- Host inicia questão;
- jogador recebe somente conteúdo liberado;
- responde;
- servidor valida;
- Host recebe status;
- resposta correta permanece oculta no cliente até revelação.

### Reconexão

- equipe entra;
- envia uma resposta;
- socket cai;
- reconecta com teamToken;
- pontuação e estado são restaurados;
- não permite responder novamente à mesma questão.

### Penalidade

- equipe inicia rodada;
- cliente envia evento confirmado;
- servidor cria incidente;
- ZERO_ROUND remove pontos da rodada;
- Host desfaz;
- pontos retornam exatamente ao valor anterior.

## Testes E2E principais

### E2E 1: sessão completa reduzida

Em ambiente de teste com tempos curtos:

1. Host cria sessão;
2. quatro jogadores entram;
3. Host inicia;
4. todos completam warmup;
5. cada equipe recebe caso;
6. respondem às evidências;
7. entram no blitz;
8. montam cadeia final;
9. ranking é exibido;
10. sessão termina;
11. exportação é gerada.

### E2E 2: atraso e resposta fora do prazo

- abrir questão por 3 s;
- tentar responder após servidor fechar;
- submissão deve ser recusada.

### E2E 3: reenvio

- enviar resposta;
- repetir payload;
- score não muda.

### E2E 4: Host protegido

- tentar ação administrativa sem token;
- servidor rejeita.

### E2E 5: abertura audiovisual

- abrir a tela pública sem interação e confirmar que o vídeo não iniciou;
- tocar `Reproduzir a fita` e confirmar reprodução com áudio;
- validar que falha ou recusa de fullscreen não impede o vídeo;
- silenciar e reativar o áudio pelos controles do Host;
- pular a transmissão e confirmar transição ao briefing;
- repetir deixando o vídeo chegar ao fim;
- confirmar que o cronômetro oficial permanece em 30:00 até `Entrar na sala`;
- simular arquivo indisponível e avançar por `Continuar sem vídeo`.

## Matriz manual de navegadores

Antes de uso em sala, testar em aparelhos reais.

| Plataforma | Navegador | Vídeo/áudio | Entrada QR | WebSocket | Visibility | Fullscreen | Wake Lock | Reconexão |
|---|---|---|---|---|---|---|---|---|
| Android | Chrome recente | | | | | | | |
| iOS | Safari recente | | | | | | | |
| Windows Host | Chrome/Edge | | N/A | | N/A | N/A | N/A | |
| macOS Host | Chrome | | N/A | | N/A | N/A | N/A | |

## Teste manual do FocusGuard

Executar em cada plataforma móvel:

1. iniciar rodada ativa;
2. abrir alternador de apps por mais de 1 s;
3. voltar;
4. verificar incidente;
5. repetir por menos de 1 s;
6. verificar suspicious sem penalidade automática no padrão;
7. trocar de aba;
8. pressionar Home;
9. bloquear e desbloquear a tela;
10. receber notificação;
11. abrir central de notificações;
12. provocar refresh;
13. desligar Wi-Fi por 5 s e religar;
14. validar reconexão.

Registrar comportamento diferente entre iOS e Android.

## Teste de rede em sala

### Pré-requisito

Computador e celulares na mesma rede.

Checklist:

- Host responde em `0.0.0.0`;
- IP privado correto detectado;
- firewall permite a porta;
- QR abre no celular;
- 8 celulares conseguem permanecer conectados;
- latência percebida adequada;
- projetor e Host funcionam simultaneamente.

### Carga mínima do MVP

Simular pelo menos 20 conexões WebSocket concorrentes mesmo que a turma esperada seja menor.

## Teste de 30 minutos

Realizar um ensaio com cronômetro real.

Meta:

- QR e entrada: <= 2 min 30 s;
- foco: <= 1 min 30 s;
- warmup: <= 2 min;
- investigação: <= 10 min;
- blitz: <= 5 min;
- cadeia final: <= 4 min;
- revelação/ranking: <= 3 min;
- fechamento: <= 2 min.

A soma deve permanecer dentro de 30 minutos sem depender de fala longa do facilitador.

## Teste de usabilidade

Pedir a uma pessoa que não participou do desenvolvimento para:

1. iniciar o servidor usando apenas README;
2. criar sessão;
3. projetar QR;
4. entrar como equipe;
5. concluir uma rodada;
6. localizar um incidente de foco;
7. desfazer penalidade;
8. exportar resultados.

Anotar qualquer etapa que exija explicação verbal adicional.

## Critérios de aceite do MVP

O MVP está pronto para piloto quando todos forem verdadeiros:

- [x] servidor sobe com um comando documentado;
- [ ] abertura reproduz vídeo e áudio localmente e possui fallback;
- [x] QR usa IP local válido;
- [ ] pelo menos quatro celulares entram sem cadastro;
- [ ] Host e Screen recebem atualizações em tempo real;
- [ ] todas as fases do modo 30 min funcionam;
- [ ] conteúdo não futuro não vaza para o cliente;
- [x] score é autoritativo no servidor;
- [ ] troca de aba/app gera evento de integridade;
- [x] ZERO_ROUND funciona;
- [x] Host consegue desfazer penalidade;
- [x] reconexão restaura equipe;
- [x] build funciona sem CDN em runtime;
- [ ] interface é utilizável em 360 px;
- [ ] fluxo completo cabe em 30 minutos;
- [x] resultados podem ser exportados;
- [x] documentação de execução está atualizada.

## Critérios para sala real

Além do MVP técnico:

- [x] logo oficial da LAGEM inserido ou placeholder aprovado;
- [ ] professor revisou as perguntas;
- [ ] imagens utilizadas possuem permissão ou foram redesenhadas;
- [ ] teste feito na mesma rede/sala ou em ambiente equivalente;
- [ ] existe um segundo facilitador com acesso ao Host;
- [ ] Plano B impresso ou versão simples disponível em caso de falha de rede.
