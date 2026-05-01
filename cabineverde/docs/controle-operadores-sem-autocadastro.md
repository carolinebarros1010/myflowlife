# Controle de operadores sem auto cadastro

## Objetivo
Implementar bloqueio de acesso no Apps Script do Cabine Verde sem fluxo de auto cadastro, com validação exclusiva pela aba `OPERADORES`.

## Regras implementadas
1. **Sem auto cadastro:** nenhum endpoint cria operador automaticamente.
2. **Fonte única de autorização:** apenas a aba `OPERADORES` define quem acessa.
3. **Identificação do usuário:** validação por `Session.getActiveUser().getEmail()`.
4. **Usuário não cadastrado:** acesso bloqueado com mensagem:
   - `Usuário não autorizado. Solicite acesso ao administrador.`
5. **Usuário inativo (`ativo = FALSE`):** acesso bloqueado com a mesma mensagem.
6. **Função criada:** `validarOperadorAtual_()`.
7. **Trilha de auditoria:** tentativas negadas são registradas em `LOG_ACESSO` e, quando disponível, também em `LOG_MIGRACAO`.
8. **Evolução futura:** o bloqueio atual preserva espaço para um fluxo de solicitação de acesso sem auto aprovação.

## Formato esperado da aba OPERADORES
Cabeçalho mínimo:
- `email`
- `nome`
- `perfil`
- `ativo`
- `ultimaAtualizacao`

Somente operadores com `ativo` equivalente a `TRUE/SIM/ATIVO/1` são autorizados.
