# FemFlow Ops

Ferramenta local para publicar uma semana FemFlow no Google Tasks e no Google Calendar a partir de um `tasks.json`.

## Instalar dependencias

No PowerShell, a partir da raiz do repositorio:

```powershell
cd tools\femflow-ops
py -m venv .venv
.\.venv\Scripts\activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

## Credenciais locais

Coloque o `credentials.json` nesta pasta (`tools/femflow-ops`). O OAuth vai criar/atualizar `token.json` localmente no primeiro uso. Esses arquivos sao ignorados pelo git.

## Criar tasks.json

Use `tasks.example.json` como modelo para montar o `tasks.json` local:

```powershell
Copy-Item tasks.example.json tasks.json
```

Cada item precisa ter:

```json
{
  "title": "RevenueCat alignment audit",
  "notes": "Conferir produtos, entitlements e paywalls ativos antes do ciclo de release.",
  "date": "2026-05-25",
  "start": "08:30",
  "end": "09:15"
}
```

## Rodar dry-run

O dry-run nao autentica e nao grava nada no Google:

```powershell
python create_plan.py --dry-run --tasks-file tasks.json --prefix "[FemFlow Ops]"
```

## Aplicar de verdade

```powershell
python create_plan.py --tasks-file tasks.json --prefix "[FemFlow Ops]"
```

O script evita duplicacao:

- Tasks com mesmo titulo e notes sao puladas.
- Eventos com mesmo titulo, data e horario sao atualizados se as notes mudaram.
- Eventos ja iguais sao pulados.

## Limpar e recriar a semana

Para remover eventos do Calendar com o prefixo nas semanas cobertas pelo `tasks.json` e recriar:

```powershell
python create_plan.py --clear-week --tasks-file tasks.json --prefix "[FemFlow Ops]"
```

`--clear-week` exige prefixo nao vazio para evitar remover eventos fora do escopo FemFlow.

## Usar por arquivo .bat

`apply_tasks.example.bat` e um modelo seguro. Mantenha ajustes pessoais em `apply_tasks.local.bat`, que tambem fica ignorado pelo git.

Fluxo recomendado:

1. Atualize `tasks.json`.
2. Rode dry-run.
3. Revise os horarios.
4. Execute `apply_tasks.local.bat` ou o comando Python de aplicacao.

## Usar com ChatGPT/Codex

Peca para o ChatGPT/Codex atualizar `tasks.example.json` ou gerar um novo `tasks.json` local com a sua semana. Depois revise o arquivo e rode o dry-run antes de publicar no Google.

Exemplo:

```text
Atualize tools/femflow-ops/tasks.json com minha semana FemFlow de segunda a quarta, das 08h30 as 11h30, priorizando RevenueCat e release Android/iOS. Nao execute create_plan.py.
```

Veja `PROMPTS.md` para prompts prontos.
