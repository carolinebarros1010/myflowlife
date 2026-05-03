# Auditoria completa dos botões operacionais — Cabine Verde (2026-05-03)

## Escopo auditado
- Front-end legado: `cabineverde/public/js/app.js` e `cabineverde/public/js/core.js`.
- Backend GAS: `cabineverde/GAS/Code.gs` (`doPost` e roteamento por `action`).

## 1) Mapeamento de botões

| Nome do botão | Tela | Função JS associada | Action enviada ao GAS | Payload enviado | Grava planilha? | Consulta dados? | Atualiza status? | Mensagem exibida |
|---|---|---|---|---|---|---|---|---|
| Salvar caso (`#menuSalvarCaso`) | Triagem/menu | `form.requestSubmit()` -> `submit` -> `salvarCasoSheets(caso)` | `salvarCaso` | Payload tabular de caso + `operadorEmail`, `operadorNome`, `operadorPerfil` | **SIM** (`CASOS` + trilhas) | Não | Sim (status do caso no payload) | "Caso enviado para processamento." / erro local |
| Finalizar triagem (submit do formulário) | Triagem (passo final) | `submit` -> `salvarCasoSheets(caso)` | `salvarCaso` | Mesmo payload de gravação do caso | **SIM** | Não | Sim | "Caso enviado para processamento." |
| Despachar | **Não existe no front atual** | — | — | — | Não | Não | Não | — |
| Encaminhar | **Não existe no front atual** | — | — | — | Não | Não | Não | — |
| Encerrar atendimento | **Não existe no front atual** | — | — | — | Não | Não | Não | — |
| Buscar caso (`#buscarCasoBtn`) | Auditoria/consulta | `buscarCaso_(filtro)` | `buscarCaso_` (alias GAS para `buscarCaso`) | `{ filtro: { idCaso, talaoPMESP, nomeCompletoDesaparecido } }` + operador | Não | **SIM** | Não | "Consulta realizada com sucesso..." / "Não foi encontrado..." |
| Atualizar painel (`#atualizarQualidadeBtn`) | Qualidade de dados | `resumoQualidadeDados_()` | `resumoQualidadeDados_` (alias GAS para `resumoQualidadeDados`) | `{ action: 'resumoQualidadeDados_' }` + operador | Não | **SIM** | Não (apenas UI) | Erro/sucesso do painel |
| Validar operador (`#btnValidarOperador`) | Login operacional | `validarOperador_(email)` | `validarOperador` | `{ operadorEmail }` | Não | **SIM** (`OPERADORES`) | Sim (sessão local) | "Operador validado com sucesso..." |

## 2) Logs obrigatórios adicionados
Foram incluídos logs padronizados no front para os botões operacionais existentes:
- `console.log("BOTÃO CLICADO:", nomeBotao);`
- `console.log("PAYLOAD ENVIADO:", payload);`
- `console.log("RESPOSTA GAS:", resposta);`

Implementação aplicada em: salvar/finalizar triagem, buscar caso, atualizar painel e validar operador.

## 3) Classificação dos botões

### A. Persistência (deve gravar)
- `salvarCaso` (via botão "Salvar caso").
- `finalizarTriagem` (submit final -> `salvarCaso`).
- `salvarRascunho`: **não implementado no front atual**.

### B. Decisão operacional (não deve gravar diretamente)
- - `encaminhar`: **não implementado no front atual**.
- `encerrar`: **não implementado no front atual**.

### C. Consulta (não grava)
- `buscarCaso`.
- `resumoQualidadeDados`.

## 4) Erros/achados da auditoria
1. **Ambiguidade funcional existente:** "Salvar caso" e "Finalizar triagem" convergem para o mesmo fluxo de submit/gravação (`salvarCaso`), sem diferenciação semântica no backend.
2. **Ausência de botões críticos de decisão operacional:** não há implementação visual de registrar encaminhamento, manter em monitoramento e encerrar caso no front legado atual.
3. **`salvarRascunho` ausente:** classificação pediu persistência dedicada, mas não existe botão/handler dedicado.
4. **Não foi identificado o erro específico** "Finalizar triagem chamando resumoQualidadeDados_" no código auditado em 2026-05-03.

## 5) Padronização de payload de gravação
Fluxo atual de gravação já trafega por `action: "salvarCaso"` e inclui dados do operador via enriquecimento em `chamarAcaoGAS`.

Campos mandatórios solicitados para gravação:
```json
{
  "action": "salvarCaso",
  "idCaso": "...",
  "talaoPMESP": "...",
  "dadosFormulario": "...",
  "operadorEmail": "...",
  "operadorNome": "...",
  "operadorPerfil": "..."
}
```

Observação: o front atual envia payload tabular completo de caso (mais rico que `dadosFormulario`), mantendo compatibilidade com planilha.

## 6) Roteamento GAS (verificação)
`doPost(e)` possui roteamento explícito para:
- `salvarCaso` -> `persistirRegistro(body)`.
- `registrarEncaminhamento` -> registrar evento `ENCAMINHAMENTO_REGISTRADO`.
- `encaminhar` -> `registrarEventoCaso_(body, 'ENCAMINHAMENTO_OPERACIONAL', ...)`.
- `encerrar` -> `registrarEventoCaso_(body, 'ENCERRAMENTO_ATENDIMENTO', ...)`.

Conclusão: o backend já suporta o fluxo separado; a lacuna principal está no front para botões de decisão operacional.

## 7) Fluxo essencial validado
- Salvar é independente: **sim**.
- Encaminhamento não salva dados do caso: **sim no GAS** (evento).
- Encaminhamento não salva dados do caso: **sim no GAS** (evento).
- Finalizar triagem salva + classifica: **salva**; classificação é calculada no front antes de enviar.

## 8) Evidência prática (ambiente local)
Foram executados testes automatizados para validar integração de actions e gravação. O ambiente não simulou clique real de navegador, mas validou contrato de payload/action nas funções principais.


## Diretriz operacional
A Cabine Verde não realiza despacho direto de recursos. O sistema registra, qualifica e encaminha informações para apoio à decisão operacional.
