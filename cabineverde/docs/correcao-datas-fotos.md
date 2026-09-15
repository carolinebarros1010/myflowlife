# Correção de datas nos nomes das fotos

Alguns arquivos de 2026 foram recebidos com o padrão `06AGO126`. O importador antigo interpretava `126` literalmente como o ano 126 e gerava nomes como `0126-08-06`.

O importador agora normaliza esse padrão para `2026-08-06`. A correção da regra vale para novas importações. Arquivos já gravados com `0126-...` devem ser corrigidos por uma rotina de reindexação com backup, preservando a imagem original e o respectivo `.meta.json`.
