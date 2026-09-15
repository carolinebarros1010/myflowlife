import importlib


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "jarvis"}


def test_imports():
    for module in ("app.main", "app.core.config", "app.core.logging_config",
                   "app.channels.whatsapp.router", "app.channels.whatsapp.service",
                   "app.channels.whatsapp.parser", "app.channels.whatsapp.client",
                   "app.channels.whatsapp.schemas", "app.services.assistant", "app.models", "run"):
        importlib.import_module(module)
