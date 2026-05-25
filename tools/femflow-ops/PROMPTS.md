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

## Organizar processo complexo em 3 dias

```text
Organize o processo completo de estabilizacao do FemFlow em 3 dias, de segunda a quarta, das 08h30 as 11h30. Quebre em fases, priorize P0 antes de P1/P2 e gere tasks.json sem sobreposicao de horarios e sem executar create_plan.py.
```

## Criar semana de release iOS/Android

```text
Crie uma semana de release iOS/Android com foco em RevenueCat, Capacitor sync, PWA iOS/WebKit, validacao Android e observabilidade. Estruture tarefas com saida concreta em blocos de 45 ou 60 minutos e gere apenas tasks.json, sem publicar no Google.
```

## Reorganizar dia priorizando billing

```text
Reorganize o dia priorizando billing/RevenueCat entre 08h30 e 11h30. Reordene os blocos existentes com prioridade P0 e mantenha tarefas objetivas com criterio de conclusao. Atualize tasks.json e nao execute create_plan.py.
```

## Adicionar tarefa pontual

```text
Adicione uma tarefa pontual hoje as 10h30 em tasks.json sem sobrepor horarios. Inclua objetivo, subtarefas, validacao, criterio de conclusao e risco nas notes. Nao publique no Google.
```

## Preparar sprint de auditoria PWA

```text
Prepare uma sprint de auditoria PWA para iOS/WebKit, cache, manifest, service worker e telemetria. Distribua em dias e blocos executaveis, com fases e prioridade, gerando somente tasks.json.
```

## Gerar tasks.json sem publicar no Google

```text
Gere tools/femflow-ops/tasks.json a partir de um pedido em linguagem natural, respeitando janela diaria e sem executar create_plan.py. Retorne somente JSON valido compativel com create_plan.py.
```
