# Ajuste de fluxo visual de foto no Cabine Verde (2026-05-11)

## Resumo
- O campo de decisão de foto (`fotoDisponivel`) foi mantido no início do fluxo apenas como pergunta **SIM/NÃO**.
- O bloco de upload (input de arquivo, preview, status e botão de envio) permanece exclusivamente no passo final **Fechamento**.
- O botão **Adicionar foto agora** só é exibido quando `fotoDisponivel = Sim`.
- O upload continua executado apenas no clique do botão e com bloqueio para `idCaso` vazio ou temporário (`CV-`).

## Impacto operacional
- Passo inicial sem upload, apenas confirmação de disponibilidade de foto.
- Fechamento exibe upload condicional, evitando envio prematuro.
- Fluxo mantém triagem rápida e reduz risco de tentativa de anexação sem `idCaso` definitivo.
