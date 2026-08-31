# Guia de conteúdo

## Fontes

`docs/GAME_CONTENT.md` é a fonte editorial e científica. `content/game.pt-BR.json` é a representação executável carregada pelo servidor.

Uma alteração científica deve ser revisada no documento editorial e no JSON. Não coloque perguntas, explicações ou respostas dentro de componentes React ou do motor.

## Estrutura do arquivo

```json
{
  "warmup": [],
  "cases": { "A": [], "B": [], "C": [], "D": [] },
  "blitz": [],
  "finalChains": []
}
```

Trilhos:

- `A`: anemia falciforme;
- `B`: beta-talassemia;
- `C`: hemofilia A ou B;
- `D`: von Willebrand versus Bernard-Soulier.

## Formato de questão

```json
{
  "id": "A1",
  "phase": "CASE_INVESTIGATION",
  "track": "A",
  "title": "A paciente",
  "prompt": "Pergunta exibida à equipe",
  "evidence": ["Pista opcional"],
  "choices": [
    { "id": "A", "text": "Alternativa" },
    { "id": "B", "text": "Alternativa" }
  ],
  "correctChoiceId": "A",
  "explanation": "Explicação liberada na revelação",
  "points": 8,
  "durationSec": 60
}
```

Regras:

- `id` deve ser único em todo o arquivo;
- `phase` deve corresponder ao bloco em que a questão está;
- `track` aparece apenas em questões de caso;
- `correctChoiceId` deve existir em `choices`;
- alternativas devem ter IDs curtos e estáveis;
- `points` e `durationSec` devem ser inteiros positivos;
- `explanation` deve justificar a resposta sem oferecer orientação clínica individual;
- `evidence` deve ser curto o suficiente para telas verticais.

## Pontuação

Pontuação-base planejada:

| Fase | Bases |
|---|---:|
| Desbloqueio molecular | 10 |
| Investigação principal | 50 |
| Código relâmpago | 20 |
| Mecanismo final | 20 |

O servidor pode adicionar bônus de tempo de até 20% dos pontos da questão. Portanto, 100 é a base pedagógica; o total técnico máximo pode chegar a aproximadamente 120.

Ao alterar pontos, verifique a soma de cada trilho. Os quatro trilhos principais devem permanecer equivalentes.

## Caso C

O motor espera sete entradas em `cases.C` nesta ordem:

1. C1;
2. C2;
3. C3;
4. C4A;
5. C4B;
6. C5A;
7. C5B.

A sessão sorteia uma variante A/B e apresenta cinco questões: C1, C2, C3, uma C4 e a C5 correspondente. Alterar essa ordem exige mudança no motor.

## Cadeia final

A equipe recebe uma cadeia diferente de seu trilho principal. A seleção usa deslocamento circular entre A, B, C e D. Mantenha pelo menos quatro cadeias finais.

## Checklist editorial

1. Confirmar terminologia e recorte da aula.
2. Confirmar que apenas uma alternativa é correta.
3. Conferir gene, proteína, herança, laboratório e fenótipo.
4. Evitar valores laboratoriais desnecessários ou não revisados.
5. Evitar doses, condutas individuais e aconselhamento clínico.
6. Validar acentos e leitura em português do Brasil.
7. Executar `npm test`, `npm run typecheck` e `npm run build`.
8. Realizar ensaio de tempo quando duração ou quantidade de questões mudar.

## Limitação atual

O JSON é tipado após carregamento, mas ainda não passa por schema Zod completo em runtime. JSON inválido impede a inicialização; inconsistências semânticas devem ser detectadas por revisão e testes até a validação estrutural de conteúdo ser implementada.

## Conteúdo do modo Escape

Casos ficam em `content/escape/cases/*.json` seguindo o tipo `EscapeCase` de `@hemocase/shared`:

- `topicTags`: tags obrigatórias do caso (vocabulário `escapeTopics`). No sorteio, o caso só entra se o professor liberar todas; alternativamente o Host pode fixar a sessão em um caso específico (`caseId` na criação), e então os tópicos herdam as `topicTags` do caso — o jogo inteiro fica sobre uma única doença;
- `rooms`: seis salas `R0`–`R5`, cada uma com `steps` na ordem de resolução. Passos com `optional: true` são arquivos de emergência e são filtrados pelas tags liberadas;
- cada passo referencia um `object` da cenografia do cliente (`apps/web/src/escape/scenes.tsx`) e declara exatamente 3 `hints` progressivas;
- em passos `microscope`, cada alternativa de `choices` deve declarar `smear` (vocabulário `escapeSmearKinds`: `normal`, `falciforme`, `microcitica-hipocromica`, `plaquetas-gigantes`, `esferocitos`, `plaquetas-pequenas`, `celulas-alvo`) — é ele que define a morfologia desenhada ao focar cada lâmina, e as três lâminas devem mostrar esfregaços diferentes para a escolha ter resposta observável;
- `answers`: gabarito por `stepId`, separado dos passos — nunca é enviado ao cliente. Tipos ordenados (`chain-fill`, `mechanism-fill`, `dial-safe`, `code`) comparam em ordem; `board-select` e `assemble` comparam como conjunto/multiconjunto;
- `debrief`: diagnóstico e rota molecular exibidos ao escapar.

Regras editoriais: mesmas do quiz (linguagem pt-BR, precisão científica revisada pelo professor). Um caso novo não exige mudança de código, desde que use os tipos de enigma existentes e objetos de cena já mapeados.

## Bancos canônicos de conteúdo médico

`content/medical-knowledge.pt-BR.json` (fatos médicos) e `content/question-bank.pt-BR.json` (perguntas prontas) são as fontes canônicas — ver `docs/MEDICAL_KNOWLEDGE_BASE.md` para a regra de precedência. A aplicação os usa assim:

- validação estrutural na inicialização do servidor (`validateMedicalContent`): ids duplicados, gabarito sem opção, doença inexistente ou pontuação fora da regra de scoring falham com mensagem clara;
- o Código Relâmpago pode ser sorteado do banco de perguntas com filtros do Host (dificuldade, categoria, expansão) — ver `docs/API_PROTOCOL.md`;
- o banco de perguntas também alimenta os arquivos de emergência do modo Escape (filtrados pelos tópicos liberados e excluindo a doença do caso principal);
- cada perfil do Escape declara `medicalId` apontando para a entidade canônica; genes e padrão de herança são conferidos contra o canônico na inicialização (`validateDiseaseAgainstCanon`) — divergência derruba o servidor, o que torna mecânica a precedência do banco médico.

## Base de conhecimento de doenças (gerador de casos)

Além dos casos prontos, o servidor gera casos inéditos a partir de perfis de doença em `content/escape/diseases/*.json`, seguindo o tipo `DiseaseKnowledge` de `@hemocase/shared`. Cada perfil descreve a doença uma única vez e o gerador monta as seis salas sorteando paciente, senhas, distratores e ordem das alternativas (nos enigmas de girar, a resposta nunca fica na primeira posição do seletor). Campos principais:

- `group`: assunto para o filtro "por assunto" do Host (`hemoglobinopatias`, `coagulopatias`, `plaquetopatias`, `trombofilias`, `vasculopatias`);
- `topicTags`: tags obrigatórias (mesmo vocabulário `escapeTopics` dos casos prontos);
- `patient`: `descriptor` (ex.: "lactente, 8 meses") e `story` (gancho do briefing);
- `clinical`: `correct` (≥4 achados verdadeiros; o gerador sorteia 4) e `distractors` (≥4 achados falsos);
- `labs`: `altered` (2–5 exames com valor) e `normal` (≥2) — o código da câmara fria é derivado dessas contagens;
- `smear`: `kind` (vocabulário `escapeSmearKinds`) e `finding` — as duas lâminas erradas recebem morfologias diferentes automaticamente;
- `protein`: `assembly` (enigma de montagem, ex.: tetrâmero da Hb) OU `role` (pergunta de função); mais `defect`, `consequence` e `context` para a frase-mecanismo;
- `gene`: `sequence` (enigma de apontar o códon divergente) OU apenas `mutationSummary` (vira pergunta de alteração molecular, com distratores das outras doenças);
- `inheritance`: `pattern` (`ar`/`ad`/`xr`), `familyStory` (heredograma) e `recurrence` (pergunta da família);
- `route`: as cinco entradas corretas do cofre final — os distratores de cada seletor vêm das `route` das OUTRAS doenças instaladas;
- `emergencyFiles`: perguntas-bônus que a doença contribui para o pool de arquivos de emergência dos casos das demais (filtradas pelos tópicos liberados).

Quanto mais doenças instaladas, mais ricos ficam os distratores de todas. Um perfil inválido derruba a inicialização com uma mensagem apontando o campo problemático (`validateDisease`).
