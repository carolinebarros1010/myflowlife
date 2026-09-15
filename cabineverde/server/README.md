# Pasta de atualização do servidor

Esta pasta contém os arquivos do servidor JSON que poderão ser copiados para o computador servidor quando a operação local for validada:

- `server.py`: API e gravação central em JSON;
- `storage_repository.py`: persistência e bloqueio dos arquivos centrais;
- `search_methodology.py`: metodologia de busca e classificação.

Durante o teste local, a aplicação usa exclusivamente o banco SQLite em `dados/cabine-verde.sqlite`. O conteúdo desta pasta não é iniciado automaticamente.
