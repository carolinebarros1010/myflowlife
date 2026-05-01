# Teste manual de integração GAS (CORS)

| Action | Payload mínimo | Resultado esperado | Permissão | Logs | Erro esperado |
|---|---|---|---|---|---|
| healthcheck | `{ "action": "healthcheck" }` | `{ ok:true, data:{service} }` | Operador autenticado | LOG_ACESSO + Logs_GAS | `ok:false` se sessão inválida |
| salvarCaso | `{ "aba":"CASOS", "colunas":[], "valores":[] }` | `{ ok:true, data:{action:"salvarCaso"} }` | OPERADOR+ | EVENTOS_OCORRENCIA + Logs_GAS | duplicidade/talão |
| visualizarFotoDesaparecido | `{ "action":"visualizarFotoDesaparecido", "idFoto":"..." }` | `{ ok:true, data:{conteudoBase64} }` | OPERADOR+ | LOG_ACESSO_FOTOS | justificativa inválida |
| listarCasos | `{ "action":"listarCasos" }` | `{ ok:true, data:{casos:[]} }` | OPERADOR+ | LOG_ACESSO | sem casos retorna vazio |
| buscarCaso | `{ "action":"buscarCaso", "filtro":{"idCaso":"..."} }` | `{ ok:true, data:[...] }` | OPERADOR+ | Logs_GAS | id inexistente => `[]` |
| gerarTimelineCaso | `{ "action":"gerarTimelineCaso", "idCaso":"..." }` | `{ ok:true, data:[...] }` | OPERADOR+ | EVENTOS/HISTÓRICO | id ausente erro |
| editarCasoControlado | `{ "action":"editarCasoControlado", ... }` | `{ ok:true, data:{alteracoesAplicadas} }` | SUPERVISOR/ADMIN | HISTORICO_EDICOES | email confirmação inválido |
| resumoQualidadeDados | `{ "action":"resumoQualidadeDados" }` | `{ ok:true, ...resumo }` | OPERADOR+ | QUALIDADE_DADOS | estrutura inválida |
| marcarProblemaQualidadeResolvido | `{ "action":"marcarProblemaQualidadeResolvido", ... }` | `{ ok:true, data:{...} }` | OPERADOR+ | QUALIDADE_DADOS | problema não encontrado |
| enviarFeedback | `{ "action":"enviarFeedback", "feedback":{} }` | `{ ok:true, data:{recebido:true} }` | OPERADOR+ | Logs_GAS | payload inválido |
| gerarRelatorioTextoSIOPM | `{ "action":"gerarRelatorioTextoSIOPM", "idCaso":"..." }` | `{ ok:true, data:{relatorio} }` | OPERADOR+ | EVENTOS/Logs | caso não encontrado |
| gerarRelatorioOperacionalComImagem | `{ "action":"gerarRelatorioOperacionalComImagem" }` | `{ ok:true, data:{qtdFotos...} }` | OPERADOR+ | RELATORIO_OPERACIONAL | sem fotos => zerado |
| validarFotoDesaparecido | `{ "action":"validarFotoDesaparecido", "idFoto":"...", "status":"VALIDADA" }` | `{ ok:true, data:{statusValidacao} }` | SUPERVISOR/ADMIN | LOG_ACESSO_FOTOS | sem permissão |
| auditarQualidadeDados | `{ "action":"auditarQualidadeDados" }` | `{ ok:true, data:{...} }` | OPERADOR+ | QUALIDADE_DADOS | inconsistência estrutural |
| listarPerfilOperador / perfil-operador | `{ "action":"listarPerfilOperador" }` | `{ ok:true, data:{email,perfil} }` | ADMIN (atual) | LOG_ACESSO | sem cadastro |

## Padrão de chamada frontend
- `method: POST`
- `Content-Type: text/plain;charset=utf-8`
- `body: JSON.stringify(payload)`
- sem headers customizados para evitar preflight.
