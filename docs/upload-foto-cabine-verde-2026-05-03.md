# Upload de foto no fluxo Cabine Verde (2026-05-03)

## Alterações
- Front-end agora envia a imagem para a action `uploadFotoCaso` ao selecionar arquivo no campo `fotoDesaparecido`.
- URL retornada é gravada em estado (`urlFotoUploadAtual`) e persistida em `urlFoto`/`linkFoto` no payload de `salvarCaso`.
- Em edição sem nova foto, a URL existente é preservada.
- Em edição com nova foto, a URL é substituída pela URL do novo upload.
- GAS adiciona a action `uploadFotoCaso` no `doPost`, usando o fluxo existente de `salvarFotoDesaparecido_`.
- Schema CASOS adiciona a coluna `urlFoto`.
- CV Card (detalhe do caso) exibe imagem quando houver `urlFoto`/`linkFoto`; caso contrário exibe placeholder.
