# Consulta e auditoria de caso — Cabine Verde

## Objetivo
Adicionar uma tela operacional para consulta e auditoria de casos por `idCaso`, `talaoPMESP` e `nomeCompletoDesaparecido`, com edição controlada por confirmação de identidade.

## Fluxo operacional
1. Operador preenche um ou mais filtros na seção **Consulta e auditoria de caso**.
2. Frontend chama `buscarCaso_(filtro)` no endpoint GAS.
3. Caso localizado exibe:
   - dados principais;
   - status;
   - classificação de risco;
   - prioridade;
   - resumo de fotos sem expor link direto;
   - ação de timeline;
   - ação de edição apenas para perfis `SUPERVISOR` e `ADMIN`.
4. Ao clicar em **Ver timeline**, o frontend chama `gerarTimelineCaso_(idCaso)` e ordena eventos por data/hora crescente.
5. Ao clicar em **Editar caso** (perfil autorizado), o frontend exige:
   - `emailConfirmacaoOperador` (email digitado como confirmação);
   - `justificativaEdicao`;
   - alterações pretendidas.
6. No backend, a identidade real vem de `Session.getActiveUser().getEmail()`. A edição só ocorre quando o email digitado corresponde ao email da sessão.

## Regras de identidade e auditoria
- **Email digitado** = confirmação explícita de identidade.
- **Email da sessão** = identidade real e única referência confiável.
- Se houver divergência, a edição é bloqueada, registrada em `LOG_ACESSO` e retorna: `Confirmação de email inválida. Edição bloqueada.`

## Registros obrigatórios
### HISTORICO_EDICOES
Campos gravados:
- `idEdicao`
- `idCaso`
- `talaoPMESP`
- `campoAlterado`
- `valorAnterior`
- `valorNovo`
- `operadorNome`
- `operadorEmail`
- `operadorPerfil`
- `dataHoraEdicao`
- `justificativa`
- `emailConfirmado`

### EVENTOS_OCORRENCIA (CASO_EDITADO)
Além do evento `tipoEvento = CASO_EDITADO`, registra:
- `operadorEmail`
- `operadorPerfil`
- `dataHoraEdicao`
- `quantidadeCamposAlterados`
- `justificativa`

## Erros e contingência
- Filtro vazio: bloqueio no frontend com feedback imediato.
- Caso não localizado: mensagem operacional de ausência de resultado.
- Falha de integração GAS: feedback de erro sem quebrar a interface.
- Email de confirmação divergente: bloqueio da edição com auditoria em `LOG_ACESSO`.
