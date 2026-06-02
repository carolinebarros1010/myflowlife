# Relatório de Auditoria Técnica — Cabine Verde

> **Escopo executado:** auditoria estática do repositório `/workspace/myflowlife`, com foco no módulo `cabineverde`, nos artefatos Google Apps Script em `cabineverde/GAS`, front-end TypeScript/JavaScript em `cabineverde/src` e `cabineverde/public`, páginas HTML legadas e documentação técnica já existente em `docs` e `cabineverde/docs`.
>
> **Limite operacional:** esta etapa não alterou código-fonte, não refatorou, não removeu arquivos e não executou correções automáticas. O único arquivo criado é este relatório.
>
> **Comandos principais usados na auditoria:** `find .. -name AGENTS.md -print`, `rg --files`, `find . -maxdepth 3 -type d`, `wc -l`, `rg -n`, `sed -n`, `nl -ba` e scripts Python locais de extração de colunas/perguntas.

## 1. Resumo executivo

O repositório contém um ecossistema MyFlowLife amplo, mas o sistema **Cabine Verde** está concentrado em `cabineverde/` e em documentação complementar na pasta raiz `docs/`. A arquitetura atual é híbrida: front-end web estático/modular em TypeScript compilável/JavaScript, páginas HTML legadas, persistência local via `localStorage`, integração oficial com Google Apps Script por Web App e persistência operacional em Google Sheets/Google Drive.

### Achados críticos

| Tema | Situação encontrada | Risco |
|---|---|---:|
| Persistência central | Google Apps Script grava na aba `CASOS` e sincroniza Talão 190/COPOM com `SpreadsheetApp`, `Range`, `setValues` e `appendRow`. | Alto |
| Identidade do caso | Há UPSERT por `idCaso`, `talaoPMESP` e `CHAVE_UNICA`, mas também há fallback legado `CV-${Date.now()}` no front público. | Alto |
| Questionário | Não foram encontradas 181 perguntas declaradas; foram encontrados **65 itens dinâmicos** na árvore de decisão e **130 colunas `arv_*`** de resposta/complemento, além de formulário legado com 40 perguntas em `auditoria.html`. | Alto |
| Modelo de dados | Há divergência entre schema GAS de `CASOS` com 182 colunas e payload TypeScript com 191 colunas, incluindo `talaoPMESP`, operadores e campos físicos extras. | Alto |
| Segurança/LGPD | Endpoint Apps Script está exposto no front; logs técnicos registram payload bruto; dados pessoais e fotos trafegam por Web App/Drive/Sheets. Existem controles por operador, mas baseados em e-mail/perfil em planilha/localStorage. | Crítico |
| Fotos | Upload usa Drive privado, metadados em `FOTOS_DESAPARECIDOS`, validação e logs de acesso; há risco de inconsistência porque `nivelAcesso`/`observacoesFoto` são enviados pelo front TS, mas o roteador GAS de upload não repassa todos esses campos ao serviço. | Alto |
| Migração | O domínio operacional está suficientemente mapeado para migração incremental, mas a ordem das colunas e compatibilidade dos nomes devem ser congeladas antes de qualquer escrita pelo novo sistema. | Alto |

### Recomendação executiva

A migração para React + NestJS deve começar por **banco espelho e API de leitura**, sem interromper o Apps Script. A escrita deve migrar apenas depois de estabilizar: schema canônico, idempotência, índice de talões, trilha de auditoria, controle de acesso forte, tratamento de anexos e reconciliação com Talão 190/COPOM.

## 2. Arquitetura atual identificada

### 2.1 Front-end

Encontrado:

- `cabineverde/index.html`: entrada raiz leve que redireciona para `public/index.html`.
- `cabineverde/public/index.html`: entrada operacional principal do front público/modular.
- `cabineverde/public/js/core.js`: núcleo JavaScript operacional com endpoint Apps Script, sessão local de operador, árvore de decisão, colunas da planilha, payload, chamadas GAS e wrappers de consulta/edição/timeline.
- `cabineverde/public/js/app.js`: camada de UI modular pública, renderização de módulos e comandos operacionais.
- `cabineverde/src/app.ts`: aplicação TypeScript principal com navegação modular, triagem, rascunhos, salvamento, upload de foto, consulta, relatórios e status de sincronização.
- Componentes em `cabineverde/src/components`, com destaque para `form/TriageForm.ts`, `triagem/*`, `desaparecidos/*`, `relatorios/ReportView.ts` e `layout/*`.
- Página legada `cabineverde/auditoria.html`, com formulário/auditoria, exportação DOCX/backup e integração direta com GAS.

### 2.2 Back-end

Encontrado:

- Back-end operacional real em **Google Apps Script** na pasta `cabineverde/GAS`.
- `Code.gs` concentra roteamento `doGet`/`doPost`, autenticação/autorização por operador, busca, edição controlada, auditoria, persistência, Talão 190, duplicidade, reconcilição e relatórios.
- `Utils.gs` concentra parse de payload, respostas JSON, abertura de planilha, garantia de estrutura e normalização.
- `CabineVerdeSchema.gs` define schema unificado de abas.
- `FotosDesaparecidos.gs` concentra upload, validação, visualização controlada, logs de acesso, exclusão/consolidação e limpeza de temporários.
- `AuditoriaQualidadeDados.gs` audita dados mínimos e registra pendências de qualidade.
- `MigracaoLegado.gs` contém rotinas extensas de migração/compatibilização legada.

### 2.3 Persistência

Encontrado:

- Persistência oficial: Google Sheets, especialmente aba `CASOS`, `OPERADORES`, `TRIAGEM_RESPOSTAS`, `EVENTOS_CASO`, `INDICADORES_OPERACIONAIS`, `QUALIDADE_DADOS`, logs e abas de fotos.
- Persistência temporária/local: `localStorage` para casos, logs, rascunhos e sessão de operador.
- Persistência de anexos: Google Drive, pasta raiz `Cabine Verde/Fotos/{ano}/{mes}/{idCaso}_{talaoPMESP}`.

### 2.4 Integrações

- Google Sheets: `SpreadsheetApp`, `openById`, `getActiveSpreadsheet`, `getRange`, `setValues`, `appendRow`, `insertSheet`, `copyTo`, `deleteRows`.
- Google Drive: `DriveApp`, criação de pastas/arquivos, `setSharing(PRIVATE, VIEW)`, `getFileById`, `setTrashed`, `setName`.
- Web App Apps Script: endpoint público hardcoded em `src/config/env.ts`, `public/js/core.js` e `auditoria.html`.
- Bibliotecas externas em `auditoria.html`: Chart.js, docx e FileSaver por CDN.

### 2.5 Autenticação/autorização

Encontrado:

- Não há autenticação moderna OIDC/JWT no front React/NestJS, pois NestJS ainda não existe.
- Há controle operacional no GAS via aba `OPERADORES`, perfis `OPERADOR`, `SUPERVISOR`, `ADMIN`, `AUDITOR`, validação por e-mail e cache de operadores.
- O front usa `localStorage` para `cabineVerdeOperadorEmail`, `cabineVerdeOperadorNome`, `cabineVerdeOperadorPerfil`, `cabineVerdeOperadorValidadoEm` e expiração local de 12 horas.
- O GAS valida permissão por ação (`validarPermissaoAcao_`) e bloqueia ações sensíveis, mas o modelo é vulnerável a manipulação de payload/localStorage se não houver validação robusta do operador no servidor para todas as rotas.

## 3. Estrutura do repositório

### 3.1 Diretórios principais

| Diretório | Papel identificado |
|---|---|
| `cabineverde/` | Módulo principal Cabine Verde. |
| `cabineverde/GAS/` | Google Apps Script backend. |
| `cabineverde/src/` | Front-end TypeScript modular. |
| `cabineverde/public/` | Front estático publicado, JS/CSS públicos. |
| `cabineverde/tests` e `cabineverde/tests-js` | Testes TypeScript/Node e JavaScript. |
| `cabineverde/docs/` | Documentação técnica específica do módulo. |
| `docs/` | Documentação técnica histórica/transversal, incluindo várias auditorias de Cabine Verde. |
| `scripts/` | Deploy de Cabine Verde. |
| `femflow/`, `legacy/`, `ebooks/`, `assets/`, `ios/`, `tools/` | Outros produtos/legados MyFlowLife, fora do núcleo Cabine Verde. |

### 3.2 Arquivos de entrada

- `cabineverde/index.html`: redirecionamento/entrada raiz.
- `cabineverde/public/index.html`: entrada principal do app publicado.
- `cabineverde/src/app.ts`: bootstrap lógico da aplicação TypeScript.
- `cabineverde/public/js/app.js`: UI pública compilada/legada.
- `cabineverde/public/js/core.js`: núcleo operacional público.
- `cabineverde/GAS/Code.gs`: entrada GAS via `doGet` e `doPost`.
- `cabineverde/auditoria.html`: página legada/autônoma de auditoria e relatórios.

### 3.3 HTML principais

| Arquivo | Observação |
|---|---|
| `cabineverde/index.html` | Entrada curta. |
| `cabineverde/public/index.html` | App operacional moderno estático. |
| `cabineverde/auditoria.html` | Formulário legado extenso, auditoria, exportação e integração GAS. |
| `index.html` raiz | Landing/root do repositório, não núcleo Cabine Verde. |

### 3.4 JavaScript/TypeScript principais

| Arquivo | Observação |
|---|---|
| `cabineverde/src/app.ts` | Orquestra triagem, rascunho, salvamento, upload, módulos e relatórios. |
| `cabineverde/src/services/sheetsService.ts` | Serviço HTTP para Apps Script. |
| `cabineverde/src/utils/sheetsPayload.ts` | Mapeamento de `CasoCompleto` para payload/colunas Sheets. Arquivo crítico. |
| `cabineverde/src/types/case.ts` | Modelo TypeScript do caso. |
| `cabineverde/public/js/core.js` | Núcleo JS público com colunas, árvore de decisão, GAS endpoint e wrappers. |
| `cabineverde/public/js/app.js` | Renderização da UI pública. |
| `cabineverde/GAS/*.gs` | Back-end Google Apps Script. |

### 3.5 CSS principais

- `cabineverde/src/styles/main.css`
- `cabineverde/public/styles/main.css`
- `cabineverde/auditoria.html` contém CSS inline extenso.
- `cabineverde/src/styles/main.css` e `public/styles/main.css` podem estar duplicados/divergentes; confirmar diffs antes de migração visual.

### 3.6 Google Apps Script

Arquivos encontrados:

- `cabineverde/GAS/Code.gs`
- `cabineverde/GAS/Utils.gs`
- `cabineverde/GAS/CabineVerdeSchema.gs`
- `cabineverde/GAS/SheetsMapping.gs`
- `cabineverde/GAS/FotosDesaparecidos.gs`
- `cabineverde/GAS/AuditoriaQualidadeDados.gs`
- `cabineverde/GAS/MigracaoLegado.gs`
- `cabineverde/GAS/appsscript.json`
- `cabineverde/GAS/MockPayload.json`

### 3.7 Documentação

Encontrados dezenas de documentos técnicos em `cabineverde/docs` e `docs`, incluindo integração Sheets, fluxo de triagem, fluxo de fotos, auditorias de duplicidade, COPOM, Talão 190, login operacional, hardening de segurança e schema de 181/182 colunas.

### 3.8 Configuração

| Arquivo | Observação |
|---|---|
| `cabineverde/package.json` | Scripts `test` e `dev`; pacote ESM privado. |
| `cabineverde/tsconfig.json` | Configuração TS. |
| `cabineverde/GAS/appsscript.json` | Manifest do Apps Script. |
| `scripts/deploy-cabineverde.sh` | Deploy/publish. |
| `.gitignore`, `_config.yml`, `CNAME` | Configuração repositório/site. |

### 3.9 Possíveis obsoletos/duplicados/temporários

- `cabineverde/auditoria.html`: operacional legado, mas ainda com integração real; não remover sem plano.
- `cabineverde/public/js/core.js` e `cabineverde/src/utils/sheetsPayload.ts`: duplicam mapeamento de colunas/payload com divergências.
- `cabineverde/src/styles/main.css` e `cabineverde/public/styles/main.css`: provável duplicidade de estilo.
- `cabineverde/GAS/MigracaoLegado.gs`: rotinas históricas; manter até concluir migração/reconciliação.
- Documentos históricos em `docs/` e `cabineverde/docs/`: úteis para auditoria, mas precisam índice/categorização.

## 4. Fluxos operacionais mapeados

### 4.1 Criação de novo caso

| Item | Detalhe |
|---|---|
| Arquivos | `src/components/form/TriageForm.ts`, `src/app.ts`, `src/utils/sheetsPayload.ts`, `src/services/sheetsService.ts`, `GAS/Code.gs`, `GAS/Utils.gs`. |
| Funções principais | `renderRegistroForm`, `renderTriageForm`, `buildCasoFromForm`, `calcularEstadoTriagem`, `gerarPayloadSheets`, `GoogleSheetsService.salvar`, `doPost`, `persistirRegistro`, `sincronizarTalao190`. |
| Entrada | Dados rápidos: talão, nome, idade, sexo, município, última visualização, solicitante, telefone; complementos e árvore `arv_*`. |
| Saída | Linha em `CASOS`, eventos, indicadores, logs, sincronização Talão 190, retorno com `idCaso`, `linha`, `action`. |
| Dependências | Endpoint GAS, planilha ativa/ID, schema, operador válido, conexão, ordem/nome das colunas. |
| Riscos | Schema divergente TS/GAS; payload bruto em logs; fallback de id temporário em JS público; inconsistência entre `talaoPMESP` e `talaoBopm`. |
| Migração | Migrar primeiro para endpoint NestJS transacional com DTO, validação, idempotency key e integração Sheets temporária assíncrona. |

### 4.2 Edição de caso

| Item | Detalhe |
|---|---|
| Arquivos | `src/app.ts`, `public/js/core.js`, `GAS/Code.gs`, `auditoria.html`. |
| Funções principais | `preencherFormularioComCaso`, `montarPayloadCasoParaSalvar`, `editarCasoControlado_`, `salvarHistoricoEdicoes_`, `salvarAuditoriaCaso_`. |
| Entrada | `idCaso`, alterações, operador, justificativa, e-mail de confirmação. |
| Saída | Atualização em `CASOS`, registros em `HISTORICO_EDICOES`/logs/eventos. |
| Dependências | Perfil autorizado, localização de linha, headers, justificativa. |
| Riscos | Múltiplos caminhos de edição; auditoria HTML usa mapeamento próprio; campos compostos podem sobrescrever campos reais se mapeamento estiver incompleto. |
| Migração | Criar `PATCH /cases/:id` com diff estruturado e tabela `case_audits`. |

### 4.3 Auditoria

| Item | Detalhe |
|---|---|
| Arquivos | `cabineverde/auditoria.html`, `GAS/AuditoriaQualidadeDados.gs`, `GAS/Code.gs`. |
| Funções principais | `salvarAuditoriaCaso_`, `auditarQualidadeDados_`, `resumoQualidadeDados_`, `marcarProblemaQualidadeResolvido_`, `gerarTimelineCaso_`. |
| Entrada | Caso buscado, checklist/alterações, problemas de qualidade. |
| Saída | Atualização de caso, `QUALIDADE_DADOS`, `EVENTOS_CASO`, logs. |
| Riscos | UI legado extensa; scripts CDN; endpoint hardcoded; manipulação direta de campos sensíveis. |
| Migração | Dashboard React de auditoria com permissões por role e trilha imutável. |

### 4.4 Consulta de caso

| Item | Detalhe |
|---|---|
| Arquivos | `GAS/Code.gs`, `public/js/core.js`, `auditoria.html`, componentes `desaparecidos`. |
| Funções principais | `buscarCaso_`, `obterCasoCompleto_`, `buscarCaso_` wrapper JS, `listarCasosComProtecao_`. |
| Entrada | `idCaso`, `talaoPMESP`, nome, termo. |
| Saída | Caso normalizado/mascarado conforme perfil; timeline opcional. |
| Riscos | Busca ampla pode expor dados pessoais; mascaramento depende do perfil recebido/validado. |
| Migração | `GET /cases` com filtros, paginação, RBAC, masking server-side e logs de consulta. |

### 4.5 Salvamento parcial/rascunho

| Item | Detalhe |
|---|---|
| Arquivos | `src/services/draftSessionService.ts`, `src/app.ts`. |
| Funções principais | `salvarRascunhoLocal`, `salvarAutoRascunhoLocal`, `carregarUltimoAutoRascunho`, `exportarRascunhoSessao`, `importarRascunhoSessao`. |
| Entrada | Estado `triagemState`. |
| Saída | `localStorage` com rascunho por sessão/id/talão. |
| Riscos | Dados pessoais no navegador sem criptografia; exportação de token pode carregar PII. |
| Migração | Rascunho server-side criptografado, TTL, dono/perfil e evento de acesso. |

### 4.6 Finalização de triagem

| Item | Detalhe |
|---|---|
| Arquivos | `src/app.ts`, `modules/triagem/triageEngine.ts`, `utils/risk.ts`, `utils/priority.ts`. |
| Funções principais | `calcularEstadoTriagem`, `calcularRisco`, `calcularPrioridade`, `calcularAptoCabineVerde`. |
| Entrada | Dados do desaparecido, vulnerabilidades, subfluxos. |
| Saída | `statusCaso`, risco, prioridade, ação sugerida, indicadores. |
| Riscos | Regras de risco existem em TS e JS público; risco de divergência. |
| Migração | Motor de triagem no NestJS com versão de regra e front consumindo resultado. |

### 4.7 Upload de foto

| Item | Detalhe |
|---|---|
| Arquivos | `src/components/form/TriageForm.ts`, `src/app.ts`, `src/services/sheetsService.ts`, `GAS/Code.gs`, `GAS/FotosDesaparecidos.gs`. |
| Funções principais | `salvarFotoDepoisDaTriagem`, `uploadFotoCaso`, `atualizarFotoCaso`, `salvarFotoDesaparecido_`, `registrarFotoNaPlanilha_`, `atualizarResumoFotosNoCaso_`. |
| Entrada | Arquivo imagem até 5MB, `idCaso`, `talaoPMESP`, metadados. |
| Saída | Arquivo Drive privado, registro `FOTOS_DESAPARECIDOS`, campos de foto em `CASOS`. |
| Riscos | Base64 via Web App; `nivelAcesso` e `observacoesFoto` não são repassados no roteador GAS de upload; logs registram metadados; link pode quebrar se arquivo for movido/lixeira. |
| Migração | Upload por API NestJS com storage privado, antivírus opcional, presigned URL, metadados e auditoria. |

### 4.8 Consolidação/substituição de foto

| Item | Detalhe |
|---|---|
| Arquivos | `GAS/FotosDesaparecidos.gs`. |
| Funções principais | `consolidarFotoCaso_`, `excluirFotoDrivePorUrlOuFileId_`, `limparFotosTemporarias_`. |
| Entrada | `idCaso`, `urlFoto`. |
| Saída | Renomeação `FOTO_{idCaso}.ext`, exclusão/lixeira de substituída, logs. |
| Riscos | Regex de fileId limitada; se URL do Drive tiver formato diferente pode não excluir; temporários só com prefixo `TEMP_`. |
| Migração | Entidade `Attachment` com versão/principal/status e storage lifecycle. |

### 4.9 Sincronização com aba CASOS

| Item | Detalhe |
|---|---|
| Arquivos | `GAS/Code.gs`, `GAS/Utils.gs`, `GAS/CabineVerdeSchema.gs`, `src/utils/sheetsPayload.ts`. |
| Funções principais | `garantirEstruturaCabineVerde_`, `garantirAbaComCabecalho`, `garantirColunasDaEstrutura`, `persistirRegistro`, `localizarLinhaCaso_`. |
| Entrada | Payload de caso. |
| Saída | Insert/update na aba `CASOS`. |
| Riscos | Dependência de cabeçalhos exatos; schema TS/GAS divergente; colunas extras adicionadas dinamicamente. |
| Migração | Tabela `cases` e exportador Sheets controlado. |

### 4.10 Sincronização com COPOM / Talão 190 / abas diárias

| Item | Detalhe |
|---|---|
| Arquivos | `GAS/Code.gs`. |
| Funções principais | `sincronizarTalao190`, `obterOuCriarAbaTalao190_`, `formatarNomeAbaTalao190_`, `montarLinhaTalao190`, `localizarLinhaAncoraRodape_`, `inserirLinhaOperacionalAntesRodape_`, `localizarLinhaDuplicadaRelatorio_`, `atualizarIndiceTaloes_`. |
| Entrada | Caso normalizado com talão/BOPM, data operacional, nome, telefone, observações. |
| Saída | Linha operacional em aba diária, índice de talões, logs de auditoria. |
| Riscos | Cabeçalho linha 6 em abas COPOM; dependência de âncora de rodapé; lock necessário; atualização errada pode tocar rodapé. |
| Migração | Job NestJS idempotente de sincronização diária, com tabela `daily_reports` e `integration_logs`. |

### 4.11 Recuperação de talão BOPM

| Item | Detalhe |
|---|---|
| Arquivos | `GAS/Code.gs`. |
| Funções principais | `recuperarTaloesAusentesCasos`, `buscarTalaoPorPrioridade_`, `mapearTalaoPorChaveCopom_`, `extrairTalaoTexto_`, `reconciliarTaloesComRelatoriosCOPOM`. |
| Entrada | Casos sem `talaoBopm`, logs/eventos/histórico/COPOM. |
| Saída | Atualizações em `CASOS`, logs de recuperação. |
| Riscos | Matching por nome/telefone/data/observação pode gerar falso positivo ou ambiguidade. |
| Migração | Serviço de reconciliação com candidatos e aprovação humana. |

### 4.12 Controle de duplicidade

| Item | Detalhe |
|---|---|
| Arquivos | `GAS/Code.gs`, `public/js/core.js`, `src/utils/sheetsPayload.ts`. |
| Funções principais | `gerarAssinaturaCaso_`, `localizarLinhaCaso_`, `obterChaveUnicaRegistro_`, `localizarLinhaPorChaveUnica_`, `analisarDuplicadosCasos_`, `limparDuplicadosCasos`, `gerarHashOperacionalTalao_`, `localizarCasoPorIndiceTaloes_`. |
| Entrada | `idCaso`, `talaoPMESP`, nome, telefone, data serviço, BOPM, `CHAVE_UNICA`. |
| Saída | Update/insert idempotente, relatório/limpeza de duplicados, índice. |
| Riscos | Ainda há fallback `CV-${Date.now()}`; múltiplas assinaturas; payloads sem `idCaso` podem duplicar; front local salva antes do backend confirmar. |
| Migração | Idempotency key única, constraint DB e tabela `duplicate_candidates`. |

### 4.13 Assinatura operacional e índice de talões

Encontrado em `GAS/Code.gs`:

- `gerarAssinaturaCaso_`
- `gerarAssinaturaOperacionalRelatorio_`
- `gerarHashOperacionalTalao_`
- `obterOuCriarIndiceTaloes_`
- `localizarCasoPorIndiceTaloes_`
- `validarReferenciaIndiceTaloes_`
- `atualizarIndiceTaloes_`
- `auditarIndiceTaloes_`
- `reconstruirIndiceTaloes_`

Risco: **médio/alto**. O índice reduz duplicidade no relatório, mas depende de hash/normalização e referência de linha. Qualquer mudança manual em planilha pode invalidar a referência.

### 4.14 Encerramento/localização

Encontrado:

- Campos `localizado`, `dataHoraLocalizacao`, `formaLocalizacao`, `encerrado190`, `numeroBo`, `statusCaso` no schema/payload.
- `montarLinhaTalao190` usa `encerrado190 || 'DESAPARECIDO'` na coluna 190.
- `statusCaso` contempla estados como `Localizado`/`Encerrado` no TS e `LOCALIZADO_VIVO`, `LOCALIZADO_OBITO`, `ENCERRADO` no formulário.

Risco: há inconsistência de nomenclatura de status entre enum/strings legadas e opções do formulário. Migrar com tabela de domínio (`case_status`) e normalização explícita.

## 5. Modelo de dados atual

### 5.1 Identificação do caso

- `idCaso` / `id`
- `talaoPMESP`
- `talaoBopm`
- `BOPM` em relatório Talão 190/COPOM
- `dataHoraRegistro`
- `dataServico`
- `turno`
- `equipe`
- `municipio`
- `statusCaso`
- `CHAVE_UNICA` / `chaveUnica` / `chaveRequisicao`

### 5.2 Identificação do desaparecido

- `nomeCompletoDesaparecido`
- `sexoGenero`
- `idade`
- `faixaEtaria`
- `cpf`
- `rg`
- `nomeMae`
- `dataNascimento`
- `corPele`
- `alturaAproximada`
- `pesoAproximado`
- `corCabelo`
- `corOlhos`
- `caracteristicasMarcantes`
- `telefoneDesaparecido`

### 5.3 Dados do desaparecimento

- `dataHoraUltimaVisualizacao`
- `localUltimaVisualizacao`
- `roupaUltimaVisualizacao`
- `meioTransporte`
- `dadosVeiculo`
- `locaisHabituais`
- `buscasPreliminares`
- `observacoesOperacionais`

### 5.4 Dados do solicitante

- `nomeSolicitante`
- `vinculoSolicitante`
- `telefoneSolicitante`
- Campo legado/autopreenchimento `arv_p3_telefone_comp` aparece no front TS, mas **não confirmado no schema `CASOS`**.

### 5.5 Dados operacionais e risco

- `operadorResponsavel`
- `operadorCriador`
- `operadorUltimaAcao`
- `classificacaoRisco`
- `prioridade`
- `acaoSugerida`
- `aptoCabineVerde`
- `indicadoresOperacionais`
- `criticidadeIndicadores`
- `vulnerabilidade`
- `condicaoMentalCognitivaComportamental`
- `limitacaoFisica`
- `usoMedicacaoEssencial`
- `usoAlcoolOutrasDrogas`
- `historicoDesaparecimentoAnterior`
- `conflitoPrevio`
- `suspeitaCrime`

### 5.6 Dados do Talão 190/COPOM

- `talaoBopm`
- `talaoPMESP`
- `BOPM` em abas diárias
- `dataServico`
- `nomeAbaTalao190`
- `abaOrigem`
- `linhaRelatorio`
- `hashOperacional`
- `assinatura`
- Campos de linha Talão 190: data, BOPM, CPF/RG, nome completo, observações, data serviço, solicitante, telefone, status 190, operador.

### 5.7 Auditoria

- `LOG_AUDITORIA`: status, chave, ação, nome, solicitante, telefone, operador, mensagem técnica.
- `EVENTOS_CASO`: `idCaso`, `talaoPMESP`, `dataHora`, `evento`, `descricao`, operador, perfil, resultado.
- `HISTORICO_EDICOES`: não detalhado no schema visualizado, mas usado em `salvarHistoricoEdicoes_` e timeline.
- `QUALIDADE_DADOS`: problema, severidade, ação recomendada, status, resolução.
- `Logs_GAS`: payload bruto/etapa técnica.

### 5.8 Foto/anexos

- `fotoDisponivel`
- `linkFoto`
- `urlFoto`
- `quantidadeFotos`
- `fotoPrincipalLink`
- `statusFotos`
- `idFoto`
- `fileIdDrive`
- `nomeArquivo`
- `linkArquivo`
- `fotoPrincipal`
- `autorizacaoUsoImagem`
- `restricaoDivulgacao`
- `statusValidacao`
- `nivelAcesso`
- `observacoesFoto`
- `origemFoto`
- `tipoFoto`

### 5.9 Questionário

- Campos `arv_*_resp` e `arv_*_comp` no schema `CASOS`.
- `subfluxoPerguntas` no tipo TS.
- `TRIAGEM_RESPOSTAS` como aba separada, porém o payload TS usa colunas reduzidas (`idCaso`, `perguntaChave`, `resposta`, `complemento`) enquanto o schema GAS espera 9 colunas (`idCaso`, `talaoPMESP`, `etapa`, `campo`, `pergunta`, `resposta`, `dataHora`, `operadorEmail`, `operadorNome`). Risco alto de incompatibilidade.

### 5.10 Status/encerramento

- `statusCaso`
- `localizado`
- `dataHoraLocalizacao`
- `formaLocalizacao`
- `encerrado190`
- `numeroBo`

## 6. Questionário e perguntas

### 6.1 Quantidade real encontrada

- **Não confirmado no código:** existência de 181 perguntas declaradas uma a uma.
- **Encontrado:** schema `CASOS` com 182 colunas em `GAS/CabineVerdeSchema.gs` e 130 colunas `arv_*` (65 pares resposta/complemento).
- **Encontrado:** `public/js/core.js` declara **65 perguntas/itens** em `ARVORE_DECISAO_CONFIG`.
- **Encontrado:** `auditoria.html` contém formulário legado com cerca de **40 perguntas numeradas**, incluindo duplicidade visual no número 20 (`q40` e `q20`) e salto/mapeamento inconsistente (`pergunta 28` usa `id="q29"`).
- **Encontrado:** `src/components/triagem/AgeSections.ts` contém textos resumidos por faixa etária, não um questionário persistente completo.

### 6.2 Onde as perguntas estão declaradas

| Local | Tipo |
|---|---|
| `cabineverde/public/js/core.js` | Declaração JS estruturada de 65 itens em `ARVORE_DECISAO_CONFIG`. |
| `cabineverde/auditoria.html` | Perguntas fixas em HTML legado. |
| `cabineverde/src/components/triagem/AgeSections.ts` | Lista resumida por faixa, sem mapeamento direto completo para persistência. |
| `cabineverde/src/components/form/TriageForm.ts` | Inputs reais e alguns hidden `arv_*`, mas não todos os 65 pares. |

### 6.3 Inconsistências do mapeamento pergunta → coluna

- `public/js/core.js` declara IDs como `passo1_foto_digital`, mas a coluna é `arv_p1_foto_recente_resp`.
- `public/js/core.js` `mapearCamposArvore` procura valores por nome de coluna `arv_*` dentro de `subfluxoPerguntas`, não por IDs naturais da pergunta; se a UI salvar respostas por ID (`passo1_*`), as colunas podem receber `Não informado`.
- `src/app.ts` autopreenche alguns campos `arv_*`, mas não renderiza/coleta dinamicamente todos os 65 itens no `TriageForm.ts`.
- `auditoria.html` mapeia apenas subconjunto de perguntas legadas para campos reais/`arv_*`.

### 6.4 Tabela de perguntas dinâmicas encontradas

| Nº | Texto da pergunta | Nome do campo no front | Coluna/field de destino inferida | Tipo | Obrigatória | Risco de migração |
|---:|---|---|---|---|---|---|
| 1 | Qual é a sua emergência? | `passo1_emergencia` | `arv_p1_emergencia_resp` / `arv_p1_emergencia_comp` | texto | Não confirmado no código | Médio |
| 2 | Qual o município? | `passo1_municipio` | `arv_p1_municipio_resp` / `arv_p1_municipio_comp` | texto | Não confirmado no código | Médio |
| 3 | Qual o nome da pessoa desaparecida? | `passo1_nome` | `arv_p1_nome_resp` / `arv_p1_nome_comp` | texto | Não confirmado no código | Médio |
| 4 | Qual o sexo ou gênero? | `passo1_sexo_genero` | `arv_p1_sexo_resp` / `arv_p1_sexo_comp` | texto | Não confirmado no código | Alto |
| 5 | Qual a idade? | `passo1_idade` | `arv_p1_idade_resp` / `arv_p1_idade_comp` | texto | Não confirmado no código | Médio |
| 6 | Você possui dados de identificação da pessoa desaparecida? | `passo1_dados_identificacao` | `arv_p1_dados_identificacao_resp` / `arv_p1_dados_identificacao_comp` | simNao | Não confirmado no código | Médio |
| 7 | Você possui foto digital recente da pessoa desaparecida? | `passo1_foto_digital` | `arv_p1_foto_recente_resp` / `arv_p1_foto_recente_comp` | simNao + complemento | Não confirmado no código | Médio |
| 8 | Há telefone celular, tablet ou outro dispositivo vinculado à pessoa desaparecida? | `passo1_dispositivo` | `arv_p1_dispositivo_vinculado_resp` / `arv_p1_dispositivo_vinculado_comp` | simNao + complemento | Não confirmado no código | Médio |
| 9 | Você sabe informar o dia e o horário em que a pessoa foi vista pela última vez? | `passo2_data_hora` | `arv_p2_data_hora_ultima_resp` / `arv_p2_data_hora_ultima_comp` | texto | Não confirmado no código | Médio |
| 10 | Você sabe onde a pessoa foi vista pela última vez? | `passo2_local` | `arv_p2_local_ultima_resp` / `arv_p2_local_ultima_comp` | texto | Não confirmado no código | Médio |
| 11 | Você sabe qual roupa a pessoa usava quando foi vista pela última vez? | `passo2_roupa` | `arv_p2_roupa_resp` / `arv_p2_roupa_comp` | texto | Não confirmado no código | Médio |
| 12 | A pessoa desaparecida estava a pé ou utilizava algum meio de transporte? | `passo2_transporte` | `arv_p2_meio_transporte_resp` / `arv_p2_meio_transporte_comp` | texto | Não confirmado no código | Alto |
| 13 | Você possui características do veículo ou meio de transporte utilizado? | `passo2_caracteristicas_transporte` | `arv_p2_dados_veiculo_resp` / `arv_p2_dados_veiculo_comp` | texto | Não confirmado no código | Alto |
| 14 | Você é familiar, responsável, cuidador ou pessoa próxima da desaparecida? | `passo3_vinculo` | `arv_p3_vinculo_resp` / `arv_p3_vinculo_comp` | texto | Não confirmado no código | Médio |
| 15 | A pessoa desaparecida estava acompanhada antes do desaparecimento? | `passo3_acompanhada` | `arv_p3_acompanhada_resp` / `arv_p3_acompanhada_comp` | simNao + complemento | Não confirmado no código | Médio |
| 16 | Você sabe informar onde essa pessoa estuda, trabalha ou realiza atividade habitual? | `passo3_estudo_trabalho` | `arv_p3_estuda_trabalha_atividade_resp` / `arv_p3_estuda_trabalha_atividade_comp` | texto | Não confirmado no código | Alto |
| 17 | Essa pessoa possui rotina fixa conhecida? | `passo3_rotina_fixa` | `arv_p3_rotina_fixa_resp` / `arv_p3_rotina_fixa_comp` | simNao + complemento | Não confirmado no código | Médio |
| 18 | Você conhece locais que essa pessoa costuma frequentar? | `passo3_locais_frequentes` | `arv_p3_locais_frequenta_resp` / `arv_p3_locais_frequenta_comp` | simNao + complemento | Não confirmado no código | Alto |
| 19 | Há locais com vínculo emocional relevante para essa pessoa? | `passo3_vinculo_emocional` | `arv_p3_vinculo_emocional_resp` / `arv_p3_vinculo_emocional_comp` | simNao + complemento | Não confirmado no código | Médio |
| 20 | Essa pessoa possui alguma condição de saúde mental, cognitiva ou comportamental que aumente sua vulnerabilidade? | `passo4_condicao_mental` | `arv_p4_condicao_saude_mental_resp` / `arv_p4_condicao_saude_mental_comp` | simNao + complemento | Não confirmado no código | Alto |
| 21 | Essa pessoa possui alguma limitação física relevante? | `passo4_limitacao_fisica` | `arv_p4_limitacao_fisica_resp` / `arv_p4_limitacao_fisica_comp` | simNao + complemento | Não confirmado no código | Médio |
| 22 | Essa pessoa depende de cuidador, responsável ou supervisão frequente? | `passo4_depende_supervisao` | `arv_p4_depende_cuidador_resp` / `arv_p4_depende_cuidador_comp` | simNao + complemento | Não confirmado no código | Alto |
| 23 | Essa pessoa faz uso contínuo de medicação essencial? | `passo4_medicacao` | `arv_p4_medicacao_essencial_resp` / `arv_p4_medicacao_essencial_comp` | simNao + complemento | Não confirmado no código | Médio |
| 24 | Essa pessoa faz uso de álcool ou outras drogas? | `passo4_alcool_drogas` | `arv_p4_uso_alcool_drogas_resp` / `arv_p4_uso_alcool_drogas_comp` | simNao | Não confirmado no código | Alto |
| 25 | Essa pessoa já desapareceu anteriormente? | `passo4_desapareceu_antes` | `arv_p4_desaparecimento_anterior_resp` / `arv_p4_desaparecimento_anterior_comp` | simNao | Não confirmado no código | Alto |
| 26 | Essa pessoa já comentou que pretendia fugir, desaparecer ou ir para outro local? | `passo4_intencao_fuga` | `arv_p4_intencao_fugir_resp` / `arv_p4_intencao_fugir_comp` | simNao | Não confirmado no código | Alto |
| 27 | Houve alguma desavença, ameaça, conflito familiar, afetivo ou social antes do desaparecimento? | `passo4_conflito` | `arv_p4_conflito_previo_resp` / `arv_p4_conflito_previo_comp` | simNao + complemento | Não confirmado no código | Médio |
| 28 | Você acredita que exista possibilidade de sequestro, violência ou outro crime? | `passo4_suspeita_crime` | `arv_p4_suspeita_crime_resp` / `arv_p4_suspeita_crime_comp` | simNao + complemento | Não confirmado no código | Médio |
| 29 | Já procuraram essa pessoa nos locais habituais? | `passo5_procuraram_locais` | `arv_p5_procurou_locais_habituais_resp` / `arv_p5_procurou_locais_habituais_comp` | simNao | Não confirmado no código | Alto |
| 30 | Já procuraram em todos os cômodos da residência ou do local de origem? | `passo5_procuraram_comodos` | `arv_p5_conferiu_comodos_resp` / `arv_p5_conferiu_comodos_comp` | simNao | Não confirmado no código | Alto |
| 31 | Alguém tentou contato telefônico ou por aplicativo? | `passo5_tentativa_contato` | `arv_p5_tentou_contato_resp` / `arv_p5_tentou_contato_comp` | simNao | Não confirmado no código | Alto |
| 32 | O aparelho celular da pessoa está ligado ou recebendo chamadas? | `passo5_aparelho_ligado` | `arv_p5_celular_ligado_resp` / `arv_p5_celular_ligado_comp` | simNao | Não confirmado no código | Alto |
| 33 | Há câmeras na residência da pessoa desaparecida? | `passo5_cameras_residencia` | `arv_p5_cameras_residencia_resp` / `arv_p5_cameras_residencia_comp` | simNao | Não confirmado no código | Médio |
| 34 | Há câmeras no último local em que ela foi vista? | `passo5_cameras_ultimo_local` | `arv_p5_cameras_ultimo_local_resp` / `arv_p5_cameras_ultimo_local_comp` | simNao | Não confirmado no código | Médio |
| 35 | Existe algum contato de pessoas que já fizeram buscas ou que possam apoiar na localização? | `passo5_contatos_apoio` | `arv_p5_contatos_busca_resp` / `arv_p5_contatos_busca_comp` | texto | Não confirmado no código | Alto |
| 36 | Foi realizado registro do desaparecimento em Delegacia física ou Delegacia Eletrônica? | `passo5_registro_delegacia` | `arv_p5_bo_delegacia_resp` / `arv_p5_bo_delegacia_comp` | simNao + complemento | Não confirmado no código | Alto |
| 37 | A criança desaparecida estava sob supervisão direta de um adulto no momento anterior ao desaparecimento? | `crianca_supervisao_direta` | `arv_crianca_supervisao_resp` / `arv_crianca_supervisao_comp` | simNao + complemento | Não confirmado no código | Médio |
| 38 | A criança tem condição de informar nome, endereço ou telefone? | `crianca_informa_dados` | `arv_crianca_informa_dados_resp` / `arv_crianca_informa_dados_comp` | simNao | Não confirmado no código | Médio |
| 39 | A criança possui transtorno do neurodesenvolvimento, deficiência ou condição que dificulte comunicação/orientação? | `crianca_condicao_comunicacao` | `arv_crianca_neurodesenvolvimento_resp` / `arv_crianca_neurodesenvolvimento_comp` | simNao + complemento | Não confirmado no código | Médio |
| 40 | Há guarda compartilhada, disputa familiar ou possibilidade de retirada por familiar sem aviso? | `crianca_guarda_disputa` | `arv_crianca_disputa_familiar_resp` / `arv_crianca_disputa_familiar_comp` | simNao + complemento | Não confirmado no código | Médio |
| 41 | A criança desapareceu de casa, escola, via pública, transporte ou outro local? | `crianca_local_desaparecimento` | `arv_crianca_local_desaparecimento_resp` / `arv_crianca_local_desaparecimento_comp` | texto | Não confirmado no código | Médio |
| 42 | Houve algum adulto desconhecido, veículo suspeito ou situação incomum antes do desaparecimento? | `crianca_adulto_veiculo_suspeito` | `arv_crianca_adulto_veiculo_suspeito_resp` / `arv_crianca_adulto_veiculo_suspeito_comp` | simNao + complemento | Não confirmado no código | Médio |
| 43 | O desaparecimento ocorreu após saída da escola, atividade esportiva, casa de terceiros ou deslocamento habitual? | `preadolescente_contexto_saida` | `arv_preadolescente_contexto_saida_resp` / `arv_preadolescente_contexto_saida_comp` | simNao + complemento | Não confirmado no código | Médio |
| 44 | Há histórico de sair sozinho sem autorização? | `preadolescente_historico_sair` | `arv_preadolescente_historico_sair_sozinho_resp` / `arv_preadolescente_historico_sair_sozinho_comp` | simNao | Não confirmado no código | Médio |
| 45 | Há suspeita de aliciamento virtual, contato com desconhecidos ou convite para encontro? | `preadolescente_aliciamento_virtual` | `arv_preadolescente_aliciamento_virtual_resp` / `arv_preadolescente_aliciamento_virtual_comp` | simNao + complemento | Não confirmado no código | Médio |
| 46 | Há conflito familiar, escolar ou social recente? | `preadolescente_conflito_recente` | `arv_preadolescente_conflito_recente_resp` / `arv_preadolescente_conflito_recente_comp` | simNao + complemento | Não confirmado no código | Médio |
| 47 | Há guarda compartilhada, disputa entre responsáveis ou possibilidade de retirada por conhecido? | `preadolescente_guarda_disputa` | `arv_preadolescente_disputa_responsaveis_resp` / `arv_preadolescente_disputa_responsaveis_comp` | simNao + complemento | Não confirmado no código | Médio |
| 48 | O adolescente já saiu de casa anteriormente sem autorização? | `adolescente_historico_saida` | `arv_adolescente_saiu_sem_autorizacao_resp` / `arv_adolescente_saiu_sem_autorizacao_comp` | simNao | Não confirmado no código | Médio |
| 49 | Houve discussão familiar, afetiva ou escolar antes do desaparecimento? | `adolescente_discussao_previa` | `arv_adolescente_discussao_previa_resp` / `arv_adolescente_discussao_previa_comp` | simNao + complemento | Não confirmado no código | Médio |
| 50 | Há indícios de fuga voluntária? | `adolescente_indicios_fuga` | `arv_adolescente_fuga_voluntaria_resp` / `arv_adolescente_fuga_voluntaria_comp` | simNao + complemento | Não confirmado no código | Médio |
| 51 | Há suspeita de envolvimento com terceiros, redes sociais, relacionamento afetivo, aliciamento ou ameaça? | `adolescente_envolvimento_terceiros` | `arv_adolescente_terceiros_redes_ameaca_resp` / `arv_adolescente_terceiros_redes_ameaca_comp` | simNao + complemento | Não confirmado no código | Médio |
| 52 | O adolescente tem histórico de automutilação, ideação suicida, surto, uso abusivo de substâncias ou sofrimento psíquico intenso? | `adolescente_sofrimento_psiquico` | `arv_adolescente_sofrimento_psiquico_resp` / `arv_adolescente_sofrimento_psiquico_comp` | simNao + complemento | Não confirmado no código | Médio |
| 53 | Há guarda compartilhada, litígio familiar ou possibilidade de retenção por responsável? | `adolescente_guarda_litigio` | `arv_adolescente_litigio_familiar_resp` / `arv_adolescente_litigio_familiar_comp` | simNao + complemento | Não confirmado no código | Médio |
| 54 | O adulto apresentou mudança abrupta de comportamento antes do desaparecimento? | `adulto_mudanca_comportamento` | `arv_adulto_mudanca_comportamento_resp` / `arv_adulto_mudanca_comportamento_comp` | simNao + complemento | Não confirmado no código | Médio |
| 55 | Há diagnóstico ou suspeita de transtorno mental, uso de medicação controlada ou crise emocional recente? | `adulto_transtorno_mental` | `arv_adulto_crise_emocional_medicacao_resp` / `arv_adulto_crise_emocional_medicacao_comp` | simNao + complemento | Não confirmado no código | Médio |
| 56 | Há histórico de tentativa de fuga, desaparecimento voluntário ou rompimento de vínculos? | `adulto_historico_fuga` | `arv_adulto_historico_fuga_rompimento_resp` / `arv_adulto_historico_fuga_rompimento_comp` | simNao + complemento | Não confirmado no código | Médio |
| 57 | Há indícios de violência doméstica, ameaça, dívida, perseguição, conflito criminal ou outra situação de risco? | `adulto_indicios_violencia` | `arv_adulto_violencia_divida_ameaca_resp` / `arv_adulto_violencia_divida_ameaca_comp` | simNao + complemento | Não confirmado no código | Médio |
| 58 | O desaparecimento ocorreu em deslocamento para trabalho, retorno para casa ou local de rotina? | `adulto_deslocamento_rotina` | `arv_adulto_trajeto_rotina_resp` / `arv_adulto_trajeto_rotina_comp` | simNao + complemento | Não confirmado no código | Médio |
| 59 | O adulto depende de medicação, tratamento, acompanhamento ou possui limitação funcional relevante? | `adulto_dependencia_tratamento` | `arv_adulto_dependencia_tratamento_resp` / `arv_adulto_dependencia_tratamento_comp` | simNao + complemento | Não confirmado no código | Médio |
| 60 | O idoso possui diagnóstico de Alzheimer, demência, desorientação, confusão mental ou perda de memória? | `idoso_alzheimer_demencia` | `arv_idoso_alzheimer_demencia_resp` / `arv_idoso_alzheimer_demencia_comp` | simNao + complemento | Não confirmado no código | Médio |
| 61 | O idoso tem dificuldade de locomoção, visão, audição ou comunicação? | `idoso_dificuldade_comunicacao` | `arv_idoso_limitacao_locomocao_comunicacao_resp` / `arv_idoso_limitacao_locomocao_comunicacao_comp` | simNao + complemento | Não confirmado no código | Médio |
| 62 | O idoso faz uso de medicação contínua essencial? | `idoso_medicacao_continua` | `arv_idoso_medicacao_essencial_resp` / `arv_idoso_medicacao_essencial_comp` | simNao + complemento | Não confirmado no código | Médio |
| 63 | O idoso costuma sair sozinho? | `idoso_sai_sozinho` | `arv_idoso_costuma_sair_sozinho_resp` / `arv_idoso_costuma_sair_sozinho_comp` | simNao | Não confirmado no código | Médio |
| 64 | O idoso desapareceu durante caminhada, ida a comércio, consulta, visita ou deslocamento habitual? | `idoso_desapareceu_deslocamento` | `arv_idoso_desapareceu_rotina_resp` / `arv_idoso_desapareceu_rotina_comp` | simNao + complemento | Não confirmado no código | Médio |
| 65 | O idoso já apresentou episódio anterior de desorientação ou desaparecimento? | `idoso_historico_desorientacao` | `arv_idoso_historico_desorientacao_resp` / `arv_idoso_historico_desorientacao_comp` | simNao + complemento | Não confirmado no código | Médio |

### 6.5 Perguntas repetidas, sem persistência ou campo errado

- Repetição/ambiguidade legada: `auditoria.html` apresenta duas perguntas numeradas como 20 (`q40` e `q20`) para doença psicológica, condicionadas por boxes diferentes.
- Campo possivelmente fora do schema: `arv_p3_telefone_comp` é criado como hidden em `TriageForm.ts`, mas não aparece no schema `CASOS` encontrado.
- Colunas sem pergunta correspondente direta: os campos `arv_*_comp` existem para todos os pares, mesmo quando a pergunta não possui `complementoLabel` no JS; podem ser persistidos vazios.
- Pergunta que pode salvar em campo errado: risco alto nos IDs naturais (`passo1_foto_digital`, `passo1_dispositivo`, `crianca_condicao_comunicacao`) versus nomes de colunas (`arv_p1_foto_recente`, `arv_p1_dispositivo_vinculado`, `arv_crianca_neurodesenvolvimento`).

## 7. Integrações com Google Sheets

### 7.1 IDs de planilhas

- `CABINE_VERDE_SPREADSHEET_ID` é obtido de `PropertiesService.getScriptProperties()` em `Utils.gs`.
- `src/config/env.ts` permite `globalThis.CABINE_VERDE_SPREADSHEET_ID`, mas por padrão deixa `spreadsheetId` vazio no front.
- Não foi encontrado ID literal da planilha no código-fonte auditado; foi encontrado placeholder `SEU_SPREADSHEET_ID` em `MockPayload.json`.

### 7.2 Abas identificadas

| Aba | Uso |
|---|---|
| `OPERADORES` | Cadastro/perfis de operadores. |
| `CASOS` | Base central de casos. |
| `TRIAGEM_RESPOSTAS` | Respostas normalizadas por pergunta. |
| `EVENTOS_CASO` / `EVENTOS_OCORRENCIA` | Eventos/timeline. Há divergência de nome entre schema e payload TS. |
| `INDICADORES_OPERACIONAIS` | Indicadores calculados. |
| `QUALIDADE_DADOS` | Pendências de auditoria. |
| `FOTOS_DESAPARECIDOS` | Metadados de fotos. |
| `LOG_ACESSO_FOTOS` | Auditoria de visualização de foto. |
| `LOG_AUDITORIA`, `Logs_GAS`, `LOGS` | Logs técnicos/operacionais. |
| `INDICE_TALOES` | Índice operacional de Talão 190. |
| Abas diárias `DDMMMYY` | COPOM/Talão 190 com cabeçalho na linha 6 e dados a partir da linha 7. |

### 7.3 Cabeçalhos e linhas

- Abas estruturais criadas pelo GAS usam cabeçalho na **linha 1**.
- Abas diárias COPOM/Talão 190 usam cabeçalho na **linha 6** e dados a partir da **linha 7**.
- Há uso de âncora de rodapé em relatório diário; a sincronização bloqueia quando a âncora não é encontrada.

### 7.4 Funções de leitura/escrita/criação

| Categoria | Funções encontradas |
|---|---|
| Criar/garantir abas | `garantirEstruturaCabineVerde_`, `garantirAbaComCabecalhos_`, `garantirAbaComCabecalho`, `garantirColunasDaEstrutura`, `obterOuCriarAbaTalao190_`, `obterOuCriarIndiceTaloes_`. |
| Ler planilhas | `buscarCaso_`, `obterCasoCompleto_`, `listarCasosComProtecao_`, `carregarOperadoresDaPlanilha_`, `carregarIndiceAbasDiariasCopom_`, `mapearTextosPorIdCaso_`. |
| Escrever planilhas | `persistirRegistro`, `registrarLogTecnico`, `registrarEventoOperacional_`, `registrarEventoOcorrenciaDetalhado_`, `registrarFotoNaPlanilha_`, `salvarAuditoriaCaso_`, `salvarHistoricoEdicoes_`. |
| Atualizar linhas | `localizarLinhaCaso_`, `localizarLinhaPorChaveUnica_`, `atualizarFotoCaso_`, `atualizarResumoFotosNoCaso_`, `sincronizarTalao190`. |
| Localizar linha existente | `localizarCasoPorIdCaso`, `localizarCasoPorTalaoPMESP`, `encontrarLinhaPorColuna`, `localizarLinhaDuplicadaRelatorio_`, `localizarCasoPorIndiceTaloes_`. |

### 7.5 Uso técnico identificado

- `LockService`: usado especialmente em sincronização Talão 190 e limpeza de duplicados, com logs de lock.
- `SpreadsheetApp`: usado em todo backend GAS.
- `Range`: `getRange`, `getValues`, `setValue`, `setValues`.
- `appendRow`: usado em logs, fotos e alguns registros.
- `setValues`: usado para gravações em lote e atualização de linhas.

### 7.6 Pontos de duplicidade/sobrescrita

- Inserção em `CASOS` se `localizarLinhaCaso_` não achar `idCaso`, `talaoPMESP` ou chave única.
- Fallback `CV-${Date.now()}` no `public/js/core.js` pode gerar ids temporários persistíveis em caminhos legados.
- `appendRow` em fotos/logs sem constraint transacional.
- Dependência de nomes exatos de coluna: qualquer renomeação manual quebra localização.
- Divergência `EVENTOS_CASO` versus `EVENTOS_OCORRENCIA` pode gerar aba alternativa ou ausência de evento esperado.

## 8. Integrações com Drive/fotos

### 8.1 Inputs de imagem no front

- `src/components/form/TriageForm.ts`: `<input type="file" id="fotoDesaparecido" name="fotoDesaparecido" accept="image/*" capture="environment" />`.
- `auditoria.html`: input legado `id="foto" accept="image/*"`.

### 8.2 Upload e destino

- `src/app.ts` valida mime `image/*`, tamanho máximo 5MB e bloqueia `idCaso` temporário `CV-*`.
- `GoogleSheetsService.uploadFotoCaso` envia `action: uploadFotoCaso` com base64.
- `GAS/Code.gs` roteia para `salvarFotoDesaparecido_`.
- `FotosDesaparecidos.gs` cria pastas `Cabine Verde/Fotos/{ano}/{mes}/{idCaso}_{talaoPMESP}` e arquivo `FOTO_PRINCIPAL_{idCaso}_{timestamp}.jpg` ou `FOTO_COMPLEMENTAR_{idCaso}_{timestamp}.jpg`.
- O arquivo é configurado como privado via `file.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.VIEW)`.

### 8.3 Consolidação e substituição

- `consolidarFotoCaso_` renomeia para `FOTO_{idCaso}.ext` e move substituída para lixeira via `excluirFotoDrivePorUrlOuFileId_`.
- `limparFotosTemporarias_` remove arquivos `TEMP_` com mais de 2 horas.

### 8.4 Riscos

- O link salvo em `CASOS` depende do arquivo continuar existindo e permissões Drive corretas.
- O route handler de `uploadFotoCaso` não repassa explicitamente `nivelAcesso` e `observacoesFoto` do payload TS; isso pode deixar `nivelAcesso` no default `RESTRITO` e observação vazia.
- O id de foto é `FOTO-` + timestamp, sem entropia adicional; risco baixo/médio em concorrência extrema.
- Upload base64 via Apps Script pode atingir limites de payload/tempo.
- Dados biométricos/imagem de vulneráveis exigem retenção, autorização e trilha de acesso rigorosa.

## 9. Controle de duplicidade

### 9.1 Mecanismos encontrados

- `idCaso` preservado em edição (`src/app.ts`).
- `normalizarTalaoPayload` sincroniza `talaoPMESP` e `talaoBopm`.
- `gerarChaveRequisicaoDeterministica` no JS público.
- `gerarAssinaturaCaso_`, `localizarLinhaCaso_`, `obterChaveUnicaRegistro_`, `localizarLinhaPorChaveUnica_` no GAS.
- `sincronizarTalao190` usa lock, hash operacional, índice e localização de duplicado.
- Rotinas `analisarDuplicadosCasos_`, `marcarDuplicadosCasos_`, `limparDuplicadosCasos`, `limparDuplicadosCasosPorAssinatura`, `limparDuplicadosRelatorioAtual`.

### 9.2 Avaliação de risco

**Risco de duplicidade: Alto.**

Justificativa:

- Há controles importantes, mas distribuídos em várias camadas e com fallbacks divergentes.
- O front salva localmente antes da confirmação oficial, o que pode confundir a operação em falha/retry.
- O payload legado público gera `CV-${Date.now()}` quando `caso.id` não existe.
- Divergências de schema e nomes podem impedir localização correta da linha existente.
- Talão 190 usa índice e lock, mas alterações manuais em abas diárias podem invalidar linhas/assinaturas.

### 9.3 Recomendação

- Criar `idCaso` exclusivamente no servidor.
- Adotar constraint única por `idCaso` e índice composto por `talaoBopm`, `dataServico`, `nomeNormalizado`, `telefoneNormalizado`.
- Implementar `idempotency_key` obrigatória para criação.
- Manter `DuplicateCandidate` para revisão humana, não limpeza automática irreversível.

## 10. Segurança, LGPD e rastreabilidade

### 10.1 Exposição e dados sensíveis

Encontrado:

- Endpoint Apps Script hardcoded em `src/config/env.ts`, `public/js/core.js` e `auditoria.html`.
- Dados pessoais sensíveis: CPF, RG, nome da mãe, telefone, saúde mental/cognitiva, uso de medicação, drogas, conflitos, suspeita de crime, fotos.
- Logs técnicos podem registrar payload bruto (`rawPostData`) em `Logs_GAS`.
- `localStorage` armazena rascunhos, casos, logs e dados de operador.
- Fotos são privadas no Drive, mas links e fileIds são salvos em planilha.

### 10.2 Controles encontrados

- Validação de operador em `OPERADORES`.
- Perfis e permissões por ação no GAS.
- Mascaramento parcial em `listarCasosComProtecao_`.
- Logs de acesso a foto e bloqueio por uso excessivo.
- Justificativa obrigatória para foto restrita/sigilosa.
- `DriveApp.Access.PRIVATE` nos arquivos criados.

### 10.3 Lacunas

- Não há autenticação forte moderna confirmada (SSO/OIDC/MFA/JWT).
- A identidade do operador no front é localStorage e payload; depende de validação server-side consistente.
- Logs com payload bruto são incompatíveis com minimização LGPD se contêm PII/fotos/base64.
- Não há política de retenção/eliminação confirmada no código.
- Não há criptografia de dados em repouso própria para Sheets/Drive além dos controles da plataforma Google.
- Não há segregação clara por unidade/equipe/turno no acesso.

### 10.4 Recomendações LGPD

- Implementar autenticação OIDC/Google Workspace com MFA e sessão curta.
- RBAC/ABAC por perfil, unidade, turno e finalidade.
- Mascarar CPF/RG/telefone por padrão; liberar completo somente com justificativa e log.
- Remover payload bruto dos logs; registrar apenas hash, idCaso, ação, status e campos alterados.
- Criar política de retenção para fotos e rascunhos.
- Criptografar anexos e metadados sensíveis quando migrar para storage próprio.
- Criar trilha imutável de auditoria (`audit_logs`) com hash encadeado opcional.

## 11. Principais riscos técnicos

| Risco | Impacto | Prioridade |
|---|---|---:|
| Divergência de schema TS/GAS/JS público | Perda de campo, gravação errada, duplicidade. | Crítica |
| Dependência de Google Sheets como banco transacional | Corrida, sobrescrita, latência, erro manual. | Crítica |
| Logs com payload bruto | Exposição LGPD. | Crítica |
| Endpoint público hardcoded | Superfície de abuso. | Alta |
| Rascunho com PII em localStorage | Vazamento em estação compartilhada. | Alta |
| Múltiplos fluxos legados ativos | Inconsistência operacional. | Alta |
| Questionário parcialmente renderizado/coletado | Respostas ausentes ou em colunas erradas. | Alta |
| Talão 190 com rodapé/linha fixa | Erro estrutural pode travar sincronização. | Alta |
| Upload base64 por GAS | Limites de tamanho/timeout. | Média/Alta |

## 12. Pontos críticos antes da migração

1. Congelar schema canônico de `CASOS` e mapear diferenças entre 182 e 191 colunas.
2. Definir status canônicos e aliases legados.
3. Definir fonte única de `idCaso`.
4. Exportar backup completo de Sheets/Drive.
5. Inventariar permissões reais do Web App e da planilha.
6. Validar se `TRIAGEM_RESPOSTAS` é usada em produção ou apenas planejada.
7. Validar todas as abas diárias COPOM e padrão de cabeçalho linha 6/rodapé.
8. Remover ou sanitizar logs brutos antes de ingestão no novo banco.
9. Criar tabela de mapeamento pergunta → coluna → DTO.
10. Definir política de retenção de fotos/rascunhos.

## 13. O que pode ser reaproveitado

| Parte | Reaproveitamento |
|---|---|
| Regras de faixa etária, risco e prioridade | Migrar para serviço de domínio/testável no NestJS. |
| Schema atual de campos | Usar como base do mapeamento legado, não como modelo final. |
| Rotinas de reconciliação/duplicidade | Reaproveitar lógica de normalização/assinatura como referência. |
| Componentes visuais TS | Reaproveitar conceitos de UX, não necessariamente código literal. |
| Documentação existente | Base de requisitos e critérios operacionais. |
| Fluxo de upload com metadados | Reaproveitar modelo conceitual de foto principal/complementar/validação. |

## 14. O que deve ser reescrito

| Parte | Motivo |
|---|---|
| Persistência em Sheets como banco principal | Substituir por PostgreSQL transacional. |
| Roteador monolítico `doPost` | Criar controllers NestJS por domínio. |
| Autenticação via localStorage/e-mail payload | Substituir por OIDC/JWT/RBAC. |
| Questionário hardcoded | Modelar `Questionnaire`, `Question`, `Answer` versionados. |
| Logs com payload bruto | Substituir por auditoria segura e minimizada. |
| Upload base64 via GAS | Substituir por upload multipart/presigned URL. |
| Página `auditoria.html` | Recriar como módulo React protegido. |
| Sincronização Talão 190 | Transformar em job idempotente com retry e logs. |

## 15. Arquitetura-alvo React + NestJS

### 15.1 NestJS módulos

```text
src/
  modules/
    auth/
    users/
    roles/
    cases/
    missing-persons/
    requesters/
    triage/
    questionnaires/
    police-reports/
    attachments/
    audit/
    reports/
    integrations/
      google-sheets/
      google-drive/
      copom/
    duplicate-detection/
    quality/
```

### 15.2 Controllers sugeridos

- `AuthController`: login/callback/session.
- `CasesController`: CRUD, consulta, status, timeline.
- `TriageController`: cálculo, finalização, regras versionadas.
- `QuestionnairesController`: perguntas e respostas.
- `AttachmentsController`: upload, validação, visualização controlada.
- `AuditController`: logs, histórico, qualidade.
- `ReportsController`: relatórios operacionais e SIOPM.
- `IntegrationsController`: health, sync Sheets/COPOM.
- `DuplicateCandidatesController`: análise e resolução.

### 15.3 DTOs

- `CreateCaseDto`
- `UpdateCaseDto`
- `FinalizeTriageDto`
- `CreateRequesterDto`
- `CreateMissingPersonDto`
- `CreatePoliceReportDto`
- `SubmitQuestionnaireAnswersDto`
- `UploadAttachmentDto`
- `ValidateAttachmentDto`
- `SearchCasesDto`
- `ResolveQualityIssueDto`
- `SyncSheetsDto`

### 15.4 React telas/rotas

```text
/login
/dashboard
/casos
/casos/novo
/casos/:id
/casos/:id/triagem
/casos/:id/auditoria
/casos/:id/fotos
/casos/:id/timeline
/qualidade
/relatorios
/integracoes/copom
/admin/operadores
/admin/perfis
```

### 15.5 React componentes/hooks/services

- Componentes: `CaseForm`, `TriageWizard`, `QuestionnaireRenderer`, `RiskPanel`, `PhotoUploader`, `CaseTimeline`, `AuditDiffPanel`, `QualityIssueList`, `DailyReportView`, `DuplicateCandidatePanel`.
- Hooks: `useCase`, `useCaseSearch`, `useTriage`, `useQuestionnaire`, `useUpload`, `useAuditTrail`, `usePermissions`.
- Services: `casesApi`, `triageApi`, `attachmentsApi`, `auditApi`, `reportsApi`, `integrationsApi`.

### 15.6 Estratégias

- Autenticação: OIDC Google Workspace/Azure AD + JWT curto + refresh seguro; MFA herdado do provedor.
- Autorização: RBAC + ABAC por unidade/equipe/finalidade; policies em NestJS Guards.
- Upload: storage privado (S3/GCS/Drive temporário), checksum, metadados, antivírus opcional, URLs assinadas de curta duração.
- Relatórios: geração server-side com templates versionados; export PDF/DOCX auditado.
- Integração temporária Sheets: job outbox com retry, status por caso e `integration_logs`; planilha vira espelho/exportação.

## 16. Modelo de dados sugerido

### 16.1 Entidades e campos principais

| Entidade | Campos principais | Relacionamentos |
|---|---|---|
| `User` | `id`, `email`, `name`, `active`, `lastLoginAt`, `providerSubject` | N:N `Role`, 1:N `Audit`, `CaseEvent`. |
| `Role` | `id`, `name`, `permissions` | N:N `User`. |
| `Case` | `id`, `legacyId`, `status`, `risk`, `priority`, `actionSuggested`, `serviceDate`, `createdAt`, `updatedAt`, `createdById`, `lastActionById` | 1:1 `MissingPerson`, 1:1 `Requester`, 1:N `Answer`, `Attachment`, `Audit`, `CaseEvent`, `PoliceReport`. |
| `MissingPerson` | `caseId`, `fullName`, `cpf`, `rg`, `motherName`, `birthDate`, `age`, `sexGender`, physical traits, last seen data | 1:1 `Case`. |
| `Requester` | `caseId`, `name`, `phone`, `relationship`, `address` | 1:1 `Case`. |
| `PoliceReport/Talao190` | `id`, `caseId`, `talaoPMESP`, `talaoBopm`, `bopm`, `boNumber`, `copomSheetName`, `copomRow`, `status190` | N:1 `Case`. |
| `Questionnaire` | `id`, `code`, `version`, `active`, `title` | 1:N `Question`. |
| `Question` | `id`, `questionnaireId`, `code`, `text`, `type`, `required`, `order`, `targetField`, `ageGroup` | N:1 `Questionnaire`, 1:N `Answer`. |
| `Answer` | `id`, `caseId`, `questionId`, `response`, `complement`, `answeredById`, `answeredAt` | N:1 `Case`, `Question`, `User`. |
| `Audit` | `id`, `caseId`, `actorId`, `action`, `before`, `after`, `reason`, `ip`, `createdAt` | N:1 `Case`, `User`. |
| `CaseEvent` | `id`, `caseId`, `type`, `description`, `metadata`, `createdById`, `createdAt` | N:1 `Case`. |
| `Attachment` | `id`, `caseId`, `type`, `storageKey`, `fileName`, `mimeType`, `size`, `checksum`, `accessLevel`, `status`, `isPrimary`, `consent`, `createdAt` | N:1 `Case`. |
| `DailyReport` | `id`, `date`, `sheetName`, `status`, `footerAnchorFound`, `generatedById`, `generatedAt` | 1:N `PoliceReport`/items. |
| `IntegrationLog` | `id`, `caseId`, `system`, `operation`, `status`, `requestHash`, `response`, `attempts`, `createdAt` | N:1 `Case` opcional. |
| `DuplicateCandidate` | `id`, `caseIdA`, `caseIdB`, `score`, `reason`, `status`, `resolvedById`, `resolvedAt` | N:1 `Case` A/B. |

### 16.2 Tabelas auxiliares recomendadas

- `case_status_history`
- `case_quality_issues`
- `photo_access_logs`
- `operator_shifts`
- `sheet_exports`
- `idempotency_keys`
- `legacy_field_mappings`

## 17. Plano de migração por fases

### Fase 0: inventário e backup

- Objetivo: congelar estado atual.
- Entregáveis: backup Sheets/Drive, dump de scripts GAS, inventário de abas/colunas/permissões.
- Riscos: backup incompleto; permissões impedem exportação.
- Aceite: checklist de abas, contagem de linhas, checksum de arquivos Drive.
- Dependências: acesso admin Google Workspace/Apps Script.
- Rollback: manter operação atual sem alterações.

### Fase 1: banco espelho

- Objetivo: criar PostgreSQL espelhando `CASOS`, fotos, eventos e operadores.
- Entregáveis: schema inicial, ETL importador, tabela `legacy_field_mappings`.
- Riscos: divergência de tipos/status.
- Aceite: contagens batem com Sheets e amostra validada.
- Dependências: backup fase 0.
- Rollback: descartar banco espelho sem afetar produção.

### Fase 2: API NestJS de leitura

- Objetivo: consultas seguras sem escrever em Sheets.
- Entregáveis: `GET /cases`, `GET /cases/:id`, timeline, masking.
- Riscos: exposição indevida.
- Aceite: resultados equivalentes aos casos da planilha, logs de acesso.
- Dependências: auth mínima e banco espelho.
- Rollback: front continua usando GAS.

### Fase 3: dashboard React de consulta

- Objetivo: substituir consulta operacional sem alterar cadastro.
- Entregáveis: busca, detalhe, timeline, painel de qualidade.
- Riscos: treinamento e adoção.
- Aceite: operadores consultam pelo novo painel; auditoria registrada.
- Dependências: API leitura.
- Rollback: usar `auditoria.html`/front antigo.

### Fase 4: cadastro de casos pelo React

- Objetivo: nova escrita transacional.
- Entregáveis: `POST /cases`, DTOs, idempotência, export temporário para Sheets.
- Riscos: duplicidade se GAS e API escreverem simultaneamente sem coordenação.
- Aceite: criação em DB e espelho Sheets com `idCaso` único.
- Dependências: schema canônico e integração Sheets.
- Rollback: bloquear escrita React e voltar ao GAS.

### Fase 5: auditoria pelo sistema novo

- Objetivo: migrar edição controlada/qualidade.
- Entregáveis: diff, justificativa, resolução de pendências, logs imutáveis.
- Riscos: incompatibilidade com histórico legado.
- Aceite: toda edição tem `Audit` e `CaseEvent`.
- Dependências: roles e cases API.
- Rollback: usar `salvarAuditoriaCaso_` no GAS.

### Fase 6: upload de fotos estruturado

- Objetivo: substituir upload base64/GAS.
- Entregáveis: `Attachment`, storage privado, URLs assinadas, logs de visualização.
- Riscos: links legados quebrados; migração de Drive.
- Aceite: foto principal/complementar, validação e acesso auditado.
- Dependências: política de retenção e storage.
- Rollback: upload GAS temporário.

### Fase 7: relatórios

- Objetivo: relatórios operacionais no novo sistema.
- Entregáveis: relatório diário, SIOPM, export PDF/DOCX, indicadores.
- Riscos: divergência de formato COPOM.
- Aceite: relatório conferido por operação.
- Dependências: dados e status confiáveis.
- Rollback: geração antiga em GAS/auditoria.html.

### Fase 8: desativação progressiva do Apps Script

- Objetivo: reduzir GAS a integração/export legado.
- Entregáveis: feature flags, bloqueio gradual de escrita, monitoramento.
- Riscos: rotina legada ainda usada sem conhecimento.
- Aceite: 30 dias sem escrita primária via GAS.
- Dependências: fases anteriores estáveis.
- Rollback: reativar Web App GAS.

### Fase 9: planilhas apenas como exportação/legado

- Objetivo: Sheets deixa de ser banco principal.
- Entregáveis: export agendado, readonly, documentação de legado.
- Riscos: resistência operacional.
- Aceite: PostgreSQL é fonte da verdade; Sheets reconciliado.
- Dependências: governança e treinamento.
- Rollback: manter export e reabrir escrita apenas em contingência formal.

## 18. Recomendações finais

1. Tratar `src/utils/sheetsPayload.ts`, `public/js/core.js` e `GAS/CabineVerdeSchema.gs` como área crítica até congelar schema.
2. Criar matriz de compatibilidade campo a campo antes de escrever qualquer API nova.
3. Remover logging de payload bruto em produção ou sanitizar imediatamente.
4. Separar operação de consulta, triagem, auditoria, fotos e relatórios em permissões explícitas.
5. Versionar questionário e manter histórico da versão respondida por caso.
6. Transformar Talão 190/COPOM em integração idempotente com fila/outbox.
7. Migrar fotos com inventário de fileId, checksum e status de acesso.
8. Criar ambiente de homologação com cópia anonimizada.
9. Definir indicadores de sucesso: duplicidade zero, tempo de cadastro, taxa de foto vinculada, pendências de qualidade, falhas de integração.
10. Preservar operação: migração incremental, sem big bang.

## 19. Checklist de próximos passos

- [ ] Exportar backup completo das planilhas e Drive.
- [ ] Confirmar ID real da planilha via propriedades do Apps Script.
- [ ] Gerar diff automatizado entre schema GAS, payload TS e JS público.
- [ ] Validar contagem real de colunas da aba `CASOS` em produção.
- [ ] Validar se `TRIAGEM_RESPOSTAS` está recebendo linhas no formato esperado.
- [ ] Criar mapa pergunta → coluna → DTO → tabela.
- [ ] Desativar/sanitizar logs de `rawPostData`.
- [ ] Definir status canônicos e aliases.
- [ ] Criar PoC NestJS de leitura com PostgreSQL espelho.
- [ ] Criar dashboard React somente leitura.
- [ ] Planejar migração de fotos e política LGPD.
- [ ] Definir runbook de rollback por fase.
