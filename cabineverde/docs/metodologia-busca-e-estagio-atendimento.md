# Metodologia de busca e estágio de atendimento

## Objetivo

A busca operacional deve localizar a pessoa e mostrar em que ponto do atendimento ela se encontra. Nome, talão, CPF, RG e telefone identificam o registro; `status`, `condição` e `estágio` respondem perguntas operacionais diferentes.

Esta busca recebe registros de duas entradas: **Novo Caso via 190**, que já possui episódio formal e segue para qualificação, e **Análise F2**, que começa como informação preliminar e pode existir sem caso, qualificação ou contato. A metodologia completa está em [metodologia-operacional-cabine-verde.md](metodologia-operacional-cabine-verde.md).

## Três dimensões

### Status

O status atual é reconstruído cronologicamente a partir das `AnalisesF2` que tenham `situacaoInformada` explícita.

Marcadores como `FOTO RECEBIDA`, `SEM NOVA INFORMAÇÃO`, `CAIXA POSTAL` e `CONTATO REALIZADO` não alteram o status.

Quando um registro histórico antigo ainda não possui `situacaoInformada`, o sistema pode exibir o `pessoa.statusPessoa` como fallback de compatibilidade. Nesse caso a resposta informa `statusOrigem = CACHE_LEGADO_SEM_HISTORICO_EXPLICITO`. Esse cache não substitui o histórico.

### Condição

Indica a condição operacional atual:

- `PENDENTE_QUALIFICACAO`: existe F2, mas ainda não há qualificação nem contato telefônico explícito;
- `EM_ACOMPANHAMENTO`: houve contato telefônico registrado, mas não há qualificação concluída;
- `EM_QUALIFICACAO`: existe registro de qualificação ainda não concluído;
- `QUALIFICADA`: existe qualificação concluída;
- `ENCERRADA`: o atendimento está marcado como encerrado;
- `SEM_ATENDIMENTO_F2`: não há registro F2 associado.

### Estágio

Indica o que já aconteceu no fluxo:

- `APENAS_ANALISE_F2`: há somente análise F2, sem qualificação e sem evento explícito de contato telefônico;
- `ANALISE_F2_VINCULADA`: há F2 vinculada a caso, mas ainda sem qualificação ou contato explícito;
- `CONTATO_REGISTRADO`: existe evento com tipo de contato, telefone, ligação, retorno ou solicitante;
- `QUALIFICACAO_INICIADA`: existe qualificação não concluída;
- `QUALIFICACAO_COMPLETA`: existe qualificação concluída;
- `SEM_REGISTRO_F2`: não há análise F2 para a pessoa.

O preenchimento de nome do solicitante ou telefone dentro da própria linha F2 não é considerado, sozinho, um novo contato telefônico. Para isso deve existir evento explícito de contato. Essa separação evita classificar uma pessoa como acompanhada apenas porque a informação inicial da F2 contém telefone.

## Filtros da API

```http
GET /api/pessoas/busca?termo=joao&status=DESAPARECIDO&condicao=PENDENTE_QUALIFICACAO&estagio=APENAS_ANALISE_F2&contato=NAO
```

Todos os filtros são opcionais e podem ser combinados. Sem termo, data ou talão, a busca pode retornar a base filtrada por status, condição ou estágio.

Cada resultado inclui:

- `statusAtual`;
- `statusOrigem`;
- `statusAtendimentoCalculado`;
- `statusAtendimentoInformado`;
- `statusAtendimentoCoerente`;
- `condicao`;
- `estagioAtendimento`;
- `temAnaliseF2`;
- `temCaso`;
- `temQualificacao`;
- `qualificacaoCompleta`;
- `temContatoTelefonico`;
- `quantidadeAnalisesF2`.

## Regra operacional principal

Uma pessoa que aparece apenas em `analises-f2.json`, sem qualificação e sem evento explícito de contato, deve ser encontrada pelo estágio `APENAS_ANALISE_F2` e pela condição `PENDENTE_QUALIFICACAO`. Isso não significa automaticamente que ela esteja localizada, desaparecida ou encerrada; o status continua dependendo de situação explícita no histórico.

O status do atendimento também é derivado: uma F2 sem qualificação representa `EM_PESQUISA`; qualificação iniciada representa `EM_QUALIFICACAO`; contato explícito representa `EM_ACOMPANHAMENTO`; e ausência de registros representa `TRIAGEM_NAO_INICIADA`. O campo legado `statusAtendimentoInformado` é preservado para auditoria. Quando ele divergir do cálculo, `statusAtendimentoCoerente` será `false` e a correção deve ser feita como atualização auditada, nunca por substituição silenciosa.
