var ESTRUTURA_PLANILHA = {
  CASOS: COLUNAS_CASOS,
  TRIAGEM_RESPOSTAS: COLUNAS_TRIAGEM_RESPOSTAS,
  EVENTOS_OCORRENCIA: COLUNAS_EVENTOS_OCORRENCIA,
  INDICADORES_OPERACIONAIS: COLUNAS_INDICADORES_OPERACIONAIS,
  FOTOS_DESAPARECIDOS: typeof COLUNAS_FOTOS_DESAPARECIDOS !== 'undefined' ? COLUNAS_FOTOS_DESAPARECIDOS : [],
  OPERADORES: ['email','nome','perfil','ativo','ultimaAtualizacao'],
  Logs_GAS: ['timestamp', 'etapa', 'ok', 'mensagem', 'rawPostData', 'payloadIdCaso']
};


function validarOperadorAtual_() {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var abaOperadores = garantirAbaComCabecalho(planilha, 'OPERADORES', ESTRUTURA_PLANILHA.OPERADORES);
  var cabecalho = garantirColunasDaEstrutura(abaOperadores, ESTRUTURA_PLANILHA.OPERADORES).map(limparTexto);
  var emailAtual = limparTexto(Session.getActiveUser().getEmail()).toLowerCase();

  if (!emailAtual) {
    registrarLogAcessoOperador_(planilha, 'ACESSO_NEGADO', 'BLOQUEADO_SEM_EMAIL', 'Usuário sem e-mail identificado na sessão Google.', '');
    throw new Error('Usuário não autorizado. Solicite acesso ao administrador.');
  }

  var idxEmail = cabecalho.indexOf('email');
  var idxAtivo = cabecalho.indexOf('ativo');
  if (idxEmail === -1 || idxAtivo === -1) {
    registrarLogAcessoOperador_(planilha, 'ACESSO_NEGADO', 'ERRO_ESTRUTURA_OPERADORES', 'Aba OPERADORES sem colunas obrigatórias (email/ativo).', emailAtual);
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
    registrarLogAcessoOperador_(planilha, 'ACESSO_NEGADO', 'NAO_CADASTRADO', 'E-mail não encontrado na aba OPERADORES.', emailAtual);
    throw new Error('Usuário não autorizado. Solicite acesso ao administrador.');
  }

  var ativoNormalizado = limparTexto(encontrado[idxAtivo]).toUpperCase();
  var operadorAtivo = ['TRUE','VERDADEIRO','SIM','ATIVO','1'].indexOf(ativoNormalizado) !== -1;

  if (!operadorAtivo) {
    registrarLogAcessoOperador_(planilha, 'ACESSO_NEGADO', 'OPERADOR_INATIVO', 'Operador localizado, porém inativo na aba OPERADORES.', emailAtual);
    throw new Error('Usuário não autorizado. Solicite acesso ao administrador.');
  }

  return { autorizado: true, email: emailAtual };
}

function registrarLogAcessoOperador_(planilha, tipoEvento, status, mensagem, email) {
  var abaLog = garantirAbaComCabecalho(planilha, 'LOG_ACESSO', ['dataHora','tipoEvento','status','mensagem','email']);
  abaLog.appendRow([formatarDataHora(new Date()), limparTexto(tipoEvento), limparTexto(status), limparTexto(mensagem), limparTexto(email)]);

  if (typeof registrarLogMigracao_ === 'function') {
    registrarLogMigracao_('validarOperadorAtual_', limparTexto(status), '', limparTexto(mensagem), 'EXECUTADO', true, limparTexto(tipoEvento));
  }
}

function doGet() {
  validarOperadorAtual_();
  return criarRespostaJson({ ok: true, service: 'cabineverde', message: 'Endpoint ativo' });
}

function doPost(e) {
  try {
    validarOperadorAtual_();
    var body = parsePayload(e);
    if (body.action === 'visualizarFotoDesaparecido') {
      var respostaFoto = visualizarFotoDesaparecido_(body.idFoto, body.operador, body.justificativa);
      return criarRespostaJson({ ok: true, message: 'Visualização autorizada', conteudoBase64: respostaFoto.conteudoBase64, mimeType: respostaFoto.mimeType, idCaso: respostaFoto.idCaso, idFoto: respostaFoto.idFoto });
    }
    var planilha = SpreadsheetApp.getActiveSpreadsheet();
    Object.keys(ESTRUTURA_PLANILHA).forEach(function (aba) {
      garantirAbaComCabecalho(planilha, aba, ESTRUTURA_PLANILHA[aba]);
    });

    var registros = body.abas && Array.isArray(body.abas) ? body.abas : [body];
    var idCaso = limparTexto((body.payload && body.payload.idCaso) || (body.dados && body.dados.idCaso));

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

    registrarLogTecnico(planilha, { etapa: 'persistencia_multiabas', ok: true, mensagem: 'Registros persistidos', rawPostData: extrairRawPostData(e), payloadIdCaso: idCaso });
    return criarRespostaJson({ ok: true, action: 'updated', idCaso: idCaso, message: 'Gravação multiabas concluída' });
  } catch (err) {
    var mensagemErro = err && err.message ? err.message : String(err);
    var planilhaLogs = obterPlanilhaLogs();
    registrarLogTecnico(planilhaLogs, { etapa: 'erro_post', ok: false, mensagem: mensagemErro, rawPostData: extrairRawPostData(e), payloadIdCaso: extrairIdCasoBruto(e) });
    return criarRespostaJson({ ok: false, message: mensagemErro }, 500);
  }
}

function persistirRegistro(planilha, registro) {
  var aba = limparTexto(registro.aba);
  var colunas = registro.colunas || [];
  var valores = registro.valores || [];
  var sheet = garantirAbaComCabecalho(planilha, aba, ESTRUTURA_PLANILHA[aba] || colunas);
  var cabecalhoAtual = garantirColunasDaEstrutura(sheet, ESTRUTURA_PLANILHA[aba] || colunas);

  if (aba === 'CASOS') {
    var registroPorColuna = mapearPorColuna(colunas, valores);
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
  var sheetEventos = garantirAbaComCabecalho(planilha, 'EVENTOS_OCORRENCIA', ESTRUTURA_PLANILHA.EVENTOS_OCORRENCIA);
  var cabecalhoEventos = garantirColunasDaEstrutura(sheetEventos, ESTRUTURA_PLANILHA.EVENTOS_OCORRENCIA);
  var eventoPorColuna = {
    idCaso: limparTexto(idCaso),
    timestampEvento: formatarDataHora(new Date()),
    tipoEvento: limparTexto(tipoEvento),
    descricaoEvento: limparTexto(descricaoEvento),
    statusCaso: '',
    prioridade: '',
    classificacaoRisco: ''
  };

  var linhaEvento = cabecalhoEventos.map(function (nomeColuna) {
    return normalizarValorPlanilha(eventoPorColuna[nomeColuna]);
  });

  sheetEventos.appendRow(linhaEvento);
}

function mapearPorColuna(colunas, valores) {
  var registro = {};
  (colunas || []).forEach(function (coluna, indice) {
    registro[coluna] = indice < valores.length ? valores[indice] : '';
  });
  return registro;
}
