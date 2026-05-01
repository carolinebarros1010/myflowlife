# Integração Google Sheets (Cabine Verde + Apps Script)

## Nova arquitetura auditável (maio/2026)
A gravação foi reestruturada para separar ocorrência, triagem, eventos e indicadores:

1. **CASOS**: dados principais da ocorrência.
2. **TRIAGEM_RESPOSTAS**: 1 linha por pergunta da árvore, vinculada ao `idCaso`.
3. **EVENTOS_OCORRENCIA**: ações, decisões, reclassificações e despachos.
4. **INDICADORES_OPERACIONAIS**: indicadores booleanos derivados da árvore.

A árvore de decisão **não foi removida**. Ela segue no frontend e agora é persistida de forma estruturada em `TRIAGEM_RESPOSTAS`.

## Cabeçalhos oficiais
- `CASOS`: `idCaso,talaoPMESP,dataHoraRegistro,dataServico,turno,equipe,operadorResponsavel,municipio,talaoBopm,statusCaso,nomeCompletoDesaparecido,sexoGenero,idade,faixaEtaria,cpf,rg,nomeMae,dataNascimento,dataHoraUltimaVisualizacao,localUltimaVisualizacao,roupaUltimaVisualizacao,meioTransporte,dadosVeiculo,fotoDisponivel,linkFoto,telefoneDesaparecido,dispositivoLigado,camerasResidencia,camerasUltimoLocal,aptoCabineVerde,nomeSolicitante,vinculoSolicitante,telefoneSolicitante,vulnerabilidade,condicaoMentalCognitivaComportamental,limitacaoFisica,usoMedicacaoEssencial,usoAlcoolOutrasDrogas,historicoDesaparecimentoAnterior,conflitoPrevio,suspeitaCrime,locaisHabituais,buscasPreliminares,classificacaoRisco,prioridade,acaoSugerida,localizado,dataHoraLocalizacao,formaLocalizacao,encerrado190,numeroBo,observacoesOperacionais`
- `TRIAGEM_RESPOSTAS`: `idCaso,perguntaChave,resposta,complemento`
- `EVENTOS_OCORRENCIA`: `idCaso,timestampEvento,tipoEvento,descricaoEvento,statusCaso,prioridade,classificacaoRisco`
- `INDICADORES_OPERACIONAIS`: `idCaso,criancaSemSupervisao,criancaVeiculoSuspeito,preadolescenteAliciamentoVirtual,adolescenteSofrimentoPsiquico,adultoSuspeitaCrime,idosoDesorientado`

## Regra de observação operacional curta
`observacoesOperacionais` recebe somente texto livre resumido do operador:
- normaliza espaços;
- fallback: `Sem observação adicional.`;
- limite de 220 caracteres com reticências.

## Mapeamento dos campos atuais
- Campos-base anteriores de `Desaparecidos` foram mantidos em `CASOS`.
- `talaoPMESP` é obrigatório no início da triagem e persistido em coluna própria da aba `CASOS`.
- Cada chave da árvore (`subfluxoPerguntas`) gera registro em `TRIAGEM_RESPOSTAS`.
- Criticidade/risco/prioridade e decisões iniciais geram evento em `EVENTOS_OCORRENCIA`.
- Indicadores calculados (`indicadoresOperacionais`) geram linha em `INDICADORES_OPERACIONAIS`.


## Regras de identidade do caso
- `idCaso` é a **chave técnica interna** para escrita e atualização no backend.
- `talaoPMESP` é a **referência oficial institucional PMESP**.
- Se `idCaso` já existir com `talaoPMESP` vazio, o registro pode receber `talaoPMESP` novo normalmente.
- Se `idCaso` já existir com `talaoPMESP` preenchido e o valor recebido divergir do salvo, o GAS bloqueia a atualização, registra `CONFLITO_TALAO_PMESP` em `EVENTOS_OCORRENCIA` e retorna erro claro ao frontend.
- Se `idCaso` não existir, mas o `talaoPMESP` já existir em outro `idCaso`, o GAS bloqueia a atualização automática, registra `POSSIVEL_DUPLICIDADE_TALAO_PMESP` em `EVENTOS_OCORRENCIA` e retorna alerta de possível duplicidade operacional.
- Merge automático **não é executado**; permanece apenas como possibilidade futura de merge assistido.

## Regra de observações operacionais
- `observacoesOperacionais` deve conter exclusivamente texto livre resumido do operador.
- Não incluir árvore de decisão, indicadores operacionais ou `talaoPMESP` neste campo.
- A árvore continua persistida em `TRIAGEM_RESPOSTAS`.
- Os indicadores continuam persistidos em `INDICADORES_OPERACIONAIS`.
