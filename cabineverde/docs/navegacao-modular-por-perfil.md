# Navegação modular por perfil - Cabine Verde

## Estrutura de módulos
A interface foi separada em módulos operacionais com rotas lógicas:
- `registro`: registro de ocorrência, triagem, foto, salvamento e geração SIOPM.
- `consulta`: busca de casos, visualização principal, timeline e auditoria.
- `qualidade`: inconsistências, filtros e tratamento.
- `relatorios`: relatórios operacional/estatístico/imagem e exportações.
- `midias`: validação e rejeição de fotos por caso.
- `admin`: operadores, perfis, logs, backup, migração e rollback.

## Matriz de acesso por perfil
- **OPERADOR**: acesso apenas a `registro` (entrada prioritária obrigatória).
- **SUPERVISOR**: `registro`, `consulta`, `qualidade`, `relatorios`, `midias`.
- **ADMIN**: acesso completo a todos os módulos.
- **AUDITOR**: `consulta`, `qualidade` e `relatorios`, sem alteração de dados.

## Regras técnicas aplicadas
1. Menu de navegação renderizado apenas com módulos permitidos ao perfil autenticado.
2. Perfil carregado do backend em `/api/perfil-operador` com fallback operacional para `OPERADOR` em ambiente local.
3. Redirecionamento inicial por perfil:
   - OPERADOR abre em `registro`.
   - Demais perfis abrem no primeiro módulo permitido.
4. Cada módulo apresenta título, descrição curta e ações principais.
5. Tela inicial simplificada para reduzir sobrecarga cognitiva operacional.
6. Compatibilidade preservada com integração GAS e payload de planilha.

## Operação assistida
- Em `consulta`, qualquer edição deve manter confirmação de e-mail e justificativa em log.
- Em `qualidade`, operadores de auditoria devem priorizar total crítico e pendente.
- Em `midias`, aprovação/rejeição deve registrar motivo e justificativa.
