import pytest

from app.channels.whatsapp.parser import parse_messages


def test_text(payload):
    message, = parse_messages(payload)
    assert message.model_dump() == {
        "sender": "5511999998888", "name": "Maria", "text": "Olá Jarvis",
        "message_id": "wamid.test", "phone_number_id": "123456", "timestamp": "1700000000",
    }


@pytest.mark.parametrize("payload", [{}, {"object": "whatsapp_business_account", "entry": None},
    {"object": "whatsapp_business_account", "entry": [{"changes": [None, {"value": None}]}]}])
def test_without_messages(payload):
    assert parse_messages(payload) == []


def test_status_and_unsupported(payload):
    value = payload["entry"][0]["changes"][0]["value"]
    value["messages"] = [{"type": "image"}, {"type": "text", "text": None}]
    value["statuses"] = [{"status": "delivered"}]
    assert parse_messages(payload) == []


def test_batch_and_missing_name(payload):
    value = payload["entry"][0]["changes"][0]["value"]
    value["contacts"] = []
    value["messages"].append({**value["messages"][0], "id": "wamid.other"})
    messages = parse_messages(payload)
    assert len(messages) == 2
    assert messages[0].name is None
