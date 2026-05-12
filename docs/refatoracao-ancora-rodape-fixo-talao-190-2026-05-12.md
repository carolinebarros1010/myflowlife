# Refatoração estrutural — âncora dinâmica do rodapé fixo (Talão 190) — 2026-05-12

## Diagnóstico da mudança arquitetural

A sincronização do relatório diário do COPOM/Cabine Verde deixou de depender de limites fixos de linha, varredura textual do rodapé e cálculo por `getLastRow()` para decidir gravação operacional.

Estratégia oficial aplicada:

> O rodapé sempre desce; a área operacional cresce dinamicamente.

Âncora estrutural oficial:

- `A21 = ### INICIO_RODAPE_FIXO ###`

## O que foi alterado no código

- Nova função `localizarLinhaAncoraRodape_(sheet)`:
  - Busca **exata** do marcador `### INICIO_RODAPE_FIXO ###` na coluna A.
  - Retorna a linha da âncora.
  - Lança erro estrutural `ÂNCORA_RODAPE_NAO_ENCONTRADA` se ausente.

- Nova função `inserirLinhaOperacionalAntesRodape_(sheet)`:
  - Localiza a âncora.
  - Insere 1 linha imediatamente acima.
  - Copia formatação da linha operacional anterior para a linha criada.
  - Limpa apenas conteúdo da linha nova.
  - Retorna a linha criada para gravação com `setValues`.

- `sincronizarTalao190(caso)`:
  - Mantém `LockService`, assinatura operacional/idempotência e `dataServico` congelada.
  - Em atualização: bloqueia escrita se a linha encontrada estiver na âncora ou abaixo.
  - Em criação: usa inserção antes da âncora (sem `appendRow`, sem `getLastRow` decisório).
  - Em ausência da âncora: bloqueia sincronização, registra `LOG_AUDITORIA` e retorna erro operacional.

- `encontrarPrimeiraLinhaVaziaRelatorio(sheet)`:
  - Mantida por compatibilidade de assinatura, agora delega para a nova inserção por âncora.

- `obterUltimaLinhaOperacionalRelatorio_(sheet)`:
  - Passou a usar a âncora como limite superior do rodapé (`linhaAncora - 1`).

- `localizarLinhaDuplicadaRelatorio_(sheet, caso)` e `limparDuplicadosRelatorioAtual()`:
  - Passam a operar estritamente entre `PRIMEIRA_LINHA_DADOS_TALAO` e a linha imediatamente anterior à âncora.

## Funções removidas/substituídas (comportamento)

- Removido comportamento de detecção de rodapé por texto (`INSTRU`, `ORIENTA`, `OBSERVA`) como regra de corte da área operacional.
- Removida dependência de área operacional fixa para encontrar “primeira vazia”.

## Onde substituir no fluxo operacional

- Inserção de novo caso no relatório diário:
  - Antes: busca de linha vazia operacional.
  - Agora: `inserirLinhaOperacionalAntesRodape_(sheet)` + `setValues` na linha retornada.

- Validação estrutural pré-gravação:
  - Sempre validar âncora com `localizarLinhaAncoraRodape_(sheet)`.

## Riscos operacionais restantes

- Se a âncora for alterada manualmente (texto diferente do valor oficial) a sincronização será bloqueada por design.
- Se a linha imediatamente acima da âncora tiver formatação incorreta, essa formatação será propagada para novas linhas operacionais.

## Validação estrutural final

Checklist aplicado:

- Sem uso de `appendRow` no fluxo do Talão 190.
- Sem uso de `getLastRow` para decidir escrita operacional no relatório diário.
- Sem varredura textual de instruções/observações para delimitar rodapé.
- Escrita de novos casos restrita à linha criada acima da âncora via `setValues`.
- Proteção ativa contra escrita na linha da âncora e abaixo dela.
