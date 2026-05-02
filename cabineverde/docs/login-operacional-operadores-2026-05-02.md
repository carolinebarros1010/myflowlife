# Login Operacional com validação em OPERADORES

## Estrutura obrigatória da aba `OPERADORES`
Cabeçalhos obrigatórios (ordem livre):
- `EMAIL`
- `NOME`
- `PERFIL`
- `ATIVO`

Regras:
- `EMAIL`: trim + lowercase.
- `ATIVO`: apenas `SIM` libera acesso; `NÃO` bloqueia.
- Perfis aceitos inicialmente: `ADMIN`, `OPERADOR`, `AUDITOR`.

## Fluxo da interface
1. Tela 0 — Login Operacional.
2. Tela 1 — Entrada Operacional.
3. Tela 2 — Triagem.
4. Tela 3 — Decisão/Resumo.

Sem operador validado, telas operacionais ficam bloqueadas.

## Persistência local
Após validação positiva, o front salva:
- `cabineVerdeOperadorEmail`
- `cabineVerdeOperadorNome`
- `cabineVerdeOperadorPerfil`
- `cabineVerdeOperadorValidadoEm`

Botão **Trocar operador** limpa as chaves e retorna para Login Operacional.
