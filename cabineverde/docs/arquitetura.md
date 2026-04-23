# Arquitetura Cabine Verde

## Decisão de stack
Foi adotada uma base modular com duas camadas:
1. **Operacional imediata** em HTML/CSS/JavaScript modular (`public/js`), sem build obrigatório.
2. **Base evolutiva** em TypeScript (`src/`), organizada por domínio para evolução em produção.

## Camadas
- `public/js/`: versão funcional ativa da triagem, classificação, payload e relatório.
- `components/`: blocos visuais (layout, formulário, listas, relatório).
- `modules/`: orquestrações por domínio (triagem, desaparecidos, relatórios).
- `utils/`: funções puras (faixa etária, risco, prioridade, payload, resumo).
- `services/`: integrações externas e persistência local.
- `types/`: contratos de dados do caso e payload.

## Evolução futura
Permite evolução para upload de fotos, integração com câmeras e modelos de análise sem quebrar o núcleo funcional.
