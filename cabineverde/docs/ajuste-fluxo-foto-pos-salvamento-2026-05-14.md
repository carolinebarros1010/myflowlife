# Ajuste do fluxo de foto após salvamento do caso (2026-05-14)

## Resumo
- Criada etapa própria "7) Foto do desaparecido" antes de "8) Fechamento".
- Foto agora é apenas preparada localmente na triagem; upload definitivo ocorre somente após persistência do caso com `idCaso` definitivo.
- Fluxo mantém salvamento não bloqueante: em caso de falha do upload de foto, o caso permanece salvo e a pendência é sinalizada ao operador.
- Backend de fotos ajustado para organização em Drive por `Cabine Verde/Fotos/{ano}/{mes}/{idCaso}_{talaoPMESP}` e nomes definitivos sem `TEMP_`.
