# Estrutura da base Cabine Verde (Apps Script)

Implementada rotina `garantirEstruturaCabineVerde_()` para criação idempotente das abas e colunas obrigatórias sem apagar dados.

## Regras atendidas
- não remove abas;
- não remove colunas;
- não altera valores já preenchidos;
- cria apenas abas ausentes;
- adiciona apenas colunas obrigatórias ausentes ao final;
- preserva ordem de colunas existentes;
- registra log estrutural na aba `LOGS` quando disponível.

## Schema oficial
Definido em `CABINE_VERDE_SCHEMA` com as abas:
`OPERADORES`, `CASOS`, `TRIAGEM_RESPOSTAS`, `EVENTOS_CASO`, `INDICADORES_OPERACIONAIS`, `QUALIDADE_DADOS`, `LOGS`, `AUDITORIA_CONSULTAS`.

## Fluxos ajustados
- `doPost`, `validarOperador_`, `persistirRegistro`, `buscarCaso_`, `gerarTimelineCaso_` e auditorias passam a garantir a estrutura no início.
- destino principal de casos: aba `CASOS`.
- timeline passa a usar `EVENTOS_CASO`.
- busca de caso prioriza `CASOS` e usa fallback legado: `Desaparecidos` e `CASOS_TRATADOS`.
