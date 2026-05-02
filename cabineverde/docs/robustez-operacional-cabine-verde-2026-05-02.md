# Robustez operacional — Cabine Verde (2026-05-02)

## Melhorias implementadas
- Cache da aba `OPERADORES` no Google Apps Script com TTL de 5 minutos (300s), reduzindo leitura repetitiva da planilha em picos de uso.
- Vínculo forte no payload operacional com `operadorCriador` e `operadorUltimaAcao`, persistidos na aba `CASOS`.
- Feedback visual explícito no front para sucesso (`success`), erro (`danger`) e bloqueio (`blocked`), sem ações silenciosas.
- Fallback local de contingência: em falha de gravação, o caso é salvo automaticamente no `localStorage` via auto-rascunho.

## Funções alteradas
- GAS:
  - `obterOperadoresCache_`
  - `salvarOperadoresCache_`
  - `carregarOperadoresDaPlanilha_`
  - `validarOperador_`
- Front-end TypeScript:
  - `atualizarStatus`
  - `obterOperadorAtual`
  - `submit` do formulário de triagem (`triage-form`)
- Mapeamento payload:
  - `gerarPayloadSheets`

## Impacto operacional
- **Alta frequência de uso:** menos chamadas à aba `OPERADORES`, com menor latência e menor risco de gargalo.
- **Falha de conexão:** o operador recebe mensagem explícita e o rascunho é preservado localmente para reenvio.
- **Múltiplos operadores:** rastreabilidade melhorada por vínculo de criador e última ação no mesmo caso.
