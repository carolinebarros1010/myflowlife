import type { AbaPayload, CasoCompleto, SheetCellValue, SheetPayload } from '../types/case.js';

const COLUNAS_CASOS = [
  'idCaso','talaoPMESP','dataHoraRegistro','dataServico','turno','equipe','operadorResponsavel','talaoBopm','operadorCriador','operadorUltimaAcao','municipio','statusCaso','nomeCompletoDesaparecido','sexoGenero','idade','faixaEtaria','cpf','rg','nomeMae','dataNascimento','corPele','alturaAproximada','pesoAproximado','corCabelo','corOlhos','caracteristicasMarcantes','dataHoraUltimaVisualizacao','localUltimaVisualizacao','roupaUltimaVisualizacao','meioTransporte','dadosVeiculo','fotoDisponivel','linkFoto','urlFoto','telefoneDesaparecido','dispositivoLigado','camerasResidencia','camerasUltimoLocal','aptoCabineVerde','nomeSolicitante','vinculoSolicitante','telefoneSolicitante','vulnerabilidade','condicaoMentalCognitivaComportamental','limitacaoFisica','usoMedicacaoEssencial','usoAlcoolOutrasDrogas','historicoDesaparecimentoAnterior','conflitoPrevio','suspeitaCrime','locaisHabituais','buscasPreliminares','classificacaoRisco','prioridade','acaoSugerida','localizado','dataHoraLocalizacao','formaLocalizacao','encerrado190','numeroBo','observacoesOperacionais',
  'arv_p1_emergencia_resp','arv_p1_emergencia_comp','arv_p1_municipio_resp','arv_p1_municipio_comp','arv_p1_nome_resp','arv_p1_nome_comp','arv_p1_sexo_resp','arv_p1_sexo_comp','arv_p1_idade_resp','arv_p1_idade_comp','arv_p1_dados_identificacao_resp','arv_p1_dados_identificacao_comp','arv_p1_foto_recente_resp','arv_p1_foto_recente_comp','arv_p1_dispositivo_vinculado_resp','arv_p1_dispositivo_vinculado_comp','arv_p2_data_hora_ultima_resp','arv_p2_data_hora_ultima_comp','arv_p2_local_ultima_resp','arv_p2_local_ultima_comp','arv_p2_roupa_resp','arv_p2_roupa_comp','arv_p2_meio_transporte_resp','arv_p2_meio_transporte_comp','arv_p2_dados_veiculo_resp','arv_p2_dados_veiculo_comp','arv_p3_vinculo_resp','arv_p3_vinculo_comp','arv_p3_acompanhada_resp','arv_p3_acompanhada_comp','arv_p3_estuda_trabalha_atividade_resp','arv_p3_estuda_trabalha_atividade_comp','arv_p3_rotina_fixa_resp','arv_p3_rotina_fixa_comp','arv_p3_locais_frequenta_resp','arv_p3_locais_frequenta_comp','arv_p3_vinculo_emocional_resp','arv_p3_vinculo_emocional_comp','arv_p4_condicao_saude_mental_resp','arv_p4_condicao_saude_mental_comp','arv_p4_limitacao_fisica_resp','arv_p4_limitacao_fisica_comp','arv_p4_depende_cuidador_resp','arv_p4_depende_cuidador_comp','arv_p4_medicacao_essencial_resp','arv_p4_medicacao_essencial_comp','arv_p4_uso_alcool_drogas_resp','arv_p4_uso_alcool_drogas_comp','arv_p4_desaparecimento_anterior_resp','arv_p4_desaparecimento_anterior_comp','arv_p4_intencao_fugir_resp','arv_p4_intencao_fugir_comp','arv_p4_conflito_previo_resp','arv_p4_conflito_previo_comp','arv_p4_suspeita_crime_resp','arv_p4_suspeita_crime_comp','arv_p5_procurou_locais_habituais_resp','arv_p5_procurou_locais_habituais_comp','arv_p5_conferiu_comodos_resp','arv_p5_conferiu_comodos_comp','arv_p5_tentou_contato_resp','arv_p5_tentou_contato_comp','arv_p5_celular_ligado_resp','arv_p5_celular_ligado_comp','arv_p5_cameras_residencia_resp','arv_p5_cameras_residencia_comp','arv_p5_cameras_ultimo_local_resp','arv_p5_cameras_ultimo_local_comp','arv_p5_contatos_busca_resp','arv_p5_contatos_busca_comp','arv_p5_bo_delegacia_resp','arv_p5_bo_delegacia_comp','arv_crianca_supervisao_resp','arv_crianca_supervisao_comp','arv_crianca_informa_dados_resp','arv_crianca_informa_dados_comp','arv_crianca_neurodesenvolvimento_resp','arv_crianca_neurodesenvolvimento_comp','arv_crianca_disputa_familiar_resp','arv_crianca_disputa_familiar_comp','arv_crianca_local_desaparecimento_resp','arv_crianca_local_desaparecimento_comp','arv_crianca_adulto_veiculo_suspeito_resp','arv_crianca_adulto_veiculo_suspeito_comp','arv_preadolescente_contexto_saida_resp','arv_preadolescente_contexto_saida_comp','arv_preadolescente_historico_sair_sozinho_resp','arv_preadolescente_historico_sair_sozinho_comp','arv_preadolescente_aliciamento_virtual_resp','arv_preadolescente_aliciamento_virtual_comp','arv_preadolescente_conflito_recente_resp','arv_preadolescente_conflito_recente_comp','arv_preadolescente_disputa_responsaveis_resp','arv_preadolescente_disputa_responsaveis_comp','arv_adolescente_saiu_sem_autorizacao_resp','arv_adolescente_saiu_sem_autorizacao_comp','arv_adolescente_discussao_previa_resp','arv_adolescente_discussao_previa_comp','arv_adolescente_fuga_voluntaria_resp','arv_adolescente_fuga_voluntaria_comp','arv_adolescente_terceiros_redes_ameaca_resp','arv_adolescente_terceiros_redes_ameaca_comp','arv_adolescente_sofrimento_psiquico_resp','arv_adolescente_sofrimento_psiquico_comp','arv_adolescente_litigio_familiar_resp','arv_adolescente_litigio_familiar_comp','arv_adulto_mudanca_comportamento_resp','arv_adulto_mudanca_comportamento_comp','arv_adulto_crise_emocional_medicacao_resp','arv_adulto_crise_emocional_medicacao_comp','arv_adulto_historico_fuga_rompimento_resp','arv_adulto_historico_fuga_rompimento_comp','arv_adulto_violencia_divida_ameaca_resp','arv_adulto_violencia_divida_ameaca_comp','arv_adulto_trajeto_rotina_resp','arv_adulto_trajeto_rotina_comp','arv_adulto_dependencia_tratamento_resp','arv_adulto_dependencia_tratamento_comp','arv_idoso_alzheimer_demencia_resp','arv_idoso_alzheimer_demencia_comp','arv_idoso_limitacao_locomocao_comunicacao_resp','arv_idoso_limitacao_locomocao_comunicacao_comp','arv_idoso_medicacao_essencial_resp','arv_idoso_medicacao_essencial_comp','arv_idoso_costuma_sair_sozinho_resp','arv_idoso_costuma_sair_sozinho_comp','arv_idoso_desapareceu_rotina_resp','arv_idoso_desapareceu_rotina_comp','arv_idoso_historico_desorientacao_resp','arv_idoso_historico_desorientacao_comp'
] as const;

const COLUNAS_TRIAGEM_RESPOSTAS = ['idCaso', 'perguntaChave', 'resposta', 'complemento'];
const COLUNAS_EVENTOS_OCORRENCIA = ['idCaso', 'timestampEvento', 'tipoEvento', 'descricaoEvento', 'statusCaso', 'prioridade', 'classificacaoRisco'];
const COLUNAS_INDICADORES = ['idCaso', 'criancaSemSupervisao', 'criancaVeiculoSuspeito', 'preadolescenteAliciamentoVirtual', 'adolescenteSofrimentoPsiquico', 'adultoSuspeitaCrime', 'idosoDesorientado'];

const hojeIso = (dataHoraRegistro: string): string => {
  const data = new Date(dataHoraRegistro || Date.now());
  return Number.isNaN(data.getTime()) ? new Date().toISOString().slice(0, 10) : data.toISOString().slice(0, 10);
};

const normalizarObservacaoCurta = (texto: string): string => {
  const limpo = String(texto || '').replace(/\s+/g, ' ').trim();
  if (!limpo) return 'Sem observação adicional.';
  return limpo.length > 220 ? `${limpo.slice(0, 217)}...` : limpo;
};

const normalizarResposta = (valor: unknown): string => {
  if (typeof valor === 'boolean') return valor ? 'Sim' : 'Não';
  const texto = String(valor ?? '').trim();
  return texto || 'Não informado';
};

const normalizarTalaoPayload = (dados: Record<string, SheetCellValue>): Record<string, SheetCellValue> => {
  const talao = String(dados.talaoPMESP || dados.talaoBopm || dados.talao || dados.numeroTalao || '').trim();
  return { ...dados, talaoPMESP: talao, talaoBopm: talao };
};

const montarTriagemRespostas = (caso: CasoCompleto): SheetCellValue[][] => {
  const subfluxo = caso.subfluxoPerguntas || {};
  const chaves = Object.keys(subfluxo).sort();
  return chaves.map((perguntaChave) => {
    const valor = subfluxo[perguntaChave];
    const resposta = perguntaChave.endsWith('_comp') ? 'Não informado' : normalizarResposta(valor);
    const complemento = perguntaChave.endsWith('_comp') ? String(valor ?? '').trim() : '';
    return [caso.id, perguntaChave, resposta, complemento];
  });
};

const montarAbas = (caso: CasoCompleto, dadosCaso: Record<string, SheetCellValue>): AbaPayload[] => {
  const triagemRespostas = montarTriagemRespostas(caso);
  const eventoInicial: SheetCellValue[] = [
    caso.id,
    caso.dataHoraRegistro,
    'triagem_inicial',
    `Caso ${caso.id} registrado e classificado como ${caso.classificacaoRisco}.`,
    caso.statusCaso,
    caso.prioridade,
    caso.classificacaoRisco
  ];

  const indicadores = caso.indicadoresOperacionais;
  const linhaIndicadores: SheetCellValue[] = [
    caso.id,
    indicadores.criancaSemSupervisao,
    indicadores.criancaVeiculoSuspeito,
    indicadores.preadolescenteAliciamentoVirtual,
    indicadores.adolescenteSofrimentoPsiquico,
    indicadores.adultoSuspeitaCrime,
    indicadores.idosoDesorientado
  ];

  const abas: AbaPayload[] = [
    { aba: 'CASOS', colunas: [...COLUNAS_CASOS], valores: COLUNAS_CASOS.map((c) => dadosCaso[c]) },
    ...triagemRespostas.map((valores) => ({ aba: 'TRIAGEM_RESPOSTAS', colunas: [...COLUNAS_TRIAGEM_RESPOSTAS], valores })),
    { aba: 'EVENTOS_OCORRENCIA', colunas: [...COLUNAS_EVENTOS_OCORRENCIA], valores: eventoInicial },
    { aba: 'INDICADORES_OPERACIONAIS', colunas: [...COLUNAS_INDICADORES], valores: linhaIndicadores }
  ];

  return abas;
};

export const gerarPayloadSheets = (caso: CasoCompleto): SheetPayload => {
  const subfluxoPerguntas = caso.subfluxoPerguntas || {};
  const dadosSemNormalizacao: Record<string, SheetCellValue> = {
    idCaso: caso.id, talaoPMESP: caso.talaoPMESP, dataHoraRegistro: caso.dataHoraRegistro, dataServico: hojeIso(caso.dataHoraRegistro), turno: '', equipe: 'Cabine Verde', operadorResponsavel: caso.operadorUltimaAcao || caso.operadorCriador || '', operadorCriador: caso.operadorCriador || '', operadorUltimaAcao: caso.operadorUltimaAcao || caso.operadorCriador || '', municipio: caso.municipio, talaoBopm: caso.talaoBopm, statusCaso: caso.statusCaso, nomeCompletoDesaparecido: caso.nomeCompletoDesaparecido, sexoGenero: caso.sexoGenero, idade: caso.idade, faixaEtaria: caso.faixaEtaria, cpf: caso.cpf, rg: caso.rg, nomeMae: caso.nomeMae, dataNascimento: caso.dataNascimento, corPele: caso.corPele || '', alturaAproximada: caso.alturaAproximada || 0, pesoAproximado: caso.pesoAproximado || 0, corCabelo: caso.corCabelo || '', corOlhos: caso.corOlhos || '', caracteristicasMarcantes: caso.caracteristicasMarcantes || '', dataHoraUltimaVisualizacao: caso.dataHoraUltimaVisualizacao, localUltimaVisualizacao: caso.localUltimaVisualizacao, roupaUltimaVisualizacao: caso.roupaUltimaVisualizacao, meioTransporte: caso.meioTransporte, dadosVeiculo: caso.dadosVeiculo, fotoDisponivel: caso.fotoDisponivel, linkFoto: caso.linkFoto || caso.urlFoto || '', urlFoto: caso.urlFoto || caso.linkFoto || '', telefoneDesaparecido: caso.telefoneDesaparecido, dispositivoLigado: caso.dispositivoLigado, camerasResidencia: caso.camerasResidencia, camerasUltimoLocal: caso.camerasUltimoLocal, aptoCabineVerde: caso.aptoCabineVerde, nomeSolicitante: caso.nomeSolicitante, vinculoSolicitante: caso.vinculoSolicitante, telefoneSolicitante: caso.telefoneSolicitante, vulnerabilidade: caso.vulnerabilidade, condicaoMentalCognitivaComportamental: caso.condicaoMentalCognitivaComportamental, limitacaoFisica: caso.limitacaoFisica, usoMedicacaoEssencial: caso.usoMedicacaoEssencial, usoAlcoolOutrasDrogas: caso.usoAlcoolOutrasDrogas, historicoDesaparecimentoAnterior: caso.historicoDesaparecimentoAnterior, conflitoPrevio: caso.conflitoPrevio, suspeitaCrime: caso.suspeitaCrime, locaisHabituais: caso.locaisHabituais, buscasPreliminares: caso.buscasPreliminares, classificacaoRisco: caso.classificacaoRisco, prioridade: caso.prioridade, acaoSugerida: caso.acaoSugerida, localizado: caso.statusCaso === 'Localizado' || caso.statusCaso === 'Encerrado', dataHoraLocalizacao: '', formaLocalizacao: '', encerrado190: caso.statusCaso === 'Encerrado', numeroBo: '', observacoesOperacionais: normalizarObservacaoCurta(caso.observacoesOperacionais)
  };

  COLUNAS_CASOS.filter((coluna) => coluna.indexOf('arv_') === 0).forEach((coluna) => {
    dadosSemNormalizacao[coluna] = coluna.endsWith('_resp') ? normalizarResposta(subfluxoPerguntas[coluna]) : String(subfluxoPerguntas[coluna] ?? '').trim();
  });
  const dadosBase = normalizarTalaoPayload(dadosSemNormalizacao);

  return {
    aba: 'CASOS',
    colunas: [...COLUNAS_CASOS],
    dados: dadosBase,
    valores: COLUNAS_CASOS.map((coluna) => dadosBase[coluna]),
    abas: montarAbas(caso, dadosBase)
  };
};
