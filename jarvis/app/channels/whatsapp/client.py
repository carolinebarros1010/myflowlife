import httpx

from app.core.config import Settings


class WhatsAppSendError(Exception):
    pass


class WhatsAppClient:
    def __init__(self, settings: Settings, http: httpx.AsyncClient) -> None:
        self.settings = settings
        self.http = http

    async def send_text_message(self, recipient: str, text: str) -> None:
        token = self.settings.whatsapp_access_token.get_secret_value()
        phone_id = self.settings.whatsapp_phone_number_id
        if not token or not phone_id:
            raise WhatsAppSendError("Envio não configurado")
        url = f"https://graph.facebook.com/{self.settings.whatsapp_api_version}/{phone_id}/messages"
        # A resposta inclui um prefixo e pode ultrapassar o limite de um texto.
        for start in range(0, len(text), 4096):
            try:
                response = await self.http.post(
                    url, headers={"Authorization": f"Bearer {token}"}, timeout=10.0,
                    json={"messaging_product": "whatsapp", "to": recipient, "type": "text",
                          "text": {"body": text[start:start + 4096]}},
                )
                response.raise_for_status()
            except httpx.HTTPError:
                raise WhatsAppSendError("Falha na comunicação com WhatsApp") from None
