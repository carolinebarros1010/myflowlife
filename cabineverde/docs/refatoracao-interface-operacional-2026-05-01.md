# Refatoração da interface operacional (2026-05-01)

## Objetivo
Reestruturar o front-end da Cabine Verde para um fluxo operacional direto de decisão, removendo dispersão de contexto da jornada principal.

## Nova arquitetura de telas principais

### Tela 1 — Entrada Operacional
- Campo obrigatório: **Número do Talão PMESP**.
- Campo: Município.
- Ação única: **Iniciar atendimento**.

### Tela 2 — Triagem
- Formulário operacional existente mantido.
- Organização em **PASSO 1 a PASSO 5** com navegação por botões **Próximo** e **Voltar**.
- Sem links externos na etapa de triagem.

### Tela 3 — Decisão Operacional
- Exibição de resumo operacional consolidado.
- Destaque de Risco, Prioridade e Status.
- Ações operacionais: encaminhamento e encaminhamento.

## Itens removidos da tela principal
Os blocos abaixo deixaram de ficar na área principal e foram movidos para **Menu secundário**:
- Casos.
- Consulta e auditoria.
- Painel de qualidade.

## Resultado esperado
A aplicação passa a operar como ferramenta de decisão operacional, evitando rolagem contínua e mantendo objetivo único por tela.
