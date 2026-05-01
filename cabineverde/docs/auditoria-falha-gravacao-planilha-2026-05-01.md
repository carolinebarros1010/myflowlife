# Auditoria de falha de gravação na planilha (2026-05-01)

## Causa raiz identificada
- O front-end enviava corretamente via `POST`, porém a leitura de resposta no serviço TypeScript não desaninhava o objeto `data` retornado pelo Apps Script.
- Com isso, `message`, `action`, `idCaso` e `aba` podiam ficar ausentes no cliente, gerando percepção de falha/salvamento sem confirmação clara.
- No Apps Script não havia os marcos de log operacionais obrigatórios (`POST_RECEBIDO`, `PAYLOAD_RECEBIDO`, `GRAVACAO_INICIADA`, `GRAVACAO_SUCESSO`, `ERRO_GRAVACAO_PLANILHA`) de forma explícita para auditoria rápida.

## Correções aplicadas
- Ajuste no parser de resposta do front-end para mesclar payload raiz + `data`.
- Mensagem operacional explícita no banner após salvar, indicando sucesso com nome da aba ou causa exata da falha.
- Inclusão dos logs obrigatórios no `doPost(e)` do Apps Script.

## Aba de gravação
- Aba principal de destino: `CASOS`.
- Persistência complementar: `TRIAGEM_RESPOSTAS`, `EVENTOS_OCORRENCIA`, `INDICADORES_OPERACIONAIS`.

## Frase-chave operacional
> Não quero salvamento silencioso. O sistema precisa confirmar se gravou ou informar exatamente por que não gravou.
