# Auditoria técnica do front-end Cabine Verde (01/05/2026)

## Relatório técnico curto

| Problema encontrado | Impacto operacional | Solução viável | Prioridade |
|---|---|---|---|
| Registro inicial não começava pelo Talão PMESP. | Abertura de caso sem identificador primário, risco de retrabalho e duplicidade. | Inserir campo **Número do Talão PMESP** como primeiro campo obrigatório no Registro Inicial e mapear automaticamente para a Triagem. | Crítica |
| Campos críticos estavam concentrados na triagem, com poucos dados mínimos no Registro Inicial. | Operador perde tempo alternando contextos no começo do atendimento. | Acrescentar telefone do solicitante e validações básicas no Registro Inicial para melhorar qualidade desde a entrada operacional. | Alta |
| Validação fraca para talão e telefone. | Maior chance de dado inconsistente para integração Apps Script/Sheets. | Aplicar `pattern`, placeholder e constraints de idade/telefone/talão sem alterar payload final. | Alta |
| Resumo operacional não priorizava persistência visual em telas longas. | Decisão mais lenta, operador precisa rolar para consultar risco/prioridade/status. | Tornar painel de risco e resumo ao vivo com comportamento `sticky` na coluna lateral. | Média |

## Proposta de arquitetura visual (módulos)

1. **Entrada Operacional**: registro rápido (talão PMESP, dados mínimos da ocorrência).  
2. **Dados do Desaparecido**: dados pessoais, físicos e última visualização.  
3. **Dados do Solicitante**: vínculo, contato e contexto relacional.  
4. **Triagem Guiada**: fluxo em etapas com avanço/retorno e validação por etapa.  
5. **Subaba por Faixa Etária**: perguntas condicionais por faixa etária (já presente no fluxo condicional).  
6. **Resumo Operacional**: risco, prioridade, status e alertas em leitura rápida persistente.  
7. **Casos e Auditoria**: consulta, histórico e logs.  
8. **Painel de Qualidade**: inconsistências, criticidade e pendências de saneamento.

## Compatibilidade e integração

- Mantido mapeamento existente para Google Sheets e Apps Script (sem remoção de campos nem quebra de IDs principais).
- Alterações focadas em reorganização de entrada operacional, validação mínima e usabilidade por etapa.
