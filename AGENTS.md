# AGENTS.md

## Objetivo do projeto
Este repositório hospeda aplicações MyFlowLife e o módulo **Cabine Verde** para triagem dinâmica de casos de pessoas desaparecidas.

## Convenções de código
- Priorizar TypeScript com tipagem explícita.
- Manter nomenclatura em português para domínios operacionais.
- Componentes visuais em `src/components` e lógica de negócio em `src/modules` e `src/utils`.

## Organização de módulos
- `src/modules/triagem`: orquestra cálculo e fluxo de triagem.
- `src/modules/desaparecidos`: listagem, filtros e detalhe de casos.
- `src/modules/relatorios`: geração de relatório operacional.

## Regras de engenharia
- Funções em `src/utils` devem permanecer puras e testáveis.
- Serviços externos (Google Sheets etc.) devem ser desacoplados em `src/services`.
- Não quebrar o mapeamento do payload para Google Sheets (`src/utils/sheetsPayload.ts`).
- Toda alteração estrutural exige atualização de documentação em `docs/`.
- Preservar clareza operacional da interface: rapidez de preenchimento e hierarquia visual sóbria.
