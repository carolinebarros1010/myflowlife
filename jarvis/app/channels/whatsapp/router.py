import hashlib
import hmac
import json
import logging
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query, Request
from fastapi.responses import PlainTextResponse

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/webhook", response_class=PlainTextResponse)
async def verify_webhook(
    request: Request,
    mode: Annotated[str | None, Query(alias="hub.mode")] = None,
    token: Annotated[str | None, Query(alias="hub.verify_token")] = None,
    challenge: Annotated[str | None, Query(alias="hub.challenge")] = None,
) -> str:
    expected = request.app.state.settings.whatsapp_verify_token.get_secret_value()
    if (mode != "subscribe" or not expected or token is None or challenge is None
            or not hmac.compare_digest(token.encode(), expected.encode())):
        raise HTTPException(status_code=403, detail="Verificação recusada")
    logger.info("Webhook verificado")
    return challenge


@router.post("/webhook")
async def receive_webhook(request: Request, background_tasks: BackgroundTasks) -> dict[str, str]:
    body = bytearray()
    async for chunk in request.stream():
        body.extend(chunk)
        if len(body) > 1_048_576:
            raise HTTPException(status_code=413, detail="Payload muito grande")
    secret = request.app.state.settings.whatsapp_app_secret.get_secret_value()
    if secret:
        signature = "sha256=" + hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
        supplied = request.headers.get("x-hub-signature-256", "")
        if not hmac.compare_digest(signature.encode(), supplied.encode()):
            raise HTTPException(status_code=403, detail="Assinatura inválida")
    try:
        payload = json.loads(body)
    except (ValueError, UnicodeDecodeError):
        raise HTTPException(status_code=400, detail="JSON inválido") from None
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="Esperado objeto JSON")
    background_tasks.add_task(request.app.state.whatsapp.receive, payload)
    return {"status": "ok"}
