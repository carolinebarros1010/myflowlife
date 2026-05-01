# GAS Workspace - Cabine Verde

Esta pasta (`cabineverde/GAS/`) é a área versionada do Google Apps Script usada pela integração do Cabine Verde com Google Sheets.

## Endpoint principal publicado
`https://script.google.com/macros/s/AKfycbyWmW1-MNFprc83mtns2FrQCL2x-k5rckwUDI2p6d0L4dzVYxLLQRg4cyB28JLG_501zw/exec`

- `GET`: healthcheck simples do serviço.
- `POST`: cria ou atualiza casos em `Desaparecidos` sem duplicidade de `idCaso` (única aba permitida).

## Estrutura de arquivos
- `Code.gs`: `doGet`, `doPost` e orquestração da estrutura da planilha.
- `SheetsMapping.gs`: colunas oficiais da aba `Desaparecidos`.
- `Utils.gs`: parse, normalização e resposta JSON.
- `MockPayload.json`: payload de teste compatível com a estrutura atual.
- `appsscript.json`: manifesto V8.

## Abas gerenciadas automaticamente
Quando um `POST` é recebido, o script garante as abas:
1. `Desaparecidos`
2. `Listas`
3. `Relatorio_Diario`
4. `Painel`
5. `Ocorrencias_Relevancia`
6. `Config`
7. `Logs_GAS`

Além do cabeçalho da linha 1, o script também semeia dados iniciais em:
- `Listas` (listas padronizadas);
- `Painel` (indicadores-base);
- `Config` (metadados de versão/estrutura).

## Configuração de Script Properties
Defina no projeto Apps Script:
- `CABINE_VERDE_SPREADSHEET_ID` (obrigatório)
- `CABINE_VERDE_SHEET_NAME` (opcional, padrão `Desaparecidos`)

## Deploy obrigatório após sincronizar arquivos
Sempre que atualizar os arquivos `.gs` no Apps Script real, publique uma nova versão da Web App:

```text
Deploy > Manage deployments > Edit > New version > Deploy
```

Se esse passo não for executado, a URL pública pode permanecer em versão anterior e retornar erro de `doGet` ausente.

## Fluxo no-cors e diagnóstico
No frontend oficial, o `POST` usa `mode: "no-cors"`. Nesse modo, o navegador retorna uma resposta opaca e o operador não consegue ler o JSON de retorno do GAS.

Por isso, o Apps Script agora registra trilha técnica na aba `Logs_GAS` com as colunas:
- `timestamp`
- `etapa`
- `ok`
- `mensagem`
- `rawPostData`
- `payloadIdCaso`

Etapas registradas no `doPost`:
1. `inicio_post`
2. `parse_payload`
3. `persistencia_desaparecidos` (sucesso) **ou** `erro_post` (falha)

## Formato de body adotado
Para maior compatibilidade com Web App do Google Apps Script + `no-cors`, o frontend envia `Content-Type: text/plain;charset=utf-8` com `body` em JSON serializado.

O parser no GAS aceita, nesta ordem:
1. `e.postData.contents` (JSON)
2. `e.parameter.payload` (JSON string)
3. `e.parameters.payload[0]` (JSON string)

Se nenhum formato válido for encontrado, retorna erro claro: `Payload ausente ou inválido. Verifique body JSON ou campo payload.`

## Checklist operacional de validação
1. Abrir o endpoint no navegador.
2. Confirmar retorno JSON de healthcheck (`ok: true` e `message: "Endpoint ativo"`).
3. Executar `POST` com `MockPayload.json`.
4. Confirmar registro na aba `Logs_GAS`.
5. Confirmar criação/atualização na aba `Desaparecidos`.

## Testes rápidos
### Healthcheck
```bash
curl 'https://script.google.com/macros/s/AKfycbyWmW1-MNFprc83mtns2FrQCL2x-k5rckwUDI2p6d0L4dzVYxLLQRg4cyB28JLG_501zw/exec'
```

### Gravação
```bash
curl -X POST 'https://script.google.com/macros/s/AKfycbyWmW1-MNFprc83mtns2FrQCL2x-k5rckwUDI2p6d0L4dzVYxLLQRg4cyB28JLG_501zw/exec' \
  -H 'Content-Type: text/plain;charset=utf-8' \
  --data @MockPayload.json
```


## URL oficial do frontend
- Produção: `https://myflowlife.com.br/cabineverde/`
- `https://myflowlife.com.br/public/index.html` não deve ser tratado como URL oficial do Cabine Verde.


## Hardening institucional (2026-05-01)
- Mascaramento LGPD em leitura de casos com `mascararDadosSensivel_`.
- Bloqueio automático de abuso de visualização de foto (5 acessos/10 min, bloqueio de 15 min).
- Varredura de permissões do Drive com evento `ARQUIVO_EXPOSTO`.
- Rotina diária `rotinaDiariaSeguranca_` com saída em `RELATORIO_SEGURANCA`.
