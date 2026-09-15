# Vertical slice Nova Análise F2

## Escopo

O primeiro vertical slice registra pesquisas F2 no servidor HTTP central, sem criar automaticamente um caso completo. A pessoa é selecionada ou criada explicitamente; cada pesquisa gera uma `AnaliseF2` independente e uma entrada de `EventoHistorico`.

## Persistência central

O servidor mantém as coleções abaixo na `dataRoot` oficial, por exemplo `D:\\CabineVerde`:

- `pessoas.json`;
- `analises-f2.json`;
- `eventos.json`.

`pessoa.statusAtual` é somente uma denormalização. A verdade é reconstruída pela última `situacaoInformada` explícita das análises cronologicamente ordenadas.

## Dois fluxos de entrada

O slice mantém claramente separados os dois caminhos operacionais, com a mesma API e a mesma base central:

1. **Novo Caso via 190**: abre uma ocorrência formal, percorre a qualificação completa e permite uma ou várias vítimas, fotos, documentos, histórico e finalização/desfecho.
2. **Nova Análise F2**: registra uma ocorrência correlata preliminar, inclusive sem `idCaso`; pode receber novas análises e eventos, ser vinculada a um caso ou evoluir para a qualificação completa.

Ambos permanecem pesquisáveis e atualizáveis. Uma informação posterior deve ser registrada como novo evento histórico, sem substituir o registro anterior.

## Fluxo Nova Análise F2

Na Área de Trabalho, `+ NOVA ANÁLISE F2` permite:

1. buscar pessoa por nome, CPF, RG, telefone, solicitante ou data + talão;
2. selecionar uma correspondência existente ou criar uma nova pessoa;
3. registrar talão, natureza, contatos, características básicas, endereço, sentido tomado, histórico, situação e marcadores;
4. salvar a análise no servidor central;
5. visualizar a linha do tempo e o status calculado da pessoa;
6. iniciar uma segunda análise sem sobrescrever a primeira.

O modo central é obrigatório para esse fluxo. O SQLite local não recebe cópia operacional da pessoa, análise ou evento.

O servidor não faz migração automática. A base limpa deve ser copiada previamente para a `dataRoot`; na inicialização os arquivos existentes são preservados e validados.

## Status

`FOTO RECEBIDA`, `TRIAGEM OK`, `CAIXA POSTAL` e `SEM NOVA INFORMAÇÃO` são marcadores de andamento. Eles não alteram o status calculado. Uma análise sem situação explícita preserva o último status explícito.

O encerramento é tratado na etapa própria de **Finalização e desfecho**. O desfecho é por vítima; casos com múltiplas vítimas só podem ser considerados encerrados quando todas tiverem desfecho compatível com encerramento.
