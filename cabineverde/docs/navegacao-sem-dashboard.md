# Navegação sem Dashboard

A navegação principal da aplicação local não exibe mais a aba Dashboard.
Após o login, a tela inicial passa a ser a Área de trabalho.
As demais abas, incluindo Resumo mensal e Resumo diário, continuam disponíveis.

A alteração está no componente `AppPainelPrioridadeComConfiguracoes`, em
`local-app/src/main.tsx`. Os serviços de indicadores permanecem disponíveis
para os relatórios existentes.

Execute `npm run build` em `cabineverde` para gerar a interface atualizada.
Instalações já distribuídas precisam receber uma atualização para refletir a mudança.
