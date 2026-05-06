# Auditoria técnica e funcional — integração TRIAGEM x AUDITORIA (2026-05-06)

## Escopo analisado
- Triagem (frontend TypeScript): `cabineverde/src/app.ts`, `cabineverde/src/components/form/TriageForm.ts`, `cabineverde/src/modules/triagem/*`, `cabineverde/src/utils/sheetsPayload.ts`.
- Auditoria (frontend legado): `cabineverde/auditoria.html`.
- Backend Google Apps Script: `cabineverde/GAS/Code.gs`, `cabineverde/GAS/CabineVerdeSchema.gs`.

## Achados principais
1. A auditoria legada renderizava apenas **40 campos tipo questionário** + metadados locais, com persistência em `localStorage`.
2. O schema oficial `CASOS` contém **182 colunas**, não 181.
3. Divergência crítica de chave de talão no schema: existe `talaoBopm` mas não `talaoPMESP` em `CASOS`; o backend já busca por `talaoPMESP` em vários fluxos.
4. `auditoria.html` já possuía integração parcial com `buscarCasoCompleto/salvarAuditoriaCaso`, porém sem botão operacional explícito de busca por talão e mantendo submit local legado em paralelo.

## TRIAGEM — inventário de arquivos
- HTML principal: `cabineverde/public/index.html` (mount do app).
- Formulário base: `cabineverde/src/components/form/TriageForm.ts`.
- Motor dinâmico/perguntas condicionais: `cabineverde/src/components/triagem/*.ts`, `cabineverde/src/modules/triagem/triageEngine.ts`.
- Estado e fluxo: `cabineverde/src/modules/triagem/triagemState.ts`, `cabineverde/src/app.ts`.
- Mapeamento payload→planilha: `cabineverde/src/utils/sheetsPayload.ts`.
- Persistência backend: `cabineverde/src/services/sheetsService.ts` + GAS `doPost` action `salvarCaso`.

## AUDITORIA — inventário de arquivos
- Página: `cabineverde/auditoria.html`.
- Script inline: na própria página (sem `auditoria.js` separado).
- Busca backend existente: `action=buscarCasoCompleto`.
- Salvamento backend existente: `action=salvarAuditoriaCaso` (normalizado para `salvarCaso` no GAS).

## Comparativo TRIAGEM x AUDITORIA
- Triagem (schema oficial): 182 colunas (`CASOS`).
- Auditoria legada (inputs `q*`): 40 campos + campos CV.
- Lacuna operacional: 142+ campos do schema sem representação explícita no formulário legado.

## Matriz de rastreabilidade (amostra de campos críticos)
| Pergunta / Dado triagem | frontend triagem | chave JSON | coluna planilha | campo auditoria legado |
|---|---|---|---|---|
| Talão PMESP | `talaoPMESP` | `talaoPMESP` | **divergente no schema** (`talaoBopm`) | `#talao` |
| Nome desaparecido | `nomeCompletoDesaparecido` | `nomeCompletoDesaparecido` | `nomeCompletoDesaparecido` | `#q1` |
| Sexo/Gênero | `sexoGenero` | `sexoGenero` | `sexoGenero` | `#q2` |
| Idade | `idade` | `idade` | `idade` | `#q3` |
| Município | `municipio` | `municipio` | `municipio` | `#q_municipio` |
| Última visualização | `dataHoraUltimaVisualizacao` | idem | idem | `#q8` |
| Local última visualização | `localUltimaVisualizacao` | idem | idem | `#q9` |
| Roupa | `roupaUltimaVisualizacao` | idem | idem | `#q10` |
| Observações operacionais | `observacoesOperacionais` | idem | idem | `#cv_obs` |

## Fluxo de busca por talão
- Campo na auditoria: `#talao`.
- Botão novo adicionado: **Buscar caso** (`buscarCasoPorTalao()`).
- Backend: `Code.gs` possui `buscarCasoCompleto` em `doGet` e `doPost`.
- Identificador padronizado recomendado: **`talaoPMESP`** (operacional).
- Compatibilidade transitória: manter leitura de `talaoBopm` em legado/migração.

## Ajustes implementados nesta entrega
1. Desativado submit legado local por padrão (`MODO_LOCAL_LEGADO = false`).
2. Adicionado botão explícito de busca por talão.
3. Implementada função `buscarCasoPorTalao()` chamando backend com `filtro.talaoPMESP`.
4. Implementado `renderizarEspelhoTriagem(caso)` para exibir **todos os campos retornados** pelo backend (conferência auditável sem perda).
5. Mantido salvamento de auditoria para backend em `salvarAuditoriaCaso`.

## Divergência 181 x 182 (campo excedente)
- O schema `CASOS` atual tem **182** entradas.
- Divergência mais sensível: presença de `talaoBopm` e ausência de `talaoPMESP` na lista `CASOS` de `CabineVerdeSchema.gs`.
- Recomendação: incluir `talaoPMESP` no schema canônico e manter `talaoBopm` apenas como alias de migração controlada.

## Proposta de padronização de nomes
- Chave principal: `talaoPMESP`.
- Alias apenas em migração: `talaoBopm`, `talaoBOPM`, `numeroTalao`, `talao`.
- Frontend, backend e planilha devem convergir para `talaoPMESP` como chave de busca e deduplicação.

## Próximos passos recomendados
1. Criar renderer dinâmico da auditoria baseado no mesmo schema/perguntas da triagem (não apenas espelho JSON).
2. Remover definitivamente blocos de localStorage legado após janela de transição.
3. Corrigir schema CASOS para refletir `talaoPMESP` sem quebrar migração.
