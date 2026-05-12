# Correção emergencial — duplicidade no RELATÓRIO/TALÃO 190 (2026-05-12)

## Causa provável
- A sincronização do Talão 190 não fazia checagem de duplicidade antes da escrita.
- A inserção procurava apenas “primeira linha vazia” sem delimitar área operacional até os blocos fixos/instruções.
- Em cenários de reenvio concorrente, a atualização poderia duplicar registros no relatório diário.

## Correções implementadas
- Proibição prática de `appendRow` na aba diária do Talão 190: gravação apenas via `setValues` com linha controlada.
- `encontrarPrimeiraLinhaVaziaRelatorio(sheet)` para localizar linha vazia somente na área operacional.
- `localizarLinhaDuplicadaRelatorio_(sheet, caso)` com assinatura operacional por:
  - BOPM/talão;
  - CPF/RG;
  - nome normalizado;
  - telefone normalizado;
  - data do atendimento.
- Se já existir: atualiza a linha existente (`setValues`).
- Se não existir: grava na primeira linha vazia da área operacional (`setValues`).
- `limparDuplicadosRelatorioAtual()` para saneamento dos duplicados do dia, mantendo o primeiro registro.
- Lock transacional adicional na sincronização do Talão 190 para reduzir corrida.

## Pontos de substituição
- Arquivo: `cabineverde/GAS/Code.gs`
- Função principal alterada: `sincronizarTalao190(caso)`.
- Funções novas: `encontrarPrimeiraLinhaVaziaRelatorio`, `localizarLinhaDuplicadaRelatorio_`, `limparDuplicadosRelatorioAtual` e auxiliares.
