import os
import json
from datetime import datetime

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

SCOPES = [
    "https://www.googleapis.com/auth/tasks",
    "https://www.googleapis.com/auth/calendar"
]

TOKEN_FILE = "token.json"
CREDENTIALS_FILE = "credentials.json"

def authenticate():
    creds = None

    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(
            TOKEN_FILE,
            SCOPES
        )

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                CREDENTIALS_FILE,
                SCOPES
            )
            creds = flow.run_local_server(port=0)

        with open(TOKEN_FILE, "w") as token:
            token.write(creds.to_json())

    return creds

def create_google_task(service, title, notes):
    task = {
        "title": title,
        "notes": notes
    }

    result = service.tasks().insert(
        tasklist='@default',
        body=task
    ).execute()

    print(f"Task criada: {result['title']}")

def create_calendar_event(service, title, notes, date, start, end):
    start_dt = f"{date}T{start}:00"
    end_dt = f"{date}T{end}:00"

    event = {
        'summary': title,
        'description': notes,
        'start': {
            'dateTime': start_dt,
            'timeZone': 'America/Sao_Paulo',
        },
        'end': {
            'dateTime': end_dt,
            'timeZone': 'America/Sao_Paulo',
        },
    }

    created_event = service.events().insert(
        calendarId='primary',
        body=event
    ).execute()

    print(f"Evento criado: {created_event.get('htmlLink')}")

def main():
    creds = authenticate()

    tasks_service = build("tasks", "v1", credentials=creds)
    calendar_service = build("calendar", "v3", credentials=creds)

    with open("tasks.json", "r", encoding="utf-8") as f:
        tasks = json.load(f)

    for item in tasks:
        create_google_task(
            tasks_service,
            item["title"],
            item["notes"]
        )

        create_calendar_event(
            calendar_service,
            item["title"],
            item["notes"],
            item["date"],
            item["start"],
            item["end"]
        )

if __name__ == "__main__":
    main()