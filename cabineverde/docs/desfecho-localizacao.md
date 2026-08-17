# Desfecho de localização

A auditoria permite registrar o desfecho do caso sem apagar os dados legados:

- resultado: não localizado, localizado vivo, localizado morto ou localizado preso;
- recurso: viatura, familiares, Cabine Verde, Polícia Civil ou outros;
- atuação exclusiva da Cabine Verde: sim, não ou não informado;
- data/hora e observações da localização;
- justificativa obrigatória, com valores anterior e novo preservados em `auditoria_local`.

O Dashboard considera como pessoa localizada somente um resultado positivo, status de localização/encerramento ou data de localização válida.
