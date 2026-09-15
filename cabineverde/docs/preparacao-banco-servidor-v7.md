# Preparação do banco para o servidor — V7

## Resultado da conferência

O arquivo `Cabine_Verde_Unificada_Eventos_V7_Atribuicao_Causal.xlsx` foi usado como fonte de validação do pacote offline.

- `AUDITORIA_CAUSAL_213`: 213 de 213 registros conferidos com `dados/historicos-v7.json`, sem divergências nos campos de data, talão, pessoa, categoria, narrativa e atribuição causal.
- `NOVAS_INSERCOES_18_19AGO`: 5 de 5 registros já estavam em `dados/analises-f2.json`.
- Nenhum registro foi duplicado ou sobrescrito nesta etapa.

## Conteúdo final do pacote

Os arquivos JSON em `CabineVerde_Pacote_D_19AGO2026/CabineVerde/dados` estão prontos para serem copiados para o servidor. A origem V7, o hash e a conferência foram registrados em `dados/metadados.json`.

Antes da cópia para o servidor, manter a estrutura de pastas intacta e preservar a pasta `backup` gerada pela importação incremental.
