# Estratégia de dados: legado + operação

O sistema opera em duas camadas:

1. **Legado:** indicadores consolidados e localizações detalhadas importados das planilhas, preservados como fonte histórica e marcados como incompletos quando necessário.
2. **Operação local:** novos casos gravados pelo aplicativo com `novoCasoLocal = true`, incluindo status, condição, desfecho, encaminhamento e recursos utilizados.

O Dashboard soma os resultados operacionais aos indicadores legados sem sobrescrever a base histórica. A origem de cada conjunto permanece identificável para auditoria e conferência.
