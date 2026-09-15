import hashlib
import hmac
import json
import logging

import httpx
import pytest
from fastapi.testclient import TestClient
from pydantic import SecretStr, ValidationError

from app.core.config import Settings
from app.main import create_app


def test_complete_reply(settings, payload, caplog):
    sent = []
    def handler(request):
        sent.append(request)
        return httpx.Response(200, json={"messages": [{"id": "outgoing"}]})
    with TestClient(create_app(settings, httpx.MockTransport(handler))) as client:
        with caplog.at_level(logging.INFO):
            assert client.post("/webhook", json=payload).status_code == 200
    assert len(sent) == 1
    assert str(sent[0].url) == "https://graph.facebook.com/v26.0/123456/messages"
    assert sent[0].headers["authorization"] == "Bearer test-access"
    assert json.loads(sent[0].content) == {"messaging_product": "whatsapp", "to": "5511999998888",
        "type": "text", "text": {"body": "Jarvis online. Mensagem recebida: Olá Jarvis"}}
    assert "wamid.test" in caplog.text and "***8888" in caplog.text
    for private in ("test-access", "test-verify", "5511999998888", "Olá Jarvis"):
        assert private not in caplog.text


@pytest.mark.parametrize("failure", ["http", "timeout"])
def test_send_failure(settings, payload, caplog, failure):
    def handler(request):
        if failure == "timeout":
            raise httpx.ReadTimeout("private test-access", request=request)
        return httpx.Response(401, text="private test-access")
    with TestClient(create_app(settings, httpx.MockTransport(handler))) as client:
        assert client.post("/webhook", json=payload).status_code == 200
    assert "Falha no envio" in caplog.text
    assert "test-access" not in caplog.text


def test_signature(settings, payload):
    settings.whatsapp_app_secret = SecretStr("test-secret")
    body = json.dumps({"object": "whatsapp_business_account"}).encode()
    signature = "sha256=" + hmac.new(b"test-secret", body, hashlib.sha256).hexdigest()
    with TestClient(create_app(settings)) as client:
        assert client.post("/webhook", content=body).status_code == 403
        assert client.post("/webhook", content=body,
                           headers={"x-hub-signature-256": signature}).status_code == 200
        assert client.post("/webhook", content=body + b" ",
                           headers={"x-hub-signature-256": signature}).status_code == 403


def test_invalid_payload(client):
    assert client.post("/webhook", content="not-json").status_code == 400
    assert client.post("/webhook", json=[]).status_code == 400
    assert client.post("/webhook", content=b"x" * 1_048_577).status_code == 413
    assert client.post("/webhook", json={}).status_code == 200


def test_other_phone_ignored(settings, payload):
    def handler(request):
        pytest.fail("Não deve enviar para outro phone_number_id")
    payload["entry"][0]["changes"][0]["value"]["metadata"]["phone_number_id"] = "999"
    with TestClient(create_app(settings, httpx.MockTransport(handler))) as client:
        assert client.post("/webhook", json=payload).status_code == 200


def test_production_requires_credentials():
    with pytest.raises(ValidationError):
        Settings(app_env="production")
