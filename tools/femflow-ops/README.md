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

## Gerar tarefas por prompt

Fluxo seguro para ambiente online/local (sem publicar no Google):

1. Criar `pedido.txt` local a partir de `pedido.example.txt`.
2. Criar `.env` local a partir de `.env.example`.
3. Configurar `OPENAI_API_KEY` no `.env` local.
4. Rodar `generate_tasks.py` para gerar `tasks.json`.
5. Revisar o `tasks.json` gerado.
6. Rodar `create_plan.py` em modo `--dry-run`.
7. Aplicar no Google apenas no servidor fixo/local autorizado.

Comandos Windows:

```powershell
cd tools\femflow-ops
.\.venv\Scripts\activate
python generate_tasks.py --prompt-file pedido.txt --output tasks.json --start-date 2026-05-25 --days 3 --start-time 08:30 --end-time 11:30 --slot-minutes 60
python create_plan.py --dry-run --tasks-file tasks.json --prefix "[FemFlow Ops]"
python create_plan.py --clear-week --tasks-file tasks.json --prefix "[FemFlow Ops]"
```

Importante:
- `create_plan.py` so deve ser executado contra Google no servidor fixo/local autorizado.
- Em ambiente online, use apenas validacao estaticas como `python -m py_compile`.
- `generate_tasks.py` apenas gera JSON e nao chama publicacao no Google.

## Aplicar plano ja validado

Use este fluxo quando voce ja possui um `tasks.json` revisado e quer aplicar com seguranca, com validacao previa e confirmacao humana explicita.

### Fluxo A — vindo de chat comum

1. ChatGPT organiza processo complexo e entrega JSON.
2. Usuario cola o conteudo em `tools/femflow-ops/tasks.json` local.
3. Usuario roda `validate_tasks.py`.
4. Usuario roda `create_plan.py --dry-run`.
5. Usuario aplica somente apos confirmacao explicita.

### Fluxo B — vindo de generate_tasks.py

1. Usuario escreve `pedido.txt` local.
2. Usuario roda `generate_tasks.py` para gerar `tasks.json`.
3. Usuario valida `tasks.json` com `validate_tasks.py`.
4. Usuario roda `create_plan.py --dry-run`.
5. Usuario aplica somente apos confirmacao explicita.

### Comandos Windows

```powershell
cd tools\femflow-ops
.\.venv\Scripts\activate

python validate_tasks.py --tasks-file tasks.json
python create_plan.py --dry-run --tasks-file tasks.json --prefix "[FemFlow Ops]"
python create_plan.py --clear-week --tasks-file tasks.json --prefix "[FemFlow Ops]"

copy apply_validated_plan.example.bat apply_validated_plan.local.bat
.\apply_validated_plan.local.bat
```

### Regras de seguranca operacional

- Publicacao real no Google Calendar/Tasks so deve acontecer no servidor fixo/local autorizado.
- Em ambiente online, usar apenas `py_compile` e validacoes que nao chamem Google.
- Nunca versionar `credentials.json`, `token.json`, `tasks.json`, `.env`, `pedido.txt` ou `.venv`.
- O arquivo `apply_validated_plan.local.bat` e local e deve permanecer ignorado no git.
