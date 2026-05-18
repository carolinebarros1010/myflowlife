# Auditoria adicional — inconsistência entre nome da aba e data dos registros (18/05/2026)

## Diagnóstico da causa raiz
- A seleção da aba diária estava distribuída e permissiva: `sincronizarTalao190` usava `caso.dataServico || caso.dataHoraRegistro || new Date()` diretamente, sem um contexto único reutilizado em todas as decisões.
- A linha gravada no relatório podia usar composição de data diferente da data efetiva usada para nome/título da aba, permitindo desalinhamento operacional em cenários de payload parcial/inconsistente.
- Não havia bloqueio explícito para impedir gravação quando nome da aba, título e data operacional divergiam.

## Correção implementada
1. **Data operacional única (single source of truth)**
   - `resolverDataOperacionalCaso_(caso)` define `dataOperacional`, `dataOperacionalISO` e `fonteData`.

2. **Padronização de nomenclatura/seleção de aba**
   - `formatarNomeAbaTalao190_(data)` como função canônica de nome da aba.
   - `obterOuCriarAbaTalao190_(dataOperacional)` como função canônica de busca/criação.

3. **Trava defensiva antes da gravação**
   - `validarConsistenciaEstruturalTalao190_(aba, contextoData)` bloqueia gravação quando:
     - nome da aba != data operacional formatada;
     - título não contém a mesma data operacional.

4. **Alerta de inconsistência entre abas**
   - `localizarRegistroEmAbaIncompativel_(caso, abaAtual)` verifica ocorrência do mesmo caso em outra aba diária e registra alerta em `LOG_AUDITORIA`.

5. **Coluna A alinhada à data operacional única**
   - `montarLinhaTalao190(caso, contextoData)` passa a gravar coluna A com `dataOperacionalISO`.

## Resultado esperado
- Nome da aba, título, coluna A e data usada na sincronização ficam coerentes e determinísticos.
- Gravações em aba incompatível passam a ser bloqueadas e auditáveis.
