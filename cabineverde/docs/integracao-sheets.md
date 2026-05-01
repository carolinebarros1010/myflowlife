# Integração Google Sheets (Cabine Verde + Apps Script)

## Nova arquitetura auditável (maio/2026)
A gravação foi reestruturada para separar ocorrência, triagem, eventos e indicadores:

1. **CASOS**: dados principais da ocorrência.
2. **TRIAGEM_RESPOSTAS**: 1 linha por pergunta da árvore, vinculada ao `idCaso`.
3. **EVENTOS_OCORRENCIA**: ações, decisões, reclassificações e despachos.
4. **INDICADORES_OPERACIONAIS**: indicadores booleanos derivados da árvore.

A árvore de decisão **não foi removida**. Ela segue no frontend e agora é persistida de forma estruturada em `TRIAGEM_RESPOSTAS`.

## Cabeçalhos oficiais
- `CASOS`: `idCaso,talaoPMESP,dataHoraRegistro,dataServico,turno,equipe,operadorResponsavel,municipio,talaoBopm,statusCaso,nomeCompletoDesaparecido,sexoGenero,idade,faixaEtaria,cpf,rg,nomeMae,dataNascimento,corPele,alturaAproximada,pesoAproximado,corCabelo,corOlhos,caracteristicasMarcantes,dataHoraUltimaVisualizacao,localUltimaVisualizacao,roupaUltimaVisualizacao,meioTransporte,dadosVeiculo,fotoDisponivel,linkFoto,telefoneDesaparecido,dispositivoLigado,camerasResidencia,camerasUltimoLocal,aptoCabineVerde,nomeSolicitante,vinculoSolicitante,telefoneSolicitante,vulnerabilidade,condicaoMentalCognitivaComportamental,limitacaoFisica,usoMedicacaoEssencial,usoAlcoolOutrasDrogas,historicoDesaparecimentoAnterior,conflitoPrevio,suspeitaCrime,locaisHabituais,buscasPreliminares,classificacaoRisco,prioridade,acaoSugerida,localizado,dataHoraLocalizacao,formaLocalizacao,encerrado190,numeroBo,observacoesOperacionais`
- `TRIAGEM_RESPOSTAS`: `idCaso,perguntaChave,resposta,complemento`
- `EVENTOS_OCORRENCIA`: `idCaso,timestampEvento,tipoEvento,descricaoEvento,statusCaso,prioridade,classificacaoRisco`
- `INDICADORES_OPERACIONAIS`: `idCaso,criancaSemSupervisao,criancaVeiculoSuspeito,preadolescenteAliciamentoVirtual,adolescenteSofrimentoPsiquico,adultoSuspeitaCrime,idosoDesorientado`

## Regra de observação operacional curta
`observacoesOperacionais` recebe somente texto livre resumido do operador:
- normaliza espaços;
- fallback: `Sem observação adicional.`;
- limite de 220 caracteres com reticências.

## Mapeamento dos campos atuais
- Campos de características físicas persistidos ponta a ponta em `CASOS`: `corPele`, `alturaAproximada`, `pesoAproximado`, `corCabelo`, `corOlhos`, `caracteristicasMarcantes`.
- Campos-base anteriores de `Desaparecidos` foram mantidos em `CASOS`.
- `talaoPMESP` é obrigatório no início da triagem e persistido em coluna própria da aba `CASOS`.
- Cada chave da árvore (`subfluxoPerguntas`) gera registro em `TRIAGEM_RESPOSTAS`.
- Criticidade/risco/prioridade e decisões iniciais geram evento em `EVENTOS_OCORRENCIA`.
- Indicadores calculados (`indicadoresOperacionais`) geram linha em `INDICADORES_OPERACIONAIS`.



## Padronização de campos físicos (maio/2026)

- Frontend: `corPele`, `corCabelo` e `corOlhos` usam lista fechada (`select`) com valores canônicos em uppercase.
- Frontend: `alturaAproximada` (cm) e `pesoAproximado` (kg) aceitam apenas número inteiro com limites (`30-250` e `1-400`).
- Backend web (TypeScript): `normalizarCamposFisicos` aplica uppercase, remoção de espaços extras, validação de lista e fallback `NAO INFORMADO` para inválidos.
- Backend GAS: `normalizarCamposFisicos_(dados)` aplica as mesmas regras antes de persistir a aba `CASOS`.
- Relatório estatístico: utiliza dados normalizados para evitar fragmentação analítica por variações textuais.

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


## Fluxo de fotos da pessoa desaparecida

- A imagem em si é armazenada no Google Drive (`Cabine Verde/Fotos/{idCaso}_{talaoPMESP}`), nunca em célula da planilha.
- Os metadados da imagem são gravados na aba `FOTOS_DESAPARECIDOS`.
- O caso é atualizado automaticamente com: `fotoDisponivel`, `quantidadeFotos`, `fotoPrincipalLink`, `statusFotos`.
- Todo upload gera evento `FOTO_ANEXADA` em `EVENTOS_OCORRENCIA`.
- Regras de uso de imagem: upload exige `autorizacaoUsoImagem`; quando ausente, `restricaoDivulgacao` é marcada.

- Acesso a imagem deve ocorrer via função intermediária `visualizarFotoDesaparecido_` (sem exposição de link direto).
- Eventos `FOTO_VISUALIZADA` e logs em `LOG_ACESSO_FOTOS` reforçam rastreabilidade jurídica.


## Fechamento operacional Cabine Verde (eventos críticos)

- Criação de caso registra `CASO_CRIADO` em `EVENTOS_OCORRENCIA` com dados operacionais (`idCaso`, `talaoPMESP`, `operador`, `dataHora`, `statusInicial`).
- A decisão da triagem pode ser registrada via `registrarDecisaoOperacional_(idCaso, operador, classificacao, prioridade, justificativa)`, gerando `DECISAO_OPERACIONAL`.
- Auditoria de acesso registra `OPERADOR_LOGADO` e `OPERADOR_BLOQUEADO` na `LOG_ACESSO` com `email`, `perfil`, `resultado` e `motivoBloqueio`.
- Validação de foto usa `validarFotoDesaparecido_(idFoto, operador, status)` com perfis `SUPERVISOR/ADMIN` e gera `FOTO_VALIDADA`/`FOTO_REJEITADA`.
- Controle de uso excessivo de foto via `verificarUsoExcessivoFoto_(idFoto, operador)`: se exceder limite configurado (mais de 5 acessos em 10 minutos), registra `USO_EXCESSIVO_FOTO` e retorna sugestão de bloqueio temporário.

## Edição controlada de casos (maio/2026)

- Busca operacional: `buscarCaso_(filtro)` retorna casos por `idCaso`, `talaoPMESP` ou `nomeCompletoDesaparecido`.
- Edição com governança: `editarCasoControlado_(idCaso, operador, alteracoes, justificativa)`.
- Regras aplicadas:
  - bloqueio sem justificativa;
  - bloqueio de perfil sem permissão (somente `SUPERVISOR/ADMIN`);
  - gravação detalhada de `valorAnterior` e `valorNovo`;
  - evento `CASO_EDITADO` na aba `EVENTOS_OCORRENCIA`;
  - histórico completo na aba `HISTORICO_EDICOES`.

## Relatório operacional com dados de imagem

- Geração por data: `gerarRelatorioOperacionalComImagem_(dataReferencia)`.
- Fonte única: aba `FOTOS_DESAPARECIDOS`.
- Campos incluídos no relatório:
  - `qtdFotosRecebidas`
  - `qtdFotosValidadas`
  - `qtdFotosUtilizadas` (validadas e autorizadas para uso)
  - `qtdFotosRejeitadas`
- Observação operacional automática:
  - `Ocorrências com uso de imagem: [idCasos]`
- Cada emissão registra evento `RELATORIO_OPERACIONAL_IMAGEM` para trilha de auditoria.

## Auditoria de qualidade dos dados (maio/2026)

- Nova rotina GAS: `auditarQualidadeDados_()`.
- Execução manual via menu: `Cabine Verde → Auditar qualidade dos dados`.
- A rotina percorre a aba `CASOS`, não altera dados automaticamente e apenas aponta inconsistências.
- A rotina registra evidências na aba `QUALIDADE_DADOS` com as colunas:
  - `dataHoraAuditoria`
  - `idCaso`
  - `talaoPMESP`
  - `campo`
  - `problema`
  - `severidade` (`CRITICA`, `ALTA`, `MEDIA`, `BAIXA`)
  - `acaoRecomendada`
  - `statusTratamento`
- Itens auditados automaticamente:
  1. ausência de `talaoPMESP`;
  2. ausência de `nomeCompletoDesaparecido`;
  3. ausência simultânea de `idade` e `faixaEtaria`;
  4. ausência de `dataHoraUltimaVisualizacao`;
  5. ausência de `localUltimaVisualizacao`;
  6. campos físicos com valor `NAO INFORMADO`;
  7. `fotoDisponivel = FALSE`;
  8. `classificacaoRisco` vazia;
  9. `prioridade` vazia;
  10. falta de decisão operacional registrada.
- Ao final, a rotina grava evento `AUDITORIA_QUALIDADE_DADOS` na aba `EVENTOS_OCORRENCIA` com resumo da execução.
