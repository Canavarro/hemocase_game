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

- `topicTags`: tags obrigatórias do caso (vocabulário `escapeTopics`). O caso só é sorteado se o professor liberar todas;
- `rooms`: seis salas `R0`–`R5`, cada uma com `steps` na ordem de resolução. Passos com `optional: true` são arquivos de emergência e são filtrados pelas tags liberadas;
- cada passo referencia um `object` da cenografia do cliente (`apps/web/src/escape/scenes.tsx`) e declara exatamente 3 `hints` progressivas;
- `answers`: gabarito por `stepId`, separado dos passos — nunca é enviado ao cliente. Tipos ordenados (`chain-fill`, `mechanism-fill`, `dial-safe`, `code`) comparam em ordem; `board-select` e `assemble` comparam como conjunto/multiconjunto;
- `debrief`: diagnóstico e rota molecular exibidos ao escapar.

Regras editoriais: mesmas do quiz (linguagem pt-BR, precisão científica revisada pelo professor). Um caso novo não exige mudança de código, desde que use os tipos de enigma existentes e objetos de cena já mapeados.
