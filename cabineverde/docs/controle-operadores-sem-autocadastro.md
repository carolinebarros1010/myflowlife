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

## Matriz de perfis e permissões (rigidez por ação)

Perfis válidos (normalizados em caixa alta): `OPERADOR`, `SUPERVISOR`, `ADMIN`, `AUDITOR`.

| Ação | OPERADOR | SUPERVISOR | ADMIN | AUDITOR |
|---|---|---|---|---|
| Registrar caso | ✅ | ✅ | ✅ | ❌ |
| Anexar foto | ✅ | ✅ | ✅ | ❌ |
| Visualizar foto INTERNO | ✅ | ✅ | ✅ | ❌ |
| Validar/Rejeitar foto | ❌ | ✅ | ✅ | ❌ |
| Visualizar foto RESTRITO/SIGILOSO | ❌ | ✅ | ✅ | ❌ |
| Ajustar estrutura/migração/operadores/configurações | ❌ | ❌ | ✅ | ❌ |
| Consultar logs | ❌ | ❌ | ✅ | ✅ |

Toda tentativa bloqueada deve ser registrada em `LOG_ACESSO`.

## Mocks de validação de perfil

Cenários de referência para auditoria:

1. `perfil="operador"` -> normalizado para `OPERADOR` -> permitido para `REGISTRAR_CASO`.
2. `perfil="supervisor"` + ação `VISUALIZAR_FOTO_RESTRITO_SIGILOSO` -> permitido.
3. `perfil="auditor"` + ação `REGISTRAR_CASO` -> bloqueado e logado.
4. `perfil="gestor"` (fora da lista) -> bloqueado por perfil inválido e logado.
5. Operador inativo ou não cadastrado -> bloqueio em `validarOperadorAtual_` e log obrigatório.
