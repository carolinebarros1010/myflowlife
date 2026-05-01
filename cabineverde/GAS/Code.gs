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
    var linha = encontrarLinhaPorId(sheet, idCaso, 1);
    var linhaFinal = cabecalhoAtual.map(function (nomeColuna) {
      return normalizarValorPlanilha(registroPorColuna[nomeColuna]);
    });
    if (linha > 1) {
      sheet.getRange(linha, 1, 1, linhaFinal.length).setValues([linhaFinal]);
      return;
    }
    sheet.appendRow(linhaFinal);
    return;
  }

  sheet.appendRow(valores);
}

function mapearPorColuna(colunas, valores) {
  var registro = {};
  (colunas || []).forEach(function (coluna, indice) {
    registro[coluna] = indice < valores.length ? valores[indice] : '';
  });
  return registro;
}

function encontrarLinhaPorId(sheet, idCaso, colunaId) {
  var idLimpo = limparTexto(idCaso);
  if (!idLimpo || sheet.getLastRow() < 2) return -1;
  var ids = sheet.getRange(2, colunaId || 1, sheet.getLastRow() - 1, 1).getValues();
  for (var i = 0; i < ids.length; i += 1) {
    if (limparTexto(ids[i][0]) === idLimpo) return i + 2;
  }
  return -1;
}
