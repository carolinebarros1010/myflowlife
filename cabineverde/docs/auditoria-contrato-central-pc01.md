# Auditoria do contrato central do PC01

## Causa raiz

O PC01 estava executando uma versão antiga do `server.py`, baseada em
`ocorrencias.json`. O aplicativo atualizado chama `GET /api/indicadores` para
o Dashboard; essa rota não existia na cópia antiga.

## Métodos do cliente e rotas HTTP

| Método exposto | Rota e método | Observação |
|---|---|---|
| `configuracao` | Nenhuma | Configuração local do Electron. |
| `testarServidor` | `GET /api/status` | Testa conectividade e schema. |
| `dashboard` | `GET /api/indicadores` | Retorna somente agregados; aceita `inicio` e `fim`. |
| `listarCasos` | `GET /api/busca?termo=...` | Busca central unificada. |
| `carregarCaso` | `GET /api/ocorrencias/{id}` | Carrega caso operacional ou histórico V7. |
| `listarVitimasCaso` | Nenhuma no modo central atual | Ainda consulta SQLite local. |
| `listarFotos` | `GET /api/fotos` | O cliente filtra o caso localmente. |
| `historicoCaso` | `GET /api/eventos?idCaso=...` | Histórico de eventos. |
| `buscarPessoasF2` | `GET /api/pessoas/busca?...` | Busca por termo, talão, status, condição e estágio. |
| `criarPessoaF2` | `POST /api/pessoas` | Cria pessoa com escrita atômica e evento. |
| `listarAnalisesF2` | `GET /api/analises?idPessoa=...` | Lista análises temporais. |
| `criarAnaliseF2` | `POST /api/analises` | Impede duplicação por data e talão. |
| `listarEventosF2` | `GET /api/eventos?idPessoa=...` | Lista eventos da pessoa. |
| `criarQualificacaoF2` | `POST /api/qualificacoes` | Acrescenta qualificação. |
| `criarPistaF2` | `POST /api/pistas` | Acrescenta pista. |
| `auditoria` | Nenhuma no modo central atual | Consulta SQLite local do aplicativo. |

As operações de foto também usam `POST /api/fotos` e
`POST /api/fotos/consentimento`; atualizações formais usam
`POST/PUT /api/ocorrencias`.

## DataRoot

Em produção, o script de inicialização define:

```text
D:\CabineVerde
```

O servidor valida `dados/metadados.json`, preserva JSONs existentes e usa o
repositório com arquivo temporário, backup e substituição atômica nas escritas.

## Dashboard

`GET /api/indicadores` retorna `ok`, `totais`, `status`, `atendimentos`,
`historicoV7` e `dashboardOperacional`. O Electron não baixa
`/api/ocorrencias` para calcular o painel.

## Deploy

Copiar somente o conteúdo de `deploy-pc01` para
`C:\Users\DESPACHADOR\CabineVerdeServidor`. Não copiar a base, fotos,
documentos ou backups.
