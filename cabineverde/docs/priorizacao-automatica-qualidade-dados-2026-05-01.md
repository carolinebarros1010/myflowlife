# Priorização automática de inconsistências — Painel de Qualidade dos Dados

Data: 2026-05-01

## Objetivo operacional
Permitir que o operador da Cabine Verde identifique imediatamente **o que deve resolver primeiro** no tratamento de inconsistências da aba `QUALIDADE_DADOS`.

## Alterações implementadas

### 1) GAS (atribuição automática)
- Incluído o campo `prioridadeTratamento` na estrutura da aba `QUALIDADE_DADOS`.
- Regra automática aplicada no momento da criação do registro de inconsistência:
  - `CRITICA` → `URGENTE`
  - `ALTA` → `ALTA`
  - `MEDIA` → `MEDIA`
  - demais casos → `BAIXA`
- Exceção mandatória:
  - Se `campo = talaoPMESP` ou `campo = classificacaoRisco`, a `prioridadeTratamento` é sempre `URGENTE`.
- Compatibilidade com dados antigos:
  - Em leituras do resumo, quando `prioridadeTratamento` não existir na linha legada, o sistema recalcula automaticamente com as mesmas regras.

### 2) Frontend (ordenação + cores + filtro rápido)
- Painel passa a ordenar inconsistências por prioridade:
  1. `URGENTE`
  2. `ALTA`
  3. `MEDIA`
  4. `BAIXA`
- Inclusão de destaque visual por cartão:
  - `URGENTE` em vermelho
  - `ALTA` em laranja
  - `MEDIA` em amarelo
  - `BAIXA` em cinza
- Inclusão de botões de filtro rápido no topo:
  - `[URGENTE] [ALTA] [MEDIA] [BAIXA]`
- Inclusão de filtro textual adicional `prioridadeTratamento`.

### 3) Planilha `QUALIDADE_DADOS`
- Estrutura atualizada para suportar a nova coluna `prioridadeTratamento` entre `severidade` e `acaoRecomendada`.

## Resultado esperado para operação
- O operador recebe uma fila já priorizada automaticamente, reduzindo latência de decisão.
- Itens críticos de identificação e risco (`talaoPMESP` e `classificacaoRisco`) sobem para o topo com prioridade `URGENTE` sem intervenção manual.
