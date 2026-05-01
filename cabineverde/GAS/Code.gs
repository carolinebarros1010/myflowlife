var ESTRUTURA_PLANILHA = {
  CASOS: COLUNAS_CASOS,
  TRIAGEM_RESPOSTAS: COLUNAS_TRIAGEM_RESPOSTAS,
  EVENTOS_OCORRENCIA: COLUNAS_EVENTOS_OCORRENCIA,
  INDICADORES_OPERACIONAIS: COLUNAS_INDICADORES_OPERACIONAIS,
  Logs_GAS: ['timestamp', 'etapa', 'ok', 'mensagem', 'rawPostData', 'payloadIdCaso']
};

function doGet() {
  return criarRespostaJson({ ok: true, service: 'cabineverde', message: 'Endpoint ativo' });
}

function doPost(e) {
  try {
    var body = parsePayload(e);
    var planilha = SpreadsheetApp.getActiveSpreadsheet();
    Object.keys(ESTRUTURA_PLANILHA).forEach(function (aba) {
      garantirAbaComCabecalho(planilha, aba, ESTRUTURA_PLANILHA[aba]);
    });

    var registros = body.abas && Array.isArray(body.abas) ? body.abas : [body];
    var idCaso = limparTexto((body.payload && body.payload.idCaso) || (body.dados && body.dados.idCaso));

    registros.forEach(function (registro) {
      persistirRegistro(planilha, registro);
    });

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

