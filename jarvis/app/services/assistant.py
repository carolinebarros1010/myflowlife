from typing import Protocol


class Assistant(Protocol):
    async def respond(self, text: str) -> str: ...


class FixedAssistant:
    async def respond(self, text: str) -> str:
        return f"Jarvis online. Mensagem recebida: {text}"
