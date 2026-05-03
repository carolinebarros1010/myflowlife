# Auditoria do fluxo de gravação de casos — Cabine Verde (2026-05-03)

## Erro identificado

O front-end estava enviando a gravação por `salvarCasoSheets` em modo `no-cors`, sem leitura de resposta e com payload tabular sem `action` explícita, dificultando diagnóstico em falhas operacionais.

## Correções aplicadas

1. Front-end:
   - inclusão de `console.log("PAYLOAD ENVIADO:", payload)` antes do envio;
   - troca da chamada silenciosa (`fetch` `no-cors`) por `chamarAcaoGAS('salvarCaso', payload)`, garantindo POST com `action` e leitura de retorno;
   - inclusão de `console.log("RESPOSTA BRUTA GAS:", texto)` no cliente HTTP central.

2. Apps Script (`doPost`):
   - inclusão de logs obrigatórios:
     - `Logger.log("POST RECEBIDO:")`
     - `Logger.log(e.postData.contents)`
   - log de tentativa de gravação:
     - `Logger.log("GRAVANDO CASO:")`
     - `Logger.log(body)`

3. Persistência (`persistirRegistro`):
   - log explícito da entrada ao gravar aba `CASOS`:
     - `Logger.log("GRAVANDO CASO:")`
     - `Logger.log(registro)`

4. Bloqueios:
   - `validarOperadorPayloadOuSessao_` passa a registrar `Logger.log("BLOQUEIO DE EXECUÇÃO")` quando bloqueia execução por operador não validado.

5. Teste direto:
   - adicionada função `testeGravacaoDireta()` para append isolado na aba `CASOS`.

## Hipótese operacional consolidada

Com os logs adicionados, a falha passa a ser identificável em uma das etapas:
- envio do payload no front;
- resposta bruta do endpoint;
- recebimento do POST no GAS;
- bloqueio por validação operacional;
- persistência efetiva via `persistirRegistro`.

