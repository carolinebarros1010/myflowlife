
var PERFIS_OPERADOR_VALIDOS = ['OPERADOR', 'SUPERVISOR', 'ADMIN', 'AUDITOR'];

function normalizarPerfilOperador_(perfil) {
  return limparTexto(perfil).toUpperCase();
}

function validarPerfilOperador_(operador, perfisPermitidos) {
  var email = limparTexto(operador && operador.email).toLowerCase();
  var perfil = normalizarPerfilOperador_(operador && operador.perfil);
  var permitidos = Array.isArray(perfisPermitidos) && perfisPermitidos.length
    ? perfisPermitidos.map(function (item) { return normalizarPerfilOperador_(item); })
    : PERFIS_OPERADOR_VALIDOS.slice();

  if (PERFIS_OPERADOR_VALIDOS.indexOf(perfil) === -1) {
    return { permitido: false, perfil: perfil, motivo: 'Perfil inválido: ' + (perfil || 'N/A') };
  }
  if (permitidos.indexOf(perfil) === -1) {
    return { permitido: false, perfil: perfil, motivo: 'Perfil sem permissão para a ação.' };
  }
  return { permitido: true, perfil: perfil, email: email, motivo: 'PERMITIDO' };
}

function validarPermissaoAcao_(operador, acao) {
  var matriz = {
    REGISTRAR_CASO: ['OPERADOR', 'SUPERVISOR', 'ADMIN'],
    ANEXAR_FOTO: ['OPERADOR', 'SUPERVISOR', 'ADMIN'],
    VISUALIZAR_FOTO_INTERNO: ['OPERADOR', 'SUPERVISOR', 'ADMIN'],
    VALIDAR_REJEITAR_FOTO: ['SUPERVISOR', 'ADMIN'],
    EDITAR_CASO_CONTROLADO: ['SUPERVISOR', 'ADMIN'],
    VISUALIZAR_FOTO_RESTRITO_SIGILOSO: ['SUPERVISOR', 'ADMIN'],
    AJUSTAR_ESTRUTURA: ['ADMIN'],
    MIGRACAO: ['ADMIN'],
    GERIR_OPERADORES: ['ADMIN'],
    CONFIGURACOES: ['ADMIN'],
    CONSULTAR_LOGS: ['AUDITOR', 'ADMIN']
  };
  var permitidos = matriz[acao] || PERFIS_OPERADOR_VALIDOS;
  return validarPerfilOperador_(operador, permitidos);
}

var ESTRUTURA_PLANILHA = {
  CASOS: COLUNAS_CASOS,
  TRIAGEM_RESPOSTAS: COLUNAS_TRIAGEM_RESPOSTAS,
  EVENTOS_OCORRENCIA: COLUNAS_EVENTOS_OCORRENCIA,
  INDICADORES_OPERACIONAIS: COLUNAS_INDICADORES_OPERACIONAIS,
  HISTORICO_EDICOES: ['idEdicao','idCaso','talaoPMESP','campoAlterado','valorAnterior','valorNovo','operadorNome','operadorEmail','operadorPerfil','dataHoraEdicao','justificativa','emailConfirmado'],
  RELATORIO_OPERACIONAL: ['dataReferencia','qtdFotosRecebidas','qtdFotosValidadas','qtdFotosUtilizadas','qtdFotosRejeitadas','observacaoOcorrenciasImagem','geradoEm'],
  FOTOS_DESAPARECIDOS: typeof COLUNAS_FOTOS_DESAPARECIDOS !== 'undefined' ? COLUNAS_FOTOS_DESAPARECIDOS : [],
  OPERADORES: ['email','nome','perfil','ativo','ultimaAtualizacao'],
  Logs_GAS: ['timestamp', 'etapa', 'ok', 'mensagem', 'rawPostData', 'payloadIdCaso'],
  QUALIDADE_DADOS: ['dataHoraAuditoria','idCaso','talaoPMESP','campo','problema','severidade','prioridadeTratamento','acaoRecomendada','statusTratamento','responsavelTratamento','dataHoraResolucao']
};


function validarOperadorAtual_() {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var abaOperadores = garantirAbaComCabecalho(planilha, 'OPERADORES', ESTRUTURA_PLANILHA.OPERADORES);
  var cabecalho = garantirColunasDaEstrutura(abaOperadores, ESTRUTURA_PLANILHA.OPERADORES).map(limparTexto);
  var emailAtual = limparTexto(Session.getActiveUser().getEmail()).toLowerCase();

  if (!emailAtual) {
    registrarLogAcessoOperador_(planilha, 'OPERADOR_BLOQUEADO', 'BLOQUEADO_SEM_EMAIL', 'Usuário sem e-mail identificado na sessão Google.', '');
    throw new Error('Usuário não autorizado. Solicite acesso ao administrador.');
  }

  var idxEmail = cabecalho.indexOf('email');
  var idxAtivo = cabecalho.indexOf('ativo');
  var idxPerfil = cabecalho.indexOf('perfil');
  if (idxEmail === -1 || idxAtivo === -1 || idxPerfil === -1) {
    registrarLogAcessoOperador_(planilha, 'OPERADOR_BLOQUEADO', 'ERRO_ESTRUTURA_OPERADORES', 'Aba OPERADORES sem colunas obrigatórias (email/ativo/perfil).', emailAtual);
    throw new Error('Usuário não autorizado. Solicite acesso ao administrador.');
  }

  var ultimaLinha = abaOperadores.getLastRow();
  var encontrado = null;
  if (ultimaLinha >= 2) {
    var dados = abaOperadores.getRange(2, 1, ultimaLinha - 1, abaOperadores.getLastColumn()).getValues();
    for (var i = 0; i < dados.length; i += 1) {
      var emailLinha = limparTexto(dados[i][idxEmail]).toLowerCase();
      if (emailLinha === emailAtual) {
        encontrado = dados[i];
        break;
      }
    }
  }

  if (!encontrado) {
    registrarLogAcessoOperador_(planilha, 'OPERADOR_BLOQUEADO', 'NAO_CADASTRADO', 'E-mail não encontrado na aba OPERADORES.', emailAtual);
    throw new Error('Usuário não autorizado. Solicite acesso ao administrador.');
  }

  var ativoNormalizado = limparTexto(encontrado[idxAtivo]).toUpperCase();
  var operadorAtivo = ['TRUE','VERDADEIRO','SIM','ATIVO','1'].indexOf(ativoNormalizado) !== -1;

  if (!operadorAtivo) {
    registrarLogAcessoOperador_(planilha, 'OPERADOR_BLOQUEADO', 'OPERADOR_INATIVO', 'Operador localizado, porém inativo na aba OPERADORES.', emailAtual);
    throw new Error('Usuário não autorizado. Solicite acesso ao administrador.');
  }

  var perfilValidacao = validarPerfilOperador_({ email: emailAtual, perfil: encontrado[idxPerfil] }, PERFIS_OPERADOR_VALIDOS);
  if (!perfilValidacao.permitido) {
    registrarLogAcessoOperador_(planilha, 'OPERADOR_BLOQUEADO', 'PERFIL_INVALIDO', perfilValidacao.motivo, emailAtual);
    throw new Error("Usuário não autorizado. Solicite acesso ao administrador.");
  }

  registrarLogAcessoOperador_(planilha, 'OPERADOR_LOGADO', 'PERMITIDO', 'Operador autenticado com sucesso.', emailAtual);
  return { autorizado: true, email: emailAtual, perfil: perfilValidacao.perfil };
}

function registrarLogAcessoOperador_(planilha, tipoEvento, status, mensagem, email) {
  var colunasLog = ['dataHora','tipoEvento','status','mensagem','email','perfil','resultado','motivoBloqueio'];
  var abaLog = garantirAbaComCabecalho(planilha, 'LOG_ACESSO', colunasLog);
  var cabecalhoLog = garantirColunasDaEstrutura(abaLog, colunasLog).map(limparTexto);
  var evento = {
    dataHora: formatarDataHora(new Date()),
    tipoEvento: limparTexto(tipoEvento),
    status: limparTexto(status),
    mensagem: limparTexto(mensagem),
    email: limparTexto(email),
    perfil: '',
    resultado: limparTexto(status),
    motivoBloqueio: limparTexto(status).indexOf('BLOQUEADO') !== -1 ? limparTexto(mensagem) : ''
  };
  abaLog.appendRow(cabecalhoLog.map(function (coluna) { return normalizarValorPlanilha(evento[coluna]); }));

  if (typeof registrarLogMigracao_ === 'function') {
    registrarLogMigracao_('validarOperadorAtual_', limparTexto(status), '', limparTexto(mensagem), 'EXECUTADO', true, limparTexto(tipoEvento));
  }
}


function serializarDadosEvento_(dados) {
  try {
    return JSON.stringify(dados || {});
  } catch (err) {
    return limparTexto(dados);
  }
}

function registrarEventoOperacional_(planilha, idCaso, tipoEvento, dadosEvento) {
  var descricao = 'dados=' + serializarDadosEvento_(dadosEvento || {});
  registrarEventoOcorrenciaDetalhado_(planilha, idCaso, tipoEvento, descricao, dadosEvento || {});
}

function registrarDecisaoOperacional_(idCaso, operador, classificacao, prioridade, justificativa) {
  var idCasoLimpo = limparTexto(idCaso);
  if (!idCasoLimpo) throw new Error('idCaso obrigatório para registrar decisão operacional.');

  var operadorValidado = validarPerfilOperador_(operador || {}, PERFIS_OPERADOR_VALIDOS);
  if (!operadorValidado.permitido) throw new Error('Operador inválido para decisão operacional: ' + operadorValidado.motivo);

  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  registrarEventoOperacional_(planilha, idCasoLimpo, 'DECISAO_OPERACIONAL', {
    classificacaoRisco: limparTexto(classificacao),
    prioridade: limparTexto(prioridade),
    justificativa: limparTexto(justificativa),
    operador: operadorValidado.email || limparTexto(operador && operador.email)
  });

  return { ok: true, idCaso: idCasoLimpo, tipoEvento: 'DECISAO_OPERACIONAL' };
}

function buscarCaso_(filtro) {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var abaCasos = garantirAbaComCabecalho(planilha, 'CASOS', COLUNAS_CASOS);
  if (abaCasos.getLastRow() < 2) return [];

  var filtroObj = filtro && typeof filtro === 'object' ? filtro : { termo: filtro };
  var termoId = limparTexto(filtroObj.idCaso || filtroObj.termo).toLowerCase();
  var termoTalao = limparTexto(filtroObj.talaoPMESP || filtroObj.termo).toLowerCase();
  var termoNome = limparTexto(filtroObj.nomeCompletoDesaparecido || filtroObj.termo).toLowerCase();
  if (!termoId && !termoTalao && !termoNome) return [];

  var cabecalho = garantirColunasDaEstrutura(abaCasos, COLUNAS_CASOS).map(limparTexto);
  var idxIdCaso = cabecalho.indexOf('idCaso');
  var idxTalao = cabecalho.indexOf('talaoPMESP');
  var idxNome = cabecalho.indexOf('nomeCompletoDesaparecido');
  var dados = abaCasos.getRange(2, 1, abaCasos.getLastRow() - 1, abaCasos.getLastColumn()).getValues();

  return dados.filter(function (linha) {
    var idCaso = limparTexto(linha[idxIdCaso]).toLowerCase();
    var talao = limparTexto(linha[idxTalao]).toLowerCase();
    var nome = limparTexto(linha[idxNome]).toLowerCase();
    var matchId = !termoId || idCaso.indexOf(termoId) !== -1;
    var matchTalao = !termoTalao || talao.indexOf(termoTalao) !== -1;
    var matchNome = !termoNome || nome.indexOf(termoNome) !== -1;
    return matchId && matchTalao && matchNome;
  }).map(function (linha) {
    var caso = {};
    cabecalho.forEach(function (coluna, index) {
      caso[coluna] = normalizarValorPlanilha(linha[index]);
    });
    return caso;
  });
}

function editarCasoControlado_(idCaso, operador, alteracoes, justificativa, emailConfirmacaoOperador) {
  var idCasoLimpo = limparTexto(idCaso);
  if (!idCasoLimpo) throw new Error('idCaso obrigatório.');
  var justificativaLimpa = limparTexto(justificativa);
  if (!justificativaLimpa) throw new Error('Edição bloqueada: justificativa obrigatória.');
  if (!alteracoes || typeof alteracoes !== 'object') throw new Error('Edição bloqueada: alteracoes inválidas.');

  var emailSessao = limparTexto(Session.getActiveUser().getEmail()).toLowerCase();
  var emailConfirmacao = limparTexto(emailConfirmacaoOperador).toLowerCase();
  if (!emailSessao || emailSessao !== emailConfirmacao) {
    var planilhaBloqueio = SpreadsheetApp.getActiveSpreadsheet();
    registrarLogAcessoOperador_(planilhaBloqueio, 'EDICAO_CASO_BLOQUEADA', 'BLOQUEADO_EMAIL_INVALIDO', 'Confirmação de email inválida. Edição bloqueada.', emailSessao || emailConfirmacao);
    throw new Error('Confirmação de email inválida. Edição bloqueada.');
  }

  var operadorBase = operador || {};
  operadorBase.email = emailSessao;
  var permissao = validarPermissaoAcao_(operadorBase, 'EDITAR_CASO_CONTROLADO');
  if (!permissao.permitido) throw new Error('Operador sem permissão para editar caso.');

  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var abaCasos = garantirAbaComCabecalho(planilha, 'CASOS', COLUNAS_CASOS);
  var cabecalho = garantirColunasDaEstrutura(abaCasos, COLUNAS_CASOS).map(limparTexto);
  var linhaCaso = localizarCasoPorIdCaso(abaCasos, idCasoLimpo, cabecalho);
  if (linhaCaso < 2) throw new Error('Caso não encontrado para edição controlada.');

  var colunasPermitidas = Object.keys(alteracoes).filter(function (campo) {
    return cabecalho.indexOf(campo) !== -1;
  });
  if (!colunasPermitidas.length) throw new Error('Nenhuma coluna válida para edição.');

  var linhaAtual = abaCasos.getRange(linhaCaso, 1, 1, abaCasos.getLastColumn()).getValues()[0];
  var historico = [];
  for (var i = 0; i < colunasPermitidas.length; i += 1) {
    var campo = colunasPermitidas[i];
    var indiceCampo = cabecalho.indexOf(campo);
    var valorAnterior = normalizarValorPlanilha(linhaAtual[indiceCampo]);
    var valorNovo = normalizarValorPlanilha(alteracoes[campo]);
    if (valorAnterior === valorNovo) continue;
    abaCasos.getRange(linhaCaso, indiceCampo + 1).setValue(valorNovo);
    historico.push({
      campo: campo,
      valorAnterior: valorAnterior,
      valorNovo: valorNovo
    });
  }

  if (!historico.length) {
    return { ok: true, idCaso: idCasoLimpo, alteracoesAplicadas: 0, message: 'Sem diferenças para atualizar.' };
  }

  var idxTalaoPMESP = cabecalho.indexOf('talaoPMESP');
  var talaoPMESP = idxTalaoPMESP >= 0 ? normalizarValorPlanilha(linhaAtual[idxTalaoPMESP]) : '';
  var dataHoraEdicao = formatarDataHora(new Date());
  salvarHistoricoEdicoes_(planilha, idCasoLimpo, talaoPMESP, permissao, operadorBase, historico, justificativaLimpa, dataHoraEdicao);
  registrarEventoOperacional_(planilha, idCasoLimpo, 'CASO_EDITADO', {
    operadorNome: limparTexto(operadorBase.nome),
    operadorEmail: emailSessao,
    operadorPerfil: permissao.perfil,
    dataHoraEdicao: dataHoraEdicao,
    justificativa: justificativaLimpa,
    quantidadeCamposAlterados: historico.length,
    campos: historico.map(function (item) { return item.campo; })
  });
  return { ok: true, idCaso: idCasoLimpo, alteracoesAplicadas: historico.length };
}

function salvarHistoricoEdicoes_(planilha, idCaso, talaoPMESP, permissao, operador, historico, justificativa, dataHoraEdicao) {
  var colunas = ESTRUTURA_PLANILHA.HISTORICO_EDICOES;
  var aba = garantirAbaComCabecalho(planilha, 'HISTORICO_EDICOES', colunas);
  var cabecalho = garantirColunasDaEstrutura(aba, colunas);
  historico.forEach(function (item) {
    var linha = {
      idEdicao: 'ED-' + new Date().getTime() + '-' + Math.floor(Math.random() * 1000),
      idCaso: idCaso,
      talaoPMESP: talaoPMESP,
      campoAlterado: item.campo,
      operadorEmail: permissao.email || '',
      operadorNome: limparTexto(operador && operador.nome),
      operadorPerfil: permissao.perfil || '',
      valorAnterior: item.valorAnterior,
      valorNovo: item.valorNovo,
      dataHoraEdicao: dataHoraEdicao,
      justificativa: justificativa,
      emailConfirmado: true
    };
    aba.appendRow(cabecalho.map(function (coluna) { return normalizarValorPlanilha(linha[coluna]); }));
  });
}

function gerarRelatorioOperacionalComImagem_(dataReferencia) {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var colunas = ESTRUTURA_PLANILHA.RELATORIO_OPERACIONAL;
  var abaRelatorio = garantirAbaComCabecalho(planilha, 'RELATORIO_OPERACIONAL', colunas);
  var resumo = consolidarDadosImagemPorData_(dataReferencia);
  var observacao = 'Ocorrências com uso de imagem: ' + (resumo.idCasosComImagem.length ? resumo.idCasosComImagem.join(', ') : 'Nenhuma');

  abaRelatorio.appendRow([
    resumo.dataReferencia,
    resumo.qtdFotosRecebidas,
    resumo.qtdFotosValidadas,
    resumo.qtdFotosUtilizadas,
    resumo.qtdFotosRejeitadas,
    observacao,
    formatarDataHora(new Date())
  ]);

  registrarEventoOcorrencia(planilha, '', 'RELATORIO_OPERACIONAL_IMAGEM', 'dataReferencia=' + resumo.dataReferencia + '; qtdFotosUtilizadas=' + resumo.qtdFotosUtilizadas + '; idCasos=' + resumo.idCasosComImagem.join(','));
  return resumo;
}

function consolidarDadosImagemPorData_(dataReferencia) {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var abaFotos = garantirAbaComCabecalho(planilha, 'FOTOS_DESAPARECIDOS', COLUNAS_FOTOS_DESAPARECIDOS);
  var dados = abaFotos.getLastRow() < 2 ? [] : abaFotos.getRange(2, 1, abaFotos.getLastRow() - 1, abaFotos.getLastColumn()).getValues();
  var cabecalho = garantirColunasDaEstrutura(abaFotos, COLUNAS_FOTOS_DESAPARECIDOS).map(limparTexto);
  var alvo = normalizarDataChave_(dataReferencia || new Date());
  var idxData = cabecalho.indexOf('dataHoraUpload');
  var idxStatus = cabecalho.indexOf('statusValidacao');
  var idxAutorizacao = cabecalho.indexOf('autorizacaoUsoImagem');
  var idxCaso = cabecalho.indexOf('idCaso');
  var casos = {};
  var resumo = { dataReferencia: alvo, qtdFotosRecebidas: 0, qtdFotosValidadas: 0, qtdFotosUtilizadas: 0, qtdFotosRejeitadas: 0, idCasosComImagem: [] };

  dados.forEach(function (linha) {
    if (normalizarDataChave_(linha[idxData]) !== alvo) return;
    resumo.qtdFotosRecebidas += 1;
    var status = limparTexto(linha[idxStatus]).toLowerCase();
    var autorizada = ['sim', 'true', 'verdadeiro', '1'].indexOf(limparTexto(linha[idxAutorizacao]).toLowerCase()) !== -1;
    var idCaso = limparTexto(linha[idxCaso]);
    if (status === 'validada') resumo.qtdFotosValidadas += 1;
    if (status === 'rejeitada') resumo.qtdFotosRejeitadas += 1;
    if (status === 'validada' && autorizada) {
      resumo.qtdFotosUtilizadas += 1;
      if (idCaso) casos[idCaso] = true;
    }
  });
  resumo.idCasosComImagem = Object.keys(casos);
  return resumo;
}

function normalizarDataChave_(entrada) {
  var data = Object.prototype.toString.call(entrada) === '[object Date]' ? entrada : new Date(entrada);
  if (isNaN(data.getTime())) data = new Date();
  return Utilities.formatDate(data, Session.getScriptTimeZone() || 'America/Sao_Paulo', 'yyyy-MM-dd');
}

function doGet() {
  validarOperadorAtual_();
  return criarRespostaJson({ ok: true, service: 'cabineverde', message: 'Endpoint ativo' });
}

function doPost(e) {
  var planilhaLogs = obterPlanilhaLogs();
  try {
    registrarLogTecnico(planilhaLogs, { etapa: 'POST_RECEBIDO', ok: true, mensagem: 'Requisição POST recebida pelo Web App', rawPostData: extrairRawPostData(e), payloadIdCaso: extrairIdCasoBruto(e) });
    var operadorAtual = validarOperadorAtual_();
    var body = parsePayload(e);
    registrarLogTecnico(planilhaLogs, { etapa: 'PAYLOAD_RECEBIDO', ok: true, mensagem: 'Payload recebido e parseado com sucesso', rawPostData: extrairRawPostData(e), payloadIdCaso: limparTexto((body.payload && body.payload.idCaso) || (body.dados && body.dados.idCaso) || body.idCaso) });
    var acaoOriginal = limparTexto(body.action);
    var action = acaoOriginal || 'salvarCaso';
    var acao = action.toUpperCase();
    var aliases = { 'perfil-operador': 'listarPerfilOperador', 'buscarCaso_': 'buscarCaso', 'gerarTimelineCaso_': 'gerarTimelineCaso', 'resumoQualidadeDados_': 'resumoQualidadeDados', 'marcarProblemaQualidadeResolvido_': 'marcarProblemaQualidadeResolvido' };
    action = aliases[action] || action;

    if (action === 'healthcheck') {
      return criarRespostaJson({ ok: true, data: { service: 'cabineverde', message: 'Endpoint ativo' } });
    }

    var mapaPermissao = {
      visualizarFotoDesaparecido: 'VISUALIZAR_FOTO_INTERNO',
      validarFotoDesaparecido: 'VALIDAR_REJEITAR_FOTO',
      editarCasoControlado: 'EDITAR_CASO_CONTROLADO',
      listarPerfilOperador: 'GERIR_OPERADORES'
    };
    var validacaoAcao = validarPermissaoAcao_(operadorAtual, mapaPermissao[action] || 'REGISTRAR_CASO');
    if (!validacaoAcao.permitido) {
      registrarLogAcessoOperador_(SpreadsheetApp.getActiveSpreadsheet(), "ACESSO_NEGADO", "SEM_PERMISSAO_ACAO", "Ação bloqueada: " + acao + "; motivo=" + validacaoAcao.motivo, operadorAtual.email);
      throw new Error("Ação não permitida para o perfil do operador.");
    }
    if (action === 'visualizarFotoDesaparecido') {
      var respostaFoto = visualizarFotoDesaparecido_(body.idFoto, body.operador, body.justificativa, body.motivoAcessoFoto);
      return criarRespostaJson({ ok: true, data: { message: 'Visualização autorizada', conteudoBase64: respostaFoto.conteudoBase64, mimeType: respostaFoto.mimeType, idCaso: respostaFoto.idCaso, idFoto: respostaFoto.idFoto } });
    }
    if (action === 'listarCasos') {
      var casos = listarCasosComProtecao_(operadorAtual);
      return criarRespostaJson({ ok: true, data: { action: 'listarCasos', casos: casos } });
    }
    if (action === 'verificarSegurancaDrive') {
      var resultadoSeguranca = verificarSegurancaDrive_(!!body.corrigirAutomaticamente);
      return criarRespostaJson({ ok: true, data: { action: 'verificarSegurancaDrive', resultado: resultadoSeguranca } });
    }
    if (action === 'resumoQualidadeDados') {
      var resumoQualidade = resumoQualidadeDados_();
      return criarRespostaJson({
        ok: true,
        action: 'resumoQualidadeDados',
        resumo: resumoQualidade,
        totalProblemas: resumoQualidade.totalProblemas,
        totalCriticos: resumoQualidade.totalCriticos,
        totalPendentes: resumoQualidade.totalPendentes,
        totalResolvidos: resumoQualidade.totalResolvidos,
        inconsistencias: resumoQualidade.inconsistencias
      });
    }
    if (action === 'marcarProblemaQualidadeResolvido') {
      return criarRespostaJson({ ok: true, data: marcarProblemaQualidadeResolvido_(body.idCaso, body.campo, body.problema, body.responsavelTratamento) });
    }

    if (action === 'buscarCaso') return criarRespostaJson({ ok: true, data: buscarCaso_(body.filtro || body.payload || body.termo || '') });
    if (action === 'gerarTimelineCaso') return criarRespostaJson({ ok: true, data: gerarTimelineCaso_(body.idCaso) });
    if (action === 'editarCasoControlado') return criarRespostaJson({ ok: true, data: editarCasoControlado_(body.idCaso, body.operador, body.alteracoes, body.justificativa, body.emailConfirmacaoOperador) });
    if (action === 'validarFotoDesaparecido') return criarRespostaJson({ ok: true, data: validarFotoDesaparecido_(body.idFoto, body.operador || operadorAtual, body.status) });
    if (action === 'auditarQualidadeDados') return criarRespostaJson({ ok: true, data: auditarQualidadeDados_() });
    if (action === 'enviarFeedback') return criarRespostaJson({ ok: true, data: { recebido: true, feedback: body.payload || body.feedback || {} } });
    if (action === 'gerarRelatorioTextoSIOPM') return criarRespostaJson({ ok: true, data: { relatorio: gerarRelatorioTextoSIOPM_(body.idCaso || (body.payload && body.payload.idCaso)) } });
    if (action === 'gerarRelatorioOperacionalComImagem') return criarRespostaJson({ ok: true, data: gerarRelatorioOperacionalComImagem_(body.dataReferencia) });
    if (action === 'listarPerfilOperador') return criarRespostaJson({ ok: true, data: operadorAtual });

    var planilha = SpreadsheetApp.getActiveSpreadsheet();
    Object.keys(ESTRUTURA_PLANILHA).forEach(function (aba) {
      garantirAbaComCabecalho(planilha, aba, ESTRUTURA_PLANILHA[aba]);
    });

    var registros = body.abas && Array.isArray(body.abas) ? body.abas : [body];
    var idCaso = limparTexto((body.payload && body.payload.idCaso) || (body.dados && body.dados.idCaso));
    registrarLogTecnico(planilhaLogs, { etapa: 'GRAVACAO_INICIADA', ok: true, mensagem: 'Iniciando persistência em abas de destino', rawPostData: extrairRawPostData(e), payloadIdCaso: idCaso });

    registros.forEach(function (registro) {
      persistirRegistro(planilha, registro);
    });

    if (body.foto && body.foto.base64) {
      salvarFotoDesaparecido_({
        idCaso: limparTexto(body.payload && body.payload.idCaso),
        talaoPMESP: limparTexto(body.payload && body.payload.talaoPMESP),
        nomeDesaparecido: limparTexto(body.payload && body.payload.nomeDesaparecido),
        operadorResponsavel: limparTexto(body.payload && body.payload.operadorResponsavel),
        origemFoto: limparTexto(body.payload && body.payload.origemFoto),
        tipoFoto: limparTexto(body.payload && body.payload.tipoFoto),
        nivelAcesso: limparTexto(body.payload && body.payload.nivelAcesso),
        autorizacaoUsoImagem: body.payload && body.payload.autorizacaoUsoImagem,
        base64: body.foto.base64,
        nomeArquivo: body.foto.nomeArquivo,
        mimeType: body.foto.mimeType
      });
    }

    registrarLogTecnico(planilhaLogs || planilha, { etapa: 'GRAVACAO_SUCESSO', ok: true, mensagem: 'Registros persistidos com sucesso', rawPostData: extrairRawPostData(e), payloadIdCaso: idCaso });
    return criarRespostaJson({ ok: true, data: { action: 'salvarCaso', idCaso: idCaso, message: 'Gravação multiabas concluída' } });
  } catch (err) {
    var mensagemErro = err && err.message ? err.message : String(err);
    registrarLogTecnico(planilhaLogs, { etapa: 'ERRO_GRAVACAO_PLANILHA', ok: false, mensagem: mensagemErro, rawPostData: extrairRawPostData(e), payloadIdCaso: extrairIdCasoBruto(e) });
    var actionErro = ''; try { actionErro = limparTexto(parsePayload(e).action); } catch (_e) {}
    return criarRespostaJson({ ok: false, erro: mensagemErro, detalhe: 'Falha no processamento da action ' + actionErro }, 500);
  }
}

function listarCasosComProtecao_(operadorAtual) {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var aba = garantirAbaComCabecalho(planilha, 'CASOS', COLUNAS_CASOS);
  if (aba.getLastRow() < 2) return [];
  var cabecalho = garantirColunasDaEstrutura(aba, COLUNAS_CASOS);
  var dados = aba.getRange(2, 1, aba.getLastRow() - 1, aba.getLastColumn()).getValues();
  var perfil = normalizarPerfilOperador_(operadorAtual && operadorAtual.perfil);
  return dados.map(function (linha) {
    var item = {};
    for (var i = 0; i < cabecalho.length; i += 1) {
      item[cabecalho[i]] = normalizarValorPlanilha(linha[i]);
    }
    item.cpfDesaparecido = mascararDadosSensivel_(item.cpfDesaparecido, perfil);
    item.rgDesaparecido = mascararDadosSensivel_(item.rgDesaparecido, perfil);
    return item;
  });
}

function mascararDadosSensivel_(valor, perfil) {
  var texto = limparTexto(valor);
  var perfilNormalizado = normalizarPerfilOperador_(perfil);
  if (!texto) return '';
  if (perfilNormalizado === 'SUPERVISOR' || perfilNormalizado === 'ADMIN') return texto;
  if (perfilNormalizado === 'AUDITOR') return '***AUDITORIA_CONTROLADA***';
  var apenasDigitos = texto.replace(/\D/g, '');
  if (apenasDigitos.length >= 4) {
    return '***.***.***-' + apenasDigitos.slice(-2);
  }
  return '***' + texto.slice(-2);
}

function verificarSegurancaDrive_(corrigirAutomaticamente) {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var pastaRaiz = obterOuCriarPasta_('Cabine Verde');
  var pastaFotos = obterOuCriarSubpasta_(pastaRaiz, 'Fotos');
  var itensAnalisados = 0;
  var arquivosExpostos = 0;
  var arquivosCorrigidos = 0;
  var filas = [pastaFotos];
  while (filas.length) {
    var atual = filas.shift();
    var arquivos = atual.getFiles();
    while (arquivos.hasNext()) {
      var arquivo = arquivos.next();
      itensAnalisados += 1;
      var acesso = arquivo.getSharingAccess();
      if (acesso !== DriveApp.Access.PRIVATE) {
        arquivosExpostos += 1;
        if (corrigirAutomaticamente) {
          arquivo.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.VIEW);
          arquivosCorrigidos += 1;
        }
        registrarEventoOcorrencia(planilha, '', 'ARQUIVO_EXPOSTO', 'fileId=' + arquivo.getId() + '; nome=' + arquivo.getName() + '; acesso=' + acesso + '; corrigido=' + (corrigirAutomaticamente ? 'TRUE' : 'FALSE'));
      }
    }
    var subpastas = atual.getFolders();
    while (subpastas.hasNext()) filas.push(subpastas.next());
  }
  return { itensAnalisados: itensAnalisados, arquivosExpostos: arquivosExpostos, arquivosCorrigidos: arquivosCorrigidos, correcaoAutomatica: !!corrigirAutomaticamente };
}

function rotinaDiariaSeguranca_() {
  var resultado = verificarSegurancaDrive_(true);
  gerarRelatorioSeguranca_(resultado);
  return resultado;
}

function gerarRelatorioSeguranca_(resultado) {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var colunas = ['dataHora', 'itensAnalisados', 'arquivosExpostos', 'arquivosCorrigidos', 'correcaoAutomatica'];
  var aba = garantirAbaComCabecalho(planilha, 'RELATORIO_SEGURANCA', colunas);
  aba.appendRow([
    formatarDataHora(new Date()),
    normalizarValorPlanilha(resultado && resultado.itensAnalisados),
    normalizarValorPlanilha(resultado && resultado.arquivosExpostos),
    normalizarValorPlanilha(resultado && resultado.arquivosCorrigidos),
    resultado && resultado.correcaoAutomatica ? 'TRUE' : 'FALSE'
  ]);
}

function persistirRegistro(planilha, registro) {
  var aba = limparTexto(registro.aba);
  var colunas = registro.colunas || [];
  var valores = registro.valores || [];
  var sheet = garantirAbaComCabecalho(planilha, aba, ESTRUTURA_PLANILHA[aba] || colunas);
  var cabecalhoAtual = garantirColunasDaEstrutura(sheet, ESTRUTURA_PLANILHA[aba] || colunas);

  if (aba === 'CASOS') {
    var registroPorColuna = mapearPorColuna(colunas, valores);
    registroPorColuna = normalizarCamposFisicos_(registroPorColuna);
    var idCaso = limparTexto(registroPorColuna.idCaso);
    var talaoPMESPRecebido = limparTexto(registroPorColuna.talaoPMESP);
    var linhaPorIdCaso = localizarCasoPorIdCaso(sheet, idCaso, cabecalhoAtual);
    var linhaPorTalaoPMESP = localizarCasoPorTalaoPMESP(sheet, talaoPMESPRecebido, cabecalhoAtual);

    validarConsistenciaCaso(planilha, {
      idCaso: idCaso,
      talaoPMESP: talaoPMESPRecebido,
      linhaPorIdCaso: linhaPorIdCaso,
      linhaPorTalaoPMESP: linhaPorTalaoPMESP
    });

    var linhaFinal = cabecalhoAtual.map(function (nomeColuna) {
      return normalizarValorPlanilha(registroPorColuna[nomeColuna]);
    });

    if (linhaPorIdCaso > 1) {
      sheet.getRange(linhaPorIdCaso, 1, 1, linhaFinal.length).setValues([linhaFinal]);
      return;
    }

    sheet.appendRow(linhaFinal);
    registrarEventoOperacional_(planilha, idCaso, 'CASO_CRIADO', {
      idCaso: idCaso,
      talaoPMESP: talaoPMESPRecebido,
      operador: limparTexto(registroPorColuna.operadorResponsavel),
      dataHora: formatarDataHora(new Date()),
      statusInicial: limparTexto(registroPorColuna.statusCaso) || 'Em triagem'
    });
    return;
  }

  sheet.appendRow(valores);
}


function localizarCasoPorIdCaso(sheet, idCaso, cabecalhoAtual) {
  return encontrarLinhaPorColuna(sheet, idCaso, 'idCaso', cabecalhoAtual);
}

function localizarCasoPorTalaoPMESP(sheet, talaoPMESP, cabecalhoAtual) {
  return encontrarLinhaPorColuna(sheet, talaoPMESP, 'talaoPMESP', cabecalhoAtual);
}

function encontrarLinhaPorColuna(sheet, valorBusca, nomeColuna, cabecalhoAtual) {
  var valorLimpo = limparTexto(valorBusca);
  if (!valorLimpo || sheet.getLastRow() < 2) return -1;
  var indiceColuna = (cabecalhoAtual || []).indexOf(nomeColuna);
  if (indiceColuna === -1) return -1;

  var valores = sheet.getRange(2, indiceColuna + 1, sheet.getLastRow() - 1, 1).getValues();
  for (var i = 0; i < valores.length; i += 1) {
    if (limparTexto(valores[i][0]) === valorLimpo) return i + 2;
  }

  return -1;
}

function validarConsistenciaCaso(planilha, contexto) {
  var idCaso = limparTexto(contexto.idCaso);
  var talaoPMESP = limparTexto(contexto.talaoPMESP);
  var linhaPorIdCaso = contexto.linhaPorIdCaso;
  var linhaPorTalaoPMESP = contexto.linhaPorTalaoPMESP;

  if (linhaPorIdCaso > 1) {
    var sheetCasos = planilha.getSheetByName('CASOS');
    var cabecalho = sheetCasos.getRange(1, 1, 1, sheetCasos.getLastColumn()).getValues()[0].map(limparTexto);
    var indiceTalao = cabecalho.indexOf('talaoPMESP');
    var talaoSalvo = indiceTalao >= 0 ? limparTexto(sheetCasos.getRange(linhaPorIdCaso, indiceTalao + 1).getValue()) : '';

    if (talaoPMESP && talaoSalvo && talaoPMESP !== talaoSalvo) {
      registrarEventoOcorrencia(planilha, idCaso, 'CONFLITO_TALAO_PMESP', 'Bloqueio: idCaso existente com talaoPMESP divergente.');
      throw new Error('Conflito de consistência: idCaso já cadastrado com outro talaoPMESP. Atualização bloqueada.');
    }
    return;
  }

  if (linhaPorTalaoPMESP > 1) {
    var sheetCasosExistente = planilha.getSheetByName('CASOS');
    var cabecalhoExistente = sheetCasosExistente.getRange(1, 1, 1, sheetCasosExistente.getLastColumn()).getValues()[0].map(limparTexto);
    var indiceIdCaso = cabecalhoExistente.indexOf('idCaso');
    var idCasoExistente = indiceIdCaso >= 0 ? limparTexto(sheetCasosExistente.getRange(linhaPorTalaoPMESP, indiceIdCaso + 1).getValue()) : '';
    if (!idCaso || idCaso !== idCasoExistente) {
      var colunasAtualizadas = garantirColunasDaEstrutura(sheetCasosExistente, ESTRUTURA_PLANILHA.CASOS.concat(['flagDuplicidade']));
      var indiceFlagDuplicidade = colunasAtualizadas.indexOf('flagDuplicidade');
      if (indiceFlagDuplicidade >= 0) {
        sheetCasosExistente.getRange(linhaPorTalaoPMESP, indiceFlagDuplicidade + 1).setValue(true);
      }

      registrarEventoOcorrencia(planilha, idCaso || idCasoExistente, 'POSSIVEL_DUPLICIDADE_TALAO_PMESP', 'severidade=CRITICA; acao=BLOQUEADO_AUTOMATICAMENTE; talaoPMESP já vinculado a outro idCaso.');
      throw new Error('Duplicidade operacional detectada: talaoPMESP já vinculado a outro caso.');
    }
  }
}

function registrarEventoOcorrencia(planilha, idCaso, tipoEvento, descricaoEvento) {
  return registrarEventoOcorrenciaDetalhado_(planilha, idCaso, tipoEvento, descricaoEvento, {});
}

function registrarEventoOcorrenciaDetalhado_(planilha, idCaso, tipoEvento, descricaoEvento, metadados) {
  var sheetEventos = garantirAbaComCabecalho(planilha, 'EVENTOS_OCORRENCIA', ESTRUTURA_PLANILHA.EVENTOS_OCORRENCIA);
  var cabecalhoEventos = garantirColunasDaEstrutura(sheetEventos, ESTRUTURA_PLANILHA.EVENTOS_OCORRENCIA);
  var meta = metadados || {};
  var eventoPorColuna = {
    idCaso: limparTexto(idCaso),
    timestampEvento: formatarDataHora(new Date()),
    tipoEvento: limparTexto(tipoEvento),
    descricaoEvento: limparTexto(descricaoEvento),
    statusCaso: '',
    prioridade: '',
    classificacaoRisco: '',
    operadorEmail: limparTexto(meta.operadorEmail),
    operadorPerfil: limparTexto(meta.operadorPerfil || meta.perfil),
    dataHoraEdicao: normalizarValorPlanilha(meta.dataHoraEdicao || ''),
    quantidadeCamposAlterados: normalizarValorPlanilha(meta.quantidadeCamposAlterados || meta.totalAlteracoes || ''),
    justificativa: limparTexto(meta.justificativa)
  };

  var linhaEvento = cabecalhoEventos.map(function (nomeColuna) {
    return normalizarValorPlanilha(eventoPorColuna[nomeColuna]);
  });

  sheetEventos.appendRow(linhaEvento);
  return true;
}

function gerarTimelineCaso_(idCaso) {
  var idCasoLimpo = limparTexto(idCaso);
  if (!idCasoLimpo) throw new Error('idCaso obrigatório para gerar timeline.');

  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var timeline = [];

  timeline = timeline
    .concat(coletarEventosOcorrenciaTimeline_(planilha, idCasoLimpo))
    .concat(coletarHistoricoEdicoesTimeline_(planilha, idCasoLimpo));

  timeline.sort(function (a, b) {
    return obterTimestampOrdenacao_(a.dataHora) - obterTimestampOrdenacao_(b.dataHora);
  });

  return timeline;
}

function coletarEventosOcorrenciaTimeline_(planilha, idCaso) {
  var aba = planilha.getSheetByName('EVENTOS_OCORRENCIA');
  if (!aba || aba.getLastRow() < 2) return [];

  var cabecalho = garantirColunasDaEstrutura(aba, ESTRUTURA_PLANILHA.EVENTOS_OCORRENCIA).map(limparTexto);
  var idxIdCaso = cabecalho.indexOf('idCaso');
  var idxDataHora = cabecalho.indexOf('timestampEvento');
  var idxTipoEvento = cabecalho.indexOf('tipoEvento');
  var idxDescricao = cabecalho.indexOf('descricaoEvento');
  if (idxIdCaso < 0 || idxDataHora < 0 || idxTipoEvento < 0 || idxDescricao < 0) return [];

  var dados = aba.getRange(2, 1, aba.getLastRow() - 1, aba.getLastColumn()).getValues();
  return dados.filter(function (linha) {
    return limparTexto(linha[idxIdCaso]) === idCaso;
  }).map(function (linha) {
    var tipoEvento = limparTexto(linha[idxTipoEvento]);
    var descricao = limparTexto(linha[idxDescricao]);
    return {
      dataHora: normalizarValorPlanilha(linha[idxDataHora]),
      tipoEvento: tipoEvento,
      descricao: descricao,
      operador: extrairOperadorDeDescricao_(descricao),
      origem: inferirOrigemTimeline_(tipoEvento),
      resumo: montarResumoTimeline_(tipoEvento, descricao),
      detalhes: { fonte: 'EVENTOS_OCORRENCIA', descricaoEvento: descricao }
    };
  });
}

function coletarHistoricoEdicoesTimeline_(planilha, idCaso) {
  var aba = planilha.getSheetByName('HISTORICO_EDICOES');
  if (!aba || aba.getLastRow() < 2) return [];

  var colunas = ESTRUTURA_PLANILHA.HISTORICO_EDICOES;
  var cabecalho = garantirColunasDaEstrutura(aba, colunas).map(limparTexto);
  var idxIdCaso = cabecalho.indexOf('idCaso');
  var idxDataHora = cabecalho.indexOf('dataHoraEdicao');
  if (idxDataHora < 0) idxDataHora = cabecalho.indexOf('timestampEdicao');
  var idxOperador = cabecalho.indexOf('operadorEmail');
  var idxCampo = cabecalho.indexOf('campoAlterado');
  if (idxCampo < 0) idxCampo = cabecalho.indexOf('campo');
  var idxAnterior = cabecalho.indexOf('valorAnterior');
  var idxNovo = cabecalho.indexOf('valorNovo');
  var idxJustificativa = cabecalho.indexOf('justificativa');
  if (idxIdCaso < 0 || idxDataHora < 0) return [];

  var dados = aba.getRange(2, 1, aba.getLastRow() - 1, aba.getLastColumn()).getValues();
  return dados.filter(function (linha) {
    return limparTexto(linha[idxIdCaso]) === idCaso;
  }).map(function (linha) {
    var campo = limparTexto(linha[idxCampo]);
    var valorAnterior = normalizarValorPlanilha(linha[idxAnterior]);
    var valorNovo = normalizarValorPlanilha(linha[idxNovo]);
    var resumo = 'Campo "' + campo + '" alterado de "' + valorAnterior + '" para "' + valorNovo + '".';
    return {
      dataHora: normalizarValorPlanilha(linha[idxDataHora]),
      tipoEvento: 'CASO_EDITADO',
      descricao: resumo,
      operador: limparTexto(linha[idxOperador]),
      origem: 'EDICAO',
      resumo: resumo,
      detalhes: {
        fonte: 'HISTORICO_EDICOES',
        campo: campo,
        valorAnterior: valorAnterior,
        valorNovo: valorNovo,
        justificativa: normalizarValorPlanilha(linha[idxJustificativa])
      }
    };
  });
}

function inferirOrigemTimeline_(tipoEvento) {
  var tipo = limparTexto(tipoEvento).toUpperCase();
  if (tipo.indexOf('FOTO_') === 0) return 'FOTO';
  if (tipo === 'USO_EXCESSIVO_FOTO' || tipo === 'BLOQUEIO_TEMPORARIO_FOTO') return 'ACESSO';
  if (tipo === 'CASO_CRIADO' || tipo === 'DECISAO_OPERACIONAL') return 'CASOS';
  return 'CASOS';
}

function montarResumoTimeline_(tipoEvento, descricao) {
  var tipo = limparTexto(tipoEvento).toUpperCase();
  if (tipo === 'CASO_CRIADO') return 'Caso criado no sistema.';
  if (tipo === 'DECISAO_OPERACIONAL') return 'Decisão operacional registrada.';
  if (tipo === 'FOTO_ANEXADA') return 'Foto anexada ao caso.';
  if (tipo === 'FOTO_VALIDADA') return 'Foto validada por supervisor/admin.';
  if (tipo === 'FOTO_REJEITADA') return 'Foto rejeitada na validação.';
  if (tipo === 'FOTO_VISUALIZADA') return 'Foto visualizada por operador autorizado.';
  if (tipo === 'USO_EXCESSIVO_FOTO') return 'Uso excessivo de foto detectado.';
  return limparTexto(descricao) || 'Evento operacional registrado.';
}

function extrairOperadorDeDescricao_(descricao) {
  var texto = limparTexto(descricao);
  if (!texto) return '';
  var operador = texto.match(/operador=([^;]+)/i);
  if (operador && operador[1]) return limparTexto(operador[1]);
  var operadorTexto = texto.match(/Operador=([^;]+)/i);
  if (operadorTexto && operadorTexto[1]) return limparTexto(operadorTexto[1]);
  return '';
}

function obterTimestampOrdenacao_(dataHora) {
  var texto = limparTexto(dataHora);
  if (!texto) return 0;
  var convertidoIso = texto.replace(' ', 'T');
  var data = new Date(convertidoIso);
  if (!isNaN(data.getTime())) return data.getTime();
  return 0;
}

function mapearPorColuna(colunas, valores) {
  var registro = {};
  (colunas || []).forEach(function (coluna, indice) {
    registro[coluna] = indice < valores.length ? valores[indice] : '';
  });
  return registro;
}

function gerarRelatorioTextoSIOPM_(idCaso) {
  var caso = buscarCaso_({ idCaso: idCaso });
  if (!caso.length) return 'Caso não encontrado para relatório SIOPM.';
  var item = caso[0];
  return 'SIOPM | idCaso=' + limparTexto(item.idCaso) + '; talaoPMESP=' + limparTexto(item.talaoPMESP) + '; nome=' + limparTexto(item.nomeCompletoDesaparecido) + '; risco=' + limparTexto(item.classificacaoRisco) + '; prioridade=' + limparTexto(item.prioridade);
}
