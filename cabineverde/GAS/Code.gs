


var CABINE_VERDE_BUILD = '2026-05-03-181-CASOS-FIX';
var PERFIS_OPERADOR_VALIDOS = ['OPERADOR', 'SUPERVISOR', 'ADMIN', 'AUDITOR'];
const ID_PLANILHA_TALAO_190 = '1gq_zk5fYPTLdjDm8IeqTThgfaijqrwNo6PNk-9cKZGs';
const ABA_MODELO_TALAO = 'MODELO_TALAO';
const PRIMEIRA_LINHA_DADOS_TALAO = 7;

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

var SCHEMA_CABINE_VERDE = CABINE_VERDE_SCHEMA;
var SCHEMA_UNIFICADO = obterSchemaCabineVerdeUnificado_();

var ESTRUTURA_PLANILHA = {
  CASOS: Array.isArray(SCHEMA_UNIFICADO.CASOS) ? SCHEMA_UNIFICADO.CASOS : COLUNAS_CASOS,
  TRIAGEM_RESPOSTAS: COLUNAS_TRIAGEM_RESPOSTAS,
  EVENTOS_CASO: Array.isArray(SCHEMA_UNIFICADO.EVENTOS_CASO) ? SCHEMA_UNIFICADO.EVENTOS_CASO : COLUNAS_EVENTOS_OCORRENCIA,
  INDICADORES_OPERACIONAIS: COLUNAS_INDICADORES_OPERACIONAIS,
  HISTORICO_EDICOES: ['idEdicao','idCaso','talaoPMESP','campoAlterado','valorAnterior','valorNovo','operadorNome','operadorEmail','operadorPerfil','dataHoraEdicao','justificativa','emailConfirmado'],
  RELATORIO_OPERACIONAL: ['dataReferencia','qtdFotosRecebidas','qtdFotosValidadas','qtdFotosUtilizadas','qtdFotosRejeitadas','observacaoOcorrenciasImagem','geradoEm'],
  FOTOS_DESAPARECIDOS: typeof COLUNAS_FOTOS_DESAPARECIDOS !== 'undefined' ? COLUNAS_FOTOS_DESAPARECIDOS : [],
  OPERADORES: SCHEMA_CABINE_VERDE.OPERADORES,
  Logs_GAS: ['timestamp', 'etapa', 'ok', 'mensagem', 'rawPostData', 'payloadIdCaso'],
  QUALIDADE_DADOS: ['dataHoraAuditoria','idCaso','talaoPMESP','campo','problema','severidade','prioridadeTratamento','acaoRecomendada','statusTratamento','responsavelTratamento','dataHoraResolucao']
};

var CACHE_OPERADORES_TTL_SEGUNDOS = 300;
var CACHE_IDEMPOTENCIA_TTL_SEGUNDOS = 21600;
var ABA_LOG_AUDITORIA = 'LOG_AUDITORIA';
var COLUNAS_LOG_AUDITORIA = ['dataHora', 'status', 'chaveUnica', 'acaoExecutada', 'nomeDesaparecido', 'solicitante', 'telefone', 'operador', 'mensagemTecnica'];

function obterOperadoresCache_() {
  var cache = CacheService.getScriptCache();
  var bruto = cache.get('cabineverde:operadores');
  if (!bruto) return null;
  try {
    return JSON.parse(bruto);
  } catch (_erro) {
    return null;
  }
}

function salvarOperadoresCache_(operadores) {
  var cache = CacheService.getScriptCache();
  cache.put('cabineverde:operadores', JSON.stringify(operadores || []), CACHE_OPERADORES_TTL_SEGUNDOS);
}

function carregarOperadoresDaPlanilha_(abaOperadores) {
  var dados = abaOperadores.getDataRange().getValues();
  var cabecalho = (dados[0] || []).map(function (h) { return limparTexto(h).toUpperCase(); });
  var idxEmail = cabecalho.indexOf('EMAIL');
  var idxNome = cabecalho.indexOf('NOME');
  var idxPerfil = cabecalho.indexOf('PERFIL');
  var idxAtivo = cabecalho.indexOf('ATIVO');
  if (idxEmail < 0 || idxNome < 0 || idxPerfil < 0 || idxAtivo < 0) return { invalido: true, operadores: [] };
  var operadores = [];
  for (var i = 1; i < dados.length; i += 1) {
    var row = dados[i];
    operadores.push({
      email: limparTexto(row[idxEmail]).toLowerCase(),
      nome: limparTexto(row[idxNome]),
      perfil: normalizarPerfilOperador_(row[idxPerfil]),
      ativo: limparTexto(row[idxAtivo]).toUpperCase()
    });
  }
  salvarOperadoresCache_(operadores);
  return { invalido: false, operadores: operadores };
}


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

function registrarLogAcessoOperador_(planilha, tipoEvento, status, mensagem, email, detalhes) {
  var colunasLog = ['dataHora','tipoEvento','status','mensagem','email','perfil','resultado','motivoBloqueio','acaoExecutada','talaoPMESP'];
  var abaLog = garantirAbaComCabecalho(planilha, 'LOG_ACESSO', colunasLog);
  var cabecalhoLog = garantirColunasDaEstrutura(abaLog, colunasLog).map(limparTexto);
  var det = detalhes && typeof detalhes === 'object' ? detalhes : {};
  var evento = {
    dataHora: formatarDataHora(new Date()),
    tipoEvento: limparTexto(tipoEvento),
    status: limparTexto(status),
    mensagem: limparTexto(mensagem),
    email: limparTexto(email),
    perfil: limparTexto(det.perfil),
    resultado: limparTexto(status),
    motivoBloqueio: limparTexto(status).indexOf('BLOQUEADO') !== -1 ? limparTexto(mensagem) : '',
    acaoExecutada: limparTexto(det.acaoExecutada || tipoEvento),
    talaoPMESP: limparTexto(det.talaoPMESP)
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


function obterColunasEventosCaso_() {
  var schema = obterSchemaCabineVerdeUnificado_();
  var colunasEventos = Array.isArray(schema.EVENTOS_CASO) ? schema.EVENTOS_CASO : [];
  Logger.log("TOTAL COLUNAS EVENTOS_CASO: " + colunasEventos.length);
  if (!Array.isArray(colunasEventos) || colunasEventos.length === 0) {
    throw new Error("Schema EVENTOS_CASO inválido.");
  }
  return colunasEventos;
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
  garantirEstruturaCabineVerde_();
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  garantirEstruturaCabineVerde_();
  var colunasCasosBusca = obterSchemaCabineVerdeUnificado_().CASOS;
  var abaCasos = garantirAbaComCabecalho(planilha, 'CASOS', colunasCasosBusca);
  var abasBusca = [abaCasos, planilha.getSheetByName('Desaparecidos'), planilha.getSheetByName('CASOS_TRATADOS')].filter(Boolean);
  if (abasBusca.every(function(a){ return a.getLastRow() < 2; })) return [];

  var filtroObj = filtro && typeof filtro === 'object' ? filtro : { termo: filtro };
  var termo = limparTexto(filtroObj.termo).toLowerCase();
  var termoId = limparTexto(filtroObj.idCaso).toLowerCase();
  var termoNome = limparTexto(filtroObj.nomeCompletoDesaparecido).toLowerCase();
  var termoData = limparTexto(filtroObj.dataRegistro || filtroObj.dataServico || filtroObj.data || '').toLowerCase();
  var termosTalao = [filtroObj.talaoPMESP, filtroObj.talaoBopm, filtroObj.talao, filtroObj.numeroTalao, termo]
    .map(function (valor) { return limparTexto(valor).toLowerCase(); })
    .filter(Boolean);
  if (!termo && !termoId && !termoNome && !termosTalao.length && !termoData) return [];

  var resultados = [];
  abasBusca.forEach(function (abaAtual) {
    if (abaAtual.getLastRow() < 2) return;
    var cabecalho = garantirColunasDaEstrutura(abaAtual, colunasCasosBusca).map(limparTexto);
    var idxIdCaso = cabecalho.indexOf('idCaso');
    var idxTalaoPMESP = cabecalho.indexOf('talaoPMESP');
    var idxTalaoBopm = cabecalho.indexOf('talaoBopm');
    var idxTalao = cabecalho.indexOf('talao');
    var idxNumeroTalao = cabecalho.indexOf('numeroTalao');
    var idxNome = cabecalho.indexOf('nomeCompletoDesaparecido');
    var idxMunicipio = cabecalho.indexOf('municipio');
    var idxDataRegistro = cabecalho.indexOf('dataHoraRegistro');
    var idxDataServico = cabecalho.indexOf('dataServico');
    var idxTelefoneSolicitante = cabecalho.indexOf('telefoneSolicitante');
    var idxNomeSolicitante = cabecalho.indexOf('nomeSolicitante');
    if (idxIdCaso < 0 && idxTalaoPMESP < 0 && idxTalaoBopm < 0 && idxTalao < 0 && idxNumeroTalao < 0 && idxNome < 0) return;
    var dados = abaAtual.getRange(2, 1, abaAtual.getLastRow() - 1, abaAtual.getLastColumn()).getValues();

    resultados = resultados.concat(dados.filter(function (linha) {
    var idCaso = limparTexto(idxIdCaso >= 0 ? linha[idxIdCaso] : '').toLowerCase();
    var nome = limparTexto(idxNome >= 0 ? linha[idxNome] : '').toLowerCase();
    var talaoCampos = [idxTalaoPMESP, idxTalaoBopm, idxTalao, idxNumeroTalao]
      .map(function (idx) { return limparTexto(idx >= 0 ? linha[idx] : '').toLowerCase(); })
      .filter(Boolean);
    var dataRegistroLinha = limparTexto(idxDataRegistro >= 0 ? linha[idxDataRegistro] : '').toLowerCase();
    var dataServicoLinha = limparTexto(idxDataServico >= 0 ? linha[idxDataServico] : '').toLowerCase();
    var dataRegistroNormalizada = dataRegistroLinha ? dataRegistroLinha.slice(0, 10) : '';
    var dataServicoNormalizada = dataServicoLinha ? dataServicoLinha.slice(0, 10) : '';
    var dataBuscaNormalizada = termoData ? termoData.slice(0, 10) : '';

    var camposBuscaLivre = [idCaso, nome]
      .concat(talaoCampos)
      .concat([
        dataRegistroLinha,
        dataServicoLinha,
        limparTexto(idxMunicipio >= 0 ? linha[idxMunicipio] : '').toLowerCase(),
        limparTexto(idxTelefoneSolicitante >= 0 ? linha[idxTelefoneSolicitante] : '').toLowerCase(),
        limparTexto(idxNomeSolicitante >= 0 ? linha[idxNomeSolicitante] : '').toLowerCase()
      ]);

    var dataConfere = !dataBuscaNormalizada || dataRegistroNormalizada === dataBuscaNormalizada || dataServicoNormalizada === dataBuscaNormalizada;

    if (termoId && (idCaso === termoId || idCaso.indexOf(termoId) !== -1)) return dataConfere;
    if (termosTalao.length && termosTalao.some(function (t) { return talaoCampos.indexOf(t) !== -1; })) return dataConfere;
    if (termosTalao.length && termosTalao.some(function (t) { return talaoCampos.some(function (campo) { return campo.indexOf(t) !== -1; }); })) return dataConfere;
    if (termoNome && nome.indexOf(termoNome) !== -1) return dataConfere;
    if (termoData && dataConfere) {
      var talhaoFoiInformado = termosTalao.length > 0;
      if (talhaoFoiInformado || termoId || termoNome) return true;
    }
    if (termo && camposBuscaLivre.some(function (campo) { return campo.indexOf(termo) !== -1; })) return dataConfere;
    return false;
    }).map(function (linha) {
      var caso = {};
      cabecalho.forEach(function (coluna, index) { caso[coluna] = normalizarValorPlanilha(linha[index]); });
      return caso;
    }));
  });
  return resultados;
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
  garantirEstruturaCabineVerde_();
  var colunasCasosEdicao = obterSchemaCabineVerdeUnificado_().CASOS;
  var abaCasos = garantirAbaComCabecalho(planilha, 'CASOS', colunasCasosEdicao);
  var cabecalho = garantirColunasDaEstrutura(abaCasos, colunasCasosEdicao).map(limparTexto);
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

function obterCasoCompleto_(filtro) {
  var resultados = buscarCaso_(filtro || {});
  if (!Array.isArray(resultados) || !resultados.length) return null;
  var caso = resultados[0];
  if (limparTexto(caso.statusDuplicidade).toLowerCase() === 'duplicado' && limparTexto(caso.duplicadoDe)) {
    var principal = buscarCaso_({ idCaso: limparTexto(caso.duplicadoDe) });
    if (Array.isArray(principal) && principal.length) return principal[0];
  }
  return caso;
}



function normalizarTextoDuplicidade_(valor) {
  var texto = limparTexto(valor).toLowerCase();
  if (!texto) return '';
  texto = texto.normalize('NFD').replace(/[̀-ͯ]/g, '');
  texto = texto.replace(/\s+/g, ' ').trim();
  return texto;
}

function normalizarMunicipioDuplicidade_(municipio) {
  var texto = normalizarTextoDuplicidade_(municipio);
  if (!texto) return '';
  var mapa = {
    'sao paulo - sp': 'sao paulo',
    'sao paulo/sp': 'sao paulo',
    's p': 'sao paulo',
    'sp': 'sao paulo'
  };
  return mapa[texto] || texto;
}

function normalizarDataServicoDuplicidade_(valor) {
  if (Object.prototype.toString.call(valor) === '[object Date]' && !isNaN(valor.getTime())) {
    return Utilities.formatDate(valor, Session.getScriptTimeZone() || 'America/Sao_Paulo', 'yyyy-MM-dd');
  }
  var texto = limparTexto(valor);
  if (!texto) return '';
  var data = new Date(texto);
  if (!isNaN(data.getTime())) {
    return Utilities.formatDate(data, Session.getScriptTimeZone() || 'America/Sao_Paulo', 'yyyy-MM-dd');
  }
  return normalizarTextoDuplicidade_(texto);
}

function montarAssinaturaCasoDuplicidade_(registro) {
  var nome = normalizarTextoDuplicidade_(registro.nomeCompletoDesaparecido);
  var idade = normalizarTextoDuplicidade_(registro.idade);
  var municipio = normalizarMunicipioDuplicidade_(registro.municipio);
  var dataServico = normalizarDataServicoDuplicidade_(registro.dataServico);
  return [nome, idade, municipio, dataServico].join('|');
}

function contarCamposPreenchidosDuplicidade_(registro) {
  var total = 0;
  Object.keys(registro || {}).forEach(function (chave) {
    if (chave === '_meta') return;
    if (limparTexto(registro[chave])) total += 1;
  });
  return total;
}

function garantirColunasDuplicidadeCasos_(abaCasos, cabecalho) {
  var colunas = ['assinaturaCaso','duplicadoDe','statusDuplicidade','dataAnaliseDuplicidade','observacaoDuplicidade'];
  var atual = cabecalho.slice();
  colunas.forEach(function (coluna) {
    if (atual.indexOf(coluna) === -1) {
      abaCasos.getRange(1, atual.length + 1).setValue(coluna);
      atual.push(coluna);
      Logger.log('SANEAMENTO_DUPLICADOS coluna adicionada: ' + coluna);
    }
  });
  return atual;
}

function analisarDuplicadosCasos_() {
  garantirEstruturaCabineVerde_();
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var schema = obterSchemaCabineVerdeUnificado_();
  var abaCasos = garantirAbaComCabecalho(planilha, 'CASOS', schema.CASOS);
  var cabecalho = garantirColunasDaEstrutura(abaCasos, schema.CASOS);
  cabecalho = garantirColunasDuplicidadeCasos_(abaCasos, cabecalho);
  var totalRegistros = Math.max(abaCasos.getLastRow() - 1, 0);
  if (!totalRegistros) {
    var vazio = { totalRegistrosAnalisados: 0, totalGruposDuplicados: 0, totalRegistrosDuplicados: 0, grupos: [] };
    Logger.log('SANEAMENTO_DUPLICADOS sem registros para análise.');
    return vazio;
  }

  var dados = abaCasos.getRange(2, 1, totalRegistros, abaCasos.getLastColumn()).getValues();
  var gruposPorAssinatura = {};
  dados.forEach(function (linha, idx) {
    var registro = {};
    cabecalho.forEach(function (coluna, cidx) { registro[coluna] = linha[cidx]; });
    var assinatura = montarAssinaturaCasoDuplicidade_(registro);
    if (!gruposPorAssinatura[assinatura]) gruposPorAssinatura[assinatura] = [];
    gruposPorAssinatura[assinatura].push({
      linhaPlanilha: idx + 2,
      idCaso: limparTexto(registro.idCaso),
      nomeCompletoDesaparecido: limparTexto(registro.nomeCompletoDesaparecido),
      idade: limparTexto(registro.idade),
      municipio: limparTexto(registro.municipio),
      dataServico: limparTexto(registro.dataServico),
      talaoPMESP: limparTexto(registro.talaoPMESP),
      talaoBopm: limparTexto(registro.talaoBopm),
      preenchimento: contarCamposPreenchidosDuplicidade_(registro),
      dataHoraRegistro: limparTexto(registro.dataHoraRegistro),
      assinaturaCaso: assinatura
    });
  });

  var grupos = [];
  Object.keys(gruposPorAssinatura).forEach(function (assinatura) {
    var itens = gruposPorAssinatura[assinatura];
    if (!itens || itens.length < 2 || !assinatura.replace(/\|/g, '')) return;
    itens.sort(function (a, b) {
      var aTemTalao = a.talaoPMESP || a.talaoBopm ? 1 : 0;
      var bTemTalao = b.talaoPMESP || b.talaoBopm ? 1 : 0;
      if (bTemTalao !== aTemTalao) return bTemTalao - aTemTalao;
      if (b.preenchimento !== a.preenchimento) return b.preenchimento - a.preenchimento;
      var dataA = new Date(a.dataHoraRegistro || '9999-12-31T23:59:59Z').getTime();
      var dataB = new Date(b.dataHoraRegistro || '9999-12-31T23:59:59Z').getTime();
      return dataA - dataB;
    });
    var principal = itens[0];
    var duplicados = itens.slice(1);
    grupos.push({ assinaturaCaso: assinatura, principal: principal, duplicados: duplicados });
  });

  var totalDuplicados = grupos.reduce(function (acc, g) { return acc + g.duplicados.length; }, 0);
  var relatorio = {
    totalRegistrosAnalisados: totalRegistros,
    totalGruposDuplicados: grupos.length,
    totalRegistrosDuplicados: totalDuplicados,
    grupos: grupos.map(function (g) {
      return {
        assinaturaCaso: g.assinaturaCaso,
        idCasoPrincipal: g.principal.idCaso,
        idsDuplicados: g.duplicados.map(function (d) { return d.idCaso; }),
        nome: g.principal.nomeCompletoDesaparecido,
        idade: g.principal.idade,
        municipio: g.principal.municipio,
        dataServico: g.principal.dataServico
      };
    })
  };
  Logger.log('SANEAMENTO_DUPLICADOS_ANALISE ' + JSON.stringify({ totalRegistros: totalRegistros, grupos: relatorio.totalGruposDuplicados, duplicados: totalDuplicados }));
  return relatorio;
}

function marcarDuplicadosCasos_(opcoes) {
  var cfg = opcoes && typeof opcoes === 'object' ? opcoes : {};
  if (cfg.simulacao) {
    var simulacao = analisarDuplicadosCasos_();
    Logger.log('SANEAMENTO_DUPLICADOS_MARCACAO_SIMULACAO ' + JSON.stringify(simulacao));
    return { simulacao: true, relatorio: simulacao };
  }
  var relatorio = analisarDuplicadosCasos_();
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var schema = obterSchemaCabineVerdeUnificado_();
  var abaCasos = garantirAbaComCabecalho(planilha, 'CASOS', schema.CASOS);
  var cabecalho = garantirColunasDuplicidadeCasos_(abaCasos, garantirColunasDaEstrutura(abaCasos, schema.CASOS));
  var idxAss = cabecalho.indexOf('assinaturaCaso') + 1;
  var idxDupDe = cabecalho.indexOf('duplicadoDe') + 1;
  var idxStatus = cabecalho.indexOf('statusDuplicidade') + 1;
  var idxData = cabecalho.indexOf('dataAnaliseDuplicidade') + 1;
  var idxObs = cabecalho.indexOf('observacaoDuplicidade') + 1;
  var agora = formatarDataHora(new Date());

  relatorio.grupos.forEach(function (grupo) {
    var mapa = grupo;
    // precisa localizar linhas por idCaso para marcação segura
    var encontrados = buscarCaso_({ idCaso: mapa.idCasoPrincipal }).slice(0, 1);
    if (encontrados.length) {
      var linhaPrincipal = localizarCasoPorId(abaCasos, mapa.idCasoPrincipal, cabecalho);
      if (linhaPrincipal > 1) {
        abaCasos.getRange(linhaPrincipal, idxAss).setValue(grupo.assinaturaCaso);
        abaCasos.getRange(linhaPrincipal, idxStatus).setValue('principal');
        abaCasos.getRange(linhaPrincipal, idxDupDe).setValue('');
        abaCasos.getRange(linhaPrincipal, idxData).setValue(agora);
        abaCasos.getRange(linhaPrincipal, idxObs).setValue('Registro principal definido por saneamento automático');
      }
    }
    (grupo.idsDuplicados || []).forEach(function (idDup) {
      var linhaDup = localizarCasoPorId(abaCasos, idDup, cabecalho);
      if (linhaDup > 1) {
        abaCasos.getRange(linhaDup, idxAss).setValue(grupo.assinaturaCaso);
        abaCasos.getRange(linhaDup, idxStatus).setValue('duplicado');
        abaCasos.getRange(linhaDup, idxDupDe).setValue(mapa.idCasoPrincipal);
        abaCasos.getRange(linhaDup, idxData).setValue(agora);
        abaCasos.getRange(linhaDup, idxObs).setValue('Duplicado identificado por saneamento automático');
      }
    });
  });
  Logger.log('SANEAMENTO_DUPLICADOS_MARCACAO_EXECUTADA ' + JSON.stringify({ grupos: relatorio.totalGruposDuplicados, duplicados: relatorio.totalRegistrosDuplicados }));
  return { simulacao: false, relatorio: relatorio };
}

function gerarRelatorioDuplicadosCasos_() {
  var relatorio = analisarDuplicadosCasos_();
  Logger.log('SANEAMENTO_DUPLICADOS_RELATORIO ' + JSON.stringify(relatorio));
  return relatorio;
}

function doGet(e) {
  var parametro = e && e.parameter ? e.parameter : {};
  var action = limparTexto(parametro.action);
  if (action === 'buscarCasoCompleto') {
    var filtro = {
      idCaso: limparTexto(parametro.idCaso),
      talaoPMESP: limparTexto(parametro.talaoPMESP),
      talaoBopm: limparTexto(parametro.talaoBopm),
      talao: limparTexto(parametro.talao),
      numeroTalao: limparTexto(parametro.numeroTalao),
      nomeCompletoDesaparecido: limparTexto(parametro.nomeCompletoDesaparecido),
      termo: limparTexto(parametro.termo)
    };
    if (!filtro.idCaso && !filtro.talaoPMESP && !filtro.talaoBopm && !filtro.talao && !filtro.numeroTalao && !filtro.nomeCompletoDesaparecido && !filtro.termo) {
      return criarRespostaJson({ ok: false, erro: 'Ausência de identificador do caso.', codigo: 'ID_OBRIGATORIO' }, 400);
    }
    var caso = obterCasoCompleto_(filtro);
    if (!caso) return criarRespostaJson({ ok: false, erro: 'Caso não encontrado.', codigo: 'CASO_NAO_ENCONTRADO' }, 404);
    return criarRespostaJson({ ok: true, data: { caso: caso } });
  }
  return jsonResponse_({
    ok: true,
    service: 'cabineverde',
    build: CABINE_VERDE_BUILD,
    message: 'Endpoint ativo',
    httpStatus: 200
  });
}

function doPost(e) {
  Logger.log('DEBUG_FLUXO_SALVARCASO: doPost inicio');
  var planilhaLogs = obterPlanilhaLogs();
  try {
    Logger.log("POST RECEBIDO:");
    Logger.log(e && e.postData ? e.postData.contents : '');
    registrarLogTecnico(planilhaLogs, { etapa: 'POST_RECEBIDO', ok: true, mensagem: 'Requisição POST recebida pelo Web App', rawPostData: extrairRawPostData(e), payloadIdCaso: extrairIdCasoBruto(e) });
    var body = parsePayload(e);
    if (limparTexto(body.action) === 'validarOperador') {
      return criarRespostaJson(validarOperador_(body.operadorEmail, body));
    }
    if (limparTexto(body.action) === 'diagnosticoBuild') {
      var schema = obterSchemaCabineVerdeUnificado_();
      return jsonResponse_({
        ok: true,
        build: CABINE_VERDE_BUILD,
        schemaCasos: Array.isArray(schema.CASOS) ? schema.CASOS.length : 0,
        schemaEventosCaso: Array.isArray(schema.EVENTOS_CASO),
        httpStatus: 200
      });
    }
    var operadorAtual = validarOperadorPayloadOuSessao_(body);
    registrarLogTecnico(planilhaLogs, { etapa: 'PAYLOAD_RECEBIDO', ok: true, mensagem: 'Payload recebido e parseado com sucesso', rawPostData: extrairRawPostData(e), payloadIdCaso: limparTexto((body.payload && body.payload.idCaso) || (body.dados && body.dados.idCaso) || body.idCaso) });
    var acaoOriginal = limparTexto(body.action);
    var action = acaoOriginal || 'salvarCaso';
    var acao = action.toUpperCase();
    var aliases = { 'perfil-operador': 'listarPerfilOperador', 'buscarCaso_': 'buscarCaso', 'gerarTimelineCaso_': 'gerarTimelineCaso', 'resumoQualidadeDados_': 'resumoQualidadeDados', 'marcarProblemaQualidadeResolvido_': 'marcarProblemaQualidadeResolvido' };
    action = aliases[action] || action;

    if (action === 'healthcheck') {
      return criarRespostaJson({ ok: true, data: { service: 'cabineverde', message: 'Endpoint ativo' } });
    }
    if (action === 'testeSalvarCasoWebApp') {
      return jsonResponse_(testarSalvarCasoPayloadMinimo181());
    }
    if (action === 'salvarAuditoriaCaso') {
      return criarRespostaJson(salvarAuditoriaCaso_(body, operadorAtual));
    }

    if (action === 'salvarCaso') {
      Logger.log("GRAVANDO CASO:");
      Logger.log(body);
      Logger.log('DEBUG_FLUXO_SALVARCASO: doPost salvarCaso payload=' + JSON.stringify({
        colunasArray: Array.isArray(body && body.colunas),
        colunasLength: Array.isArray(body && body.colunas) ? body.colunas.length : null,
        valoresArray: Array.isArray(body && body.valores),
        valoresLength: Array.isArray(body && body.valores) ? body.valores.length : null
      }));
    }

    var mapaPermissao = {
      visualizarFotoDesaparecido: 'VISUALIZAR_FOTO_INTERNO',
      validarFotoDesaparecido: 'VALIDAR_REJEITAR_FOTO',
      editarCasoControlado: 'EDITAR_CASO_CONTROLADO',
      listarPerfilOperador: 'GERIR_OPERADORES',
      gerarBackupBase: 'GERIR_OPERADORES',
      restaurarBackupBase: 'GERIR_OPERADORES',
      listarCasosPorStatus: 'REGISTRAR_CASO',
      gerarRelatorioCasos: 'REGISTRAR_CASO',
      analisarDuplicadosCasos: 'REGISTRAR_CASO',
      marcarDuplicadosCasos: 'REGISTRAR_CASO',
      gerarRelatorioDuplicadosCasos: 'REGISTRAR_CASO'
    };
    var validacaoAcao = validarPermissaoAcao_(operadorAtual, mapaPermissao[action] || 'REGISTRAR_CASO');
    if (!validacaoAcao.permitido) {
      registrarLogAcessoOperador_(SpreadsheetApp.getActiveSpreadsheet(), "ACESSO_NEGADO", "SEM_PERMISSAO_ACAO", "Ação bloqueada: " + acao + "; motivo=" + validacaoAcao.motivo, operadorAtual.email);
      throw new Error("Ação não permitida para o perfil do operador.");
    }
    var perfilAcao = normalizarPerfilOperador_(operadorAtual && operadorAtual.perfil);
    if (action === 'marcarDuplicadosCasos' && perfilAcao !== 'ADMIN') throw new Error('Apenas ADMIN pode marcar duplicados.');
    if ((action === 'analisarDuplicadosCasos' || action === 'gerarRelatorioDuplicadosCasos') && ['ADMIN','SUPERVISOR'].indexOf(perfilAcao) === -1) throw new Error('Somente ADMIN ou SUPERVISOR podem analisar/gerar relatório de duplicados.');
    if (action === 'visualizarFotoDesaparecido') {
      var respostaFoto = visualizarFotoDesaparecido_(body.idFoto, body.operador, body.justificativa, body.motivoAcessoFoto);
      return criarRespostaJson({ ok: true, data: { message: 'Visualização autorizada', conteudoBase64: respostaFoto.conteudoBase64, mimeType: respostaFoto.mimeType, idCaso: respostaFoto.idCaso, idFoto: respostaFoto.idFoto } });
    }
    if (action === 'uploadFotoCaso') {
      var payloadFoto = body.payload || {};
      var resultadoUpload = salvarFotoDesaparecido_({
        idCaso: limparTexto(payloadFoto.idCaso),
        talaoPMESP: limparTexto(payloadFoto.talaoPMESP),
        nomeDesaparecido: limparTexto(payloadFoto.nomeDesaparecido),
        operadorResponsavel: limparTexto(payloadFoto.operadorResponsavel),
        origemFoto: limparTexto(payloadFoto.origemFoto),
        tipoFoto: limparTexto(payloadFoto.tipoFoto),
        autorizacaoUsoImagem: !!payloadFoto.autorizacaoUsoImagem,
        base64: limparTexto(payloadFoto.base64),
        nomeArquivo: limparTexto(payloadFoto.nomeArquivo),
        mimeType: limparTexto(payloadFoto.mimeType)
      });
      limparFotosTemporarias_();
      return criarRespostaJson({ ok: true, data: { action: 'uploadFotoCaso', urlFoto: resultadoUpload.linkArquivo, linkArquivo: resultadoUpload.linkArquivo, fileIdDrive: resultadoUpload.fileIdDrive } });
    }
    if (action === 'atualizarFotoCaso') {
      var payloadAtualizacaoFoto = body.payload || {};
      var retornoAtualizacaoFoto = atualizarFotoCaso_({
        idCaso: limparTexto(payloadAtualizacaoFoto.idCaso || body.idCaso),
        talaoPMESP: limparTexto(payloadAtualizacaoFoto.talaoPMESP || body.talaoPMESP),
        fotoDisponivel: limparTexto(payloadAtualizacaoFoto.fotoDisponivel || body.fotoDisponivel || 'Sim'),
        linkFoto: limparTexto(payloadAtualizacaoFoto.linkFoto || body.linkFoto),
        urlFoto: limparTexto(payloadAtualizacaoFoto.urlFoto || body.urlFoto)
      });
      return criarRespostaJson({ ok: true, data: retornoAtualizacaoFoto });
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
    if (action === 'buscarCasoCompleto') {
      var filtroCompleto = body.filtro || body.payload || {
        idCaso: body.idCaso,
        talaoPMESP: body.talaoPMESP,
        nomeCompletoDesaparecido: body.nomeCompletoDesaparecido,
        termo: body.termo
      };
      var casoCompleto = obterCasoCompleto_(filtroCompleto);
      if (!casoCompleto) return criarRespostaJson({ ok: false, erro: 'Caso não encontrado.', codigo: 'CASO_NAO_ENCONTRADO' }, 404);
      return criarRespostaJson({ ok: true, data: { caso: casoCompleto } });
    }
    if (action === 'gerarTimelineCaso') return criarRespostaJson({ ok: true, data: gerarTimelineCaso_(body.idCaso) });
    if (action === 'editarCasoControlado') return criarRespostaJson({ ok: true, data: editarCasoControlado_(body.idCaso, body.operador, body.alteracoes, body.justificativa, body.emailConfirmacaoOperador) });
    if (action === 'validarFotoDesaparecido') return criarRespostaJson({ ok: true, data: validarFotoDesaparecido_(body.idFoto, body.operador || operadorAtual, body.status) });
    if (action === 'auditarQualidadeDados') return criarRespostaJson({ ok: true, data: auditarQualidadeDados_() });
    if (action === 'enviarFeedback') return criarRespostaJson({ ok: true, data: { recebido: true, feedback: body.payload || body.feedback || {} } });
    if (action === 'gerarRelatorioTextoSIOPM') return criarRespostaJson({ ok: true, data: { relatorio: gerarRelatorioTextoSIOPM_(body.idCaso || (body.payload && body.payload.idCaso)) } });
    if (action === 'gerarRelatorioOperacionalComImagem') return criarRespostaJson({ ok: true, data: gerarRelatorioOperacionalComImagem_(body.dataReferencia) });
    if (action === 'listarPerfilOperador') return criarRespostaJson({ ok: true, data: operadorAtual });
    if (action === 'gerarBackupBase') return criarRespostaJson({ ok: true, data: gerarBackupBase_(operadorAtual) });
    if (action === 'restaurarBackupBase') return criarRespostaJson({ ok: true, data: restaurarBackupBase_(body.backup, operadorAtual) });
    if (action === 'listarCasosPorStatus') return criarRespostaJson({ ok: true, data: listarCasosPorStatus_(body.status) });
    if (action === 'gerarRelatorioCasos') return criarRespostaJson({ ok: true, data: gerarRelatorioCasos_(body.status) });
    if (action === 'analisarDuplicadosCasos') return criarRespostaJson({ ok: true, data: analisarDuplicadosCasos_() });
    if (action === 'marcarDuplicadosCasos') return criarRespostaJson({ ok: true, data: marcarDuplicadosCasos_({ simulacao: !!body.simulacao }) });
    if (action === 'gerarRelatorioDuplicadosCasos') return criarRespostaJson({ ok: true, data: gerarRelatorioDuplicadosCasos_() });

    var planilha = SpreadsheetApp.getActiveSpreadsheet();
    if (action === 'salvarCaso') {
      var schemaSalvarCaso = obterSchemaCabineVerdeUnificado_();
      var colunasCasosSalvar = Array.isArray(body.colunas) && body.colunas.length ? body.colunas : schemaSalvarCaso.CASOS;
      Logger.log('DEBUG_FLUXO_SALVARCASO: doPost garantir CASOS=' + JSON.stringify({
        origem: Array.isArray(body.colunas) && body.colunas.length ? 'payload.colunas' : 'schema.CASOS',
        length: Array.isArray(colunasCasosSalvar) ? colunasCasosSalvar.length : null
      }));
      garantirAbaComCabecalhos_(planilha, 'CASOS', colunasCasosSalvar);
    } else {
      garantirEstruturaCabineVerde_();
    }

    if (body.payload && typeof body.payload === 'object') body.payload = normalizarTalaoPayload(body.payload);
    if (body.dados && typeof body.dados === 'object') body.dados = normalizarTalaoPayload(body.dados);
    body = normalizarTalaoPayload(body);
    var registros = body.abas && Array.isArray(body.abas) ? body.abas : [body];
    var idCaso = limparTexto((body.payload && body.payload.idCaso) || (body.dados && body.dados.idCaso));
    var talao = limparTexto((body.payload && body.payload.talaoPMESP) || (body.dados && body.dados.talaoPMESP) || body.talaoPMESP);
    var revalidacao = validarOperador_(operadorAtual.email, body || {});
    if (!revalidacao.ok || !revalidacao.autorizado) {
      registrarLogAcessoOperador_(planilha, 'GRAVACAO_BLOQUEADA', 'OPERADOR_NAO_REVALIDADO', 'Operador não revalidado na aba OPERADORES antes da gravação.', operadorAtual.email, { perfil: operadorAtual.perfil, acaoExecutada: action, talaoPMESP: talao });
      throw new Error('Operador não validado para gravação.');
    }
    registrarLogTecnico(planilhaLogs, { etapa: 'GRAVACAO_INICIADA', ok: true, mensagem: 'Iniciando persistência em abas de destino', rawPostData: extrairRawPostData(e), payloadIdCaso: idCaso });

    var chaveRequisicao = limparTexto(body.chaveRequisicao || (body.payload && body.payload.chaveRequisicao));
    var chaveUnica = limparTexto(body.chaveUnica || (body.payload && body.payload.chaveUnica) || chaveRequisicao);
    var cacheIdempotencia = CacheService.getScriptCache();

    var lock = null;
    if (action === 'salvarCaso') {
      lock = LockService.getScriptLock();
      lock.waitLock(20000);
    }

    var resultadoPersistencia = { idCaso: idCaso, action: 'updated', linha: -1, status: 'sucesso', message: 'Gravação multiabas concluída' };
    try {
      if (action === 'salvarCaso' && chaveUnica) {
        var marcador = cacheIdempotencia.get('salvarCaso:' + chaveUnica);
        if (marcador) {
          registrarLogAuditoriaPersistencia_(planilha, { dataHora: formatarDataHora(new Date()), status: 'duplicado_ignorado', chaveUnica: chaveUnica, acaoExecutada: 'CACHE_HIT', nomeDesaparecido: limparTexto((body.payload && body.payload.nomeCompletoDesaparecido) || body.nomeCompletoDesaparecido), solicitante: limparTexto((body.payload && body.payload.nomeSolicitante) || body.nomeSolicitante), telefone: limparTexto((body.payload && body.payload.telefoneSolicitante) || body.telefoneSolicitante), operador: limparTexto(operadorAtual && operadorAtual.email), mensagemTecnica: 'Requisição duplicada ignorada por idempotência no CacheService.' });
          return criarRespostaJson({ ok: true, status: 'duplicado_ignorado', data: { action: 'ignored', idCaso: idCaso, linha: -1, message: 'Requisição duplicada ignorada por idempotência' } });
        }
      }

      registros.forEach(function (registro) {
        var parcial = persistirRegistro(planilha, registro) || {};
        if (parcial.idCaso) resultadoPersistencia.idCaso = parcial.idCaso;
        if (parcial.action) resultadoPersistencia.action = parcial.action;
        if (parcial.linha) resultadoPersistencia.linha = parcial.linha;
      });

      if (action === 'salvarCaso' && chaveUnica) {
        cacheIdempotencia.put('salvarCaso:' + chaveUnica, '1', CACHE_IDEMPOTENCIA_TTL_SEGUNDOS);
      }
    } finally {
      if (lock) lock.releaseLock();
    }
    idCaso = limparTexto(resultadoPersistencia.idCaso || idCaso);

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

    var urlFotoCaso = limparTexto((body.payload && (body.payload.urlFoto || body.payload.linkFoto)) || (body.dados && (body.dados.urlFoto || body.dados.linkFoto)));
    if (action === 'salvarCaso' && urlFotoCaso) {
      consolidarFotoCaso_(idCaso, urlFotoCaso);
    }
    limparFotosTemporarias_();
    registrarLogAcessoOperador_(planilha, 'GRAVACAO_CONCLUIDA', 'SUCESSO', 'Registros persistidos com sucesso.', operadorAtual.email, { perfil: operadorAtual.perfil, acaoExecutada: action, talaoPMESP: talao });
    registrarLogTecnico(planilhaLogs || planilha, { etapa: 'GRAVACAO_SUCESSO', ok: true, mensagem: 'Registros persistidos com sucesso', rawPostData: extrairRawPostData(e), payloadIdCaso: idCaso });
    return criarRespostaJson({ ok: true, status: resultadoPersistencia.status || 'sucesso', data: { action: resultadoPersistencia.action, idCaso: idCaso, linha: resultadoPersistencia.linha, message: resultadoPersistencia.message || 'Gravação multiabas concluída' } });
  } catch (err) {
    var mensagemErro = err && err.message ? err.message : String(err);
    var codigoErro = limparTexto(err && err.codigo);
    registrarLogTecnico(planilhaLogs, { etapa: 'ERRO_GRAVACAO_PLANILHA', ok: false, mensagem: mensagemErro, rawPostData: extrairRawPostData(e), payloadIdCaso: extrairIdCasoBruto(e) });
    var actionErro = ''; try { actionErro = limparTexto(parsePayload(e).action); } catch (_e) {}
    return criarRespostaJson({ ok: false, status: 'erro', codigo: codigoErro || 'ERRO_GRAVACAO_PLANILHA', erro: mensagemErro, mensagem: mensagemErro, detalhe: 'Falha no processamento da action ' + actionErro }, 500);
  }
}

function salvarAuditoriaCaso_(body, operadorAtual) {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var abaCasos = planilha.getSheetByName('CASOS');
  if (!abaCasos) return { ok: false, codigo: 'ABA_CASOS_NAO_ENCONTRADA', erro: 'Aba CASOS não encontrada.' };

  var caso = (body && (body.caso || body.dados || body.payload)) || {};
  if (typeof caso !== 'object' || caso === null) caso = {};
  caso = normalizarTalaoPayload(caso);

  var idCaso = limparTexto(body.idCaso || caso.idCaso || caso.id);
  var talaoBopm = limparTexto(caso.talaoBopm || caso.talaoPMESP || caso.numeroTalao || caso.talao);
  var talaoPMESP = limparTexto(caso.talaoPMESP || caso.talaoBopm || caso.numeroTalao || caso.talao);
  var numeroTalao = limparTexto(caso.numeroTalao || caso.talaoPMESP || caso.talaoBopm || caso.talao);
  var assinaturaCaso = limparTexto(caso.assinaturaCaso);
  var nomeCompletoDesaparecido = limparTexto(caso.nomeCompletoDesaparecido);
  var telefoneSolicitante = limparTexto(caso.telefoneSolicitante);
  var temFallbackNomeTelefone = !!(nomeCompletoDesaparecido && telefoneSolicitante);
  if (!idCaso && !talaoBopm && !talaoPMESP && !numeroTalao && !assinaturaCaso && !temFallbackNomeTelefone) {
    return { ok: false, codigo: 'CHAVE_CASO_AUDITORIA_NAO_INFORMADA', erro: 'Não foi possível identificar o caso para atualização na aba CASOS.' };
  }

  var headers = abaCasos.getRange(1, 1, 1, Math.max(abaCasos.getLastColumn(), 1)).getValues()[0];
  var auditoriaCols = ['operadorUltimaAlteracaoAuditoria', 'emailOperadorUltimaAlteracaoAuditoria', 'perfilOperadorUltimaAlteracaoAuditoria', 'dataHoraUltimaAlteracaoAuditoria'];
  for (var c = 0; c < auditoriaCols.length; c += 1) {
    if (headers.indexOf(auditoriaCols[c]) === -1) {
      headers.push(auditoriaCols[c]);
      abaCasos.getRange(1, headers.length).setValue(auditoriaCols[c]);
    }
  }
  headers = abaCasos.getRange(1, 1, 1, abaCasos.getLastColumn()).getValues()[0];
  var idx = {};
  headers.forEach(function (h, i) { idx[limparTexto(h)] = i; });

  var ultimaLinha = abaCasos.getLastRow();
  if (ultimaLinha < 2) return { ok: false, codigo: 'CASO_NAO_ENCONTRADO_EM_CASOS', erro: 'Caso não encontrado na aba CASOS para atualização da auditoria.' };
  var matriz = abaCasos.getRange(2, 1, ultimaLinha - 1, headers.length).getValues();

  function valorLinha(linha, chave) {
    var pos = idx[chave];
    return pos === undefined ? '' : limparTexto(linha[pos]);
  }
  function acharLinha(predicate) {
    for (var i = 0; i < matriz.length; i += 1) if (predicate(matriz[i])) return i + 2;
    return -1;
  }

  var linhaCaso = -1;
  if (idCaso) linhaCaso = acharLinha(function (r) { return valorLinha(r, 'idCaso') === idCaso; });
  if (linhaCaso < 0 && talaoBopm) linhaCaso = acharLinha(function (r) { return valorLinha(r, 'talaoBopm') === talaoBopm; });
  if (linhaCaso < 0 && talaoPMESP) linhaCaso = acharLinha(function (r) { return valorLinha(r, 'talaoPMESP') === talaoPMESP; });
  if (linhaCaso < 0 && numeroTalao) linhaCaso = acharLinha(function (r) { return valorLinha(r, 'numeroTalao') === numeroTalao; });
  if (linhaCaso < 0 && assinaturaCaso) linhaCaso = acharLinha(function (r) { return valorLinha(r, 'assinaturaCaso') === assinaturaCaso; });
  if (linhaCaso < 0 && temFallbackNomeTelefone) {
    linhaCaso = acharLinha(function (r) {
      return valorLinha(r, 'nomeCompletoDesaparecido') === nomeCompletoDesaparecido && valorLinha(r, 'telefoneSolicitante') === telefoneSolicitante;
    });
  }
  if (linhaCaso < 0) return { ok: false, codigo: 'CASO_NAO_ENCONTRADO_EM_CASOS', erro: 'Caso não encontrado na aba CASOS para atualização da auditoria.' };

  var camposTecnicosIgnorados = {
    action: true, modo: true, destino: true, caso: true, dados: true,
    operadorNome: true, operadorEmail: true, operadorPerfil: true, tokenInformado: true,
    operadorUltimaAlteracaoAuditoria: true, emailOperadorUltimaAlteracaoAuditoria: true,
    perfilOperadorUltimaAlteracaoAuditoria: true, dataHoraUltimaAlteracaoAuditoria: true,
    dataHoraEdicao: true, idEdicao: true
  };
  var linhaOriginal = abaCasos.getRange(linhaCaso, 1, 1, headers.length).getValues()[0];
  var linhaAtual = linhaOriginal.slice();
  var alteracoesOperacionais = [];

  Object.keys(caso).forEach(function (k) {
    if (camposTecnicosIgnorados[k]) return;
    var pos = idx[k];
    if (pos === undefined) return;
    var v = caso[k];
    if (v === '' || v === null || v === undefined) return;
    var valorAnterior = linhaOriginal[pos];
    var valorNovo = v;
    if (String(valorAnterior) === String(valorNovo)) return;
    linhaAtual[pos] = valorNovo;
    alteracoesOperacionais.push({
      campoAlterado: k,
      valorAnterior: valorAnterior,
      valorNovo: valorNovo
    });
  });

  var operadorNome = limparTexto(body.operadorNome || (operadorAtual && operadorAtual.nome));
  var operadorEmail = limparTexto(body.operadorEmail || (operadorAtual && operadorAtual.email));
  var operadorPerfil = limparTexto(body.operadorPerfil || (operadorAtual && operadorAtual.perfil));
  linhaAtual[idx.operadorUltimaAlteracaoAuditoria] = operadorNome || operadorEmail || 'OPERADOR_NAO_IDENTIFICADO';
  linhaAtual[idx.emailOperadorUltimaAlteracaoAuditoria] = operadorEmail || '';
  linhaAtual[idx.perfilOperadorUltimaAlteracaoAuditoria] = operadorPerfil || '';
  linhaAtual[idx.dataHoraUltimaAlteracaoAuditoria] = new Date();
  abaCasos.getRange(linhaCaso, 1, 1, headers.length).setValues([linhaAtual]);

  var historicoEdicoesRegistradas = 0;
  if (alteracoesOperacionais.length) {
    var cabecalhoHistorico = [
      'idEdicao', 'idCaso', 'talaoPMESP', 'campoAlterado', 'valorAnterior', 'valorNovo',
      'operadorNome', 'operadorEmail', 'operadorPerfil', 'dataHoraEdicao', 'justificativa', 'emailConfirmado'
    ];
    var abaHistorico = planilha.getSheetByName('HISTORICO_EDICOES');
    if (!abaHistorico) {
      abaHistorico = planilha.insertSheet('HISTORICO_EDICOES');
      abaHistorico.getRange(1, 1, 1, cabecalhoHistorico.length).setValues([cabecalhoHistorico]);
    } else {
      var ultimaColHistorico = Math.max(abaHistorico.getLastColumn(), 1);
      var cabecalhoAtualHistorico = abaHistorico.getRange(1, 1, 1, ultimaColHistorico).getValues()[0].map(limparTexto);
      cabecalhoHistorico.forEach(function (coluna) {
        if (cabecalhoAtualHistorico.indexOf(coluna) !== -1) return;
        abaHistorico.getRange(1, cabecalhoAtualHistorico.length + 1).setValue(coluna);
        cabecalhoAtualHistorico.push(coluna);
      });
    }
    var headerHistFinal = abaHistorico.getRange(1, 1, 1, abaHistorico.getLastColumn()).getValues()[0].map(limparTexto);
    var idxHist = {};
    headerHistFinal.forEach(function (h, i) { idxHist[h] = i; });
    var idCasoHistorico = limparTexto(idCaso || caso.idCaso || caso.id);
    var talaoHistorico = limparTexto(caso.talaoPMESP || caso.talaoBopm || caso.numeroTalao || linhaOriginal[idx.talaoPMESP] || linhaOriginal[idx.talaoBopm] || linhaOriginal[idx.numeroTalao] || 'N/D');
    var justificativa = limparTexto(body.justificativaAuditoria || body.justificativa || caso.justificativaAuditoria || caso.justificativa || '');
    var emailConfirmado = limparTexto(body.emailConfirmado || caso.emailConfirmado || (operadorEmail ? 'SIM' : 'NÃO'));
    var operadorNomeHistorico = operadorNome || operadorEmail || 'OPERADOR_NAO_IDENTIFICADO';
    var dataHora = new Date();

    function gerarIdEdicao_() {
      var agora = new Date();
      function pad(n) { return String(n).padStart(2, '0'); }
      var carimbo = agora.getFullYear() + pad(agora.getMonth() + 1) + pad(agora.getDate()) + '-' + pad(agora.getHours()) + pad(agora.getMinutes()) + pad(agora.getSeconds());
      var sufixo = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
      return 'EDT-' + carimbo + '-' + sufixo;
    }

    var linhasHistorico = alteracoesOperacionais.map(function (alt) {
      var linhaHist = new Array(headerHistFinal.length).fill('');
      linhaHist[idxHist.idEdicao] = gerarIdEdicao_();
      linhaHist[idxHist.idCaso] = idCasoHistorico;
      linhaHist[idxHist.talaoPMESP] = talaoHistorico || 'N/D';
      linhaHist[idxHist.campoAlterado] = alt.campoAlterado;
      linhaHist[idxHist.valorAnterior] = alt.valorAnterior;
      linhaHist[idxHist.valorNovo] = alt.valorNovo;
      linhaHist[idxHist.operadorNome] = operadorNomeHistorico;
      linhaHist[idxHist.operadorEmail] = operadorEmail || '';
      linhaHist[idxHist.operadorPerfil] = operadorPerfil || '';
      linhaHist[idxHist.dataHoraEdicao] = dataHora;
      linhaHist[idxHist.justificativa] = justificativa;
      linhaHist[idxHist.emailConfirmado] = emailConfirmado;
      return linhaHist;
    });
    abaHistorico.getRange(abaHistorico.getLastRow() + 1, 1, linhasHistorico.length, headerHistFinal.length).setValues(linhasHistorico);
    historicoEdicoesRegistradas = linhasHistorico.length;
  }

  Logger.log('AUDITORIA_CASO_ATUALIZADA idCaso=%s linha=%s operador=%s camposAlterados=%s historicoRegistrado=%s',
    limparTexto(idCaso || caso.idCaso || caso.id),
    linhaCaso,
    operadorNome || operadorEmail || 'OPERADOR_NAO_IDENTIFICADO',
    alteracoesOperacionais.length,
    historicoEdicoesRegistradas
  );

  return {
    ok: true,
    action: 'salvarAuditoriaCaso',
    destino: 'CASOS',
    codigo: 'AUDITORIA_CASO_ATUALIZADA_EM_CASOS',
    mensagem: alteracoesOperacionais.length ? 'Caso atualizado com sucesso na aba CASOS.' : 'Nenhuma alteração operacional foi detectada para atualização na aba CASOS.',
    idCaso: idCaso || limparTexto(caso.idCaso || caso.id),
    linha: linhaCaso,
    operadorUltimaAlteracaoAuditoria: linhaAtual[idx.operadorUltimaAlteracaoAuditoria],
    historicoEdicoesRegistradas: historicoEdicoesRegistradas
  };
}

function atualizarFotoCaso_(payload) {
  garantirEstruturaCabineVerde_();
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var colunasCasos = obterSchemaCabineVerdeUnificado_().CASOS;
  var sheetCasos = garantirAbaComCabecalho(planilha, 'CASOS', colunasCasos);
  var cabecalho = garantirColunasDaEstrutura(sheetCasos, colunasCasos);
  var idCaso = limparTexto(payload && payload.idCaso);
  var talaoPMESP = limparTexto(payload && payload.talaoPMESP);
  var linha = idCaso ? localizarCasoPorId(sheetCasos, idCaso, cabecalho) : localizarCasoPorTalaoPMESP(sheetCasos, talaoPMESP, cabecalho);
  if (linha < 2) throw new Error('Caso não encontrado para atualização de foto.');

  var idxFotoDisponivel = cabecalho.indexOf('fotoDisponivel');
  var idxLinkFoto = cabecalho.indexOf('linkFoto');
  var idxUrlFoto = cabecalho.indexOf('urlFoto');
  var idxStatusFotos = cabecalho.indexOf('statusFotos');
  var idxDataAtualizacaoFoto = cabecalho.indexOf('dataAtualizacaoFoto');
  var fotoDisponivel = limparTexto(payload && payload.fotoDisponivel) || (limparTexto(payload && (payload.urlFoto || payload.linkFoto)) ? 'Sim' : 'Pendente');
  var urlFoto = limparTexto(payload && (payload.urlFoto || payload.linkFoto));
  var statusFotos = limparTexto(payload && payload.statusFotos) || (urlFoto ? 'ANEXADA' : 'PENDENTE');
  if (idxFotoDisponivel >= 0) sheetCasos.getRange(linha, idxFotoDisponivel + 1).setValue(fotoDisponivel);
  if (idxLinkFoto >= 0) sheetCasos.getRange(linha, idxLinkFoto + 1).setValue(urlFoto);
  if (idxUrlFoto >= 0) sheetCasos.getRange(linha, idxUrlFoto + 1).setValue(urlFoto);
  if (idxStatusFotos >= 0) sheetCasos.getRange(linha, idxStatusFotos + 1).setValue(statusFotos);
  if (idxDataAtualizacaoFoto >= 0) sheetCasos.getRange(linha, idxDataAtualizacaoFoto + 1).setValue(new Date());
  return { action: 'atualizarFotoCaso', idCaso: idCaso, talaoPMESP: talaoPMESP, fotoDisponivel: fotoDisponivel, statusFotos: statusFotos, urlFoto: urlFoto, message: 'Foto do caso atualizada com sucesso' };
}

function validarOperadorPayloadOuSessao_(payload) {
  var emailGoogle = limparTexto(Session.getActiveUser().getEmail()).toLowerCase();
  var emailOperador = limparTexto(payload && payload.operadorEmail).toLowerCase() || emailGoogle;
  Logger.log('DEBUG_AUTH validarOperadorPayloadOuSessao_ action=%s emailPayload=%s emailSessao=%s operadorNome=%s operadorPerfil=%s', limparTexto(payload && payload.action), emailOperador, emailGoogle, limparTexto(payload && payload.operadorNome), limparTexto(payload && payload.operadorPerfil));
  var validacao = validarOperador_(emailOperador, payload || {});
  Logger.log('DEBUG_AUTH resultadoValidacao ok=%s autorizado=%s motivo=%s operadorEmail=%s operadorPerfil=%s', !!validacao.ok, !!validacao.autorizado, limparTexto(validacao.motivo), limparTexto(validacao.operador && validacao.operador.email), limparTexto(validacao.operador && validacao.operador.perfil));
  if (!validacao.ok || !validacao.autorizado) {
    Logger.log("BLOQUEIO DE EXECUÇÃO");
    throw new Error('Operador não validado ou não autorizado.');
  }
  return { autorizado: true, email: validacao.operador.email, perfil: validacao.operador.perfil, nome: validacao.operador.nome };
}

function validarOperador_(emailInformado, payload) {
  garantirEstruturaCabineVerde_();
  var email = limparTexto(emailInformado).toLowerCase();
  var nomePayload = limparTexto(payload && payload.operadorNome);
  var perfilPayload = normalizarPerfilOperador_(payload && payload.operadorPerfil);
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var aba = planilha.getSheetByName('OPERADORES');
  if (!email) {
    registrarLogAcessoOperador_(planilha, 'LOGIN_OPERADOR_BLOQUEADO', 'EMAIL_NAO_INFORMADO', 'E-mail do operador não informado.', '');
    return { ok: false, autorizado: false, motivo: 'EMAIL_NAO_INFORMADO', mensagem: 'Informe o e-mail institucional do operador.' };
  }
  if (!aba) {
    registrarLogAcessoOperador_(planilha, 'LOGIN_OPERADOR_BLOQUEADO', 'ABA_OPERADORES_NAO_ENCONTRADA', 'Aba OPERADORES não encontrada.', email);
    return { ok: false, autorizado: false, motivo: 'ABA_OPERADORES_NAO_ENCONTRADA', mensagem: 'Configuração de operadores não encontrada.' };
  }
  var cacheOperadores = obterOperadoresCache_();
  var snapshot = cacheOperadores ? { invalido: false, operadores: cacheOperadores } : carregarOperadoresDaPlanilha_(aba);
  if (snapshot.invalido) {
    registrarLogAcessoOperador_(planilha, 'LOGIN_OPERADOR_BLOQUEADO', 'CABECALHOS_OPERADORES_INVALIDOS', 'Cabeçalhos obrigatórios ausentes na aba OPERADORES.', email);
    return { ok: false, autorizado: false, motivo: 'CABECALHOS_OPERADORES_INVALIDOS', mensagem: 'A aba OPERADORES está sem cabeçalhos obrigatórios.' };
  }
  for (var i = 0; i < snapshot.operadores.length; i += 1) {
    var row = snapshot.operadores[i];
    if (limparTexto(row.email).toLowerCase() !== email) continue;
    var ativo = limparTexto(row.ativo).toUpperCase();
    var operadorAtivo = ['TRUE','VERDADEIRO','SIM','ATIVO','1'].indexOf(ativo) !== -1;
    if (!operadorAtivo) {
      registrarLogAcessoOperador_(planilha, 'LOGIN_OPERADOR_BLOQUEADO', 'OPERADOR_INATIVO', email, email);
      return { ok: false, autorizado: false, motivo: 'OPERADOR_INATIVO', mensagem: 'Operador inativo. Solicite liberação.' };
    }
    var operador = { email: email, nome: limparTexto(row.nome) || nomePayload, perfil: normalizarPerfilOperador_(row.perfil) || perfilPayload || 'OPERADOR', ativo: 'SIM' };
    registrarLogAcessoOperador_(planilha, 'LOGIN_OPERADOR_SUCESSO', 'OPERADOR_AUTORIZADO', 'Operador validado na aba OPERADORES.', email);
    return { ok: true, autorizado: true, operador: operador };
  }
  registrarLogAcessoOperador_(planilha, 'LOGIN_OPERADOR_BLOQUEADO', 'OPERADOR_NAO_AUTORIZADO', email, email);
  return { ok: false, autorizado: false, motivo: 'OPERADOR_NAO_AUTORIZADO', mensagem: 'Operador não autorizado.' };
}

function listarCasosComProtecao_(operadorAtual) {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var colunasCasos = obterSchemaCabineVerdeUnificado_().CASOS;
  var aba = garantirAbaComCabecalho(planilha, 'CASOS', colunasCasos);
  if (aba.getLastRow() < 2) return [];
  var cabecalho = garantirColunasDaEstrutura(aba, colunasCasos);
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

function normalizarTalaoPayload(dados) {
  var fonte = dados && typeof dados === 'object' ? dados : {};
  var talao = limparTexto(fonte.talaoPMESP || fonte.talaoBopm || fonte.talao || fonte.numeroTalao || '');
  fonte.talaoPMESP = talao;
  fonte.talaoBopm = talao;
  return fonte;
}

function normalizarPayloadCaso_(caso) {
  var fonte = caso && typeof caso === 'object' ? caso : {};
  var talao = limparTexto(fonte.talaoPMESP || fonte.talaoBopm || fonte.numeroTalao || fonte.talao);
  var nome = limparTexto(fonte.nomeCompletoDesaparecido || fonte.nomeDesaparecido);
  var observacoes = limparTexto(fonte.observacoesOperacionais || fonte.observacoes);
  var status190 = limparTexto(fonte.encerrado190 || fonte.status190);
  var operador = limparTexto(fonte.operadorResponsavel || fonte.operadorPM);
  var foto = limparTexto(fonte.urlFoto || fonte.linkFoto);
  var cpf = limparTexto(fonte.cpf);
  var rg = limparTexto(fonte.rg);
  var cpfRg = limparTexto(fonte.cpfRg || [cpf, rg].filter(Boolean).join(' / '));

  fonte.talaoPMESP = talao;
  fonte.talaoBopm = talao;
  fonte.numeroTalao = talao;
  fonte.talao = talao;
  fonte.nomeCompletoDesaparecido = nome;
  if (!fonte.nomeDesaparecido) fonte.nomeDesaparecido = nome;
  fonte.observacoesOperacionais = observacoes;
  if (!fonte.observacoes) fonte.observacoes = observacoes;
  fonte.encerrado190 = status190;
  if (!fonte.status190) fonte.status190 = status190;
  fonte.operadorResponsavel = operador;
  if (!fonte.operadorPM) fonte.operadorPM = operador;
  fonte.urlFoto = foto;
  if (!fonte.linkFoto) fonte.linkFoto = foto;
  fonte.cpfRg = cpfRg;
  return fonte;
}

function validarCamposObrigatoriosCaso_(caso) {
  var campos = ['talaoBopm', 'nomeCompletoDesaparecido', 'nomeSolicitante', 'telefoneSolicitante'];
  var faltantes = campos.filter(function (campo) { return !limparTexto(caso && caso[campo]); });
  if (!faltantes.length) return { ok: true, camposAusentes: [] };
  var rotulos = {
    talaoBopm: 'Número do Talão PMESP/BOPM',
    nomeCompletoDesaparecido: 'Nome completo do desaparecido',
    nomeSolicitante: 'Nome do solicitante',
    telefoneSolicitante: 'Telefone do solicitante'
  };
  var mensagem = 'Campos obrigatórios ausentes: ' + faltantes.map(function (c) { return rotulos[c] || c; }).join(', ') + '.';
  return {
    ok: false,
    erro: {
      sucesso: false,
      codigo: 'CAMPO_OBRIGATORIO_AUSENTE',
      mensagem: mensagem,
      message: mensagem,
      camposAusentes: faltantes,
      diagnostico: {
        idCaso: limparTexto(caso && caso.idCaso),
        talaoBopm: limparTexto(caso && caso.talaoBopm),
        nomeCompletoDesaparecido: limparTexto(caso && caso.nomeCompletoDesaparecido),
        nomeSolicitante: limparTexto(caso && caso.nomeSolicitante),
        telefoneSolicitante: limparTexto(caso && caso.telefoneSolicitante)
      }
    }
  };
}

function gerarAssinaturaCaso_(dados) {
  var dataServico = normalizarDataRelatorio_(dados && (dados.dataServico || dados.dataHoraRegistro || dados.dataHoraUltimaVisualizacao));
  var talaoBopm = normalizarDocumentoRelatorio_(dados && (dados.talaoBopm || dados.talaoPMESP || dados.numeroTalao || dados.talao || dados.bopm));
  var nome = normalizarTextoAssinatura_(dados && (dados.nomeCompletoDesaparecido || dados.nome));
  var telefoneSolicitante = normalizarTelefoneRelatorio_(dados && dados.telefoneSolicitante);
  return [dataServico, talaoBopm, nome, telefoneSolicitante].join('|');
}

function normalizarTextoAssinatura_(valor) {
  return limparTexto(valor).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function localizarLinhaCaso_(sheetCasos, cabecalhoAtual, dados) {
  var idCaso = limparTexto(dados && dados.idCaso);
  var talaoPMESP = limparTexto(dados && dados.talaoPMESP);
  var talaoBopm = limparTexto(dados && dados.talaoBopm);
  var numeroTalao = limparTexto(dados && (dados.numeroTalao || dados.talao));

  var linhaId = idCaso ? localizarCasoPorIdCaso(sheetCasos, idCaso, cabecalhoAtual) : -1;
  if (linhaId > 1) return { linha: linhaId, criterio: 'idCaso' };

  var linhaTalao = talaoPMESP ? localizarCasoPorTalaoPMESP(sheetCasos, talaoPMESP, cabecalhoAtual) : -1;
  if (linhaTalao > 1) return { linha: linhaTalao, criterio: 'talaoPMESP' };

  if (talaoBopm) {
    var linhaBopm = encontrarLinhaPorColuna(sheetCasos, talaoBopm, 'talaoBopm', cabecalhoAtual);
    if (linhaBopm > 1) return { linha: linhaBopm, criterio: 'talaoBopm' };
  }

  if (numeroTalao) {
    var linhaNumero = encontrarLinhaPorColuna(sheetCasos, numeroTalao, 'numeroTalao', cabecalhoAtual);
    if (linhaNumero > 1) return { linha: linhaNumero, criterio: 'numeroTalao' };
  }

  var assinatura = gerarAssinaturaCaso_(dados);
  if (!assinatura || assinatura === '|||') return { linha: -1, criterio: '' };
  var idxAssinatura = cabecalhoAtual.indexOf('assinaturaCaso');
  if (idxAssinatura >= 0 && sheetCasos.getLastRow() > 1) {
    var assinaturas = sheetCasos.getRange(2, idxAssinatura + 1, sheetCasos.getLastRow() - 1, 1).getValues();
    for (var i = 0; i < assinaturas.length; i += 1) {
      if (limparTexto(assinaturas[i][0]) === assinatura) return { linha: i + 2, criterio: 'assinaturaCaso' };
    }
  }
  return { linha: -1, criterio: '' };
}


function obterChaveUnicaRegistro_(body, registroPorColuna) {
  var chave = limparTexto((registroPorColuna && registroPorColuna.CHAVE_UNICA) || (registroPorColuna && registroPorColuna.chaveUnica) || body.chaveUnica || body.chaveRequisicao || (body.payload && body.payload.chaveUnica) || (body.payload && body.payload.chaveRequisicao));
  if (!chave) return '';
  return chave;
}

function localizarLinhaPorChaveUnica_(sheetCasos, cabecalhoAtual, chaveUnica) {
  var chave = limparTexto(chaveUnica);
  if (!chave) return -1;
  var idx = cabecalhoAtual.indexOf('CHAVE_UNICA');
  if (idx < 0 || sheetCasos.getLastRow() < 2) return -1;
  var valores = sheetCasos.getRange(2, idx + 1, sheetCasos.getLastRow() - 1, 1).getValues();
  for (var i = 0; i < valores.length; i += 1) {
    if (limparTexto(valores[i][0]) === chave) return i + 2;
  }
  return -1;
}

function registrarLogAuditoriaPersistencia_(planilha, dados) {
  var aba = garantirAbaComCabecalho(planilha, ABA_LOG_AUDITORIA, COLUNAS_LOG_AUDITORIA);
  var cabecalho = garantirColunasDaEstrutura(aba, COLUNAS_LOG_AUDITORIA);
  var linha = cabecalho.map(function (coluna) {
    return normalizarValorPlanilha((dados || {})[coluna]);
  });
  var linhaDestino = aba.getLastRow() + 1;
  aba.getRange(linhaDestino, 1, 1, linha.length).setValues([linha]);
}

function persistirRegistro(planilha, registro) {
  Logger.log("PERSISTIR_REGISTRO_OFICIAL_ATIVO");
  Logger.log('DEBUG_FLUXO_SALVARCASO: persistirRegistro entrada=' + JSON.stringify({
    aba: limparTexto(registro && registro.aba),
    colunasArray: Array.isArray(registro && registro.colunas),
    colunasLength: Array.isArray(registro && registro.colunas) ? registro.colunas.length : null,
    valoresArray: Array.isArray(registro && registro.valores),
    valoresLength: Array.isArray(registro && registro.valores) ? registro.valores.length : null
  }));
  var aba = limparTexto(registro.aba);
  var colunas = registro.colunas || [];
  var valores = registro.valores || [];
  var schema = obterSchemaCabineVerdeUnificado_();
  var colunasPayload = Array.isArray(registro.colunas) ? registro.colunas : [];
  var colunasFallback = Array.isArray(schema && schema[aba]) ? schema[aba] : [];
  var colunasEstrutura = Array.isArray(ESTRUTURA_PLANILHA[aba]) && ESTRUTURA_PLANILHA[aba].length ? ESTRUTURA_PLANILHA[aba] : colunasFallback;

  if (aba === 'CASOS') {
    var colunasSchemaCasos = Array.isArray(schema && schema.CASOS)
      ? schema.CASOS
      : (Array.isArray(CABINE_VERDE_SCHEMA && CABINE_VERDE_SCHEMA.CASOS) ? CABINE_VERDE_SCHEMA.CASOS : []);

    if (!Array.isArray(colunasSchemaCasos) || colunasSchemaCasos.length === 0) {
      throw new Error('CASOS sem colunas válidas no schema.');
    }

    colunas = colunasSchemaCasos;
    var sheetCasos = garantirAbaComCabecalho(planilha, 'CASOS', colunasSchemaCasos);
    garantirAbaComCabecalhos_(planilha, 'CASOS', colunasSchemaCasos);
    var cabecalhoAtual = garantirColunasDaEstrutura(sheetCasos, colunasSchemaCasos);

    Logger.log('TOTAL COLUNAS HEADER CASOS (PLANILHA): ' + cabecalhoAtual.length);
    Logger.log('HEADER FINAL CASOS: ' + colunasSchemaCasos.length);
    Logger.log('TOTAL COLUNAS PAYLOAD: ' + (Array.isArray(registro.colunas) ? registro.colunas.length : 'NAO_ARRAY'));
    Logger.log('TOTAL VALORES PAYLOAD: ' + valores.length);

    var valoresPorSchema = colunasSchemaCasos.map(function (nomeColuna) {
      if (Array.isArray(colunasPayload) && colunasPayload.length) {
        var idx = colunasPayload.indexOf(nomeColuna);
        return idx >= 0 ? valores[idx] : '';
      }
      return '';
    });

    if (valoresPorSchema.length !== colunas.length) {
      throw new Error('Falha ao alinhar valores ao schema CASOS.');
    }

    Logger.log("GRAVANDO CASO:");
    Logger.log(registro);
    var registroPorColuna = mapearPorColuna(colunas, valoresPorSchema);
    registroPorColuna = normalizarPayloadCaso_(normalizarTalaoPayload(registroPorColuna));
    registroPorColuna = normalizarCamposFisicos_(registroPorColuna);
    registroPorColuna.talaoBopm = limparTexto(registroPorColuna.talaoBopm || registroPorColuna.talaoPMESP || registroPorColuna.numeroTalao || registroPorColuna.bopm);
    registroPorColuna.talaoPMESP = limparTexto(registroPorColuna.talaoPMESP || registroPorColuna.talaoBopm);
    var validacaoObrigatorios = validarCamposObrigatoriosCaso_(registroPorColuna);
    if (!validacaoObrigatorios.ok) {
      registrarLogAuditoriaPersistencia_(planilha, { dataHora: formatarDataHora(new Date()), status: 'erro', chaveUnica: obterChaveUnicaRegistro_(registro, registroPorColuna), acaoExecutada: 'BLOQUEIO_CAMPOS_OBRIGATORIOS', nomeDesaparecido: limparTexto(registroPorColuna.nomeCompletoDesaparecido), solicitante: limparTexto(registroPorColuna.nomeSolicitante), telefone: limparTexto(registroPorColuna.telefoneSolicitante), operador: limparTexto(registroPorColuna.operadorResponsavel), mensagemTecnica: validacaoObrigatorios.erro.mensagem });
      return validacaoObrigatorios.erro;
    }
    var idCaso = limparTexto(registroPorColuna.idCaso);
    var dataServicoRecebida = normalizarDataServicoImutavel_(registroPorColuna.dataServico, registroPorColuna.dataHoraRegistro);
    registroPorColuna.dataServico = dataServicoRecebida;
    var talaoPMESPRecebido = limparTexto(registroPorColuna.talaoPMESP);
    var chaveUnica = obterChaveUnicaRegistro_(registro, registroPorColuna);
    if (chaveUnica) { registroPorColuna.CHAVE_UNICA = chaveUnica; registroPorColuna.chaveUnica = chaveUnica; registroPorColuna.chaveRequisicao = chaveUnica; }
    var modoRegistro = limparTexto((registro.payload && registro.payload.modo) || registro.modo || '').toLowerCase();
    if (chaveUnica) {
      var linhaExistentePorChave = localizarLinhaPorChaveUnica_(sheetCasos, cabecalhoAtual, chaveUnica);
      if (linhaExistentePorChave > 1) {
        registrarLogAuditoriaPersistencia_(planilha, { dataHora: formatarDataHora(new Date()), status: 'duplicado_ignorado', chaveUnica: chaveUnica, acaoExecutada: 'PLANILHA_CHAVE_UNICA_HIT', nomeDesaparecido: limparTexto(registroPorColuna.nomeCompletoDesaparecido), solicitante: limparTexto(registroPorColuna.nomeSolicitante), telefone: limparTexto(registroPorColuna.telefoneSolicitante), operador: limparTexto(registroPorColuna.operadorResponsavel), mensagemTecnica: 'CHAVE_UNICA já existente na planilha CASOS.' });
        return { idCaso: idCaso, action: 'ignored', linha: linhaExistentePorChave, status: 'duplicado_ignorado', message: 'Requisição duplicada ignorada por CHAVE_UNICA' };
      }
    }
    var resultadoLocalizacao = localizarLinhaCaso_(sheetCasos, cabecalhoAtual, registroPorColuna);
    var linhaPorIdCaso = idCaso ? localizarCasoPorIdCaso(sheetCasos, idCaso, cabecalhoAtual) : -1;
    var linhaPorTalaoPMESP = talaoPMESPRecebido ? localizarCasoPorTalaoPMESP(sheetCasos, talaoPMESPRecebido, cabecalhoAtual) : -1;
    var linhaAlvo = resultadoLocalizacao.linha;
    if (linhaAlvo > 1 && !idCaso) {
      var idxIdCasoAtual = cabecalhoAtual.indexOf('idCaso');
      if (idxIdCasoAtual >= 0) {
        idCaso = limparTexto(sheetCasos.getRange(linhaAlvo, idxIdCasoAtual + 1).getValue());
        registroPorColuna.idCaso = idCaso;
      }
    }
    var idxDataServico = cabecalhoAtual.indexOf('dataServico');
    if (linhaAlvo > 1 && idxDataServico >= 0) {
      var dataServicoPersistida = normalizarDataServicoImutavel_(sheetCasos.getRange(linhaAlvo, idxDataServico + 1).getValue(), registroPorColuna.dataHoraRegistro);
      if (dataServicoPersistida) {
        if (dataServicoRecebida && dataServicoRecebida !== dataServicoPersistida) {
          registrarLogAuditoriaPersistencia_(planilha, { dataHora: formatarDataHora(new Date()), status: 'dataServico_preservada', chaveUnica: chaveUnica, acaoExecutada: 'PRESERVACAO_DATA_SERVICO', nomeDesaparecido: limparTexto(registroPorColuna.nomeCompletoDesaparecido), solicitante: limparTexto(registroPorColuna.nomeSolicitante), telefone: limparTexto(registroPorColuna.telefoneSolicitante), operador: limparTexto(registroPorColuna.operadorResponsavel), mensagemTecnica: 'dataServico recebida diferente foi ignorada para preservar idempotência.' });
        }
        registroPorColuna.dataServico = dataServicoPersistida;
      }
    }
    if (!linhaAlvo || linhaAlvo <= 1) {
      registroPorColuna.dataServico = normalizarDataServicoImutavel_(registroPorColuna.dataServico, registroPorColuna.dataHoraRegistro);
    }
    if (!idCaso) idCaso = 'CV-' + Utilities.getUuid().slice(0, 8).toUpperCase();
    registroPorColuna.idCaso = idCaso;
    registroPorColuna.dataHoraAtualizacao = formatarDataHora(new Date());
    registroPorColuna.assinaturaCaso = gerarAssinaturaCaso_(registroPorColuna);

    validarConsistenciaCaso(planilha, {
      idCaso: idCaso,
      talaoPMESP: talaoPMESPRecebido,
      linhaPorIdCaso: linhaPorIdCaso,
      linhaPorTalaoPMESP: linhaPorTalaoPMESP
    });

    var linhaFinal = colunasSchemaCasos.map(function (nomeColuna) {
      return normalizarValorPlanilha(registroPorColuna[nomeColuna]);
    });

    if (linhaAlvo > 1) {
      sheetCasos.getRange(linhaAlvo, 1, 1, linhaFinal.length).setValues([linhaFinal]);
      sincronizarTalao190(registroPorColuna);
      if (modoRegistro === 'edicao') {
        registrarEventoOperacional_(planilha, idCaso, 'EDICAO_CASO', {
          idCaso: idCaso,
          talaoPMESP: talaoPMESPRecebido,
          modo: 'edicao',
          dataHora: formatarDataHora(new Date())
        });
      }
      registrarLogAuditoriaPersistencia_(planilha, { dataHora: formatarDataHora(new Date()), status: 'atualizado', chaveUnica: chaveUnica, acaoExecutada: 'UPDATE_CASO', nomeDesaparecido: limparTexto(registroPorColuna.nomeCompletoDesaparecido), solicitante: limparTexto(registroPorColuna.nomeSolicitante), telefone: limparTexto(registroPorColuna.telefoneSolicitante), operador: limparTexto(registroPorColuna.operadorResponsavel), mensagemTecnica: 'Caso atualizado por critério=' + limparTexto(resultadoLocalizacao.criterio) });
      return { idCaso: idCaso, action: 'updated', linha: linhaAlvo, status: 'atualizado', message: 'Caso existente atualizado com sucesso' };
    }

    var linhaInsercao = sheetCasos.getLastRow() + 1;
    sheetCasos.getRange(linhaInsercao, 1, 1, linhaFinal.length).setValues([linhaFinal]);
    sincronizarTalao190(registroPorColuna);
    registrarEventoOperacional_(planilha, idCaso, 'CASO_CRIADO', {
      idCaso: idCaso,
      talaoPMESP: talaoPMESPRecebido,
      operador: limparTexto(registroPorColuna.operadorResponsavel),
      dataHora: formatarDataHora(new Date()),
      statusInicial: limparTexto(registroPorColuna.statusCaso) || 'Em triagem'
    });
    registrarLogAuditoriaPersistencia_(planilha, { dataHora: formatarDataHora(new Date()), status: 'sucesso', chaveUnica: chaveUnica, acaoExecutada: 'INSERT_CASO', nomeDesaparecido: limparTexto(registroPorColuna.nomeCompletoDesaparecido), solicitante: limparTexto(registroPorColuna.nomeSolicitante), telefone: limparTexto(registroPorColuna.telefoneSolicitante), operador: limparTexto(registroPorColuna.operadorResponsavel), mensagemTecnica: 'Novo caso inserido com sucesso.' });
    return { idCaso: idCaso, action: 'created', linha: linhaInsercao, status: 'sucesso', message: 'Novo caso gravado com sucesso' };
  }

  if (aba === 'LOG_AUDITORIA') {
    registrarLogAuditoriaPersistencia_(planilha, mapearPorColuna(colunas, valores));
    var abaLog = garantirAbaComCabecalho(planilha, ABA_LOG_AUDITORIA, COLUNAS_LOG_AUDITORIA);
    return { action: 'created', linha: abaLog.getLastRow() };
  }
  if (aba === 'CASOS' || String(aba).indexOf('RELAT') !== -1 || String(aba).indexOf('TALAO') !== -1) {
    throw new Error('appendRow genérico bloqueado para aba operacional crítica: ' + aba);
  }
  var sheet = garantirAbaComCabecalho(planilha, aba, colunasEstrutura.length ? colunasEstrutura : colunas);
  var linhaDestino = sheet.getLastRow() + 1;
  sheet.getRange(linhaDestino, 1, 1, valores.length).setValues([valores]);
  return { action: 'created', linha: linhaDestino };
}


var ABA_INDICE_TALOES = 'INDICE_TALOES';
var COLUNAS_INDICE_TALOES = [
  'hashOperacional','idCaso','talaoNormalizado','talaoOriginal','nomeNormalizado','telefoneNormalizado','dataOperacional','nomeAba','linha','status','criadoEm','atualizadoEm','origem','observacaoAuditoria'
];

function obterOuCriarIndiceTaloes_() {
  var planilha = SpreadsheetApp.openById(ID_PLANILHA_TALAO_190);
  var aba = planilha.getSheetByName(ABA_INDICE_TALOES);
  if (!aba) {
    aba = planilha.insertSheet(ABA_INDICE_TALOES);
    aba.getRange(1, 1, 1, COLUNAS_INDICE_TALOES.length).setValues([COLUNAS_INDICE_TALOES]);
    aba.setFrozenRows(1);
    registrarLogAuditoria_({ evento: 'INDICE_TALOES_CRIADO', timestamp: new Date() });
    return aba;
  }
  var cabecalho = aba.getRange(1, 1, 1, COLUNAS_INDICE_TALOES.length).getDisplayValues()[0];
  if (cabecalho.join('|') !== COLUNAS_INDICE_TALOES.join('|')) {
    aba.getRange(1, 1, 1, COLUNAS_INDICE_TALOES.length).setValues([COLUNAS_INDICE_TALOES]);
  }
  return aba;
}

function gerarHashOperacionalTalao_(caso, dataOperacional) {
  var dataNormalizada = normalizarDataRelatorio_(dataOperacional);
  var nome = normalizarTextoAssinatura_(caso && caso.nomeCompletoDesaparecido);
  var telefone = normalizarTelefoneRelatorio_(caso && caso.telefoneSolicitante);
  var talao = normalizarDocumentoRelatorio_(caso && (caso.talaoPMESP || caso.talaoBopm || caso.numeroTalao || caso.talao));
  var base = [dataNormalizada, nome, telefone, talao].join('|');
  var hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, base, Utilities.Charset.UTF_8);
  return hash.map(function(b){ var v=(b<0?b+256:b).toString(16); return v.length===1?'0'+v:v; }).join('');
}

function localizarCasoPorIndiceTaloes_(chaves) {
  var aba = obterOuCriarIndiceTaloes_();
  registrarLogAuditoria_({ evento: 'INDICE_TALOES_CONSULTADO', idCaso: chaves && chaves.idCaso, timestamp: new Date() });
  var ultima = aba.getLastRow();
  if (ultima < 2) return { encontrado: false, motivoLocalizacao: 'indice_vazio' };
  var dados = aba.getRange(2, 1, ultima - 1, COLUNAS_INDICE_TALOES.length).getValues();
  function encontrar(pred, motivo){ for (var i=0;i<dados.length;i+=1){ if (pred(dados[i])) return { encontrado:true, linhaIndice:i+2, nomeAba:limparTexto(dados[i][7]), linhaRelatorio:Number(dados[i][8])||0, motivoLocalizacao:motivo, registroIndice:dados[i]}; } return null; }
  var idCaso = limparTexto(chaves && chaves.idCaso);
  var hash = limparTexto(chaves && chaves.hashOperacional);
  var talao = normalizarDocumentoRelatorio_(chaves && chaves.talaoNormalizado);
  var hit = (idCaso && encontrar(function(r){ return limparTexto(r[1])===idCaso; }, 'idCaso')) ||
    (hash && encontrar(function(r){ return limparTexto(r[0])===hash; }, 'hashOperacional')) ||
    (talao && encontrar(function(r){ return normalizarDocumentoRelatorio_(r[2])===talao; }, 'talaoNormalizado'));
  if (hit) { registrarLogAuditoria_({ evento: 'INDICE_TALOES_HIT', motivo: hit.motivoLocalizacao, timestamp: new Date() }); return hit; }
  registrarLogAuditoria_({ evento: 'INDICE_TALOES_MISS', timestamp: new Date() });
  return { encontrado: false, motivoLocalizacao: 'nao_localizado' };
}

function validarReferenciaIndiceTaloes_(registroIndice, chaves) {
  var planilha = SpreadsheetApp.openById(ID_PLANILHA_TALAO_190);
  var nomeAba = limparTexto(registroIndice && registroIndice.nomeAba);
  var linha = Number(registroIndice && registroIndice.linhaRelatorio);
  if (!nomeAba || !linha || linha < PRIMEIRA_LINHA_DADOS_TALAO) return { valido:false, motivo:'referencia_invalida' };
  var aba = planilha.getSheetByName(nomeAba);
  if (!aba || aba.getLastRow() < linha) return { valido:false, motivo:'aba_ou_linha_inexistente' };
  var linhaDados = aba.getRange(linha, 1, 1, 11).getValues()[0];
  if (linhaDados.every(function(c){ return limparTexto(c)===''; })) return { valido:false, motivo:'linha_vazia' };
  var idOk = !chaves.idCaso || limparTexto(linhaDados[10]) === limparTexto(chaves.idCaso);
  var talaoOk = !chaves.talaoNormalizado || normalizarDocumentoRelatorio_(linhaDados[1]) === normalizarDocumentoRelatorio_(chaves.talaoNormalizado);
  if (!idOk && !talaoOk) return { valido:false, motivo:'chave_divergente' };
  return { valido:true, aba:aba, linha:linha };
}

function atualizarIndiceTaloes_(dados) {
  var aba = obterOuCriarIndiceTaloes_();
  var linhaIndice = Number(dados.linhaIndice) || 0;
  var agora = formatarDataHora(new Date());
  var criadoEm = dados.criadoEm || agora;
  var linha = [dados.hashOperacional || '', dados.idCaso || '', dados.talaoNormalizado || '', dados.talaoOriginal || '', dados.nomeNormalizado || '', dados.telefoneNormalizado || '', dados.dataOperacional || '', dados.nomeAba || '', Number(dados.linhaRelatorio) || '', dados.status || 'ativo', criadoEm, agora, dados.origem || 'sincronizarTalao190', dados.observacaoAuditoria || ''];
  if (linhaIndice >= 2) aba.getRange(linhaIndice, 1, 1, linha.length).setValues([linha]);
  else aba.getRange(aba.getLastRow()+1, 1, 1, linha.length).setValues([linha]);
  registrarLogAuditoria_({ evento: 'INDICE_TALOES_ATUALIZADO', idCaso: dados.idCaso, nomeAba: dados.nomeAba, linhaRelatorio: dados.linhaRelatorio, timestamp: new Date() });
}

function sincronizarTalao190(caso) {
  var normalizador = (typeof normalizarPayloadCaso_ === 'function')
    ? normalizarPayloadCaso_
    : function (c) { return c || {}; };
  var casoNormalizado = normalizador(caso || {});
  var lock = LockService.getDocumentLock();
  var lockAdquirido = false;
  try {
    lock.waitLock(30000);
    lockAdquirido = true;
    registrarLogAuditoria_({
      evento: 'LOCK_TALAO_190_ADQUIRIDO',
      idCaso: casoNormalizado.idCaso,
      talao: casoNormalizado.talaoBopm,
      nome: casoNormalizado.nomeCompletoDesaparecido,
      timestamp: new Date()
    });
    var contextoData = resolverDataOperacionalCaso_(casoNormalizado);
    var abaTalao = obterOuCriarAbaTalao190_(contextoData.dataOperacional);
    validarConsistenciaEstruturalTalao190_(abaTalao, contextoData);
    var linha = montarLinhaTalao190(casoNormalizado, contextoData);
    var divergenciaAba = localizarRegistroEmAbaIncompativel_(casoNormalizado, abaTalao.getName());
    if (divergenciaAba) {
      registrarLogAuditoriaPersistencia_(SpreadsheetApp.getActiveSpreadsheet(), {
        dataHora: formatarDataHora(new Date()),
        status: 'alerta',
        chaveUnica: limparTexto(casoNormalizado.CHAVE_UNICA || casoNormalizado.chaveUnica),
        acaoExecutada: 'ALERTA_ABA_INCOMPATIVEL_TALAO_190',
        nomeDesaparecido: limparTexto(casoNormalizado.nomeCompletoDesaparecido),
        solicitante: limparTexto(casoNormalizado.nomeSolicitante),
        telefone: limparTexto(casoNormalizado.telefoneSolicitante),
        operador: limparTexto(casoNormalizado.operadorResponsavel),
        mensagemTecnica: 'Caso encontrado em aba incompatível=' + divergenciaAba + '; abaAtual=' + abaTalao.getName() + '; dataOperacional=' + contextoData.dataOperacionalISO
      });
    }
    var hashOperacional = gerarHashOperacionalTalao_(casoNormalizado, contextoData.dataOperacional);
    var talaoNormalizado = normalizarDocumentoRelatorio_(casoNormalizado.talaoBopm);
    var idCaso = limparTexto(casoNormalizado.idCaso);
    var indiceHit = localizarCasoPorIndiceTaloes_({ idCaso: idCaso, hashOperacional: hashOperacional, talaoNormalizado: talaoNormalizado });
    var linhaExistente = -1;
    if (indiceHit.encontrado) {
      var validacaoIndice = validarReferenciaIndiceTaloes_({ nomeAba: indiceHit.nomeAba, linhaRelatorio: indiceHit.linhaRelatorio }, { idCaso: idCaso, talaoNormalizado: talaoNormalizado });
      if (validacaoIndice.valido && indiceHit.nomeAba === abaTalao.getName()) linhaExistente = indiceHit.linhaRelatorio;
      else registrarLogAuditoria_({ evento: 'INDICE_TALOES_REFERENCIA_INVALIDA', idCaso: idCaso, motivo: validacaoIndice.motivo, timestamp: new Date() });
    }
    if (linhaExistente <= 0) linhaExistente = localizarLinhaDuplicadaRelatorio_(abaTalao, casoNormalizado);

    if (linhaExistente > 0) {
      var linhaAncoraAtualizacao = localizarLinhaAncoraRodape_(abaTalao);
      if (linhaExistente >= linhaAncoraAtualizacao) {
        throw new Error('Proteção estrutural: tentativa de atualização no rodapé fixo (linha ' + linhaExistente + ', âncora ' + linhaAncoraAtualizacao + ').');
      }
      abaTalao.getRange(linhaExistente, 1, 1, 11).setValues([linha]);
      registrarLogAuditoriaPersistencia_(SpreadsheetApp.getActiveSpreadsheet(), {
        dataHora: formatarDataHora(new Date()),
        status: 'atualizado',
        chaveUnica: limparTexto(casoNormalizado.CHAVE_UNICA || casoNormalizado.chaveUnica),
        acaoExecutada: 'UPDATE_RELATORIO_TALAO_190',
        nomeDesaparecido: limparTexto(casoNormalizado.nomeCompletoDesaparecido),
        solicitante: limparTexto(casoNormalizado.nomeSolicitante),
        telefone: limparTexto(casoNormalizado.telefoneSolicitante),
        operador: limparTexto(casoNormalizado.operadorResponsavel),
        mensagemTecnica: 'Caso já existente no relatório diário; atualização com setValues na linha ' + linhaExistente + '.'
      });
      atualizarIndiceTaloes_({ linhaIndice: indiceHit && indiceHit.linhaIndice, hashOperacional: hashOperacional, idCaso: idCaso, talaoNormalizado: talaoNormalizado, talaoOriginal: limparTexto(casoNormalizado.talaoBopm), nomeNormalizado: normalizarTextoAssinatura_(casoNormalizado.nomeCompletoDesaparecido), telefoneNormalizado: normalizarTelefoneRelatorio_(casoNormalizado.telefoneSolicitante), dataOperacional: contextoData.dataOperacionalISO, nomeAba: abaTalao.getName(), linhaRelatorio: linhaExistente, status: 'atualizado' });
      return { sucesso: true, status: 'atualizado', acao: 'ATUALIZADO', nomeAba: abaTalao.getName(), linha: linhaExistente, idCaso: idCaso, talaoBopm: casoNormalizado.talaoBopm, mensagem: 'Talão 190 sincronizado com sucesso.' };
    }

    var linhaLivre = localizarPrimeiraLinhaOperacionalLivre_(abaTalao);
    var linhaDestino = inserirLinhaOperacionalAntesRodape_(abaTalao);
    abaTalao.getRange(linhaDestino, 1, 1, 11).setValues([linha]);
    registrarLogAuditoriaPersistencia_(SpreadsheetApp.getActiveSpreadsheet(), {
      dataHora: formatarDataHora(new Date()),
      status: 'sucesso',
      chaveUnica: limparTexto(casoNormalizado.CHAVE_UNICA || casoNormalizado.chaveUnica),
      acaoExecutada: 'INSERT_RELATORIO_TALAO_190',
      nomeDesaparecido: limparTexto(casoNormalizado.nomeCompletoDesaparecido),
      solicitante: limparTexto(casoNormalizado.nomeSolicitante),
      telefone: limparTexto(casoNormalizado.telefoneSolicitante),
      operador: limparTexto(casoNormalizado.operadorResponsavel),
      mensagemTecnica: 'linhaLivreDetectada=' + linhaLivre + '; linhaInserida=' + linhaDestino + '; aba=' + abaTalao.getName() + '; dataOperacional=' + contextoData.dataOperacionalISO + '; talao=' + limparTexto(casoNormalizado.talaoBopm)
    });
    atualizarIndiceTaloes_({ linhaIndice: indiceHit && indiceHit.linhaIndice, hashOperacional: hashOperacional, idCaso: idCaso, talaoNormalizado: talaoNormalizado, talaoOriginal: limparTexto(casoNormalizado.talaoBopm), nomeNormalizado: normalizarTextoAssinatura_(casoNormalizado.nomeCompletoDesaparecido), telefoneNormalizado: normalizarTelefoneRelatorio_(casoNormalizado.telefoneSolicitante), dataOperacional: contextoData.dataOperacionalISO, nomeAba: abaTalao.getName(), linhaRelatorio: linhaDestino, status: 'ativo' });
    return { sucesso: true, status: 'sucesso', acao: 'INSERIDO', nomeAba: abaTalao.getName(), linha: linhaDestino, idCaso: idCaso, talaoBopm: casoNormalizado.talaoBopm, mensagem: 'Talão 190 sincronizado com sucesso.' };
  } catch (erro) {
    registrarLogAuditoria_({
      evento: 'ERRO_LOCK_TALAO_190',
      idCaso: casoNormalizado.idCaso,
      talaoBopm: casoNormalizado.talaoBopm,
      talaoPMESP: casoNormalizado.talaoPMESP,
      nome: casoNormalizado.nomeCompletoDesaparecido,
      mensagemErro: erro && erro.message ? erro.message : String(erro),
      stack: erro && erro.stack ? erro.stack : '',
      timestamp: new Date()
    });
    if (String(erro && erro.message || erro).indexOf('ÂNCORA_RODAPE_NAO_ENCONTRADA') !== -1) {
      try {
        registrarLogAuditoriaPersistencia_(SpreadsheetApp.getActiveSpreadsheet(), {
          dataHora: formatarDataHora(new Date()),
          status: 'erro',
          chaveUnica: limparTexto(caso && (caso.CHAVE_UNICA || caso.chaveUnica)),
          acaoExecutada: 'SINCRONIZACAO_BLOQUEADA_AUSENCIA_ANCORA',
          nomeDesaparecido: limparTexto(caso && caso.nomeCompletoDesaparecido),
          solicitante: limparTexto(caso && caso.nomeSolicitante),
          telefone: limparTexto(caso && caso.telefoneSolicitante),
          operador: limparTexto(caso && caso.operadorResponsavel),
          mensagemTecnica: 'Sincronização bloqueada: âncora de rodapé fixo ausente na aba diária.'
        });
      } catch (e) {}
    }
    Logger.log('ERRO_SINCRONIZAR_TALAO_190: ' + (erro && erro.message ? erro.message : erro));
    return { sucesso: false, status: 'erro', codigo: 'ERRO_SINCRONIZAR_TALAO_190', mensagem: erro && erro.message ? erro.message : String(erro) };
  } finally {
    if (lockAdquirido) {
      try {
        lock.releaseLock();
        registrarLogAuditoria_({
          evento: 'LOCK_TALAO_190_LIBERADO',
          idCaso: casoNormalizado.idCaso,
          talao: casoNormalizado.talaoBopm,
          nome: casoNormalizado.nomeCompletoDesaparecido,
          timestamp: new Date()
        });
      } catch (e) {}
    }
  }
}

function encontrarPrimeiraLinhaVaziaRelatorio(sheet) {
  return inserirLinhaOperacionalAntesRodape_(sheet);
}

function encontrarPrimeiraLinhaVaziaTalao(aba) {
  return encontrarPrimeiraLinhaVaziaRelatorio(aba);
}

function obterUltimaLinhaOperacionalRelatorio_(sheet) {
  var linhaAncora = localizarLinhaAncoraRodape_(sheet);
  return Math.max(PRIMEIRA_LINHA_DADOS_TALAO - 1, linhaAncora - 1);
}

function localizarLinhaAncoraRodape_(sheet) {
  var ultimaLinha = Math.max(sheet.getMaxRows(), 21);
  var colA = sheet.getRange(1, 1, ultimaLinha, 1).getDisplayValues();
  for (var i = 0; i < colA.length; i += 1) {
    if (limparTexto(colA[i][0]) === '### INICIO_RODAPE_FIXO ###') {
      return i + 1;
    }
  }
  throw new Error('ÂNCORA_RODAPE_NAO_ENCONTRADA: marcador "### INICIO_RODAPE_FIXO ###" ausente na coluna A da aba ' + sheet.getName() + '.');
}

function inserirLinhaOperacionalAntesRodape_(sheet) {
  var linhaAncora = localizarLinhaAncoraRodape_(sheet);
  if (linhaAncora <= PRIMEIRA_LINHA_DADOS_TALAO) {
    throw new Error('Estrutura inválida: âncora de rodapé na linha ' + linhaAncora + ', antes do início operacional.');
  }
  var linhaLivreExistente = localizarPrimeiraLinhaOperacionalLivre_(sheet, linhaAncora);
  if (linhaLivreExistente > 0) return linhaLivreExistente;
  var linhaOrigemFormato = linhaAncora - 1;
  sheet.insertRowsBefore(linhaAncora, 1);
  var intervaloOrigem = sheet.getRange(linhaOrigemFormato, 1, 1, sheet.getMaxColumns());
  var intervaloDestino = sheet.getRange(linhaAncora, 1, 1, sheet.getMaxColumns());
  intervaloOrigem.copyTo(intervaloDestino, SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
  intervaloDestino.clearContent();
  return linhaAncora;
}

function localizarPrimeiraLinhaOperacionalLivre_(sheet, linhaAncora) {
  var ancora = linhaAncora || localizarLinhaAncoraRodape_(sheet);
  var ultimaLinhaOperacional = ancora - 1;
  if (ultimaLinhaOperacional < PRIMEIRA_LINHA_DADOS_TALAO) return -1;
  var totalLinhas = ultimaLinhaOperacional - PRIMEIRA_LINHA_DADOS_TALAO + 1;
  var totalColunas = Math.max(11, sheet.getLastColumn(), sheet.getMaxColumns());
  var intervalo = sheet.getRange(PRIMEIRA_LINHA_DADOS_TALAO, 1, totalLinhas, totalColunas);
  var valores = intervalo.getValues();
  var exibidos = intervalo.getDisplayValues();
  var formulas = intervalo.getFormulas();
  for (var i = 0; i < totalLinhas; i += 1) {
    if (linhaOperacionalVazia_(valores[i], exibidos[i], formulas[i])) return PRIMEIRA_LINHA_DADOS_TALAO + i;
  }
  return -1;
}

function linhaOperacionalVazia_(valores, exibidos, formulas) {
  var limiteColunas = Math.min(11, Math.max((valores || []).length, (exibidos || []).length, (formulas || []).length));
  for (var i = 0; i < limiteColunas; i += 1) {
    var valor = limparTexto(valores && valores[i]).replace(/\u00A0/g, '').trim();
    var exibido = limparTexto(exibidos && exibidos[i]).replace(/\u00A0/g, '').trim();
    var formula = limparTexto(formulas && formulas[i]).trim();
    if (valor || exibido || formula) return false;
  }
  return true;
}

function localizarLinhaDuplicadaRelatorio_(sheet, caso) {
  var linhaAncora = localizarLinhaAncoraRodape_(sheet);
  var ultimaLinhaOperacional = linhaAncora - 1;
  if (ultimaLinhaOperacional < PRIMEIRA_LINHA_DADOS_TALAO) return -1;
  var linhas = ultimaLinhaOperacional - PRIMEIRA_LINHA_DADOS_TALAO + 1;
  var dados = sheet.getRange(PRIMEIRA_LINHA_DADOS_TALAO, 1, linhas, 11).getValues();
  var assinaturaBusca = gerarAssinaturaOperacionalRelatorio_(caso);
  var idCasoBusca = limparTexto(caso && caso.idCaso);
  var talaoBusca = normalizarDocumentoRelatorio_(caso && (caso.talaoPMESP || caso.talaoBopm || caso.numeroTalao || caso.talao));
  for (var i = 0; i < dados.length; i += 1) {
    var linha = dados[i];
    var vazia = linha.every(function (c) { return limparTexto(c) === ''; });
    if (vazia) continue;
    var assinaturaLinha = gerarAssinaturaOperacionalRelatorio_({
      talaoBopm: linha[1], cpf: linha[2], nomeCompletoDesaparecido: linha[3], telefoneSolicitante: linha[7], dataHoraRegistro: linha[0]
    });
    var idLinha = limparTexto(linha[10]);
    var talaoLinha = normalizarDocumentoRelatorio_(linha[1]);
    if ((idCasoBusca && idLinha && idLinha === idCasoBusca) || (talaoBusca && talaoLinha && talaoLinha === talaoBusca) || assinaturaLinha === assinaturaBusca) return PRIMEIRA_LINHA_DADOS_TALAO + i;
  }
  return -1;
}

function gerarAssinaturaOperacionalRelatorio_(caso) {
  var dataBase = normalizarDataRelatorio_(caso && (caso.dataServico || caso.dataHoraRegistro));
  return [
    dataBase,
    normalizarDocumentoRelatorio_(caso && (caso.talaoBopm || caso.talaoPMESP || caso.talao || caso.numeroTalao)),
    normalizarTextoAssinatura_(caso && caso.nomeCompletoDesaparecido),
    normalizarTelefoneRelatorio_(caso && caso.telefoneSolicitante)
  ].join('|');
}

function normalizarDocumentoRelatorio_(valor) { return limparTexto(valor).replace(/[^0-9A-Za-z]/g, '').toUpperCase(); }
function normalizarTelefoneRelatorio_(valor) { return limparTexto(valor).replace(/\D/g, ''); }
function normalizarDataRelatorio_(valor) {
  var dt = valor instanceof Date ? valor : new Date(valor);
  if (!(dt instanceof Date) || isNaN(dt.getTime())) return limparTexto(valor);
  return Utilities.formatDate(dt, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function normalizarDataServicoImutavel_(dataServico, dataHoraRegistro) {
  var base = limparTexto(dataServico) || limparTexto(dataHoraRegistro);
  var normalizada = normalizarDataRelatorio_(base);
  return limparTexto(normalizada) || normalizarDataRelatorio_(new Date());
}


function limparDuplicadosRelatorioAtual() {
  var aba = obterOuCriarAbaTalao190(new Date());
  var ultimaLinhaOperacional = obterUltimaLinhaOperacionalRelatorio_(aba);
  if (ultimaLinhaOperacional < PRIMEIRA_LINHA_DADOS_TALAO) return { removidos: 0, mantidos: 0 };
  var totalLinhas = ultimaLinhaOperacional - PRIMEIRA_LINHA_DADOS_TALAO + 1;
  var dados = aba.getRange(PRIMEIRA_LINHA_DADOS_TALAO, 1, totalLinhas, 11).getValues();
  var assinaturas = {};
  var removidos = 0;
  for (var i = dados.length - 1; i >= 0; i -= 1) {
    var linha = dados[i];
    if (linha.every(function (c) { return limparTexto(c) === ''; })) continue;
    var assinatura = gerarAssinaturaOperacionalRelatorio_({ talaoBopm: linha[1], cpf: linha[2], nomeCompletoDesaparecido: linha[3], telefoneSolicitante: linha[7], dataHoraRegistro: linha[0] });
    if (assinaturas[assinatura]) {
      aba.getRange(PRIMEIRA_LINHA_DADOS_TALAO + i, 1, 1, 11).clearContent();
      removidos += 1;
    } else {
      assinaturas[assinatura] = true;
    }
  }
  return { removidos: removidos, mantidos: Object.keys(assinaturas).length };
}

function obterOuCriarAbaTalao190(data) {
  return obterOuCriarAbaTalao190_(data);
}

function obterOuCriarAbaTalao190_(dataOperacional) {
  var planilhaTalao = SpreadsheetApp.openById(ID_PLANILHA_TALAO_190);
  var nomeAba = formatarNomeAbaTalao190_(dataOperacional);
  var aba = planilhaTalao.getSheetByName(nomeAba);
  if (aba) {
    atualizarTituloTalao(aba, dataOperacional);
    return aba;
  }

  var abaModelo = planilhaTalao.getSheetByName(ABA_MODELO_TALAO);
  if (!abaModelo) throw new Error('Aba modelo não encontrada: ' + ABA_MODELO_TALAO);

  aba = abaModelo.copyTo(planilhaTalao).setName(nomeAba);
  planilhaTalao.setActiveSheet(aba);
  planilhaTalao.moveActiveSheet(1);
  atualizarTituloTalao(aba, dataOperacional);
  return aba;
}

function formatarNomeAbaTalao(data) {
  return formatarNomeAbaTalao190_(data);
}

function formatarNomeAbaTalao190_(data) {
  var dt = data instanceof Date ? data : new Date(data);
  if (!(dt instanceof Date) || isNaN(dt.getTime())) throw new Error('DATA_SERVICO_INVALIDA_PARA_NOME_DA_ABA');
  var meses = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  var dia = ('0' + dt.getDate()).slice(-2);
  var mes = meses[dt.getMonth()];
  var ano = ('0' + (dt.getFullYear() % 100)).slice(-2);
  return dia + mes + ano;
}

function resolverDataOperacionalCaso_(caso) {
  var nomeAbaTalao190 = limparTexto(caso && (caso.nomeAbaTalao190 || caso.nomeAba));
  var abaOrigem = limparTexto(caso && caso.abaOrigem);
  var dataBrutaServico = limparTexto(caso && caso.dataServico);
  var dataBrutaRegistro = limparTexto(caso && caso.dataHoraRegistro);
  if (!nomeAbaTalao190 && !abaOrigem && !dataBrutaServico && !dataBrutaRegistro) {
    var erroAba = new Error('Não foi possível identificar a aba diária do Talão 190. Informe dataServico, dataHoraRegistro ou referência da aba original.');
    erroAba.codigo = 'ABA_TALAO_190_NAO_IDENTIFICADA';
    throw erroAba;
  }
  var base = dataBrutaServico || dataBrutaRegistro;
  var dt = base ? new Date(base) : new Date();
  if (!(dt instanceof Date) || isNaN(dt.getTime())) dt = new Date();
  var iso = Utilities.formatDate(dt, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return { dataOperacional: dt, dataOperacionalISO: iso, fonteData: dataBrutaServico ? 'dataServico' : (dataBrutaRegistro ? 'dataHoraRegistro' : 'sistema') };
}

function montarLinhaTalao190(caso, contextoData) {
  var contexto = contextoData || resolverDataOperacionalCaso_(caso);
  var dataRegistro = contexto.dataOperacionalISO;
  var dataServico = contexto.dataOperacionalISO;
  return [
    dataRegistro, // DATA
    caso.talaoBopm || '', // BOPM
    caso.cpf || '', // CPF/RG
    caso.nomeCompletoDesaparecido || '', // NOME COMPLETO (Desaparecido)
    caso.observacoesOperacionais || '', // OBS.
    dataServico, // DATA (serviço)
    caso.nomeSolicitante || '', // Nome do Solicitante
    caso.telefoneSolicitante || '', // Telefone
    caso.observacoesOperacionais || '', // OBS.
    caso.encerrado190 || 'DESAPARECIDO', // 190
    limparTexto(caso.idCaso || caso.id) || caso.operadorResponsavel || '' // Operador PM (idCaso preferencial para UPSERT)
  ];
}

function validarConsistenciaEstruturalTalao190_(aba, contextoData) {
  var nomeEsperado = formatarNomeAbaTalao190_(contextoData.dataOperacional);
  if (aba.getName() !== nomeEsperado) {
    throw new Error('BLOQUEIO_DIVERGENCIA_ABA_DATA: aba=' + aba.getName() + '; esperado=' + nomeEsperado + '; data=' + contextoData.dataOperacionalISO);
  }
  atualizarTituloTalao(aba, contextoData.dataOperacional);
  if (!validarTituloTalaoConsistente_(aba, contextoData.dataOperacional)) {
    throw new Error('BLOQUEIO_DIVERGENCIA_TITULO_DATA: aba=' + aba.getName() + '; data=' + contextoData.dataOperacionalISO);
  }
}

function validarTituloTalaoConsistente_(aba, data) {
  var tituloEsperado = 'RELATÓRIO TALÃO 190 ' + formatarNomeAbaTalao190_(data) + ' - ';
  var valores = aba.getDataRange().getDisplayValues();
  for (var i = 0; i < valores.length; i += 1) {
    for (var j = 0; j < valores[i].length; j += 1) {
      var valor = limparTexto(valores[i][j]).toUpperCase();
      if (valor.indexOf('RELATÓRIO TALÃO 190') !== -1) return valor.indexOf(tituloEsperado.toUpperCase()) === 0;
    }
  }
  return false;
}

function localizarRegistroEmAbaIncompativel_(caso, abaAtual) {
  var planilhaTalao = SpreadsheetApp.openById(ID_PLANILHA_TALAO_190);
  var talao = normalizarDocumentoRelatorio_(caso && (caso.talaoPMESP || caso.talaoBopm || caso.numeroTalao || caso.talao));
  var idCaso = limparTexto(caso && caso.idCaso);
  if (!talao && !idCaso) return '';
  var abas = planilhaTalao.getSheets();
  for (var i = 0; i < abas.length; i += 1) {
    var aba = abas[i];
    var nome = aba.getName();
    if (nome === abaAtual || !/^\d{2}[A-Z]{3}\d{2}$/.test(nome)) continue;
    var linhaHit = localizarLinhaDuplicadaRelatorio_(aba, caso);
    if (linhaHit > 0) return nome;
  }
  return '';
}

function obterDiaSemanaPtBr(data) {
  var dias = [
    'DOMINGO',
    'SEGUNDA-FEIRA',
    'TERÇA-FEIRA',
    'QUARTA-FEIRA',
    'QUINTA-FEIRA',
    'SEXTA-FEIRA',
    'SÁBADO'
  ];

  return dias[data.getDay()];
}

function atualizarTituloTalao(aba, data) {
  var dt = data instanceof Date ? data : new Date(data);
  if (!(dt instanceof Date) || isNaN(dt.getTime())) dt = new Date();

  var nomeAba = formatarNomeAbaTalao(dt);
  var diaSemana = obterDiaSemanaPtBr(dt);
  var titulo = 'RELATÓRIO TALÃO 190 ' + nomeAba + ' - ' + diaSemana;

  var intervalo = aba.getDataRange();
  var valores = intervalo.getValues();

  for (var i = 0; i < valores.length; i++) {
    for (var j = 0; j < valores[i].length; j++) {
      var valor = String(valores[i][j] || '').toUpperCase();
      if (valor.indexOf('RELATÓRIO TALÃO 190') !== -1) {
        aba.getRange(i + 1, j + 1).setValue(titulo);
        return;
      }
    }
  }

  aba.getRange('A5').setValue(titulo);
}

function executarAuditoriaHeaderCasos() {
  return auditarHeaderCasos_();
}
function auditarHeaderCasos_() {
  var schema = obterSchemaCabineVerdeUnificado_();
  var schemaCasos = Array.isArray(schema && schema.CASOS) ? schema.CASOS : [];
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var abaCasos = planilha.getSheetByName('CASOS');
  if (!abaCasos) {
    return { ok: false, erro: 'Aba CASOS não encontrada.', schemaCasos: schemaCasos.length };
  }

  var cabecalhoAtual = abaCasos.getRange(1, 1, 1, Math.max(abaCasos.getLastColumn(), 1)).getValues()[0].map(limparTexto).filter(Boolean);
  var normalizados = {};
  var duplicadas = [];
  cabecalhoAtual.forEach(function (coluna) {
    var chave = normalizarCabecalho_(coluna);
    if (normalizados[chave]) duplicadas.push(coluna);
    normalizados[chave] = true;
  });

  var schemaNormalizado = schemaCasos.map(normalizarCabecalho_);
  var extras = cabecalhoAtual.filter(function (coluna) {
    return schemaNormalizado.indexOf(normalizarCabecalho_(coluna)) === -1;
  });

  Logger.log('HEADER FINAL CASOS: ' + schemaCasos.length);
  Logger.log('COLUNAS EXTRAS CASOS: ' + JSON.stringify(extras));
  Logger.log('COLUNAS DUPLICADAS CASOS: ' + JSON.stringify(duplicadas));

  return {
    ok: true,
    headerAtual: cabecalhoAtual.length,
    headerSchema: schemaCasos.length,
    colunasExtras: extras,
    colunasDuplicadas: duplicadas
  };
}

function testeGravacaoDireta() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var aba = ss.getSheetByName("CASOS");
  aba.appendRow([
    "TESTE123",
    "7450",
    new Date(),
    "TESTE"
  ]);
}



function testarSalvarCasoPayloadMinimo181() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var schema = obterSchemaCabineVerdeUnificado_();
  var valores = schema.CASOS.map(function (col) {
    if (col === 'idCaso') return 'TESTE-181';
    if (col === 'nomeCompletoDesaparecido') return 'Teste Cabine Verde';
    if (col === 'municipio') return 'SÃO PAULO';
    return '';
  });

  return persistirRegistro(ss, {
    action: 'salvarCaso',
    aba: 'CASOS',
    colunas: schema.CASOS,
    valores: valores,
    payload: {
      idCaso: 'TESTE-181',
      nomeCompletoDesaparecido: 'Teste Cabine Verde',
      municipio: 'SÃO PAULO'
    },
    operadorEmail: 'cabineverdeesperanca@gmail.com',
    operadorNome: 'admin',
    operadorPerfil: 'ADMIN'
  });
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
      var colunasSchemaCasos = obterSchemaCabineVerdeUnificado_().CASOS;
      var colunasAtualizadas = garantirColunasDaEstrutura(sheetCasosExistente, colunasSchemaCasos.concat(['flagDuplicidade']));
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
  var schema = obterSchemaCabineVerdeUnificado_();
  var colunasEventos = Array.isArray(schema.EVENTOS_CASO) ? schema.EVENTOS_CASO : obterColunasEventosCaso_();
  garantirAbaComCabecalhos_(planilha, 'EVENTOS_CASO', colunasEventos);
  var sheetEventos = garantirAbaComCabecalho(planilha, 'EVENTOS_CASO', colunasEventos);
  var cabecalhoEventos = garantirColunasDaEstrutura(sheetEventos, colunasEventos);
  var meta = metadados || {};
  var eventoPorColuna = {
    idCaso: limparTexto(idCaso),
    talaoPMESP: limparTexto(meta.talaoPMESP),
    dataHora: formatarDataHora(new Date()),
    evento: limparTexto(tipoEvento),
    descricao: limparTexto(descricaoEvento),
    operadorEmail: limparTexto(meta.operadorEmail),
    operadorPerfil: limparTexto(meta.operadorPerfil || meta.perfil),
    operadorNome: limparTexto(meta.operadorNome),
    resultado: limparTexto(meta.resultado || 'SUCESSO')
  };

  var linhaEvento = cabecalhoEventos.map(function (nomeColuna) {
    return normalizarValorPlanilha(eventoPorColuna[nomeColuna]);
  });

  sheetEventos.appendRow(linhaEvento);
  return true;
}

function gerarTimelineCaso_(idCaso) {
  garantirEstruturaCabineVerde_();
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
  var aba = planilha.getSheetByName('EVENTOS_CASO');
  if (!aba || aba.getLastRow() < 2) return [];

  var colunasEventos = obterSchemaCabineVerdeUnificado_().EVENTOS_CASO;
  var cabecalho = garantirColunasDaEstrutura(aba, colunasEventos).map(limparTexto);
  var idxIdCaso = cabecalho.indexOf('idCaso');
  var idxDataHora = cabecalho.indexOf('dataHora');
  var idxTipoEvento = cabecalho.indexOf('evento');
  var idxDescricao = cabecalho.indexOf('descricao');
  var idxTalao = cabecalho.indexOf('talaoPMESP');
  if (idxIdCaso < 0 || idxDataHora < 0 || idxTipoEvento < 0 || idxDescricao < 0) return [];

  var dados = aba.getRange(2, 1, aba.getLastRow() - 1, aba.getLastColumn()).getValues();
  var talaoBusca = limparTexto(idCaso);
  return dados.filter(function (linha) {
    return limparTexto(linha[idxIdCaso]) === idCaso || (idxTalao >= 0 && limparTexto(linha[idxTalao]) === talaoBusca);
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
      detalhes: { fonte: 'EVENTOS_CASO', descricaoEvento: descricao }
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
  var talaoBusca = limparTexto(idCaso);
  return dados.filter(function (linha) {
    return limparTexto(linha[idxIdCaso]) === idCaso || (idxTalao >= 0 && limparTexto(linha[idxTalao]) === talaoBusca);
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

function executarLimpezaCasosReal() {
  return auditarELimparCasosSeguro_(false);
}
function executarAuditoriaCasosDryRun() {
  return auditarELimparCasosSeguro_(true);
}
function auditarELimparCasosSeguro_(dryRun) {
  var DRY_RUN = dryRun !== false;
  var schema = obterSchemaCabineVerdeUnificado_();
  var schemaCasos = Array.isArray(schema && schema.CASOS) ? schema.CASOS : [];
  if (!schemaCasos.length) throw new Error('Schema oficial CASOS inválido.');

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var abaOriginal = ss.getSheetByName('CASOS');
  if (!abaOriginal) throw new Error('Aba CASOS não encontrada.');

  var headerOriginal = abaOriginal.getRange(1, 1, 1, Math.max(abaOriginal.getLastColumn(), 1)).getValues()[0].map(limparTexto).filter(Boolean);
  var headerNorm = headerOriginal.map(normalizarCabecalho_);
  var schemaNorm = schemaCasos.map(normalizarCabecalho_);

  var duplicadas = [];
  var seen = {};
  headerNorm.forEach(function (h, i) { if (seen[h]) duplicadas.push(headerOriginal[i]); seen[h] = true; });

  var extras = headerOriginal.filter(function (c) { return schemaNorm.indexOf(normalizarCabecalho_(c)) === -1; });
  var equivalencias = {
    talaopmesp: 'talaoBopm',
    datahorainicio: 'dataHoraRegistro',
    datahoraultimaatualizacao: 'dataHoraRegistro',
    status: 'statusCaso',
    dadosveiculotransporte: 'dadosVeiculo',
    fotodigitaldisponivel: 'fotoDisponivel',
    dispositivovinculado: 'dispositivoLigado',
    telefonedispositivopessoa: 'telefoneDesaparecido',
    vulnerabilidadeidentificada: 'vulnerabilidade',
    risco: 'classificacaoRisco',
    classificacaooperacional: 'classificacaoRisco',
    operadorcriador: 'operadorResponsavel',
    operadorultimaacao: 'operadorResponsavel',
    observacoesoperacionais: 'observacoesOperacionais',
    tipocaso: 'observacoesOperacionais',
    flagalerta: 'observacoesOperacionais',

    // aliases operacionais legados para a aba CASOS
    data: 'dataHoraRegistro',
    bopm: 'talaoBopm',
    cpfrg: 'cpf',
    nomecompleto: 'nomeCompletoDesaparecido',
    observacaocurta: 'observacoesOperacionais',
    datadoatendimento: 'dataServico',
    nomedosolicitante: 'nomeSolicitante',
    telefone: 'telefoneSolicitante',
    observacaocompleta: 'observacoesOperacionais',
    status190: 'encerrado190',
    operadorpm: 'operadorResponsavel'
  };

  function concatenarObservacoesOperacionais_(valorAtual, prefixo, valorExtra) {
    var base = limparTexto(valorAtual);
    var extraLimpo = limparTexto(valorExtra);
    if (!extraLimpo) return base;
    var bloco = prefixo + extraLimpo;
    return base ? (base + ' | ' + bloco) : bloco;
  }

  var camposEquivalentes = [];
  var camposPerdidos = [];
  extras.forEach(function (coluna) {
    var destino = equivalencias[normalizarCabecalho_(coluna)];
    if (destino && schemaNorm.indexOf(normalizarCabecalho_(destino)) !== -1) {
      camposEquivalentes.push({ origem: coluna, destino: destino });
    } else {
      camposPerdidos.push(coluna);
    }
  });

  var relatorio = {
    dryRun: DRY_RUN,
    totalColunasAtuais: headerOriginal.length,
    totalColunasOficiais: schemaCasos.length,
    colunasExtras: extras,
    colunasDuplicadas: duplicadas,
    camposEquivalentesEncontrados: camposEquivalentes,
    camposQueSeriamPerdidos: camposPerdidos,
    planoMigracao: [
      'Criar backup CASOS_BACKUP_<timestamp>',
      'Criar CASOS_LIMPA com header oficial de 181 colunas',
      'Copiar dados mapeados por header/equivalências',
      'Validar contagem de linhas',
      'Renomear CASOS para CASOS_ANTIGA e CASOS_LIMPA para CASOS'
    ]
  };

  Logger.log('RELATORIO AUDITORIA CASOS: ' + JSON.stringify(relatorio));
  if (DRY_RUN) return relatorio;

  var timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'America/Sao_Paulo', 'yyyyMMdd_HHmmss');
  var backupName = 'CASOS_BACKUP_' + timestamp;
  abaOriginal.copyTo(ss).setName(backupName);

  var abaLimpa = ss.getSheetByName('CASOS_LIMPA');
  if (abaLimpa) ss.deleteSheet(abaLimpa);
  abaLimpa = ss.insertSheet('CASOS_LIMPA');
  abaLimpa.getRange(1, 1, 1, schemaCasos.length).setValues([schemaCasos]);

  var linhas = abaOriginal.getLastRow();
  if (linhas > 1) {
    var dados = abaOriginal.getRange(2, 1, linhas - 1, abaOriginal.getLastColumn()).getValues();
    var dadosMapeados = dados.map(function (linha) {
      return schemaCasos.map(function (colDestino) {
        if (colDestino === 'observacoesOperacionais') {
          var idxObs = headerNorm.indexOf('observacoesoperacionais');
          var observacao = idxObs >= 0 ? normalizarValorPlanilha(linha[idxObs]) : '';
          var idxTipoCaso = headerNorm.indexOf('tipocaso');
          if (idxTipoCaso >= 0) {
            observacao = concatenarObservacoesOperacionais_(observacao, 'tipoCaso: ', normalizarValorPlanilha(linha[idxTipoCaso]));
          }
          var idxFlagAlerta = headerNorm.indexOf('flagalerta');
          if (idxFlagAlerta >= 0) {
            observacao = concatenarObservacoesOperacionais_(observacao, 'flagAlerta: ', normalizarValorPlanilha(linha[idxFlagAlerta]));
          }
          return observacao;
        }

        var idxDireto = headerNorm.indexOf(normalizarCabecalho_(colDestino));
        if (idxDireto >= 0) return normalizarValorPlanilha(linha[idxDireto]);

        var origemEq = null;
        for (var chave in equivalencias) {
          if (equivalencias[chave] === colDestino) {
            var idxEq = headerNorm.indexOf(chave);
            if (idxEq >= 0) { origemEq = idxEq; break; }
          }
        }
        return origemEq !== null ? normalizarValorPlanilha(linha[origemEq]) : '';
      });
    });
    if (dadosMapeados.length) {
      abaLimpa.getRange(2, 1, dadosMapeados.length, schemaCasos.length).setValues(dadosMapeados);
    }
  }

  if (abaLimpa.getLastRow() !== abaOriginal.getLastRow()) {
    throw new Error('Validação de linhas falhou: CASOS_LIMPA=' + abaLimpa.getLastRow() + ' CASOS=' + abaOriginal.getLastRow());
  }

  abaOriginal.setName('CASOS_ANTIGA');
  abaLimpa.setName('CASOS');

  relatorio.executado = true;
  relatorio.backupCriado = backupName;
  relatorio.linhasOriginais = abaOriginal.getLastRow();
  relatorio.linhasMigradas = ss.getSheetByName('CASOS').getLastRow();
  return relatorio;
}

function listarCasosPorStatus_(status) {
  var casos = listarCasosComProtecao_({ perfil: 'ADMIN' });
  var alvo = limparTexto(status).toLowerCase();
  return casos.filter(function (caso) {
    var statusCaso = limparTexto(caso.statusCaso).toLowerCase();
    if (alvo === 'desap') return statusCaso === 'desap' || statusCaso.indexOf('busca') >= 0 || statusCaso.indexOf('desap') >= 0;
    if (alvo === 'loc') return statusCaso === 'loc' || statusCaso.indexOf('local') >= 0 || statusCaso.indexOf('encerr') >= 0;
    return true;
  });
}

function gerarRelatorioCasos_(status) {
  var casos = listarCasosPorStatus_(status);
  return {
    status: limparTexto(status),
    total: casos.length,
    casos: casos
  };
}

function gerarBackupBase_(operadorAtual) {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var schema = obterSchemaCabineVerdeUnificado_();
  var abas = ['CASOS', 'AUDITORIAS', 'EVENTOS_CASO', 'LOGS'];
  var dadosAbas = abas.map(function (nomeAba) {
    var aba = planilha.getSheetByName(nomeAba);
    if (!aba) return { nome: nomeAba, colunas: [], registros: [] };
    var valores = aba.getDataRange().getValues();
    if (!valores.length) return { nome: nomeAba, colunas: [], registros: [] };
    var colunas = valores[0].map(limparTexto);
    var registros = valores.slice(1).map(function (linha) {
      var item = {};
      colunas.forEach(function (coluna, idx) { item[coluna] = normalizarValorPlanilha(linha[idx]); });
      return item;
    });
    return { nome: nomeAba, colunas: colunas, registros: registros };
  });
  var totalCasos = dadosAbas.reduce(function (acc, aba) { return aba.nome === 'CASOS' ? aba.registros.length : acc; }, 0);
  return {
    meta: {
      data: formatarDataHora(new Date()),
      operador: { email: limparTexto(operadorAtual.email), nome: limparTexto(operadorAtual.nome), perfil: limparTexto(operadorAtual.perfil) },
      versao: 'cabine-verde-backup-oficial-v1',
      quantidadeCasos: totalCasos
    },
    schema: schema,
    abas: dadosAbas
  };
}

function restaurarBackupBase_(backup, operadorAtual) {
  if (!backup || !backup.meta || !Array.isArray(backup.abas)) {
    throw new Error('Backup inválido.');
  }
  registrarLogAcessoOperador_(
    SpreadsheetApp.getActiveSpreadsheet(),
    'RESTAURACAO_BACKUP_BASE',
    'PENDENTE_VALIDACAO_MANUAL',
    'Solicitação de restauração recebida. Fluxo automático bloqueado por segurança operacional.',
    operadorAtual.email,
    { perfil: operadorAtual.perfil, origem: 'auditoria.html' }
  );
  return { restaurado: false, bloqueado: true, motivo: 'Restauração automática desativada por segurança. Solicitação registrada em LOGS.' };
}


function limparDuplicadosCasosPorAssinatura() {
  garantirEstruturaCabineVerde_();
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var schema = obterSchemaCabineVerdeUnificado_();
  var abaCasos = garantirAbaComCabecalho(planilha, 'CASOS', schema.CASOS);
  var cabecalho = garantirColunasDaEstrutura(abaCasos, schema.CASOS);
  var total = Math.max(abaCasos.getLastRow() - 1, 0);
  if (!total) return { removidos: 0, mantidos: 0 };
  var dados = abaCasos.getRange(2, 1, total, abaCasos.getLastColumn()).getValues();
  var vistos = {};
  var removidos = 0;
  for (var i = dados.length - 1; i >= 0; i -= 1) {
    var registro = {};
    cabecalho.forEach(function (coluna, cidx) { registro[coluna] = dados[i][cidx]; });
    var assinatura = gerarAssinaturaCaso_(registro);
    if (!assinatura || assinatura === '|||') continue;
    if (vistos[assinatura]) {
      abaCasos.deleteRow(i + 2);
      removidos += 1;
    } else {
      vistos[assinatura] = true;
    }
  }
  return { removidos: removidos, mantidos: Object.keys(vistos).length };
}

function recuperarTaloesAusentesCasos() {
  garantirEstruturaCabineVerde_();
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var schema = obterSchemaCabineVerdeUnificado_();
  var abaCasos = garantirAbaComCabecalho(planilha, 'CASOS', schema.CASOS);
  var cabecalhoCasos = garantirColunasDaEstrutura(abaCasos, schema.CASOS);
  var totalLinhas = Math.max(abaCasos.getLastRow() - 1, 0);
  if (!totalLinhas) {
    return { totalAnalisado: 0, totalSemTalao: 0, totalRecuperado: 0, totalNaoRecuperado: 0, casosNaoRecuperados: [] };
  }

  var idxTalaoBopm = cabecalhoCasos.indexOf('talaoBopm');
  var idxIdCaso = cabecalhoCasos.indexOf('idCaso');
  var idxObservacoes = cabecalhoCasos.indexOf('observacoesOperacionais');
  var idxNome = cabecalhoCasos.indexOf('nomeCompletoDesaparecido');
  var idxTelefone = cabecalhoCasos.indexOf('telefoneSolicitante');
  var idxDataServico = cabecalhoCasos.indexOf('dataServico');
  if (idxTalaoBopm < 0) throw new Error('Coluna talaoBopm não encontrada em CASOS.');

  var dadosCasos = abaCasos.getRange(2, 1, totalLinhas, abaCasos.getLastColumn()).getValues();
  var mapaEventos = mapearTextosPorIdCaso_('EVENTOS_CASO', ['idCaso', 'descricaoEvento', 'detalhes', 'observacoes']);
  var mapaHistorico = mapearTextosPorIdCaso_('HISTORICO_EDICOES', ['idCaso', 'valorNovo', 'valorAnterior', 'justificativa']);
  var mapaLogs = mapearTextosPorIdCaso_('LOG_AUDITORIA', ['chaveUnica', 'mensagemTecnica', 'acaoExecutada']);
  var mapaCopom = mapearTalaoPorChaveCopom_();

  var atualizacoes = [];
  var registrosLog = [];
  var casosNaoRecuperados = [];
  var totalSemTalao = 0;
  var totalRecuperado = 0;

  dadosCasos.forEach(function (linha, idx) {
    var talaoAtual = limparTexto(linha[idxTalaoBopm]);
    if (talaoAtual) return;
    totalSemTalao += 1;

    var idCaso = idxIdCaso >= 0 ? limparTexto(linha[idxIdCaso]) : '';
    var nome = idxNome >= 0 ? limparTexto(linha[idxNome]) : '';
    var telefone = idxTelefone >= 0 ? limparTexto(linha[idxTelefone]) : '';
    var dataServico = idxDataServico >= 0 ? limparTexto(linha[idxDataServico]) : '';
    var recuperado = buscarTalaoPorPrioridade_({
      observacoesOperacionais: idxObservacoes >= 0 ? limparTexto(linha[idxObservacoes]) : '',
      textoHistorico: mapaHistorico[idCaso] || '',
      textoLog: mapaLogs[idCaso] || '',
      textoEvento: mapaEventos[idCaso] || '',
      chaveCopom: gerarChaveCopom_(nome, telefone, dataServico),
      mapaCopom: mapaCopom
    });

    if (recuperado && recuperado.valor) {
      atualizacoes.push({ linhaPlanilha: idx + 2, valor: recuperado.valor });
      registrosLog.push(criarLogRecuperacaoTalao_(idCaso, nome, telefone, 'talao_recuperado', recuperado.origem, recuperado.valor));
      totalRecuperado += 1;
      return;
    }

    casosNaoRecuperados.push({ idCaso: idCaso, nomeCompletoDesaparecido: nome, telefoneSolicitante: telefone, dataServico: dataServico });
    registrosLog.push(criarLogRecuperacaoTalao_(idCaso, nome, telefone, 'talao_nao_recuperado', 'nao_encontrado', ''));
  });

  if (atualizacoes.length) {
    var valoresColuna = abaCasos.getRange(2, idxTalaoBopm + 1, totalLinhas, 1).getValues();
    atualizacoes.forEach(function (item) {
      valoresColuna[item.linhaPlanilha - 2][0] = item.valor;
    });
    abaCasos.getRange(2, idxTalaoBopm + 1, totalLinhas, 1).setValues(valoresColuna);
  }

  if (registrosLog.length) {
    var abaLog = garantirAbaComCabecalho(planilha, ABA_LOG_AUDITORIA, COLUNAS_LOG_AUDITORIA);
    var cabecalhoLog = garantirColunasDaEstrutura(abaLog, COLUNAS_LOG_AUDITORIA);
    var linhasLog = registrosLog.map(function (registro) {
      return cabecalhoLog.map(function (coluna) { return normalizarValorPlanilha(registro[coluna]); });
    });
    abaLog.getRange(abaLog.getLastRow() + 1, 1, linhasLog.length, cabecalhoLog.length).setValues(linhasLog);
  }

  return {
    totalAnalisado: totalLinhas,
    totalSemTalao: totalSemTalao,
    totalRecuperado: totalRecuperado,
    totalNaoRecuperado: totalSemTalao - totalRecuperado,
    casosNaoRecuperados: casosNaoRecuperados
  };
}

function buscarTalaoPorPrioridade_(fontes) {
  var candidatos = [
    { origem: 'observacao', texto: fontes.observacoesOperacionais || '' },
    { origem: 'historico', texto: fontes.textoHistorico || '' },
    { origem: 'log', texto: fontes.textoLog || '' },
    { origem: 'evento', texto: fontes.textoEvento || '' }
  ];
  for (var i = 0; i < candidatos.length; i += 1) {
    var valor = extrairTalaoTexto_(candidatos[i].texto);
    if (valor) return { valor: valor, origem: candidatos[i].origem };
  }
  var valorCopom = fontes.mapaCopom[fontes.chaveCopom] || '';
  if (valorCopom) return { valor: valorCopom, origem: 'relatorio' };
  return null;
}

function extrairTalaoTexto_(texto) {
  var conteudo = limparTexto(texto);
  if (!conteudo) return '';
  var regex = /(?:TAL[ÃA]O|BOPM)\s*(?:N[º°O]\s*)?[:#-]?\s*(\d{4,12})/i;
  var match = conteudo.match(regex);
  return match && match[1] ? limparTexto(match[1]) : '';
}

function mapearTextosPorIdCaso_(nomeAba, camposTexto) {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var aba = planilha.getSheetByName(nomeAba);
  if (!aba || aba.getLastRow() < 2) return {};
  var dados = aba.getDataRange().getValues();
  var cabecalho = dados[0].map(limparTexto);
  var idxId = cabecalho.indexOf('idCaso');
  if (idxId < 0) return {};
  var indicesTexto = camposTexto.map(function (campo) { return cabecalho.indexOf(campo); }).filter(function (idx) { return idx >= 0; });
  var mapa = {};
  for (var i = 1; i < dados.length; i += 1) {
    var idCaso = limparTexto(dados[i][idxId]);
    if (!idCaso) continue;
    var textoLinha = indicesTexto.map(function (idx) { return limparTexto(dados[i][idx]); }).join(' | ');
    mapa[idCaso] = (mapa[idCaso] ? mapa[idCaso] + ' | ' : '') + textoLinha;
  }
  return mapa;
}

function mapearTalaoPorChaveCopom_() {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var aba = planilha.getSheetByName('COPOM - CABINE VERDE');
  if (!aba || aba.getLastRow() < 2) return {};
  var dados = aba.getDataRange().getValues();
  var cabecalho = dados[0].map(limparTexto);
  var idxNome = cabecalho.indexOf('nomeCompletoDesaparecido');
  var idxTelefone = cabecalho.indexOf('telefoneSolicitante');
  var idxDataServico = cabecalho.indexOf('dataServico');
  var idxTalao = cabecalho.indexOf('talaoBopm');
  if (idxNome < 0 || idxTelefone < 0 || idxDataServico < 0 || idxTalao < 0) return {};
  var mapa = {};
  for (var i = 1; i < dados.length; i += 1) {
    var valorTalao = limparTexto(dados[i][idxTalao]);
    if (!valorTalao) continue;
    var chave = gerarChaveCopom_(dados[i][idxNome], dados[i][idxTelefone], dados[i][idxDataServico]);
    if (chave) mapa[chave] = valorTalao;
  }
  return mapa;
}

function gerarChaveCopom_(nome, telefone, dataServico) {
  return [limparTexto(nome).toUpperCase(), limparTexto(telefone), normalizarDataSomenteDia_(dataServico)].join('|');
}

function normalizarDataSomenteDia_(valor) {
  if (valor instanceof Date && !isNaN(valor.getTime())) {
    return Utilities.formatDate(valor, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  var texto = limparTexto(valor);
  if (!texto) return '';
  var matchIso = texto.match(/(\d{4}-\d{2}-\d{2})/);
  if (matchIso) return matchIso[1];
  var matchBr = texto.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (matchBr) return matchBr[3] + '-' + matchBr[2] + '-' + matchBr[1];
  return texto;
}

function criarLogRecuperacaoTalao_(idCaso, nome, telefone, status, origem, valorRecuperado) {
  return {
    dataHora: formatarDataHora(new Date()),
    status: status,
    chaveUnica: idCaso,
    acaoExecutada: 'recuperarTaloesAusentesCasos|' + origem + '|valor=' + (valorRecuperado || ''),
    nomeDesaparecido: nome,
    solicitante: '',
    telefone: telefone,
    operador: 'rotina_emergencial',
    mensagemTecnica: 'origem=' + origem + '; valor_recuperado=' + (valorRecuperado || '')
  };
}



function reconciliarTaloesComRelatoriosCOPOM(simulacao) {
  var SIMULACAO = simulacao !== false;
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    garantirEstruturaCabineVerde_();
    var planilha = SpreadsheetApp.getActiveSpreadsheet();
    var schema = obterSchemaCabineVerdeUnificado_();
    var abaCasos = garantirAbaComCabecalho(planilha, 'CASOS', schema.CASOS);
    var cabecalhoCasos = garantirColunasDaEstrutura(abaCasos, schema.CASOS);
    var totalLinhas = Math.max(abaCasos.getLastRow() - 1, 0);
    if (!totalLinhas) return { simulacao: SIMULACAO, totalAnalisado: 0, totalSemTalao: 0, totalReconciliado: 0, totalAmbiguo: 0, totalNaoEncontrado: 0, casosRecuperados: [], conflitos: [] };

    var idx = mapearIndicesReconciliacaoCopom_(cabecalhoCasos);
    if (idx.talaoBopm < 0) throw new Error('Coluna talaoBopm (CASOS!H) não encontrada.');

    var backupNome = SIMULACAO ? '' : criarBackupCasosReconciliacao_(planilha, abaCasos);
    var dadosCasos = abaCasos.getRange(2, 1, totalLinhas, abaCasos.getLastColumn()).getValues();
    var indiceCopom = carregarIndiceAbasDiariasCopom_(planilha);

    var atualizacoes = [];
    var logs = [];
    var recuperados = [];
    var conflitos = [];
    var totalSemTalao = 0;

    for (var i = 0; i < dadosCasos.length; i += 1) {
      var linha = dadosCasos[i];
      if (limparTexto(linha[idx.talaoBopm])) continue;
      totalSemTalao += 1;
      var caso = extrairCasoReconciliacao_(linha, idx, i + 2);
      var analise = encontrarMelhorCorrespondenciaCopom_(caso, indiceCopom);

      if (analise.status === 'forte') {
        atualizacoes.push({ linhaPlanilha: caso.linhaPlanilha, talao: analise.vencedor.talao, assinatura: analise.vencedor.assinatura });
        recuperados.push({ idCaso: caso.idCaso, linhaCasos: caso.linhaPlanilha, talaoRecuperado: analise.vencedor.talao, abaOrigem: analise.vencedor.abaOrigem, linhaOrigem: analise.vencedor.linhaOrigem });
        logs.push(criarLogReconciliacaoCopom_(caso, analise.vencedor, 'talao_reconciliado_copom'));
      } else if (analise.status === 'ambiguo') {
        conflitos.push({ idCaso: caso.idCaso, linhaCasos: caso.linhaPlanilha, motivo: 'Múltiplas correspondências com alta confiança', candidatos: analise.candidatos.map(function (c) { return { abaOrigem: c.abaOrigem, linhaOrigem: c.linhaOrigem, talao: c.talao, score: c.score }; }) });
        logs.push(criarLogReconciliacaoCopom_(caso, analise.candidatos[0], 'conflito_manual'));
      }
    }

    if (!SIMULACAO && atualizacoes.length) {
      var idxAss = cabecalhoCasos.indexOf('assinaturaCaso');
      var colTalao = abaCasos.getRange(2, idx.talaoBopm + 1, totalLinhas, 1).getValues();
      var colAss = idxAss >= 0 ? abaCasos.getRange(2, idxAss + 1, totalLinhas, 1).getValues() : null;
      atualizacoes.forEach(function (u) {
        var pos = u.linhaPlanilha - 2;
        colTalao[pos][0] = u.talao;
        if (colAss) colAss[pos][0] = u.assinatura;
      });
      abaCasos.getRange(2, idx.talaoBopm + 1, totalLinhas, 1).setValues(colTalao);
      if (colAss) abaCasos.getRange(2, idxAss + 1, totalLinhas, 1).setValues(colAss);
    }

    registrarLogsEmLote_(planilha, logs);
    return { simulacao: SIMULACAO, backupCriado: backupNome, totalAnalisado: totalLinhas, totalSemTalao: totalSemTalao, totalReconciliado: recuperados.length, totalAmbiguo: conflitos.length, totalNaoEncontrado: totalSemTalao - recuperados.length - conflitos.length, casosRecuperados: recuperados, conflitos: conflitos };
  } finally {
    lock.releaseLock();
  }
}

function mapearIndicesReconciliacaoCopom_(cabecalho) { var idx = {}; ['idCaso','talaoBopm','nomeCompletoDesaparecido','telefoneSolicitante','dataServico','nomeSolicitante','observacoesOperacionais'].forEach(function (c) { idx[c] = cabecalho.indexOf(c); }); return idx; }
function extrairCasoReconciliacao_(linha, idx, linhaPlanilha) { return { linhaPlanilha: linhaPlanilha, idCaso: idx.idCaso >= 0 ? limparTexto(linha[idx.idCaso]) : '', nome: idx.nomeCompletoDesaparecido >= 0 ? limparTexto(linha[idx.nomeCompletoDesaparecido]) : '', telefone: idx.telefoneSolicitante >= 0 ? limparTexto(linha[idx.telefoneSolicitante]) : '', dataServico: idx.dataServico >= 0 ? linha[idx.dataServico] : '', nomeSolicitante: idx.nomeSolicitante >= 0 ? limparTexto(linha[idx.nomeSolicitante]) : '', observacoes: idx.observacoesOperacionais >= 0 ? limparTexto(linha[idx.observacoesOperacionais]) : '' }; }
function criarBackupCasosReconciliacao_(planilha, abaCasos) { var nome = 'BACKUP_CASOS_RECONCILIACAO_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmmss'); var abaBackup = abaCasos.copyTo(planilha).setName(nome); abaBackup.hideSheet(); return nome; }
function criarLogReconciliacaoCopom_(caso, candidato, status) { return { dataHora: formatarDataHora(new Date()), status: status, chaveUnica: caso.idCaso, acaoExecutada: 'reconciliarTaloesComRelatoriosCOPOM|' + (candidato && candidato.abaOrigem || ''), nomeDesaparecido: caso.nome, solicitante: caso.nomeSolicitante, telefone: caso.telefone, operador: 'rotina_reconciliacao_copom', mensagemTecnica: 'abaOrigem=' + limparTexto(candidato && candidato.abaOrigem) + '; linhaOrigem=' + limparTexto(candidato && candidato.linhaOrigem) + '; bopmRecuperado=' + limparTexto(candidato && candidato.talao) }; }
function normalizarCabecalhoCopom_(valor) { return normalizarTextoOperacional_(valor).replace(/[^A-Z0-9]/g, ''); }
function localizarIndiceCabecalhoCopom_(cabecalhoNorm, aliases) { for (var i = 0; i < aliases.length; i += 1) { var idx = cabecalhoNorm.indexOf(normalizarCabecalhoCopom_(aliases[i])); if (idx >= 0) return idx; } return -1; }
function carregarIndiceAbasDiariasCopom_(planilha) {
  var ignorar = { 'MODELO_TALAO': true, 'LOG_AUDITORIA': true, 'EVENTOS_CASO': true, 'CASOS': true };
  var mapa = {};
  planilha.getSheets().forEach(function (aba) {
    var nomeAba = limparTexto(aba.getName());
    if (!/^\d{2}[A-Z]{3}\d{2}$/.test(nomeAba) || ignorar[nomeAba]) return;
    if (aba.getLastRow() < 7) return;

    var ultimaColuna = Math.max(aba.getLastColumn(), 1);
    var cabecalhoLinha6 = aba.getRange(6, 1, 1, ultimaColuna).getValues()[0].map(limparTexto);
    var cabecalhoNorm = cabecalhoLinha6.map(normalizarCabecalhoCopom_);

    var idxTalao = localizarIndiceCabecalhoCopom_(cabecalhoNorm, ['BOPM', 'TALÃO', 'TALAO', 'Nº TALÃO', 'NUMERO TALAO']);
    var idxNome = localizarIndiceCabecalhoCopom_(cabecalhoNorm, ['NOME COMPLETO', 'NOME COMPLETO DESAPARECIDO', 'NOME']);
    var idxTel = localizarIndiceCabecalhoCopom_(cabecalhoNorm, ['TELEFONE', 'TELEFONE SOLICITANTE', 'CELULAR']);
    var idxSolic = localizarIndiceCabecalhoCopom_(cabecalhoNorm, ['NOME DO SOLICITANTE', 'SOLICITANTE', 'NOME SOLICITANTE']);
    var idxData = localizarIndiceCabecalhoCopom_(cabecalhoNorm, ['DATA', 'DATA SERVICO', 'DATA DO SERVICO']);
    var idxObs = localizarIndiceCabecalhoCopom_(cabecalhoNorm, ['OBS', 'OBSERVACOES', 'OBSERVACOES OPERACIONAIS']);

    if (idxTalao < 0 || idxNome < 0 || idxTel < 0 || idxData < 0 || idxSolic < 0 || idxObs < 0) return;

    var primeiraLinhaDados = 7;
    var totalLinhasDados = Math.max(aba.getLastRow() - primeiraLinhaDados + 1, 0);
    if (!totalLinhasDados) return;
    var dados = aba.getRange(primeiraLinhaDados, 1, totalLinhasDados, ultimaColuna).getValues();

    for (var i = 0; i < dados.length; i += 1) {
      var talao = limparTexto(dados[i][idxTalao]);
      if (!talao) continue;
      var nome = limparTexto(dados[i][idxNome]);
      var tel = limparTexto(dados[i][idxTel]);
      var chave = [normalizarTextoOperacional_(nome), normalizarTelefoneOperacional_(tel)].join('|');
      mapa[chave] = mapa[chave] || [];
      mapa[chave].push({
        abaOrigem: nomeAba,
        linhaOrigem: primeiraLinhaDados + i,
        talao: talao,
        nome: nome,
        telefone: tel,
        dataServico: dados[i][idxData],
        nomeSolicitante: limparTexto(dados[i][idxSolic]),
        observacoes: limparTexto(dados[i][idxObs])
      });
    }
  });
  return mapa;
}
function encontrarMelhorCorrespondenciaCopom_(caso, indice) { var chave = [normalizarTextoOperacional_(caso.nome), normalizarTelefoneOperacional_(caso.telefone)].join('|'); var candidatos = (indice[chave] || []).map(function (cand) { return pontuarCandidatoCopom_(caso, cand); }).filter(function (c) { return c.score >= 70; }).sort(function (a, b) { return b.score - a.score; }); if (!candidatos.length) return { status: 'nao_encontrado', candidatos: [] }; if (candidatos.length > 1 && (candidatos[0].score - candidatos[1].score) <= 5) return { status: 'ambiguo', candidatos: candidatos.slice(0, 3) }; return { status: 'forte', vencedor: candidatos[0], candidatos: candidatos.slice(0, 3) }; }
function pontuarCandidatoCopom_(caso, candidato) { var score = 0; if (normalizarDataSomenteDia_(caso.dataServico) && normalizarDataSomenteDia_(caso.dataServico) === normalizarDataSomenteDia_(candidato.dataServico)) score += 35; if (normalizarTextoOperacional_(caso.nomeSolicitante) && normalizarTextoOperacional_(caso.nomeSolicitante) === normalizarTextoOperacional_(candidato.nomeSolicitante)) score += 20; score += Math.round(similaridadeTextoCopom_(caso.observacoes, candidato.observacoes) * 25); score += 30; candidato.score = score; candidato.assinatura = gerarAssinaturaCaso_({ dataServico: caso.dataServico || candidato.dataServico, talaoBopm: candidato.talao, nomeCompletoDesaparecido: caso.nome, telefoneSolicitante: caso.telefone }); return candidato; }
function similaridadeTextoCopom_(a, b) { var ta = normalizarTextoOperacional_(a); var tb = normalizarTextoOperacional_(b); if (!ta || !tb) return 0; var sa = {}; ta.split(/\s+/).forEach(function (t) { if (t && t.length > 2) sa[t] = true; }); var sb = {}; tb.split(/\s+/).forEach(function (t) { if (t && t.length > 2) sb[t] = true; }); var inter = 0; var uni = 0; var keys = {}; Object.keys(sa).forEach(function (k) { keys[k] = true; }); Object.keys(sb).forEach(function (k) { keys[k] = true; }); Object.keys(keys).forEach(function (k) { uni += 1; if (sa[k] && sb[k]) inter += 1; }); return uni ? inter / uni : 0; }


function limparDuplicadosCasos(simulacao) {
  var SIMULACAO = simulacao !== false;
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    garantirEstruturaCabineVerde_();
    var planilha = SpreadsheetApp.getActiveSpreadsheet();
    var schema = obterSchemaCabineVerdeUnificado_();
    var abaCasos = garantirAbaComCabecalho(planilha, 'CASOS', schema.CASOS);
    var cabecalho = garantirColunasDaEstrutura(abaCasos, schema.CASOS);
    var total = Math.max(abaCasos.getLastRow() - 1, 0);
    if (!total) return { simulacao: SIMULACAO, totalLinhasAnalisadas: 0, totalGruposDuplicados: 0, totalLinhasRemovidas: 0, totalCamposMesclados: 0, conflitosManuais: [], casosNaoResolvidosAutomaticamente: [] };

    var backupNome = 'BACKUP_CASOS_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmmss');
    var abaBackup = abaCasos.copyTo(planilha).setName(backupNome);
    planilha.setActiveSheet(abaCasos);
    planilha.moveActiveSheet(1);
    abaBackup.hideSheet();

    var dados = abaCasos.getRange(2, 1, total, abaCasos.getLastColumn()).getValues();
    var indices = mapearIndicesCasosDuplicados_(cabecalho);
    var grupos = agruparDuplicadosCasos_(dados, indices);

    var linhasMescladas = dados.map(function (linha) { return linha.slice(); });
    var linhasRemover = {};
    var logs = [];
    var conflitosManuais = [];
    var naoResolvidos = [];
    var totalCamposMesclados = 0;
    var totalRemovidos = 0;

    Object.keys(grupos).forEach(function (assinatura) {
      var grupo = grupos[assinatura];
      if (!grupo || grupo.length < 2) return;
      var resolucao = resolverGrupoDuplicadoCasos_(grupo, linhasMescladas, indices, assinatura);
      if (resolucao.conflito) {
        conflitosManuais.push(resolucao.conflito);
        naoResolvidos.push(resolucao.conflito);
        logs.push(criarLogLimpezaDuplicado_(resolucao.principal && resolucao.principal.idCaso || '', '', 'conflito_manual', assinatura, 'sistema_limpeza_duplicados', JSON.stringify(resolucao.conflito)));
        return;
      }
      if (!resolucao.principal) return;
      totalCamposMesclados += resolucao.camposMesclados;
      resolucao.removidos.forEach(function (item) {
        linhasRemover[item.indiceLinha] = true;
        totalRemovidos += 1;
        logs.push(criarLogLimpezaDuplicado_(resolucao.principal.idCaso, item.idCaso, 'duplicado_real_removido', assinatura, 'sistema_limpeza_duplicados', JSON.stringify(resolucao.dadosMesclados[item.indiceLinha] || [])));
      });
    });

    if (!SIMULACAO) {
      abaCasos.getRange(2, 1, linhasMescladas.length, cabecalho.length).setValues(linhasMescladas);
      var removerOrdenado = Object.keys(linhasRemover).map(function (k) { return Number(k); }).sort(function (a, b) { return b - a; });
      removerOrdenado.forEach(function (idx) {
        abaCasos.deleteRow(idx + 2);
      });
    }

    registrarLogsEmLote_(planilha, logs);

    return {
      simulacao: SIMULACAO,
      backupCriado: backupNome,
      totalLinhasAnalisadas: total,
      totalGruposDuplicados: Object.keys(grupos).filter(function (k) { return grupos[k].length > 1; }).length,
      totalLinhasRemovidas: SIMULACAO ? 0 : totalRemovidos,
      totalLinhasRemocaoPlanejada: totalRemovidos,
      totalCamposMesclados: totalCamposMesclados,
      conflitosManuais: conflitosManuais,
      casosNaoResolvidosAutomaticamente: naoResolvidos
    };
  } finally {
    lock.releaseLock();
  }
}

function mapearIndicesCasosDuplicados_(cabecalho) {
  var idx = {};
  ['idCaso','dataServico','talaoBopm','nomeCompletoDesaparecido','telefoneSolicitante','cpf','rg','observacoesOperacionais','nomeSolicitante'].forEach(function (c) {
    idx[c] = cabecalho.indexOf(c);
  });
  return idx;
}

function agruparDuplicadosCasos_(dados, idx) {
  var grupos = {};
  for (var i = 0; i < dados.length; i += 1) {
    var linha = dados[i];
    if (linhaVaziaEstrutural_(linha)) continue;
    var assinatura = gerarAssinaturaOperacionalDuplicado_(linha, idx);
    if (!assinatura) continue;
    grupos[assinatura] = grupos[assinatura] || [];
    grupos[assinatura].push({ indiceLinha: i, idCaso: idx.idCaso >= 0 ? limparTexto(linha[idx.idCaso]) : '', assinatura: assinatura });
  }
  return grupos;
}

function gerarAssinaturaOperacionalDuplicado_(linha, idx) {
  var data = idx.dataServico >= 0 ? normalizarDataSomenteDia_(linha[idx.dataServico]) : '';
  var talao = idx.talaoBopm >= 0 ? limparTexto(linha[idx.talaoBopm]) : '';
  var nome = idx.nomeCompletoDesaparecido >= 0 ? normalizarTextoOperacional_(linha[idx.nomeCompletoDesaparecido]) : '';
  var telefone = idx.telefoneSolicitante >= 0 ? normalizarTelefoneOperacional_(linha[idx.telefoneSolicitante]) : '';
  if (!data && !talao && !nome && !telefone) return '';
  return [data, talao, nome, telefone].join('|');
}

function resolverGrupoDuplicadoCasos_(grupo, linhas, idx, assinatura) {
  var candidatos = grupo.map(function (item) {
    var linha = linhas[item.indiceLinha];
    return { item: item, linha: linha, score: pontuarRegistroDuplicado_(linha, idx), preenchidos: contarCamposPreenchidos_(linha), observacaoTam: tamanhoCampo_(linha, idx.observacoesOperacionais) };
  });
  candidatos.sort(function (a, b) {
    if (b.score !== a.score) return b.score - a.score;
    if (b.observacaoTam !== a.observacaoTam) return b.observacaoTam - a.observacaoTam;
    if (b.preenchidos !== a.preenchidos) return b.preenchidos - a.preenchidos;
    return a.item.indiceLinha - b.item.indiceLinha;
  });
  if (!candidatos.length) return { principal: null, removidos: [], camposMesclados: 0, dadosMesclados: {}, conflito: null };
  if (candidatos.length > 1 && Math.abs(candidatos[0].score - candidatos[1].score) <= 5 && !confirmarMesmaPessoa_(candidatos[0].linha, candidatos[1].linha, idx)) {
    return { principal: null, removidos: [], camposMesclados: 0, dadosMesclados: {}, conflito: { assinaturaOperacional: assinatura, motivo: 'Pontuação próxima com divergência de identidade (cpf/rg/nome).' } };
  }
  var principal = candidatos[0];
  var camposMesclados = 0;
  var removidos = [];
  var dadosMesclados = {};
  candidatos.slice(1).forEach(function (sec) {
    var mescla = mesclarDadosUteisDuplicado_(principal.linha, sec.linha);
    camposMesclados += mescla.totalCampos;
    dadosMesclados[sec.item.indiceLinha] = mescla.campos;
    removidos.push(sec.item);
  });
  if (idx.dataServico >= 0 && !limparTexto(principal.linha[idx.dataServico])) {
    var primeiraComData = candidatos.find(function (c) { return limparTexto(c.linha[idx.dataServico]); });
    if (primeiraComData) principal.linha[idx.dataServico] = primeiraComData.linha[idx.dataServico];
  }
  return { principal: principal.item, removidos: removidos, camposMesclados: camposMesclados, dadosMesclados: dadosMesclados, conflito: null };
}

function pontuarRegistroDuplicado_(linha, idx) {
  var score = 0;
  if (idx.talaoBopm >= 0 && limparTexto(linha[idx.talaoBopm])) score += 100;
  var temCpf = idx.cpf >= 0 && limparTexto(linha[idx.cpf]);
  var temRg = idx.rg >= 0 && limparTexto(linha[idx.rg]);
  if (temCpf && temRg) score += 70;
  score += Math.min(tamanhoCampo_(linha, idx.observacoesOperacionais), 500) / 10;
  score += contarCamposPreenchidos_(linha);
  return score;
}

function mesclarDadosUteisDuplicado_(principal, duplicado) {
  var campos = [];
  var total = 0;
  for (var i = 0; i < principal.length; i += 1) {
    var valorPrincipal = limparTexto(principal[i]);
    var valorDuplicado = limparTexto(duplicado[i]);
    if (!valorPrincipal && valorDuplicado) {
      principal[i] = duplicado[i];
      campos.push(i);
      total += 1;
    }
  }
  return { totalCampos: total, campos: campos };
}

function confirmarMesmaPessoa_(linhaA, linhaB, idx) {
  var cpfA = idx.cpf >= 0 ? limparTexto(linhaA[idx.cpf]) : '';
  var cpfB = idx.cpf >= 0 ? limparTexto(linhaB[idx.cpf]) : '';
  if (cpfA && cpfB && cpfA !== cpfB) return false;
  var rgA = idx.rg >= 0 ? limparTexto(linhaA[idx.rg]) : '';
  var rgB = idx.rg >= 0 ? limparTexto(linhaB[idx.rg]) : '';
  if (rgA && rgB && rgA !== rgB) return false;
  var nomeA = idx.nomeCompletoDesaparecido >= 0 ? normalizarTextoOperacional_(linhaA[idx.nomeCompletoDesaparecido]) : '';
  var nomeB = idx.nomeCompletoDesaparecido >= 0 ? normalizarTextoOperacional_(linhaB[idx.nomeCompletoDesaparecido]) : '';
  if (nomeA && nomeB && nomeA !== nomeB) return false;
  return true;
}

function registrarLogsEmLote_(planilha, registrosLog) {
  if (!registrosLog.length) return;
  var abaLog = garantirAbaComCabecalho(planilha, ABA_LOG_AUDITORIA, COLUNAS_LOG_AUDITORIA);
  var cabecalhoLog = garantirColunasDaEstrutura(abaLog, COLUNAS_LOG_AUDITORIA);
  var linhas = registrosLog.map(function (registro) {
    return cabecalhoLog.map(function (col) { return normalizarValorPlanilha(registro[col]); });
  });
  abaLog.getRange(abaLog.getLastRow() + 1, 1, linhas.length, cabecalhoLog.length).setValues(linhas);
}

function criarLogLimpezaDuplicado_(idCasoPrincipal, idCasoRemovido, motivo, assinatura, operadorSistema, dadosMesclados) {
  return {
    dataHora: formatarDataHora(new Date()),
    status: motivo === 'conflito_manual' ? 'conflito_manual' : 'deduplicacao_casos',
    chaveUnica: idCasoPrincipal,
    acaoExecutada: 'limparDuplicadosCasos',
    nomeDesaparecido: '',
    solicitante: '',
    telefone: '',
    operador: operadorSistema,
    mensagemTecnica: 'acao=limparDuplicadosCasos; idCasoPrincipal=' + limparTexto(idCasoPrincipal) + '; idCasoRemovido=' + limparTexto(idCasoRemovido) + '; motivo=' + motivo + '; assinaturaOperacional=' + assinatura + '; dadosMesclados=' + dadosMesclados
  };
}

function linhaVaziaEstrutural_(linha) {
  for (var i = 0; i < linha.length; i += 1) {
    if (limparTexto(linha[i])) return false;
  }
  return true;
}

function contarCamposPreenchidos_(linha) {
  var total = 0;
  for (var i = 0; i < linha.length; i += 1) {
    if (limparTexto(linha[i])) total += 1;
  }
  return total;
}

function tamanhoCampo_(linha, idx) {
  if (idx < 0) return 0;
  return limparTexto(linha[idx]).length;
}

function normalizarTextoOperacional_(valor) {
  return limparTexto(valor).toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
}

function normalizarTelefoneOperacional_(valor) {
  return limparTexto(valor).replace(/\D+/g, '');
}

function auditarIndiceTaloes_() {
  var aba = obterOuCriarIndiceTaloes_();
  var inconsistencias = [];
  var ultima = aba.getLastRow();
  for (var r = 2; r <= ultima; r += 1) {
    var row = aba.getRange(r, 1, 1, COLUNAS_INDICE_TALOES.length).getValues()[0];
    var validacao = validarReferenciaIndiceTaloes_({ nomeAba: row[7], linhaRelatorio: row[8] }, { idCaso: row[1], talaoNormalizado: row[2] });
    if (!validacao.valido) inconsistencias.push({ linhaIndice: r, motivo: validacao.motivo, idCaso: row[1] });
  }
  registrarLogAuditoria_({ evento: 'INDICE_TALOES_AUDITADO', total: ultima - 1, inconsistencias: inconsistencias.length, timestamp: new Date() });
  return { total: Math.max(0, ultima - 1), inconsistencias: inconsistencias };
}

function reconstruirIndiceTaloes_() {
  var planilha = SpreadsheetApp.openById(ID_PLANILHA_TALAO_190);
  var abas = planilha.getSheets();
  var indice = obterOuCriarIndiceTaloes_();
  if (indice.getLastRow() > 1) indice.getRange(2, 1, indice.getLastRow() - 1, COLUNAS_INDICE_TALOES.length).clearContent();
  for (var i = 0; i < abas.length; i += 1) {
    var nome = abas[i].getName();
    if (!/^\d{2}[A-Z]{3}\d{2}$/.test(nome)) continue;
    var linhaAncora = localizarLinhaAncoraRodape_(abas[i]);
    var total = linhaAncora - PRIMEIRA_LINHA_DADOS_TALAO;
    if (total <= 0) continue;
    var dados = abas[i].getRange(PRIMEIRA_LINHA_DADOS_TALAO, 1, total, 11).getValues();
    for (var j = 0; j < dados.length; j += 1) {
      if (dados[j].every(function (c) { return limparTexto(c) === ''; })) continue;
      var caso = { idCaso: dados[j][10], talaoPMESP: dados[j][1], nomeCompletoDesaparecido: dados[j][3], telefoneSolicitante: dados[j][7], dataServico: dados[j][5], dataHoraRegistro: dados[j][0] };
      var dt = normalizarDataRelatorio_(dados[j][5] || dados[j][0]);
      atualizarIndiceTaloes_({ hashOperacional: gerarHashOperacionalTalao_(caso, dt), idCaso: limparTexto(dados[j][10]), talaoNormalizado: normalizarDocumentoRelatorio_(dados[j][1]), talaoOriginal: limparTexto(dados[j][1]), nomeNormalizado: normalizarTextoAssinatura_(dados[j][3]), telefoneNormalizado: normalizarTelefoneRelatorio_(dados[j][7]), dataOperacional: dt, nomeAba: nome, linhaRelatorio: PRIMEIRA_LINHA_DADOS_TALAO + j, status: 'reconstruido', origem: 'reconstruirIndiceTaloes_' });
    }
  }
  registrarLogAuditoria_({ evento: 'INDICE_TALOES_RECONSTRUIDO', timestamp: new Date() });
  return { status: 'ok' };
}
