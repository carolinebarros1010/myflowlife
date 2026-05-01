# Timeline de Caso - Cabine Verde

## Objetivo
Consolidar a evolução operacional de um `idCaso` em uma única linha do tempo cronológica para auditoria, supervisão e análise de evolução do caso.

## Função GAS
Implementada a função:

- `gerarTimelineCaso_(idCaso)`

## Fontes unificadas
A timeline combina registros de:

- `EVENTOS_OCORRENCIA`
- `HISTORICO_EDICOES`

Na prática, os eventos abaixo passam a aparecer automaticamente quando já registrados em `EVENTOS_OCORRENCIA`:

- `CASO_CRIADO`
- `DECISAO_OPERACIONAL`
- `FOTO_ANEXADA`
- `FOTO_VALIDADA`
- `FOTO_REJEITADA`
- `FOTO_VISUALIZADA`
- `USO_EXCESSIVO_FOTO`
- `BLOQUEIO_TEMPORARIO_FOTO`

## Formato de retorno
Retorna uma lista ordenada por `dataHora`:

```js
[
  {
    dataHora,
    tipoEvento,
    descricao,
    operador,
    origem,
    resumo,
    detalhes
  }
]
```

### Campos padronizados
- `dataHora`: timestamp do evento/edição.
- `tipoEvento`: código do evento (ou `CASO_EDITADO` para histórico de edição).
- `descricao`: descrição operacional.
- `operador`: operador identificado no evento (quando disponível).
- `origem`: `CASOS`, `FOTO`, `EDICAO` ou `ACESSO`.
- `resumo`: texto amigável para leitura rápida.
- `detalhes`: objeto com dados de apoio (fonte e metadados relevantes).

## Benefícios operacionais
- Auditoria rápida da trilha do caso.
- Visão da evolução cronológica de decisões e alterações.
- Suporte à supervisão com identificação de autoria (`operador`) e momento (`dataHora`).
