# JARVIS v0.1

Fundação independente em Python 3.12+, FastAPI, Uvicorn, httpx, python-dotenv e Pydantic.
Recebe textos do WhatsApp e responde `Jarvis online. Mensagem recebida: <texto>`.
Sem IA, banco, voz ou integrações Google nesta versão.

## Instalação e execução (Windows PowerShell)

Na raiz do repositório:

```powershell
cd jarvis
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
python run.py
```

Use Python 3.12 ou superior (`py -3.12 -m venv .venv` seleciona explicitamente 3.12).
Se a ativação estiver bloqueada, use `.venv\Scripts\python.exe -m pip install -r requirements.txt`
e `.venv\Scripts\python.exe run.py`, sem alterar a política do PowerShell.
Alternativa após ativar o ambiente:

```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 --no-access-log
```

O `.env` é carregado da pasta `jarvis`, sem substituir variáveis já exportadas.
Sem credenciais, o servidor inicia para testes locais, mas não verifica nem envia mensagens reais.
Preencha localmente `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` e um
`WHATSAPP_VERIFY_TOKEN` escolhido por você. `WHATSAPP_BUSINESS_ACCOUNT_ID` é reservado
para configuração futura. A versão solicitada, `v26.0`, é configurável via `WHATSAPP_API_VERSION`.
Nunca compartilhe o `.env`.

## Endpoints e testes

```powershell
Invoke-RestMethod http://localhost:8000/health
python -m pytest -q
```

`GET /health` retorna HTTP 200 com `{"status":"ok","service":"jarvis"}`.
`GET /webhook` exige `hub.mode=subscribe`, `hub.verify_token` igual ao configurado
e `hub.challenge`; retorna o challenge como texto puro ou HTTP 403.
`POST /webhook` aceita objeto JSON, confirma com HTTP 200 e processa textos em segundo plano.
JSON inválido retorna 400; corpo acima de 1 MiB retorna 413; assinatura inválida retorna 403.
Eventos de status, mídia e mensagens incompletas são ignorados.
Os testes usam transporte HTTP simulado e não enviam mensagens reais.

## Arquitetura

```text
app/main.py                    fábrica da aplicação, lifespan e health
app/core/config.py             ambiente e validação de configuração
app/core/logging_config.py     logs sem dados de autorização
app/channels/whatsapp/router.py endpoints, challenge, assinatura e validação HTTP
app/channels/whatsapp/parser.py extração pura de mensagens e contatos
app/channels/whatsapp/schemas.py modelo normalizado de texto
app/channels/whatsapp/service.py coordenação por mensagem
app/channels/whatsapp/client.py envio HTTP com timeout e erros sanitizados
app/services/assistant.py      interface Assistant e resposta fixa
app/models/                    reservado para modelos futuros
tests/                         health, imports, webhook, parser e envio simulado
```

Fluxo: router → service → parser → Assistant → WhatsAppClient → API Meta.
O cliente HTTP é compartilhado durante a vida da aplicação e fechado no encerramento.
O envio usa o número empresarial configurado e ignora eventos de outros números.
Respostas acima de 4096 caracteres são divididas em mensagens sequenciais.
Para trocar a resposta fixa, implemente `Assistant.respond` e injete no service em `main.py`.

## Conectar à Meta posteriormente

1. Configure um aplicativo Meta com WhatsApp Cloud API, número de teste e destinatário permitido.
2. Preencha o `.env` com os identificadores e credenciais correspondentes.
3. Configure também `WHATSAPP_APP_SECRET`, o segredo do aplicativo Meta. Ele autentica
   `X-Hub-Signature-256` sobre o corpo original. O verify token só verifica o GET.
4. Exponha a porta 8000 por túnel HTTPS, por exemplo `ngrok http 8000` após instalar
   e configurar o ngrok. Use a URL HTTPS fornecida acrescida de `/webhook` como callback.
5. Informe na Meta o mesmo verify token e assine o campo `messages` do WhatsApp.
6. Envie `Olá Jarvis` do destinatário autorizado ao número configurado e confirme a resposta.

Antes de exposição pública, configure o App Secret; `APP_ENV=production` exige
token de acesso, phone number ID, verify token e App Secret. Nesse ambiente `run.py`
desativa reload. Mantenha também logs de proxy/túnel sem query strings de verificação.
O servidor não grava payloads ou textos: logs incluem evento, message_id e telefone mascarado.
Falhas externas não incluem corpo da resposta, tokens ou stack traces para o cliente.

## Limites e próximos passos

`BackgroundTasks` executa no processo, após confirmar o recebimento. Uma queda pode perder
trabalho já confirmado; falhas de envio são registradas, sem retry automático. O HTTP 200
confirma recebimento, não entrega da resposta. Reenvios da Meta podem gerar respostas duplicadas.
`WhatsAppService.process_message` mantém `message_id` como ponto explícito para futura
reserva atômica/deduplicação persistente, antes do envio; não há deduplicação nesta versão.

Primeiro valide a conversa real com a Meta. Depois implemente fila durável, idempotência,
política de retries e acompanhamento dos status. Só então avance para OpenAI, memória,
Calendar, Gmail, ferramentas, voz e outros canais conforme necessidade.

Referências: [background tasks do FastAPI](https://fastapi.tiangolo.com/tutorial/background-tasks/),
[lifespan do FastAPI](https://fastapi.tiangolo.com/advanced/events/),
[verificação de webhook da Meta](https://whatsapp.github.io/WhatsApp-Nodejs-SDK/api-reference/webhooks/start/),
[payloads da Meta](https://www.postman.com/meta/whatsapp-business-platform/folder/tduohwq/webhook-payload-reference).
