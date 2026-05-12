# Integração operacional com Talão 190 (COPOM)

Data: 2026-05-12

## Objetivo

Manter a aba `CASOS` da planilha principal **Cabine verde** como fonte oficial e auditável, e publicar cópia operacional diária para a planilha **COPOM - CABINE VERDE**.

## Implementação no GAS

Arquivo alterado: `cabineverde/GAS/Code.gs`.

### Constantes adicionadas

- `ID_PLANILHA_TALAO_190 = '1gq_zk5fYPTLdjDm8IeqTThgfaijqrwNo6PNk-9cKZGs'`
- `ABA_MODELO_TALAO = 'MODELO_TALAO'`

### Fluxo

1. O caso continua sendo gravado normalmente em `CASOS`.
2. Após gravação (create ou update), o backend chama `sincronizarTalao190(caso)`.
3. A sincronização abre a planilha operacional por `SpreadsheetApp.openById(ID_PLANILHA_TALAO_190)`.
4. A aba diária usa o padrão `ddMMMyy` em maiúsculo (ex.: `12MAI26`).
5. Quando a aba do dia não existe:
   - copia `MODELO_TALAO`;
   - renomeia para a data do dia;
   - atualiza o título em `A1`;
   - grava o registro.
6. Quando já existe, apenas grava na primeira linha livre abaixo do cabeçalho.

### Funções adicionadas

- `sincronizarTalao190(caso)`
- `obterOuCriarAbaTalao190(data)`
- `formatarNomeAbaTalao(data)`
- `montarLinhaTalao190(caso)`
- `atualizarTituloTalao(aba, data)`

## Mapeamento aplicado para o Talão 190

1. DATA = `caso.dataHoraRegistro` ou `caso.dataServico`
2. BOPM = `caso.talaoBopm`
3. CPF/RG = `caso.cpf`
4. NOME COMPLETO (Desaparecido) = `caso.nomeCompletoDesaparecido`
5. OBS. = `caso.observacoesOperacionais`
6. DATA = `caso.dataServico` ou data atual
7. Nome do Solicitante = `caso.nomeSolicitante`
8. Telefone = `caso.telefoneSolicitante`
9. OBS. = `caso.observacoesOperacionais`
10. 190 = `caso.encerrado190` ou `DESAPARECIDO`
11. Quem é o Operador "PM" que ligou para o solicitante = `caso.operadorResponsavel`

## Observações

- Em caso de falha de sincronização, o erro é registrado em log (`Logger.log`) sem interromper a persistência oficial da aba `CASOS`.
- A rotina preserva a formatação da aba modelo ao criar abas diárias por cópia.
