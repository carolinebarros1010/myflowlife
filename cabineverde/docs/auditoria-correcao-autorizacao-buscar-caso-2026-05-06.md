# Correção de autorização na auditoria (`buscarCasoCompleto`) — 2026-05-06

## Sintoma
Ao acionar **Buscar caso** na `auditoria.html`, o backend retornava `Operador não validado ou não autorizado`.

## Causa raiz
A página `auditoria.html` enviava apenas `action` + `filtro`, sem reutilizar os metadados operacionais persistidos no login da triagem (`operadorEmail`, `operadorNome`, `operadorPerfil`).

Como o `doPost` do GAS valida operador em **todas** as ações sensíveis por `validarOperadorPayloadOuSessao_`, a ausência de e-mail no payload fazia a validação falhar quando `Session.getActiveUser().getEmail()` vinha vazio no contexto Web App público.

## Ajustes aplicados
- Criação de `obterContextoAutenticacao()` na `auditoria.html` para ler sessão operacional do `localStorage`.
- Centralização de chamadas em `chamarBackendAuditoria(action, payload)` com:
  - envio de `operadorEmail`, `operadorNome`, `operadorPerfil`;
  - envio opcional de `token` e header `Authorization: Bearer`;
  - `credentials: 'include'` no `fetch`.
- Logs temporários no GAS em `validarOperadorPayloadOuSessao_` para rastrear:
  - action;
  - e-mail payload;
  - e-mail de sessão do Apps Script;
  - resultado da validação (ok/autorizado/motivo/perfil).

## Segurança preservada
A correção **não removeu validações** nem criou bypass. O backend continua exigindo operador cadastrado e ativo na aba `OPERADORES`.
