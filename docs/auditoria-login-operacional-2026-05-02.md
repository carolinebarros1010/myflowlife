# Auditoria e endurecimento do Login Operacional (2026-05-02)

## Alterações aplicadas
- Revalidação obrigatória do operador no backend (aba `OPERADORES`) imediatamente antes de qualquer gravação.
- Expiração de sessão no frontend com limite máximo de 12 horas, com limpeza automática do `localStorage` e retorno ao login.
- Bloqueio real de interface: quando não validado, somente a tela de Login Operacional é renderizada.
- Log operacional ampliado com: `email`, `ação executada`, `talão PMESP`, `data/hora` e `resultado`.

## Cenários validados
- Operador válido: autorizado e com gravação permitida.
- Operador inválido: login bloqueado.
- Operador inativo: login bloqueado.
- Sessão expirada: limpeza de sessão e retorno ao login.
- Tentativa de envio sem operador: bloqueada no frontend e no backend.
