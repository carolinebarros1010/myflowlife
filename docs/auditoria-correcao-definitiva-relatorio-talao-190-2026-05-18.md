# Correção definitiva — relatório Talão 190 (18/05/2026)

## Causa raiz identificada
- A rotina de inserção no relatório diário utilizava estratégia de **inserção direta antes da âncora de rodapé**, sem reaproveitar linhas operacionais já vazias entre a linha inicial da operação (`7`) e a âncora do rodapé.
- Em cenários com resíduos estruturais (fórmulas vazias, espaços não-quebráveis, conteúdo invisível) nas linhas 7–13, o fluxo continuava empurrando o rodapé e gravando novos registros em posições mais abaixo (ex.: linha 14), degradando a previsibilidade da área operacional.
- A deduplicação do Talão 190 era baseada majoritariamente em assinatura operacional; quando havia variação de normalização em campos de assinatura, um novo insert podia ocorrer.

## Ajustes implementados
1. **Detecção de primeira linha operacional livre real**
   - Nova função `localizarPrimeiraLinhaOperacionalLivre_` varre a janela operacional (linha 7 até antes do rodapé).
   - Nova função `linhaOperacionalVazia_` considera:
     - `getValues()`
     - `getDisplayValues()`
     - `getFormulas()`
     - remoção de espaços não quebráveis (`\u00A0`) e `trim`
   - Se existir linha realmente livre, a escrita ocorre nela sem empurrar rodapé.

2. **Proteção da inserção antes do rodapé**
   - `inserirLinhaOperacionalAntesRodape_` agora primeiro tenta reutilizar linha livre operacional.
   - Apenas quando não houver linha livre, faz `insertRowsBefore(âncora)` com cópia de formato e `clearContent()`.

3. **UPSERT mais robusto no relatório diário**
   - `localizarLinhaDuplicadaRelatorio_` passou a tentar match por:
     1. `idCaso` (quando disponível no relatório);
     2. `talao` normalizado;
     3. assinatura operacional.
   - Reduz duplicidade em cenários de variação textual residual.

4. **Log operacional reforçado**
   - Em inserções no Talão 190, registro no `LOG_AUDITORIA` com:
     - `linhaLivreDetectada`
     - `linhaInserida`
     - `aba`
     - `talão`

## Impacto operacional esperado
- Registros passam a iniciar na **primeira linha operacional livre válida**, reduzindo deslocamentos artificiais para linha 14+.
- Menor risco de duplicidade por sincronizações repetidas com pequenas variações de texto.
- Maior rastreabilidade para auditoria policial por log explícito da decisão de linha.

## Restrições preservadas
- Sem alteração de layout visual institucional.
- Sem remoção de rodapé fixo.
- Sem alteração de cabeçalhos.
- Sem uso de `appendRow()` para o Talão 190.
