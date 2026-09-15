# Importação da planilha histórica da Cabine Verde — 2026-08-26

## Fonte

- Arquivo: `Planilha de Dados F2 CABINE VERDE ABRIL.xlsx`.
- Origem local versionada: `CabineVerde_Pacote_D_19AGO2026/`.
- A planilha original do Drive foi tratada como somente leitura.

## Estratégia aplicada

O importador passou a localizar o cabeçalho real de cada aba, ignorando capas, títulos e textos decorativos anteriores à tabela. Cabeçalhos repetidos recebem nomes estáveis (`DATA`, `DATA_2`, por exemplo), e o registro completo permanece preservado em `dados_json` e `bruto_json`.

Registros sem nome e sem talão, ou compostos apenas por marcadores (`*****`), não são cadastrados como casos. A chave técnica dos casos sem `idCaso` é formada por aba e linha de origem, permitindo reexecução idempotente.

## Resultado verificado

- 135 abas analisadas.
- 7.190 linhas de dados lidas.
- 5.356 casos importados.
- 26 casos marcados como `INCOMPLETO` por falta de talão ou nome.
- 0 duplicidades na execução corrigida.
- 0 erros de importação.

O banco local atualizado é `dados/cabine-verde.sqlite`. Foi preservado o backup `dados/cabine-verde.sqlite.backup-before-planilha-fix-20260826`.

## Operação

No modo local, a busca da aplicação consulta `id_caso`, talão, nome e o JSON completo do caso. O modo central consulta a base HTTP configurada e não complementa automaticamente os resultados com o SQLite local; uma futura publicação central deverá importar o mesmo lote para a base oficial do servidor.
