# Lock transacional no Talão 190 (Cabine Verde)

## Risco de race condition
Sem lock transacional no Google Apps Script, duas execuções simultâneas podem ler o mesmo estado da aba diária, decidir por `insert` na mesma janela de tempo e produzir duplicidade operacional no Talão 190.

## Motivo do LockService
Foi aplicado `LockService.getDocumentLock()` na entrada de `sincronizarTalao190(caso)` para serializar a seção crítica no nível do documento (planilha), reduzindo conflito entre operadores, chamadas paralelas de frontend/backend e múltiplos `doPost`.

## Escopo protegido
O lock envolve todo o fluxo crítico:
- resolução da data operacional;
- obtenção/criação da aba diária;
- validação estrutural;
- verificação de duplicidade;
- escolha da linha (existente ou primeira livre);
- decisão `insert`/`update`;
- escrita final na planilha;
- logs operacionais.

## Impacto operacional
- preserva UPSERT por `idCaso`, talão normalizado e assinatura operacional;
- evita duplicidade por concorrência simultânea;
- mantém rastreabilidade do Talão 190 sem alterar layout da planilha.

## Timeout/falha de lock
Quando `waitLock(30000)` falha, o fluxo registra `ERRO_LOCK_TALAO_190` com contexto operacional (`idCaso`, talões, nome, timestamp, mensagem e stack quando disponível) e retorna status de erro.
Também foram adicionados logs de sucesso:
- `LOCK_TALAO_190_ADQUIRIDO`;
- `LOCK_TALAO_190_LIBERADO`.
