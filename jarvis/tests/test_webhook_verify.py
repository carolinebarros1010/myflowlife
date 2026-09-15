import pytest


def test_valid_verification(client):
    response = client.get("/webhook", params={"hub.mode": "subscribe",
                          "hub.verify_token": "test-verify", "hub.challenge": "12345"})
    assert response.status_code == 200
    assert response.text == "12345"
    assert response.headers["content-type"].startswith("text/plain")


@pytest.mark.parametrize("params", [
    {}, {"hub.mode": "subscribe", "hub.verify_token": "wrong", "hub.challenge": "123"},
    {"hub.mode": "wrong", "hub.verify_token": "test-verify", "hub.challenge": "123"},
    {"hub.mode": "subscribe", "hub.verify_token": "test-verify"},
])
def test_invalid_verification(client, params):
    assert client.get("/webhook", params=params).status_code == 403
