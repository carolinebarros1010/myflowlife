# Consulta de fotos e imagens

No modo central, as imagens são lidas de `D:\CabineVerde\fotos` pelo endpoint `GET /api/fotos`. Cada imagem é acompanhada do arquivo `.meta.json`, que fornece nome da vítima, talão, data do talão, autorização e identificador da ocorrência.

A busca do aplicativo consulta esses metadados e abre a imagem pela URL HTTP do servidor. A listagem também é adaptada ao formato local esperado pela tela, sem copiar a imagem para o computador do operador.

O confronto facial continua sendo uma operação separada: o Electron primeiro monta um manifesto local temporário das imagens centrais e só então executa o motor de confronto.
