# Operação local da Cabine Verde

O modo local usa `dados/cabine-verde.sqlite` dentro da pasta de dados do usuário. Os registros marcados como `LEGADO` não participam mais das consultas operacionais.

Os 254 localizados oficiais permanecem na tabela `localizacoes_legado` e são apresentados na aba **Localizações** a partir dessa fonte, sem duplicação como casos em andamento.

A pasta `server` contém uma cópia dos arquivos necessários para a futura instalação do servidor JSON. Ela fica separada do fluxo local e não é executada durante os testes.

## Migração da planilha F2

O arquivo `Planilha de Dados F2 CABINE VERDE ABRIL.xlsx` usa as colunas operacionais A:K nas abas diárias. O script `tools/migrar-planilha-f2-para-sqlite.py` lê essas posições, consolida repetições por talão + nome, grava cada linha original em `eventos_caso` e recalcula o status pela evidência de localização, custódia, óbito, contato ou ausência de preenchimento.

A execução de 02/09/2026 importou 5.867 linhas e consolidou 5.817 casos no banco local. O histórico oficial de 254 localizados permanece na tabela `localizacoes_legado`.

## Área de trabalho e produção diária

A aba **Área de trabalho** exibe a inserção de atendimento, com os fluxos rápido e qualificado. O formulário de produção diária permanece exclusivamente na aba **Resumo diário**. Ao salvar, os indicadores gravados em `producao_diaria` são somados ao consolidado mensal consultado pelo painel.
