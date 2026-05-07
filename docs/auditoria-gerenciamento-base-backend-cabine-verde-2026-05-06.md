# Auditoria — gerenciamento da base e relatórios gerais via backend (2026-05-06)

## Objetivo
Remover dependência operacional de `localStorage` nos botões gerenciais da `auditoria.html` e integrar com backend oficial (GAS/planilha).

## Ajustes realizados
- Botões renomeados para:
  - `BACKUP OFICIAL`
  - `RESTAURAR BASE OFICIAL`
  - `RELATÓRIO OFICIAL — EM BUSCA`
  - `RELATÓRIO OFICIAL — LOCALIZADOS`
- Inclusão de aviso visual: **Dados carregados da base oficial.**
- Criação de `aplicarPermissoesBotoesGerenciais()` para controle por perfil.
- Troca de ações legadas:
  - `exportarBackup()` -> `gerarBackupBackend()`
  - `importarBackup(event)` -> `restaurarBackupBackend(event)`
  - `gerarRelatorioMassa(...)` -> `gerarRelatorioBackend(...)`
- Funções legadas mantidas apenas quando `MODO_LOCAL_LEGADO = true`.

## Regras por perfil implementadas
- `ADMIN`: visualiza e executa backup/restauração/relatórios globais.
- `SUPERVISOR`: visualiza e executa relatórios globais.
- `OPERADOR`: não visualiza botões gerenciais globais.

## Backend (GAS)
Novas actions:
- `gerarBackupBase`
- `restaurarBackupBase`
- `listarCasosPorStatus`
- `gerarRelatorioCasos`

### Segurança operacional
- Restauração automática **bloqueada por padrão** no backend.
- A ação registra evento de auditoria em `LOGS` para execução manual controlada.
