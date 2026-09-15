# Reaproveitamento das respostas da qualificação

As respostas das perguntas da qualificação são identificadas pela chave estável da pergunta (`pergunta.id`) e ficam em `respostasArvore` da vítima correspondente.

No modo central, a tela lê e grava vítimas em `/api/vitimas`. A atualização usa mesclagem por chave: respostas já preenchidas são preservadas e somente as perguntas enviadas na edição atual são atualizadas. Ao reabrir a mesma vítima, as respostas salvas aparecem automaticamente, sem reutilizar dados de outra pessoa.

O mesmo princípio vale para `complementosArvore`. O histórico da atualização é registrado em `eventos.json` como `QUALIFICACAO_VITIMA_ATUALIZADA`.
