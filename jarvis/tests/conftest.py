import pytest
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import create_app


@pytest.fixture
def settings() -> Settings:
    return Settings(app_env="test", whatsapp_verify_token="test-verify",
                    whatsapp_access_token="test-access", whatsapp_phone_number_id="123456")


@pytest.fixture
def client(settings):
    with TestClient(create_app(settings)) as client:
        yield client


@pytest.fixture
def payload():
    return {"object": "whatsapp_business_account", "entry": [{"id": "789", "changes": [{
        "field": "messages", "value": {
            "metadata": {"phone_number_id": "123456"},
            "contacts": [{"wa_id": "5511999998888", "profile": {"name": "Maria"}}],
            "messages": [{"from": "5511999998888", "id": "wamid.test", "timestamp": "1700000000",
                          "type": "text", "text": {"body": "Olá Jarvis"}}],
        }}]}]}
