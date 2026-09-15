# Importação do acervo de fotos de solicitantes

O acervo em `Documentos_Cabine_Verde` contém fotos enviadas por solicitantes ou familiares. Essas imagens são dados sensíveis e devem permanecer privadas, com acesso controlado e autorização registrada separadamente.

## Preparação

O utilitário `tools/preparar_importacao_fotos.py` não altera os originais por padrão. Ele:

- extrai `nomeVitima`, `talao` e `dataTalao` de nomes de arquivos e pastas;
- normaliza a sugestão de caminho para `fotos/IMPORT-{data}_{talao}_{nome}`, compatível com a rota atual do servidor;
- calcula SHA-256 para identificar cópias;
- gera `manifesto-fotos.json` e `manifesto-fotos.csv`;
- marca como `REVISAR` os registros sem metadado confiável ou duplicados.

Exemplo de preparação:

```powershell
python tools/preparar_importacao_fotos.py `
  --origem Documentos_Cabine_Verde `
  --saida Documentos_Cabine_Verde/_importacao
```

Depois da conferência manual do manifesto, a cópia para uma base explícita do servidor pode ser feita com `--copiar --destino D:\CabineVerde`. O comando não sobrescreve um destino com conteúdo diferente.

O `idCaso` definitivo continua sendo o vínculo operacional principal. O talão, a data e o nome são metadados de conferência e pesquisa; quando o caso for localizado na base, o registro deve ser associado ao `idCaso` correspondente.
