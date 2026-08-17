# Migracao local rapida

O banco local da Cabine Verde e SQLite. A origem legada nunca e alterada pelo importador.

## Preparar os arquivos

Baixe a planilha principal como Excel (`Arquivo > Fazer download > Microsoft Excel`) e coloque o `.xlsx` em uma pasta:

```text
dados-legados/
  Cabine Verde.xlsx
```

O importador le todas as abas do arquivo. Tambem aceita varios CSV ou JSON. Os cabecalhos podem ser antigos; aliases de `idCaso`, `talaoPMESP`, nome, status e observacoes sao reconhecidos.

## Validar sem gravar

Na pasta `cabineverde`:

```powershell
npm run migrate:legacy -- "C:/caminho/dados-legados" --dry-run
```

## Gravar o banco local

```powershell
npm run migrate:legacy -- "C:/caminho/dados-legados" --output "data/cabine-verde.sqlite"
```

O processo e idempotente por arquivo e linha de origem. Registros brutos permanecem em `casos.bruto_json`; observacoes antigas permanecem em `legado_observacoes`.

O relatorio informa arquivos lidos, linhas, casos importados, incompletos, duplicados e erros. O arquivo SQLite deve ser copiado para backup antes de qualquer uso operacional.
