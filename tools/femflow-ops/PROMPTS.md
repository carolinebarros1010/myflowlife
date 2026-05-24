# Prompts FemFlow Ops

Use estes prompts para gerar ou reorganizar `tools/femflow-ops/tasks.json`. Sempre revise o arquivo e rode `--dry-run` antes de publicar no Google.

## Organizar semana

```text
Organize minha semana FemFlow de segunda a quarta das 08h30 as 11h30. Gere tools/femflow-ops/tasks.json usando o formato de tasks.example.json. Priorize blocos curtos, operacionalmente claros, e nao execute create_plan.py.
```

## Adicionar tarefa

```text
Adicione uma tarefa na terca as 10h em tools/femflow-ops/tasks.json. Preserve as demais tarefas, evite sobreposicao de horarios e nao execute create_plan.py.
```

## Priorizar RevenueCat

```text
Reorganize o dia priorizando RevenueCat. Mantenha a agenda entre 08h30 e 11h30, ajuste os blocos existentes em tools/femflow-ops/tasks.json e nao execute create_plan.py.
```

## Limpar duplicados

```text
Limpe duplicados e gere novo tasks.json. Considere duplicadas as tarefas com mesmo titulo, data, start, end e notes. Preserve apenas a versao mais clara e nao execute create_plan.py.
```

## Sprint release iOS/Android

```text
Prepare sprint de release iOS/Android para FemFlow em tools/femflow-ops/tasks.json. Inclua blocos para RevenueCat, Capacitor sync, Android launchMode, auditoria PWA iOS/WebKit e revisao final. Nao execute create_plan.py.
```
