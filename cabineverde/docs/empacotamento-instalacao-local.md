# Empacotamento e armazenamento local

O instalador do Cabine Verde é gerado com `npm run pack:win` e cria um instalador NSIS para Windows x64.

Após a instalação, o banco e os arquivos operacionais ficam em uma pasta persistente do usuário:

`%APPDATA%\Cabine Verde\`

Estrutura criada automaticamente:

- `dados\cabine-verde.sqlite`: banco oficial local, inicializado com o legado incluído no instalador.
- `fotos\casos\<id-do-caso>\`: fotos novas, separadas por caso.
- `fotos\legado\`: espaço reservado para fotos antigas arquivadas.

A pasta de instalação contém somente o programa. Assim, atualizar ou reinstalar o aplicativo não substitui o banco nem as fotos já cadastradas. O primeiro acesso copia o banco legado empacotado para a pasta persistente quando ainda não existir um banco local.

Para transportar a operação para outro computador, copie a pasta `%APPDATA%\Cabine Verde\` para o mesmo local no novo usuário antes de abrir o aplicativo. O confronto de imagens continua local e o motor Python deve ser instalado separadamente quando for utilizado.
