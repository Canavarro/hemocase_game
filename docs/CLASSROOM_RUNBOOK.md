# Operação em sala

## Quinze minutos antes

1. Conecte o computador Host e os celulares à mesma rede Wi-Fi.
2. Desative VPNs e confirme que o firewall permite conexões Node.js na rede privada.
3. Na raiz do projeto, execute `npm run game`.
4. Abra `http://127.0.0.1:3000/host` no computador.
5. Confirme no terminal o endereço indicado como `Acesso na rede local`.
6. Crie uma sessão e abra a tela do projetor pelo painel.
7. Reproduza alguns segundos da fita, confira imagem e volume e recarregue a tela do projetor para reiniciar a abertura.
8. Use um celular real para ler o QR Code e confirmar que a página de entrada abre.
9. Apague a equipe de teste reiniciando a sessão ou crie uma nova sessão.
10. Mantenha carregadores disponíveis e desative a suspensão automática do computador Host.

## Execução dos 30 minutos

1. Reproduza a fita no projetor antes de iniciar o relógio oficial.
2. Aguarde as equipes entrarem pelo QR Code e confirme os indicadores verdes no painel.
3. Avance para `Protocolo de foco` e peça que todas as equipes ativem o modo de jogo.
4. Use `Avançar` somente quando a turma estiver pronta; o servidor também avança questões quando o prazo termina.
5. Em uma interrupção de sala, use `Pausar`; o relógio será retomado do mesmo ponto.
6. Acompanhe respostas pendentes e incidentes sem revelar alternativas corretas.
7. Reverta uma penalidade somente com justificativa registrada.
8. Na revelação, permita que o projetor mostre a matriz e o ranking.
9. Exporte CSV e JSON antes de fechar o servidor.

## Contingências

- Vídeo sem áudio: use `Ativar som`; se a mídia falhar, escolha `Continuar sem vídeo`.
- Celular desconectado: reabra o mesmo endereço no aparelho; o token local restaura a equipe.
- QR Code não abre: confirme que o celular está no mesmo Wi-Fi e digite a URL local mostrada no projetor.
- Endereço de rede incorreto no PowerShell: encerre o servidor, execute `$env:HOST_IP = "192.168.x.x"` e depois `npm run game`. Em Bash, use `HOST_IP=192.168.x.x npm run game`.
- Projetor travado: recarregue somente a tela `/screen`; o estado oficial permanece no servidor.
- Host precisa corrigir pontuação: use o controle ao lado das bases da equipe e registre o motivo.

## Encerramento

1. Confirme que a exportação foi baixada.
2. Encerre o processo com `Ctrl+C`.
3. Não compartilhe tokens do Host nem arquivos de relatório fora da finalidade da atividade.
