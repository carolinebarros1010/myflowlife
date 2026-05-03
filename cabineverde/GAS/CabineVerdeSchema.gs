const CABINE_VERDE_SCHEMA = {
  OPERADORES: ['email', 'nome', 'perfil', 'ativo', 'ultimaAtualizacao'],
  CASOS: ['idCaso', 'dataHoraRegistro', 'dataServico', 'turno', 'equipe', 'operadorResponsavel', 'municipio', 'talaoBopm', 'statusCaso', 'nomeCompletoDesaparecido', 'sexoGenero', 'idade', 'faixaEtaria', 'cpf', 'rg', 'nomeMae', 'dataNascimento', 'dataHoraUltimaVisualizacao', 'localUltimaVisualizacao', 'roupaUltimaVisualizacao', 'meioTransporte', 'dadosVeiculo', 'fotoDisponivel', 'linkFoto', 'urlFoto', 'telefoneDesaparecido', 'dispositivoLigado', 'camerasResidencia', 'camerasUltimoLocal', 'aptoCabineVerde', 'nomeSolicitante', 'vinculoSolicitante', 'telefoneSolicitante', 'vulnerabilidade', 'condicaoMentalCognitivaComportamental', 'limitacaoFisica', 'usoMedicacaoEssencial', 'usoAlcoolOutrasDrogas', 'historicoDesaparecimentoAnterior', 'conflitoPrevio', 'suspeitaCrime', 'locaisHabituais', 'buscasPreliminares', 'classificacaoRisco', 'prioridade', 'acaoSugerida', 'localizado', 'dataHoraLocalizacao', 'formaLocalizacao', 'encerrado190', 'numeroBo', 'observacoesOperacionais', 'arv_p1_emergencia_resp', 'arv_p1_emergencia_comp', 'arv_p1_municipio_resp', 'arv_p1_municipio_comp', 'arv_p1_nome_resp', 'arv_p1_nome_comp', 'arv_p1_sexo_resp', 'arv_p1_sexo_comp', 'arv_p1_idade_resp', 'arv_p1_idade_comp', 'arv_p1_dados_identificacao_resp', 'arv_p1_dados_identificacao_comp', 'arv_p1_foto_recente_resp', 'arv_p1_foto_recente_comp', 'arv_p1_dispositivo_vinculado_resp', 'arv_p1_dispositivo_vinculado_comp', 'arv_p2_data_hora_ultima_resp', 'arv_p2_data_hora_ultima_comp', 'arv_p2_local_ultima_resp', 'arv_p2_local_ultima_comp', 'arv_p2_roupa_resp', 'arv_p2_roupa_comp', 'arv_p2_meio_transporte_resp', 'arv_p2_meio_transporte_comp', 'arv_p2_dados_veiculo_resp', 'arv_p2_dados_veiculo_comp', 'arv_p3_vinculo_resp', 'arv_p3_vinculo_comp', 'arv_p3_acompanhada_resp', 'arv_p3_acompanhada_comp', 'arv_p3_estuda_trabalha_atividade_resp', 'arv_p3_estuda_trabalha_atividade_comp', 'arv_p3_rotina_fixa_resp', 'arv_p3_rotina_fixa_comp', 'arv_p3_locais_frequenta_resp', 'arv_p3_locais_frequenta_comp', 'arv_p3_vinculo_emocional_resp', 'arv_p3_vinculo_emocional_comp', 'arv_p4_condicao_saude_mental_resp', 'arv_p4_condicao_saude_mental_comp', 'arv_p4_limitacao_fisica_resp', 'arv_p4_limitacao_fisica_comp', 'arv_p4_depende_cuidador_resp', 'arv_p4_depende_cuidador_comp', 'arv_p4_medicacao_essencial_resp', 'arv_p4_medicacao_essencial_comp', 'arv_p4_uso_alcool_drogas_resp', 'arv_p4_uso_alcool_drogas_comp', 'arv_p4_desaparecimento_anterior_resp', 'arv_p4_desaparecimento_anterior_comp', 'arv_p4_intencao_fugir_resp', 'arv_p4_intencao_fugir_comp', 'arv_p4_conflito_previo_resp', 'arv_p4_conflito_previo_comp', 'arv_p4_suspeita_crime_resp', 'arv_p4_suspeita_crime_comp', 'arv_p5_procurou_locais_habituais_resp', 'arv_p5_procurou_locais_habituais_comp', 'arv_p5_conferiu_comodos_resp', 'arv_p5_conferiu_comodos_comp', 'arv_p5_tentou_contato_resp', 'arv_p5_tentou_contato_comp', 'arv_p5_celular_ligado_resp', 'arv_p5_celular_ligado_comp', 'arv_p5_cameras_residencia_resp', 'arv_p5_cameras_residencia_comp', 'arv_p5_cameras_ultimo_local_resp', 'arv_p5_cameras_ultimo_local_comp', 'arv_p5_contatos_busca_resp', 'arv_p5_contatos_busca_comp', 'arv_p5_bo_delegacia_resp', 'arv_p5_bo_delegacia_comp', 'arv_crianca_supervisao_resp', 'arv_crianca_supervisao_comp', 'arv_crianca_informa_dados_resp', 'arv_crianca_informa_dados_comp', 'arv_crianca_neurodesenvolvimento_resp', 'arv_crianca_neurodesenvolvimento_comp', 'arv_crianca_disputa_familiar_resp', 'arv_crianca_disputa_familiar_comp', 'arv_crianca_local_desaparecimento_resp', 'arv_crianca_local_desaparecimento_comp', 'arv_crianca_adulto_veiculo_suspeito_resp', 'arv_crianca_adulto_veiculo_suspeito_comp', 'arv_preadolescente_contexto_saida_resp', 'arv_preadolescente_contexto_saida_comp', 'arv_preadolescente_historico_sair_sozinho_resp', 'arv_preadolescente_historico_sair_sozinho_comp', 'arv_preadolescente_aliciamento_virtual_resp', 'arv_preadolescente_aliciamento_virtual_comp', 'arv_preadolescente_conflito_recente_resp', 'arv_preadolescente_conflito_recente_comp', 'arv_preadolescente_disputa_responsaveis_resp', 'arv_preadolescente_disputa_responsaveis_comp', 'arv_adolescente_saiu_sem_autorizacao_resp', 'arv_adolescente_saiu_sem_autorizacao_comp', 'arv_adolescente_discussao_previa_resp', 'arv_adolescente_discussao_previa_comp', 'arv_adolescente_fuga_voluntaria_resp', 'arv_adolescente_fuga_voluntaria_comp', 'arv_adolescente_terceiros_redes_ameaca_resp', 'arv_adolescente_terceiros_redes_ameaca_comp', 'arv_adolescente_sofrimento_psiquico_resp', 'arv_adolescente_sofrimento_psiquico_comp', 'arv_adolescente_litigio_familiar_resp', 'arv_adolescente_litigio_familiar_comp', 'arv_adulto_mudanca_comportamento_resp', 'arv_adulto_mudanca_comportamento_comp', 'arv_adulto_crise_emocional_medicacao_resp', 'arv_adulto_crise_emocional_medicacao_comp', 'arv_adulto_historico_fuga_rompimento_resp', 'arv_adulto_historico_fuga_rompimento_comp', 'arv_adulto_violencia_divida_ameaca_resp', 'arv_adulto_violencia_divida_ameaca_comp', 'arv_adulto_trajeto_rotina_resp', 'arv_adulto_trajeto_rotina_comp', 'arv_adulto_dependencia_tratamento_resp', 'arv_adulto_dependencia_tratamento_comp', 'arv_idoso_alzheimer_demencia_resp', 'arv_idoso_alzheimer_demencia_comp', 'arv_idoso_limitacao_locomocao_comunicacao_resp', 'arv_idoso_limitacao_locomocao_comunicacao_comp', 'arv_idoso_medicacao_essencial_resp', 'arv_idoso_medicacao_essencial_comp', 'arv_idoso_costuma_sair_sozinho_resp', 'arv_idoso_costuma_sair_sozinho_comp', 'arv_idoso_desapareceu_rotina_resp', 'arv_idoso_desapareceu_rotina_comp', 'arv_idoso_historico_desorientacao_resp', 'arv_idoso_historico_desorientacao_comp'],
  TRIAGEM_RESPOSTAS: ['idCaso', 'talaoPMESP', 'etapa', 'campo', 'pergunta', 'resposta', 'dataHora', 'operadorEmail', 'operadorNome'],
  EVENTOS_CASO: ['idCaso', 'talaoPMESP', 'dataHora', 'evento', 'descricao', 'operadorEmail', 'operadorNome', 'operadorPerfil', 'resultado'],
  INDICADORES_OPERACIONAIS: ['idCaso', 'talaoPMESP', 'risco', 'prioridade', 'classificacaoOperacional', 'tipoCaso', 'flagAlerta', 'vulnerabilidadeIdentificada', 'suspeitaCrime', 'idade', 'faixaEtaria', 'dataHora', 'operadorEmail'],
  QUALIDADE_DADOS: ['idProblema', 'idCaso', 'talaoPMESP', 'dataHora', 'campo', 'problema', 'severidade', 'prioridadeTratamento', 'status', 'operadorEmail', 'resolvidoEm', 'resolvidoPor', 'observacaoResolucao'],
  LOGS: ['dataHora', 'evento', 'motivo', 'mensagem', 'operadorEmail', 'operadorNome', 'operadorPerfil', 'talaoPMESP', 'idCaso', 'resultado', 'origem'],
  AUDITORIA_CONSULTAS: ['dataHora', 'operadorEmail', 'operadorNome', 'operadorPerfil', 'filtroUsado', 'idCaso', 'talaoPMESP', 'nomeCompleto', 'resultado', 'quantidadeEncontrada']
};

function obterSchemaCabineVerdeUnificado_() {
  if (typeof CABINE_VERDE_SCHEMA === "undefined" || !CABINE_VERDE_SCHEMA || typeof CABINE_VERDE_SCHEMA !== 'object') {
    throw new Error("CABINE_VERDE_SCHEMA não está definido globalmente.");
  }

  if (!Array.isArray(CABINE_VERDE_SCHEMA.OPERADORES)) {
    throw new Error("CABINE_VERDE_SCHEMA não possui chave OPERADORES válida.");
  }

  if (!Array.isArray(CABINE_VERDE_SCHEMA.CASOS) || CABINE_VERDE_SCHEMA.CASOS.length === 0) {
    throw new Error("CABINE_VERDE_SCHEMA não possui chave CASOS válida.");
  }

  if (!Array.isArray(CABINE_VERDE_SCHEMA.EVENTOS_CASO) || CABINE_VERDE_SCHEMA.EVENTOS_CASO.length === 0) {
    throw new Error("CABINE_VERDE_SCHEMA não possui chave EVENTOS_CASO válida.");
  }

  return CABINE_VERDE_SCHEMA;
}

function testarSchemaCasos181() {
  var schema = obterSchemaCabineVerdeUnificado_();
  Logger.log(Array.isArray(schema.CASOS));
  Logger.log(schema.CASOS.length);
}

function testeSchemaGlobal() {
  var schema = obterSchemaCabineVerdeUnificado_();
  Logger.log(Object.keys(schema).join(', '));
}
