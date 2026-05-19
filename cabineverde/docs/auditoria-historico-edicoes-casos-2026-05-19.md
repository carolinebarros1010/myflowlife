# Ajuste incremental: histórico de edições na auditoria de casos (2026-05-19)

## Contexto
O fluxo de auditoria já atualizava diretamente a aba `CASOS` sem depender da aba diária do Talão 190.

## Melhoria aplicada
Foi adicionada trilha de auditoria por campo na aba `HISTORICO_EDICOES` durante `salvarAuditoriaCaso_`:

- Garante a existência da aba `HISTORICO_EDICOES`.
- Cria cabeçalho padrão quando a aba não existe.
- Se a aba existe, adiciona apenas colunas ausentes ao final, sem reordenar ou apagar dados.
- Compara `valorAnterior` x `valorNovo` por campo operacional da linha já existente em `CASOS`.
- Ignora campos técnicos e valores vazios/null/undefined.
- Registra uma linha no histórico para cada campo realmente alterado.
- Mantém atualização dos campos finais de última alteração na `CASOS`.

## Registro histórico
Cada alteração operacional grava:

- `idEdicao` no formato `EDT-YYYYMMDD-HHMMSS-XXXX`.
- `idCaso`, `talaoPMESP`, `campoAlterado`, `valorAnterior`, `valorNovo`.
- `operadorNome`, `operadorEmail`, `operadorPerfil`.
- `dataHoraEdicao`, `justificativa`, `emailConfirmado`.

## Front-end de auditoria
A tela `auditoria.html` passou a enviar `justificativaAuditoria` no payload de `salvarAuditoriaCaso` e ganhou campo opcional/discreto para justificativa.
