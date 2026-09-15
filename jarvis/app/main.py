import logging
from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

import httpx
from fastapi import FastAPI

from app.channels.whatsapp.client import WhatsAppClient
from app.channels.whatsapp.router import router
from app.channels.whatsapp.service import WhatsAppService
from app.core.config import Settings, load_settings
from app.core.logging_config import configure_logging
from app.services.assistant import FixedAssistant


def create_app(settings: Settings | None = None,
               transport: httpx.AsyncBaseTransport | None = None) -> FastAPI:
    @asynccontextmanager
    async def lifespan(application: FastAPI) -> AsyncIterator[None]:
        configure_logging()
        config = settings if settings is not None else load_settings()
        application.state.settings = config
        async with httpx.AsyncClient(transport=transport, timeout=10.0) as http:
            application.state.whatsapp = WhatsAppService(WhatsAppClient(config, http), FixedAssistant())
            logging.getLogger(__name__).info("JARVIS iniciado ambiente=%s", config.app_env)
            if not config.whatsapp_app_secret.get_secret_value():
                logging.getLogger(__name__).warning("Modo local: assinatura de POST não configurada")
            yield

    application = FastAPI(title="JARVIS", version="0.1.0", lifespan=lifespan, debug=False)
    application.include_router(router)

    @application.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "ok", "service": "jarvis"}

    return application


app = create_app()
