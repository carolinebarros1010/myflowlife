# Produção diária

A aba **Resumo diário** registra os indicadores por data e operador responsável. O formulário de lançamento e o quadro pronto para compartilhamento ficam exclusivamente nessa aba; a **Área de trabalho** permanece dedicada à operação dos casos. O operador é preenchido a partir da sessão autenticada; o estagiário permanece como informação complementar e não é contabilizado como operador.

## Persistência

- No modo local, os lançamentos são mantidos na tabela SQLite `producao_diaria`.
- No modo central, são mantidos na coleção `dados/producao-diaria.json` do servidor, sem substituir arquivos existentes. O servidor cria essa coleção vazia apenas quando ela ainda não existe.
- A chave de atualização é `data + operadorEmail`. Salvar novamente o mesmo dia para o mesmo operador executa atualização, evitando duplicidade.
- O histórico importado do relatório não preenche a produção diária ativa. Ele permanece no resumo mensal/consolidado; a produção diária começa somente com lançamentos feitos pelos operadores.

## API central

- `GET /api/producao-diaria?inicio=AAAA-MM-DD&fim=AAAA-MM-DD&operadorEmail=...`
- `POST /api/producao-diaria`
- `PUT /api/producao-diaria/{id}`

Os indicadores numéricos são normalizados para inteiros não negativos. A tela consulta o período mensal selecionado, permite filtrar por e-mail e exibe totais calculados a partir dos registros persistidos.

## Validação

O build deve ser executado com `npm run build`. Testes contra a base real do servidor não fazem parte do empacotamento; para homologação, usar uma cópia/backup da base e validar login, salvamento, atualização do mesmo dia e consulta central.
