import argparse
import json
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

SCOPES = [
    "https://www.googleapis.com/auth/tasks",
    "https://www.googleapis.com/auth/calendar",
]

BASE_DIR = Path(__file__).resolve().parent
TOKEN_FILE = BASE_DIR / "token.json"
CREDENTIALS_FILE = BASE_DIR / "credentials.json"
DEFAULT_TASKS_FILE = "tasks.json"
DEFAULT_PREFIX = "[FemFlow Ops]"
TASKLIST_ID = "@default"
CALENDAR_ID = "primary"
TIME_ZONE = "America/Sao_Paulo"
SAO_PAULO_OFFSET = "-03:00"


@dataclass
class Stats:
    tasks_created: int = 0
    tasks_skipped: int = 0
    events_created: int = 0
    events_updated: int = 0
    events_skipped: int = 0
    events_deleted: int = 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Publica tarefas FemFlow no Google Tasks e Google Calendar."
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Mostra o que seria criado sem autenticar nem gravar no Google.",
    )
    parser.add_argument(
        "--prefix",
        default=DEFAULT_PREFIX,
        help=f"Prefixo aplicado aos titulos. Padrao: {DEFAULT_PREFIX!r}.",
    )
    parser.add_argument(
        "--clear-week",
        action="store_true",
        help="Remove eventos do Calendar com o prefixo nas semanas das tarefas antes de recriar.",
    )
    parser.add_argument(
        "--tasks-file",
        default=DEFAULT_TASKS_FILE,
        help="Arquivo JSON de entrada. Padrao: tasks.json.",
    )

    return parser.parse_args()


def resolve_tasks_file(tasks_file: str) -> Path:
    path = Path(tasks_file)

    if path.is_absolute():
        return path

    cwd_path = Path.cwd() / path
    if cwd_path.exists():
        return cwd_path

    return BASE_DIR / path


def normalize_prefix(prefix: str) -> str:
    return prefix.strip()


def title_with_prefix(title: str, prefix: str) -> str:
    clean_title = title.strip()

    if not prefix:
        return clean_title

    if clean_title.startswith(prefix):
        return clean_title

    return f"{prefix} {clean_title}"


def load_tasks(tasks_file: Path) -> list[dict[str, str]]:
    if not tasks_file.exists():
        print(f"ALERTA: arquivo de tarefas nao encontrado: {tasks_file}")
        print("Crie um tasks.json local a partir de tasks.example.json ou use --tasks-file.")
        return []

    with tasks_file.open("r", encoding="utf-8") as file:
        data = json.load(file)

    if not isinstance(data, list):
        raise ValueError("O arquivo de tarefas precisa ser uma lista JSON.")

    required_fields = {"title", "notes", "date", "start", "end"}
    tasks: list[dict[str, str]] = []

    for index, item in enumerate(data, start=1):
        if not isinstance(item, dict):
            raise ValueError(f"Tarefa #{index} precisa ser um objeto JSON.")

        missing_fields = sorted(required_fields - set(item))
        if missing_fields:
            missing = ", ".join(missing_fields)
            raise ValueError(f"Tarefa #{index} esta sem campos obrigatorios: {missing}")

        task = {field: str(item[field]).strip() for field in required_fields}
        datetime.fromisoformat(f"{task['date']}T{task['start']}:00")
        datetime.fromisoformat(f"{task['date']}T{task['end']}:00")
        tasks.append(task)

    return tasks


def authenticate():
    creds = None

    if TOKEN_FILE.exists():
        creds = Credentials.from_authorized_user_file(
            TOKEN_FILE,
            SCOPES,
        )

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                CREDENTIALS_FILE,
                SCOPES,
            )
            creds = flow.run_local_server(port=0)

        with TOKEN_FILE.open("w", encoding="utf-8") as token:
            token.write(creds.to_json())

    return creds


def rfc3339_at_start_of_day(day: date) -> str:
    return f"{day.isoformat()}T00:00:00{SAO_PAULO_OFFSET}"


def task_datetime(task: dict[str, str], field: str) -> str:
    return f"{task['date']}T{task[field]}:00"


def event_body(task: dict[str, str], title: str) -> dict[str, Any]:
    return {
        "summary": title,
        "description": task["notes"],
        "start": {
            "dateTime": task_datetime(task, "start"),
            "timeZone": TIME_ZONE,
        },
        "end": {
            "dateTime": task_datetime(task, "end"),
            "timeZone": TIME_ZONE,
        },
    }


def iso_local_key(value: str | None) -> str:
    if not value:
        return ""

    return value[:19]


def list_google_tasks(service) -> list[dict[str, Any]]:
    tasks: list[dict[str, Any]] = []
    page_token = None

    while True:
        request = service.tasks().list(
            tasklist=TASKLIST_ID,
            showCompleted=True,
            showDeleted=False,
            showHidden=True,
            maxResults=100,
            pageToken=page_token,
        )
        response = request.execute()
        tasks.extend(response.get("items", []))
        page_token = response.get("nextPageToken")

        if not page_token:
            return tasks


def find_existing_task(existing_tasks: list[dict[str, Any]], title: str, notes: str):
    for task in existing_tasks:
        if task.get("title") == title and task.get("notes", "") == notes:
            return task

    return None


def create_google_task(
    service,
    existing_tasks: list[dict[str, Any]],
    title: str,
    notes: str,
    stats: Stats,
):
    existing_task = find_existing_task(existing_tasks, title, notes)

    if existing_task:
        print(f"Task pulada: {title}")
        stats.tasks_skipped += 1
        return existing_task

    task = {
        "title": title,
        "notes": notes,
    }

    result = service.tasks().insert(
        tasklist=TASKLIST_ID,
        body=task,
    ).execute()

    existing_tasks.append(result)
    stats.tasks_created += 1
    print(f"Task criada: {result['title']}")
    return result


def list_calendar_events(service, start_dt: str, end_dt: str, prefix: str) -> list[dict[str, Any]]:
    events: list[dict[str, Any]] = []
    page_token = None

    while True:
        request = service.events().list(
            calendarId=CALENDAR_ID,
            timeMin=start_dt,
            timeMax=end_dt,
            q=prefix or None,
            singleEvents=True,
            orderBy="startTime",
            pageToken=page_token,
        )
        response = request.execute()
        events.extend(response.get("items", []))
        page_token = response.get("nextPageToken")

        if not page_token:
            return events


def week_range(task_date: str) -> tuple[date, date]:
    parsed_date = date.fromisoformat(task_date)
    week_start = parsed_date - timedelta(days=parsed_date.weekday())
    return week_start, week_start + timedelta(days=7)


def unique_week_ranges(tasks: list[dict[str, str]]) -> list[tuple[date, date]]:
    weeks = {week_range(task["date"]) for task in tasks}
    return sorted(weeks, key=lambda item: item[0])


def clear_calendar_weeks(service, tasks: list[dict[str, str]], prefix: str, stats: Stats):
    for week_start, week_end in unique_week_ranges(tasks):
        events = list_calendar_events(
            service,
            rfc3339_at_start_of_day(week_start),
            rfc3339_at_start_of_day(week_end),
            prefix,
        )
        scoped_events = [
            event for event in events
            if event.get("summary", "").startswith(prefix)
        ]

        if not scoped_events:
            print(f"Nenhum evento para limpar na semana {week_start.isoformat()} a {week_end.isoformat()}.")
            continue

        for event in scoped_events:
            service.events().delete(
                calendarId=CALENDAR_ID,
                eventId=event["id"],
            ).execute()
            stats.events_deleted += 1
            print(f"Evento removido: {event.get('summary')} ({event.get('htmlLink', 'sem link')})")


def find_existing_event(events: list[dict[str, Any]], task: dict[str, str], title: str):
    expected_start = task_datetime(task, "start")
    expected_end = task_datetime(task, "end")

    for event in events:
        start = event.get("start", {}).get("dateTime")
        end = event.get("end", {}).get("dateTime")

        if (
            event.get("summary") == title
            and iso_local_key(start) == expected_start
            and iso_local_key(end) == expected_end
        ):
            return event

    return None


def create_or_update_calendar_event(
    service,
    task: dict[str, str],
    title: str,
    existing_events: list[dict[str, Any]],
    stats: Stats,
):
    existing_event = find_existing_event(existing_events, task, title)
    body = event_body(task, title)

    if existing_event:
        if existing_event.get("description", "") == task["notes"]:
            stats.events_skipped += 1
            print(f"Evento pulado: {title} ({existing_event.get('htmlLink', 'sem link')})")
            return existing_event

        updated_event = service.events().patch(
            calendarId=CALENDAR_ID,
            eventId=existing_event["id"],
            body=body,
        ).execute()
        stats.events_updated += 1
        print(f"Evento atualizado: {updated_event.get('htmlLink')}")
        return updated_event

    created_event = service.events().insert(
        calendarId=CALENDAR_ID,
        body=body,
    ).execute()
    existing_events.append(created_event)
    stats.events_created += 1
    print(f"Evento criado: {created_event.get('htmlLink')}")
    return created_event


def load_calendar_window(service, tasks: list[dict[str, str]], prefix: str) -> list[dict[str, Any]]:
    events: list[dict[str, Any]] = []

    for week_start, week_end in unique_week_ranges(tasks):
        events.extend(
            list_calendar_events(
                service,
                rfc3339_at_start_of_day(week_start),
                rfc3339_at_start_of_day(week_end),
                prefix,
            )
        )

    return events


def print_dry_run(tasks: list[dict[str, str]], prefix: str, clear_week: bool):
    print("Modo dry-run: nenhuma autenticacao ou gravacao sera feita no Google.")

    if clear_week:
        if prefix:
            for week_start, week_end in unique_week_ranges(tasks):
                print(
                    "Calendar: limparia eventos com prefixo "
                    f"{prefix!r} entre {week_start.isoformat()} e {week_end.isoformat()}."
                )
        else:
            print("ALERTA: --clear-week precisa de --prefix para proteger eventos fora do FemFlow.")

    for task in tasks:
        title = title_with_prefix(task["title"], prefix)
        print(
            "Criaria/atualizaria: "
            f"{title} | {task['date']} {task['start']}-{task['end']} | notes: {task['notes']}"
        )


def print_summary(stats: Stats):
    print("")
    print("Resumo:")
    print(f"- Tasks criadas: {stats.tasks_created}")
    print(f"- Tasks puladas: {stats.tasks_skipped}")
    print(f"- Eventos criados: {stats.events_created}")
    print(f"- Eventos atualizados: {stats.events_updated}")
    print(f"- Eventos pulados: {stats.events_skipped}")
    print(f"- Eventos removidos: {stats.events_deleted}")


def main():
    args = parse_args()
    prefix = normalize_prefix(args.prefix)
    tasks_file = resolve_tasks_file(args.tasks_file)
    tasks = load_tasks(tasks_file)

    print(f"Arquivo de tarefas: {tasks_file}")
    print(f"Tarefas lidas: {len(tasks)}")

    if not tasks:
        return 1

    if args.clear_week and not prefix:
        print("ALERTA: --clear-week requer um --prefix nao vazio para evitar remover eventos indevidos.")
        return 2

    if args.dry_run:
        print_dry_run(tasks, prefix, args.clear_week)
        return 0

    creds = authenticate()

    tasks_service = build("tasks", "v1", credentials=creds)
    calendar_service = build("calendar", "v3", credentials=creds)
    stats = Stats()

    if args.clear_week:
        clear_calendar_weeks(calendar_service, tasks, prefix, stats)

    existing_tasks = list_google_tasks(tasks_service)
    existing_events = load_calendar_window(calendar_service, tasks, prefix)

    for item in tasks:
        title = title_with_prefix(item["title"], prefix)

        create_google_task(
            tasks_service,
            existing_tasks,
            title,
            item["notes"],
            stats,
        )

        create_or_update_calendar_event(
            calendar_service,
            item,
            title,
            existing_events,
            stats,
        )

    print_summary(stats)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
