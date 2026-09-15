# API central Cabine Verde

O `server/server.py` utiliza uma `dataRoot` oficial configurável por `CABINE_VERDE_DATA_ROOT`, por exemplo `D:\\CabineVerde` ou `C:\\Users\\Ricardo Junior\\Desktop\\CabineVerde` durante a homologação. Sem essa variável, ele prioriza `D:\\CabineVerde` e depois a base JSON do Desktop quando `dados\\metadados.json` existir. A estrutura esperada é:

```text
D:\\CabineVerde\\dados\\pessoas.json
D:\\CabineVerde\\dados\\analises-f2.json
D:\\CabineVerde\\dados\\eventos.json
D:\\CabineVerde\\dados\\casos.json
D:\\CabineVerde\\dados\\vitimas.json
D:\\CabineVerde\\dados\\taloes.json
D:\\CabineVerde\\dados\\metadados.json
D:\\CabineVerde\\fotos\\
D:\\CabineVerde\\documentos\\
D:\\CabineVerde\\backup\\
D:\\CabineVerde\\logs\\
```

Arquivos existentes são carregados e validados. `metadados.json` é obrigatório e deve conter `schemaVersion: "1.0.0"`; se estiver ausente ou incompatível, o servidor não inicia. Os demais JSON ausentes podem ser criados vazios. Arquivos inválidos interrompem a inicialização; nunca são sobrescritos. Não há importação automática de planilhas, SQLite legado ou dados embarcados no instalador.

Uma base vazia só pode ser criada explicitamente:

```powershell
python server.py --init-database
```

As gravações usam lock, arquivo temporário, validação JSON, backup do arquivo anterior e substituição atômica. O SQLite local não é usado como fonte da Nova Análise F2.

## Rotas

A API preserva:

- `GET /api/status`;
- `GET /api/indicadores`: resumo agregado do Dashboard (`totais`, `status`, `atendimentos` e `dashboardOperacional`), calculado no servidor sem enviar `/api/ocorrencias` inteiro ao frontend. Aceita `inicio` e `fim` no formato `YYYY-MM-DD`.
- `GET/POST /api/ocorrencias`;
- `GET /api/ocorrencias/:id`;
- `PUT/PATCH /api/ocorrencias/:id`;
- `GET/POST /api/fotos` e `GET /api/fotos`;
- `POST /api/fotos/consentimento`;
- arquivos em `/fotos/...` e `/documentos/...`.

Para o vertical slice F2:

- `GET /api/pessoas/busca`;
- `POST /api/pessoas`;
- `GET /api/analises`;
- `GET /api/analises/:id`;
- `POST/PATCH /api/analises`;
- `GET/POST /api/eventos`.

As fotos preservam no arquivo `.meta.json` os metadados recebidos no upload (`nome`, `talao`, `dataTalao` e `idOcorrencia`). Para arquivos antigos sem esses campos, a listagem aplica fallback pelo caso vinculado e pelo padrão do nome do arquivo, como `2026-08-24_9266_BENEDITA-APARECIDA-DE-LIMA.jpg`.

`GET /api/eventos` aceita `idPessoa` ou `idCaso`. Atualizações de ocorrência feitas pela Área de Trabalho e pela Finalização geram eventos centrais; a criação formal registra `CASO_190_CRIADO` e alterações de desfecho registram `FINALIZACAO_ATUALIZADA`.

### Filtros da busca de pessoas

`GET /api/pessoas/busca` mantém os filtros de identificação (`termo`, `dataTalao` e `talao`) e aceita também:

- `status`: situação explícita mais recente do histórico F2;
- `condicao`: condição operacional, como `PENDENTE_QUALIFICACAO`, `EM_ACOMPANHAMENTO` ou `QUALIFICADA`;
- `estagio`: estágio do atendimento, como `APENAS_ANALISE_F2`, `CONTATO_REGISTRADO` ou `QUALIFICACAO_COMPLETA`;
- `contato`: `SIM` ou `NAO`, conforme evento explícito de contato telefônico.

Os filtros podem ser combinados. `APENAS_ANALISE_F2` identifica a pessoa que possui análise F2, mas ainda não possui qualificação nem contato telefônico registrado. A metodologia completa está em [metodologia-busca-e-estagio-atendimento.md](metodologia-busca-e-estagio-atendimento.md).

## Clientes

O Electron inicia em modo central por padrão, com `http://127.0.0.1` ou `CABINE_VERDE_API_URL`. No PC2, configure `http://10.59.186.112` na aba **Configurações**. Uma configuração local já existente continua sendo respeitada como escolha explícita de compatibilidade.

O React/Electron não abre os JSON diretamente. Toda leitura e escrita de pessoas, análises e eventos passa pela API HTTP.

## Dois computadores

1. Copie a base JSON para `D:\\CabineVerde` no servidor real ou use `C:\\Users\\Ricardo Junior\\Desktop\\CabineVerde` durante a homologação.
2. Execute no PC1:

```powershell
$env:CABINE_VERDE_DATA_ROOT='D:\\CabineVerde'
python server.py
```

3. Libere a porta HTTP para a rede operacional autorizada.
4. No PC1, use `http://127.0.0.1`.
5. No PC2, use `http://10.59.186.112`.

Os dois aplicativos consultam a mesma base oficial pelo servidor HTTP.

`GET /api/ocorrencias` expõe aliases de leitura (`id`, `idCaso`, `nome`, `nome_desaparecido`, `talao`, `talao_pm`, `status` e `statusCaso`) derivados da estrutura oficial de casos, vítimas e pessoas. Esses aliases existem para compatibilidade da interface e não alteram os arquivos JSON. A interface central não complementa a lista com casos do SQLite local.

Para validar persistência e concorrência no desenvolvimento:

```powershell
npm run test:server
```
