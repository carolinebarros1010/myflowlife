const CABINE_VERDE_SCHEMA = {
  OPERADORES: ['email', 'nome', 'perfil', 'ativo', 'ultimaAtualizacao'],
  CASOS: ['idCaso', 'talaoPMESP', 'dataHoraInicio', 'dataHoraUltimaAtualizacao', 'status', 'nomeCompletoDesaparecido', 'sexoGenero', 'idade', 'faixaEtaria', 'municipio', 'dataHoraUltimaVisualizacao', 'localUltimaVisualizacao', 'roupaUltimaVisualizacao', 'meioTransporte', 'dadosVeiculoTransporte', 'fotoDigitalDisponivel', 'dispositivoVinculado', 'telefoneDispositivoPessoa', 'vulnerabilidadeIdentificada', 'suspeitaCrime', 'camerasResidencia', 'camerasUltimoLocal', 'nomeSolicitante', 'vinculoSolicitante', 'telefoneSolicitante', 'risco', 'prioridade', 'aptoCabineVerde', 'classificacaoOperacional', 'tipoCaso', 'flagAlerta', 'operadorCriador', 'operadorUltimaAcao', 'observacoesOperacionais'],
  TRIAGEM_RESPOSTAS: ['idCaso', 'talaoPMESP', 'etapa', 'campo', 'pergunta', 'resposta', 'dataHora', 'operadorEmail', 'operadorNome'],
  EVENTOS_CASO: ['idCaso', 'talaoPMESP', 'dataHora', 'evento', 'descricao', 'operadorEmail', 'operadorNome', 'operadorPerfil', 'resultado'],
  INDICADORES_OPERACIONAIS: ['idCaso', 'talaoPMESP', 'risco', 'prioridade', 'classificacaoOperacional', 'tipoCaso', 'flagAlerta', 'vulnerabilidadeIdentificada', 'suspeitaCrime', 'idade', 'faixaEtaria', 'dataHora', 'operadorEmail'],
  QUALIDADE_DADOS: ['idProblema', 'idCaso', 'talaoPMESP', 'dataHora', 'campo', 'problema', 'severidade', 'prioridadeTratamento', 'status', 'operadorEmail', 'resolvidoEm', 'resolvidoPor', 'observacaoResolucao'],
  LOGS: ['dataHora', 'evento', 'motivo', 'mensagem', 'operadorEmail', 'operadorNome', 'operadorPerfil', 'talaoPMESP', 'idCaso', 'resultado', 'origem'],
  AUDITORIA_CONSULTAS: ['dataHora', 'operadorEmail', 'operadorNome', 'operadorPerfil', 'filtroUsado', 'idCaso', 'talaoPMESP', 'nomeCompleto', 'resultado', 'quantidadeEncontrada']
};
