# Auditoria técnica completa — COPOM - CABINE VERDE (2026-05-12)

## Escopo
Auditoria sob ótica **exclusiva de preenchimento da planilha operacional COPOM - CABINE VERDE**, considerando:
- integridade operacional;
- organização visual;
- consistência dos dados;
- prevenção de duplicidade;
- preservação de áreas fixas;
- rastreabilidade;
- preenchimento correto de colunas.

## Evidências analisadas
- Backend Apps Script (`cabineverde/GAS/Code.gs`).
- Schema canônico (`cabineverde/GAS/CabineVerdeSchema.gs`).
- Mapeamento frontend payload (`cabineverde/src/utils/sheetsPayload.ts`).
- Testes automatizados de posição de coluna e fluxo (`cabineverde/tests-js/core.test.js`, `cabineverde/tests-js/simulacao-operacional.test.js`).
- Documentação operacional prévia (`docs/integracao-talao-190-cabine-verde-2026-05-12.md`, `docs/correcao-emergencial-duplicidade-relatorio-talao-190-2026-05-12.md`).

---

## 1) Estrutura da planilha COPOM - CABINE VERDE

### 1.1 Abas alvo
- O backend sincroniza o relatório diário na planilha externa via `SpreadsheetApp.openById(ID_PLANILHA_TALAO_190)`.
- A aba diária é gerada/selecionada por `formatarNomeAbaTalao(data)` no padrão `ddMMMyy` em maiúsculo (ex.: `12MAI26`).
- Se a aba não existir, é clonada de `MODELO_TALAO`, preservando layout base.

**Diagnóstico:** ✅ aderente ao requisito de abas diárias e padronização nominal.

### 1.2 Área operacional x área fixa
- A escrita começa em `PRIMEIRA_LINHA_DADOS_TALAO = 7`.
- O limite inferior operacional é detectado dinamicamente por busca de marcadores de instrução (`INSTRU`, `ORIENTA`, `OBSERVA`) na coluna A.
- Quando não encontra marcador, usa `getLastRow()` como limite.

**Diagnóstico:** ⚠️ parcialmente robusto.
- Ponto forte: mecanismo explícito para proteger bloco fixo inferior.
- Risco: depende de texto/marcador na coluna A; se o modelo mudar rótulos, o limite pode degradar.

---

## 2) Validação do mapeamento de colunas

## 2.1 CASOS (fonte oficial)
- `COLUNAS_CASOS` posiciona `talaoBopm` na 8ª coluna lógica (H) e há teste cobrindo isso.
- `normalizarTalaoPayload` espelha `talaoPMESP` e `talaoBopm` para reduzir divergência de chave.

**Diagnóstico:** ✅ mapeamento crítico de `talaoBopm` consistente no pipeline frontend + backend.

### 2.2 Relatório diário (11 colunas em `montarLinhaTalao190`)
Mapeamento efetivo para aba diária:
1. DATA ← `dataHoraRegistro`
2. BOPM ← `talaoBopm`
3. CPF/RG ← `cpf` (**RG não é separado**)
4. NOME COMPLETO ← `nomeCompletoDesaparecido`
5. OBS. ← `observacoesOperacionais`
6. DATA (serviço) ← `dataServico`
7. Solicitante ← `nomeSolicitante`
8. Telefone ← `telefoneSolicitante`
9. OBS. (duplicada) ← `observacoesOperacionais`
10. 190/status ← `encerrado190` ou `DESAPARECIDO`
11. Operador ← `operadorResponsavel`

**Diagnóstico:** ⚠️ aderência parcial aos campos solicitados.
- `nomeCompletoDesaparecido`, solicitante, telefone, operador e data de serviço estão mapeados.
- `cpf/rg` é consolidado em um único campo de origem (`cpf`) no relatório diário.
- `status`, `prioridade`, `risco` **não são projetados explicitamente** nas 11 colunas diárias.

---

## 3) Fluxo operacional real (create/update/reabertura/localização/encerramento)

### 3.1 Criação
- `persistirRegistro` grava `CASOS` via `setValues` e aciona `sincronizarTalao190`.

### 3.2 Atualização/Reabertura
- Localização de linha por precedência: `idCaso` → `talaoPMESP` → `talaoBopm` → `numeroTalao` → `assinaturaCaso`.
- Em match: update da mesma linha `CASOS` com `setValues` e re-sincronização do relatório diário.

### 3.3 Localização/Encerramento
- O valor enviado à coluna “190” do relatório depende de `encerrado190`; fallback padrão = `DESAPARECIDO`.

**Diagnóstico:** ✅ fluxo de update da mesma ocorrência está bem definido e orientado a idempotência.

---

## 4) Preenchimento do relatório diário

### Controles identificados
- `appendRow` não é usado para a aba diária; gravação ocorre por `setValues` em linha calculada.
- Se assinatura operacional já existir, atualiza a linha existente.
- Se não existir, grava na primeira linha vazia da área operacional.
- Se área operacional lotar, dispara erro explícito.

**Diagnóstico:** ✅ conformidade forte com não invasão e não duplicação por escrita cega.

---

## 5) Assinatura operacional

### Assinatura de deduplicação no relatório diário
- `gerarAssinaturaOperacionalRelatorio_` usa:
  - `dataServico` (ou `dataHoraRegistro`);
  - `talaoBopm`/`talaoPMESP` normalizado;
  - nome normalizado;
  - telefone normalizado.

**Diagnóstico:** ✅ exatamente alinhado ao requisito solicitado.

---

## 6) Integridade visual da planilha

### Proteções existentes
- Escrita por linha/coluna fixa (`getRange(..., 11).setValues`) evita deslocamento de grade.
- Inibição explícita de `appendRow` genérico para abas críticas (`CASOS`, `RELAT*`, `TALAO*`).
- Criação de abas diárias por cópia de modelo preserva formatação base.

### Riscos remanescentes
- Detecção da área fixa depende de strings na coluna A; mudança textual no template pode reduzir proteção.
- Não há validação de “células coloridas/protegidas” via API antes da escrita.

**Diagnóstico:** ⚠️ bom nível atual, porém com fragilidade de acoplamento ao texto do modelo.

---

## 7) Consistência operacional

- `dataServico` é preservada de forma imutável em updates (se divergente, backend mantém valor persistido e loga preservação).
- `operadorResponsavel` é propagado para relatório diário na coluna final.
- Mudanças relevantes geram eventos (`EVENTOS_CASO`) e logs de auditoria.

**Diagnóstico:** ✅ consistente no núcleo CASOS→COPOM.

---

## 8) Auditoria de duplicidade

### Mecanismos ativos
- Cache idempotente por `chaveUnica` em `CacheService`.
- Lock transacional em `salvarCaso` e em `sincronizarTalao190` com `LockService`.
- Bloqueio por `CHAVE_UNICA` já existente na CASOS.
- Deduplicação semântica por assinatura no relatório diário.
- Função de saneamento retroativo (`limparDuplicadosRelatorioAtual`).

### Vulnerabilidades residuais
- Se `chaveUnica` não vier do cliente, dependência maior de assinatura/critério de localização.
- Assinatura pode colidir em homônimos com mesmo telefone e data sem talão forte.

**Diagnóstico:** ✅ alto nível de robustez, com riscos residuais conhecidos.

---

## 9) Robustez operacional (24h)

- `LockService`: presente nos dois pontos críticos (persistência e sincronização diária).
- `CacheService`: idempotência de requisição ativa com TTL de 6h.
- Anti duplo clique: coberto por idempotência backend; no frontend há dedupe explícito no upload de foto por assinatura de arquivo.
- Fallback: falha na sincronização COPOM não derruba persistência em `CASOS` (erro logado e retorno controlado no sync).

**Diagnóstico:** ✅ arquitetura orientada a continuidade operacional.

---

## 10) Observabilidade

- Existe `LOG_AUDITORIA` com colunas dedicadas e escrita via `setValues` controlado.
- Há logs técnicos (`Logs_GAS`) de início, sucesso e erro de gravação.
- Eventos operacionais em `EVENTOS_CASO` para rastreabilidade de ações.
- Logs específicos para preservação de `dataServico` e para duplicados ignorados.

**Diagnóstico:** ✅ trilha auditável adequada para operação crítica, com espaço para observabilidade ativa (alertas).

---

## Pontos aprovados
1. Escrita no relatório diário somente via `setValues` em faixa fixa.
2. Proibição prática de `appendRow` em abas operacionais críticas.
3. Controle de duplicidade por assinatura + chave única + lock + cache.
4. Preservação de `dataServico` em updates.
5. Padronização de aba diária `ddMMMyy` e cópia de `MODELO_TALAO`.

## Vulnerabilidades restantes
1. Dependência textual para detectar início de bloco instrucional.
2. `CPF/RG` em coluna única mas preenchida apenas com `cpf` no `montarLinhaTalao190`.
3. Ausência explícita de `status/prioridade/risco` no layout diário de 11 colunas (pode limitar decisão tática no COPOM).
4. Sem validação de proteção/estilo de célula antes de gravar (proteção lógica, não estrutural da planilha).

## Inconsistências estruturais observadas
1. Dupla observação no relatório diário (colunas 5 e 9 usam `observacoesOperacionais`).
2. Campo 190 usa `encerrado190` com fallback textual; sem enum operacional rígido.

## Recomendações de endurecimento (produção policial 24h)
1. Tornar limite da área operacional parametrizável (ex.: `ULTIMA_LINHA_OPERACIONAL_TALAO`) em vez de inferência por texto.
2. Validar, no startup diário, integridade do template (cabeçalhos, posições e proteção de ranges).
3. Incluir `rg` concatenado com `cpf` na coluna CPF/RG quando disponível.
4. Persistir também `statusCaso`, `prioridade` e `classificacaoRisco` em colunas extras no relatório (se o template permitir) ou em aba auxiliar vinculada por assinatura.
5. Adicionar alerta ativo (e-mail/webhook) para falha em `sincronizarTalao190` e para lotação da área operacional.
6. Exigir `chaveUnica` obrigatória no contrato de integração frontend→backend para eliminar janelas semânticas.

## Pontos críticos de risco operacional
1. Mudança não controlada no template da COPOM pode comprometer o detector de área fixa.
2. Falha silenciosa de sincronização (atualmente logada) sem alerta imediato pode gerar defasagem operacional entre CASOS e diário.
3. Ambiguidade CPF/RG reduz capacidade de conferência rápida em atendimento de alta pressão.

## Checklist operacional final
- [x] Aba diária no padrão `ddMMMyy`.
- [x] Escrita apenas na área operacional (início linha 7).
- [x] Proteção contra invasão da área instrucional por limite operacional.
- [x] Sem `appendRow` para relatório diário.
- [x] Atualização na mesma linha para caso já existente.
- [x] Assinatura operacional com data+talao+nome+telefone normalizados.
- [x] Lock transacional na sincronização.
- [x] Idempotência por cache/chave.
- [x] LOG_AUDITORIA ativo.
- [ ] Alerta ativo (tempo real) para falha de sincronização.
- [ ] Regra explícita para CPF+RG no relatório diário.
- [ ] Guarda de integridade estrutural do template antes de cada turno.

## Conclusão executiva
O sistema atual apresenta **boa maturidade de integridade e anti-duplicidade** para escrita na planilha operacional COPOM, com decisões corretas de `setValues`, lock e assinatura operacional. O risco residual principal está na **dependência do template textual para delimitar área fixa** e na **lacuna de observabilidade ativa** (alerta imediato). Para ambiente policial 24h, recomenda-se endurecimento estrutural do limite operacional e telemetria de falha em tempo real.
