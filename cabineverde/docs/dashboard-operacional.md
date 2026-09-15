# Dashboard operacional

O dashboard apresenta o layout operacional de resultados da Muralha Paulista – Desaparecidos. Em modo central, os indicadores são calculados exclusivamente a partir da API e da base oficial do servidor; o SQLite legado não participa desses números. O modo local mantém os indicadores históricos para compatibilidade.

O seletor permite consultar o período legado, os últimos 15 dias, os últimos 30 dias ou um intervalo personalizado. Para intervalos filtrados, os valores são calculados a partir da tabela local `localizacoes_legado`. O período legado preserva os indicadores consolidados importados, inclusive quando a soma das linhas detalhadas ainda estiver incompleta.

No modo central, o painel não utiliza `indicadores_producao_legado`, `localizacoes_legado` nem qualquer outro dado do SQLite local. Ele consulta a API do servidor e considera como localização confirmada somente registros com desfecho/status de localização explícito. Casos centrais ainda em `EM_ANDAMENTO` não são contados como localizações.

## Quadro de produção atualizado em 28/08/2026

O modo local usa como fotografia oficial o quadro `Relatório Diário de PRODUÇÃO da CABINE VERDE.xlsx`, fonte `1p7Q-ZCYr6JA2mLBF1_7s6XgW8_MA-cT9`: 242 localizações, distribuídas em 92 pela Muralha, 77 por VTR, 32 por vulto/imprensa/outros, 23 com resultado prisão e 18 em óbito. O período exibido é 22/04/2026–28/08/2026.

Novos registros locais marcados como localização confirmada são somados ao quadro no carregamento do dashboard, sem alterar a fotografia histórica importada. Assim, os próximos casos atualizam automaticamente o painel.

Na finalização operacional, o campo **Vulto/imprensa?** aceita **Sim** ou **Não**. Quando marcado como **Sim**, o caso novo é contabilizado na categoria **VULTO / IMPRENSA E OUTROS** do dashboard; o campo antigo de mídia/foto não é mais usado para esse indicador.

## Status visual do atendimento

- **Em andamento**: registro inicial/F2 sem contato ou aprofundamento iniciado; permanece com fundo branco.
- **Em triagem**: contato, entrevista qualificada ou inserção de imagem registrada; aparece em laranja claro/bege.
- **Localizado**: ocorrência finalizada com localização; aparece em azul claro.
