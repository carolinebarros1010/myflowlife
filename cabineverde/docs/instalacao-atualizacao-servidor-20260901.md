# Pacote para o servidor — 01/09/2026

O material do pendrive é separado em duas partes:

- `Cabine-Verde-Setup-0.2.4.exe`: instala a versão do aplicativo.
- `Atualizacao-Servidor-20260901`: atualiza a base e o arquivo de consulta do servidor já existente.

## Instalação

Execute `Cabine-Verde-Setup-0.2.4.exe` no computador servidor e conclua o instalador. Se já houver uma instalação, mantenha o mesmo caminho escolhido pelo instalador.

## Atualização da base existente

1. Feche o Cabine Verde no servidor.
2. Faça backup do banco atual em `%APPDATA%\Cabine Verde\dados\cabine-verde.sqlite`.
3. Copie `Atualizacao-Servidor-20260901\dados\cabine-verde.sqlite` para `%APPDATA%\Cabine Verde\dados\cabine-verde.sqlite`.
4. Copie `Atualizacao-Servidor-20260901\dados\consulta\producao-consolidada\producao-consolidada.json` para `%APPDATA%\Cabine Verde\dados\consulta\producao-consolidada\producao-consolidada.json`.
5. Abra o aplicativo e confirme a consulta de um talão importado e o resumo diário.

O banco contém os casos existentes, os 254 registros de localização do relatório e os lançamentos diários importados do XLSX. A cópia distribuída foi conferida com 9.777 casos e 389 lançamentos diários. Não substitua o banco com o aplicativo aberto.
