# Diagnóstico e correção — busca de imagens e dashboard

## Diagnóstico

- A fonte central desta versão é o repositório JSON em `dados/`, não um SQLite. O SQLite em `electron/main.cjs` é somente a persistência local quando o modo local é selecionado.
- As imagens são arquivos físicos em `fotos/`, acompanhados por `<arquivo>.meta.json`. O vínculo principal é `idOcorrencia`/`idCaso`; talão e nome podem estar nos metadados ou no caso central.
- O endpoint de consulta é `GET /api/fotos`. Antes da correção, o cliente baixava a lista inteira e filtrava o JSON superficialmente; metadados legados sem nome/talão não eram relacionados de forma robusta ao caso.
- O encerramento é `PUT /api/ocorrencias/{id}`. Antes da correção, o caso era persistido e auditado, mas `/api/indicadores` calculava o painel principalmente de `historicosV7`, `pessoas` e `eventos`; uma alteração recente no caso não entrava nas categorias.

## Correção

- `GET /api/fotos?termo=...` agora pesquisa no servidor, com normalização de acentos, maiúsculas/minúsculas, espaços e talão formatado, aceitando nome parcial e todos os tokens informados.
- A montagem da resposta recupera nome e talão do caso central e mantém fallback para nomes de arquivo e metadados de fotos migradas.
- A finalização marca o caso como `finalizado`, grava `dataEncerramento` e deriva `statusCaso` compatível com localização, custódia ou óbito antes de salvar o evento de auditoria.
- O dashboard recalcula a cada solicitação e soma os casos centrais finalizados às categorias legadas quando aplicável. Nenhum indicador depende do banco local do cliente em modo central.
- O bridge Electron envia o termo para a API, em vez de executar a filtragem de fotos no computador cliente.

## Testes

Foram adicionados testes integrados para: foto por nome parcial e talão sem formatação; finalização persistida; incremento imediato do total e da categoria de óbito; e evento `FINALIZACAO_ATUALIZADA`. A suíte `npm run test:server` passou com 12 testes.

## Erro de gravação observado no PC01

O erro `WinError 5 ... casos.json.tmp -> casos.json` acontece na substituição atômica do arquivo central. O repositório usava um nome temporário fixo (`casos.json.tmp`), sujeito a colisão entre processos e a bloqueios transitórios do Windows. Agora cada gravação usa um temporário exclusivo por processo/thread, tenta a substituição por até cinco vezes e remove o temporário mesmo em caso de falha. Se o arquivo continuar bloqueado, a API retorna erro explícito de arquivo central bloqueado.

## Confronto facial

O erro apresentado no confronto era `Tempo limite de 8 segundos excedido` durante a preparação do manifesto local das fotos centrais. Essa etapa pode baixar muitas imagens e ocorrer na primeira inicialização do motor/modelo. O timeout HTTP do Electron foi ampliado para 120 segundos; o confronto continua usando o manifesto derivado da API central e o motor facial local, sem transformar o cache em fonte oficial.

## Legados e operação

Não foi necessária uma migração destrutiva: a compatibilidade é resolvida na leitura dos metadados e dos aliases de casos. A instalação em produção deve publicar o servidor atualizado e manter todos os clientes em modo `central`; o teste com dois computadores exige repetir a consulta a `/api/indicadores` após a gravação.
