from typing import Any

from pydantic import ValidationError

from app.channels.whatsapp.schemas import TextMessage


def _objects(value: Any) -> list[dict[str, Any]]:
    return [item for item in value if isinstance(item, dict)] if isinstance(value, list) else []


def parse_messages(payload: dict[str, Any]) -> list[TextMessage]:
    messages: list[TextMessage] = []
    if payload.get("object") != "whatsapp_business_account":
        return messages
    for entry in _objects(payload.get("entry")):
        for change in _objects(entry.get("changes")):
            value = change.get("value")
            if change.get("field") != "messages" or not isinstance(value, dict):
                continue
            metadata = value.get("metadata")
            if not isinstance(metadata, dict):
                continue
            for raw in _objects(value.get("messages")):
                if raw.get("type") != "text" or not isinstance(raw.get("text"), dict):
                    continue
                name = None
                for contact in _objects(value.get("contacts")):
                    if contact.get("wa_id") == raw.get("from"):
                        profile = contact.get("profile")
                        if isinstance(profile, dict):
                            name = profile.get("name")
                try:
                    messages.append(TextMessage(
                        sender=raw.get("from"), name=name, text=raw["text"].get("body"),
                        message_id=raw.get("id"), phone_number_id=metadata.get("phone_number_id"),
                        timestamp=raw.get("timestamp"),
                    ))
                except ValidationError:
                    continue
    return messages
