import argparse
import json
import os
from pathlib import Path
from typing import Any

from openai import OpenAI

BASE_DIR = Path(__file__).resolve().parent
DEFAULT_PROMPT_FILE = "pedido.txt"
DEFAULT_OUTPUT_FILE = "tasks.json"
DEFAULT_MODEL = "gpt-4.1-mini"

SYSTEM_PROMPT = """Voce e um planejador operacional da FemFlow Ops.
Retorne somente JSON valido (sem markdown), no formato de lista de objetos.
Cada objeto deve conter obrigatoriamente: title, notes, date, start, end.
Campos opcionais permitidos: priority, phase.

Regras obrigatorias:
- Transformar processos complexos em tarefas diarias executaveis.
- Identificar objetivo macro.
- Quebrar em fases.
- Distribuir por dias.
- Quebrar cada dia em blocos de 45 ou 60 minutos (ou no slot informado).
- Respeitar integralmente start-date, days, start-time, end-time e slot-minutes.
- Priorizar P0 antes de P1 e P2.
- Nao criar tarefa vaga; cada tarefa precisa de saida concreta.
- notes deve conter, nesta ordem:
  Objetivo
  Subtarefas
  Validacao
  Criterio de conclusao
  Risco
- Nao criar eventos fora da janela.
- Nao sobrepor eventos.
- Se o processo for maior que o tempo disponivel, incluir excedente como \"Backlog sugerido\" nas notes do ultimo evento.
- Gerar apenas JSON valido, sem explicacoes adicionais.
"""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Gera tasks.json da FemFlow Ops por prompt, sem publicar no Google."
    )
    parser.add_argument("--prompt-file", default=DEFAULT_PROMPT_FILE)
    parser.add_argument("--output", default=DEFAULT_OUTPUT_FILE)
    parser.add_argument("--start-date", required=True)
    parser.add_argument("--days", type=int, required=True)
    parser.add_argument("--start-time", required=True)
    parser.add_argument("--end-time", required=True)
    parser.add_argument("--slot-minutes", type=int, required=True)
    parser.add_argument("--model", default=DEFAULT_MODEL)
    return parser.parse_args()


def resolve_path(path_str: str) -> Path:
    path = Path(path_str)
    if path.is_absolute():
        return path
    cwd_path = Path.cwd() / path
    if cwd_path.exists() or cwd_path.parent.exists():
        return cwd_path
    return BASE_DIR / path


def load_local_env_if_exists() -> None:
    env_path = BASE_DIR / ".env"
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


def read_prompt_file(prompt_file: Path) -> str:
    if not prompt_file.exists():
        raise FileNotFoundError(
            f"Arquivo de prompt nao encontrado: {prompt_file}. "
            "Crie pedido.txt a partir de pedido.example.txt."
        )

    content = prompt_file.read_text(encoding="utf-8").strip()
    if not content:
        raise ValueError(f"Arquivo de prompt vazio: {prompt_file}")
    return content


def build_user_prompt(prompt_text: str, args: argparse.Namespace) -> str:
    planning_params = {
        "start_date": args.start_date,
        "days": args.days,
        "start_time": args.start_time,
        "end_time": args.end_time,
        "slot_minutes": args.slot_minutes,
    }
    return (
        "Pedido em linguagem natural:\n"
        f"{prompt_text}\n\n"
        "Parametros de planejamento (obrigatorios):\n"
        f"{json.dumps(planning_params, ensure_ascii=False, indent=2)}\n\n"
        "Retorne somente JSON valido no formato solicitado."
    )


def extract_json(content: str) -> Any:
    try:
        return json.loads(content)
    except json.JSONDecodeError as exc:
        raise ValueError("A resposta do modelo nao veio em JSON valido.") from exc


def validate_tasks(data: Any) -> list[dict[str, Any]]:
    if not isinstance(data, list):
        raise ValueError("JSON invalido: esperado uma lista de tarefas.")

    required = {"title", "notes", "date", "start", "end"}
    optional = {"priority", "phase"}
    validated: list[dict[str, Any]] = []

    for idx, item in enumerate(data, start=1):
        if not isinstance(item, dict):
            raise ValueError(f"Tarefa #{idx} invalida: esperado objeto JSON.")

        missing = sorted(required - set(item.keys()))
        if missing:
            raise ValueError(
                f"Tarefa #{idx} sem campos obrigatorios: {', '.join(missing)}"
            )

        cleaned: dict[str, Any] = {}
        for key in required | optional:
            if key in item:
                cleaned[key] = str(item[key]).strip()

        validated.append(cleaned)

    return validated


def main() -> None:
    args = parse_args()
    load_local_env_if_exists()

    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError(
            "OPENAI_API_KEY nao encontrado. Configure no ambiente ou no arquivo .env local."
        )

    prompt_file = resolve_path(args.prompt_file)
    output_file = resolve_path(args.output)

    prompt_text = read_prompt_file(prompt_file)
    user_prompt = build_user_prompt(prompt_text, args)

    client = OpenAI(api_key=api_key)
    response = client.responses.create(
        model=args.model,
        input=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
    )

    content = response.output_text.strip()
    data = extract_json(content)
    tasks = validate_tasks(data)

    output_file.parent.mkdir(parents=True, exist_ok=True)
    output_file.write_text(
        json.dumps(tasks, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    print(f"tasks.json gerado com sucesso em: {output_file}")
    print("Nenhuma publicacao no Google foi executada.")


if __name__ == "__main__":
    main()
