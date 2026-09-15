import logging
from typing import Any

from app.channels.whatsapp.client import WhatsAppClient, WhatsAppSendError
from app.channels.whatsapp.parser import parse_messages
from app.channels.whatsapp.schemas import TextMessage
from app.services.assistant import Assistant

logger = logging.getLogger(__name__)


class WhatsAppService:
    def __init__(self, client: WhatsAppClient, assistant: Assistant) -> None:
        self.client = client
        self.assistant = assistant

    async def receive(self, payload: dict[str, Any]) -> None:
        for message in parse_messages(payload):
            await self.process_message(message)

    async def process_message(self, message: TextMessage) -> None:
        # Ponto para futura reserva atômica por message_id antes do envio.
        logger.info("Mensagem recebida message_id=%s telefone=***%s",
                    message.message_id, message.sender[-4:])
        if message.phone_number_id != self.client.settings.whatsapp_phone_number_id:
            logger.warning("Mensagem ignorada: phone_number_id não configurado")
            return
        try:
            reply = await self.assistant.respond(message.text)
            await self.client.send_text_message(message.sender, reply)
        except WhatsAppSendError:
            logger.warning("Falha no envio message_id=%s", message.message_id)
        except Exception:
            logger.error("Falha no processamento message_id=%s", message.message_id)
        else:
            logger.info("Resposta enviada message_id=%s", message.message_id)
