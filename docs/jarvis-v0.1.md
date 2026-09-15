# Fundação JARVIS v0.1

O backend reside em `jarvis/` e é independente das aplicações MyFlowLife/Cabine Verde.
Usa Python 3.12+, FastAPI, Uvicorn, httpx, python-dotenv e Pydantic; testes com pytest.
Não altera os módulos de triagem, dados operacionais ou payloads do Google Sheets.

`main` monta aplicação e recursos HTTP; `core` trata configuração/logs; o canal WhatsApp
separa router, parser, schemas, service e client; `services/assistant.py` oferece resposta
fixa por interface substituível. Os endpoints são `/health` e GET/POST `/webhook`.

O processamento usa BackgroundTasks sem persistência: pode perder eventos em reinício e
responder novamente a reenvios. A futura idempotência deve usar `message_id` na entrada
de `process_message`, com reserva atômica e armazenamento persistente. Não há banco nesta etapa.
Credenciais ficam no ambiente; assinatura HMAC de POST é exigida em produção via App Secret.

Consulte [instalação, configuração e validação](../jarvis/README.md).
