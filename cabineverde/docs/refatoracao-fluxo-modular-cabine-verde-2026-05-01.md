# Refatoração de fluxo modular — Cabine Verde (2026-05-01)

## Objetivo
Reduzir carga cognitiva e duplicidade no atendimento, separando o processo em módulos operacionais e garantindo fluxo linear: **Registro -> Triagem**.

## Mudanças aplicadas
- Criação de módulo dedicado de **Triagem** separado do módulo de **Registro**.
- Registro inicial simplificado com apenas:
  - nome
  - idade
  - sexo
  - município
  - última visualização
  - solicitante
- Após salvar no registro, redirecionamento automático para o módulo de triagem.
- Reuso dos dados do registro na triagem para evitar preenchimento duplicado dos campos principais.
- Conteúdos de consulta, qualidade e relatórios mantidos em módulos próprios, fora da tela de registro.

## Compatibilidade
- Mapeamento de payload para backend/Google Sheets preservado.
- Campos complementares seguem no formulário de triagem.
