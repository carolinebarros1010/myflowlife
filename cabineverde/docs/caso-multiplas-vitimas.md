# Caso com múltiplas vítimas

Um mesmo caso e talão podem possuir duas ou mais vítimas. A identificação inicial pergunta a quantidade informada e, após as buscas preliminares, o operador pode usar **Nova vítima no mesmo caso**.

Cada vítima recebe uma ordem própria na tabela `vitimas_caso`, mantendo vínculo com `id_caso`. A inclusão gera registro de auditoria com operador e data/hora. O caso continua sendo contado uma vez no indicador de casos; vítimas e localizações devem ser contabilizadas individualmente.
