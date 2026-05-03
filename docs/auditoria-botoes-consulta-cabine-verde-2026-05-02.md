# Auditoria de botões e fluxo de Consulta/Auditoria de Caso — Cabine Verde (2026-05-02)

## Tabela de auditoria dos botões
| Botão | Tela | Função JS | Action GAS | Grava planilha | Consulta planilha | Aba usada | Status |
|---|---|---|---|---|---|---|---|
| Validar operador | Login operacional | `validarOperador_` | `validarOperador` | Não | Sim | `OPERADORES` | OK |
| Trocar operador | Cabeçalho operacional | `limparOperadorLocal` | — | Não | Não | — | OK |
| Iniciar atendimento | Entrada operacional | handler `iniciarAtendimentoBtn` | — | Não | Não | — | OK (somente navegação + cópia de campos) |
| Voltar | Triagem (passos) | handler `passoVoltarBtn` | — | Não | Não | — | OK |
| Próximo | Triagem (passos) | handler `passoProximoBtn` | — | Não | Não | — | OK |
| Salvar rascunho | **Não existe botão dedicado no `public/js/app.js`** | — | — | — | — | — | Pendente de implementação no front legado |
| Finalizar triagem | Formulário de triagem (submit/menu salvar) | `salvarCasoSheets` | payload tabular (sem `action`, fallback GAS=`salvarCaso`) | Sim | Não | `CASOS`, `TRIAGEM_RESPOSTAS`, `EVENTOS_CASO`, `INDICADORES_OPERACIONAIS` | OK (com feedback de sucesso/erro) |
| Buscar caso | Consulta e auditoria | `buscarCaso_` | `buscarCaso_` (alias GAS `buscarCaso`) | Não | Sim | `CASOS` (+ leitura correlata de timeline) | **Ajustado** |
| Atualizar painel | Qualidade de dados | `resumoQualidadeDados_` | `resumoQualidadeDados_` (alias GAS `resumoQualidadeDados`) | Não | Sim | `QUALIDADE_DADOS` | OK |

## Fluxo de Consulta e Auditoria de Caso
1. Operador preenche ao menos um filtro: `idCaso`, `talaoPMESP` ou `nomeCompletoDesaparecido`.
2. Front valida regra de filtro obrigatório localmente.
3. Front envia action de consulta ao GAS (`buscarCaso`).
4. GAS consulta aba principal de casos e retorna lista.
5. Front exibe resumo do caso.
6. Timeline é consultada via botão `Ver timeline` (action `gerarTimelineCaso`).
7. Front registra log de consulta com tipo `CONSULTA_CASO_REALIZADA` via action `enviarFeedback`.

## Apps Script (doPost)
Actions mapeadas no endpoint:
- Validação/autenticação: `validarOperador`, `listarPerfilOperador`.
- Gravação: fallback `salvarCaso` (quando sem action explícita no payload tabular).
- Consulta: `buscarCaso`, `gerarTimelineCaso`, `listarCasos`, `resumoQualidadeDados`.
- Governança/qualidade: `marcarProblemaQualidadeResolvido`, `auditarQualidadeDados`, `editarCasoControlado`.
- Relatórios: `gerarRelatorioTextoSIOPM`, `gerarRelatorioOperacionalComImagem`.

## Problemas encontrados
- Mensagens de consulta estavam genéricas (`Caso localizado para auditoria` / erro cru).
- Não havia registro explícito no front para `CONSULTA_CASO_REALIZADA`.
- Botão dedicado `Salvar rascunho` não existe no front legado ativo (`public/js/app.js`).

## Correções aplicadas (mínimas)
- Mensagens de consulta melhoradas para cenários de 0, 1 e múltiplos resultados.
- Inclusão de log de consulta (`CONSULTA_CASO_REALIZADA`) com operador, filtros e resultado.
- Mensagem de erro de busca tornada operacionalmente clara.
