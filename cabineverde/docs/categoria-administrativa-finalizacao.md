# Categoria administrativa na finalização

A aba `Finalização e desfecho` deriva `categoriaAdministrativa` no cliente antes do salvamento. A função pura `derivarCategoriaAdministrativa` usa somente os selects existentes e respeita a prioridade:

`MORTA` > `PRESA_CUSTODIA` > `CABINE_MURALHA` > `VTR_PM`.

Quando não há combinação segura, o valor enviado é `null`. Não são usadas observações, videomonitoramento, reconhecimento facial, contato telefônico ou exclusão de alternativas para criar categoria.
