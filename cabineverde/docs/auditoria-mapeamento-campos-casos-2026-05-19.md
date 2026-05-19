# Auditoria técnica de mapeamento `auditoria.html` → CASOS (2026-05-19)

## Causa raiz confirmada
O frontend de auditoria utilizava campos de questionário (`q1..q39`) como origem operacional, com payload parcialmente composto e sem mapeamento explícito e completo para colunas reais da aba `CASOS`. Isso causava risco de atualização incompleta, especialmente em identificação composta (Q4) e perguntas com semântica própria do questionário.

## Tabela de auditoria e correção aplicada

| Campo visual | id/name atual | chave enviada (antes/depois) | coluna CASOS correta | status | correção aplicada |
|---|---|---|---|---|---|
| 01. Nome da pessoa desaparecida | `id=q1` | antes: `nomeCompletoDesaparecido` parcial; depois: `nomeCompletoDesaparecido` + `arv_p1_nome_resp` | `nomeCompletoDesaparecido`, `arv_p1_nome_resp` | Corrigido | Mapeamento explícito no payload. |
| 02. Sexo ou gênero | `id=q2` | antes: não garantido; depois: `sexoGenero` + `arv_p1_sexo_resp` | `sexoGenero`, `arv_p1_sexo_resp` | Corrigido | Campo atômico e árvore `_resp` enviados. |
| 03. Idade | `id=q3` | antes: não garantido; depois: `idade` + `arv_p1_idade_resp` | `idade`, `arv_p1_idade_resp` | Corrigido | Campo atômico e árvore `_resp` enviados. |
| 04. Dados de identificação | `id=q4` | antes: `dadosIdentificacao` com split limitado; depois: `dadosIdentificacao` + `arv_p1_dados_identificacao_resp` + extração atômica (`cpf`, `rg`, `nomeMae`, `dataNascimento`) | `cpf`, `rg`, `nomeMae`, `dataNascimento`, `arv_p1_dados_identificacao_resp` | Corrigido | Nova função `extrairIdentificacaoQuestionario_` com marcadores e validação conservadora. |
| 05. Meio de transporte | `id=q5` | antes: não garantido; depois: `meioTransporte` + `arv_p2_meio_transporte_resp` | `meioTransporte`, `arv_p2_meio_transporte_resp` | Corrigido | Mapeamento explícito para CASOS. |
| 06. Características do transporte | `id=q6` | antes: não garantido; depois: `dadosVeiculo` + `arv_p2_dados_veiculo_resp` | `dadosVeiculo`, `arv_p2_dados_veiculo_resp` | Corrigido | Mapeamento explícito para CASOS. |
| 07. Características físicas | `id=q7` | antes: sem destino claro; depois: concatena em `observacoesOperacionais` | `observacoesOperacionais` | Corrigido com regra segura | Sem criar nova coluna; também registra `perguntasSemDestinoSeguro` quando vazio. |
| 08. Data/hora última visualização | `id=q8` | antes: não garantido; depois: `dataHoraUltimaVisualizacao` + `arv_p2_data_hora_ultima_resp` | `dataHoraUltimaVisualizacao`, `arv_p2_data_hora_ultima_resp` | Corrigido | Mapeamento explícito para CASOS. |
| 09. Local última visualização | `id=q9` | antes: não garantido; depois: `localUltimaVisualizacao` + `arv_p2_local_ultima_resp` | `localUltimaVisualizacao`, `arv_p2_local_ultima_resp` | Corrigido | Mapeamento explícito para CASOS. |

## Observações de engenharia
- Backend mantido com fallback defensivo (`normalizarCamposAuditoriaParaCasos_` e `expandirCamposCompostosAuditoriaParaCasos_`).
- Prioridade de campo explícito preservada no backend: expansão composta não sobrescreve campo específico já enviado.
- Diagnóstico de auditoria enriquecido com `camposQuestionarioMapeados` e `perguntasSemDestinoSeguro`.
