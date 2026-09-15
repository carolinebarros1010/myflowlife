# Atualização da base em 24/08/2026

## Escopo

Foram incorporados os registros da F2 referentes às abas `18AGO26`, `19AGO26` e `20AGO26` da planilha de dados da Cabine Verde.

Os 158 atendimentos foram inseridos na tabela `casos` com:

- nome e talão pesquisáveis;
- data, documento, solicitante, telefone e observações preservados;
- `status_caso` definido como `Em triagem`;
- `localizado` e `encerrado190` definidos como falsos.

O status de origem da planilha foi preservado em `dados_json.statusOrigem`, sem concluir automaticamente o caso. O operador deve registrar o desfecho pela aplicação.

## Indicadores e histórico

O indicador legado foi atualizado para total de 223 localizações, mantendo os valores de produção da planilha. Os cinco registros recentes das linhas 270 a 274 foram incluídos em `localizacoes_legado`, sem alterar o status dos casos.

O script reproduzível é `tools/aplicar-atualizacao-f2-18-20-agosto.py` e o manifesto de origem é `data/imports/f2-atualizacao-18-20-ago-2026.json`.

Cada banco atualizado recebeu uma cópia de segurança com o sufixo `.backup-antes-f2-20260824`.
