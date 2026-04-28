/**
 * Cabine Verde - Endpoint Web App (Google Apps Script)
 *
 * Propriedades esperadas:
 * - CABINE_VERDE_SPREADSHEET_ID: ID da planilha de destino
 * - CABINE_VERDE_SHEET_NAME (opcional): nome da aba principal (default: Desaparecidos)
 */

var ESTRUTURA_PLANILHA = {
  Desaparecidos: COLUNAS_DESAPARECIDOS,
  Logs_GAS: ['timestamp', 'etapa', 'ok', 'mensagem', 'rawPostData', 'payloadIdCaso'],
  Listas: ['tipoLista', 'valor'],
  Relatorio_Diario: [
    'dataServico',
    'turno',
    'equipe',
    'totalCasosAnalisados',
    'totalContatosDeclarantes',
    'totalLocalizados',
    'totalBaixas',
    'totalFotosRecebidas',
    'totalAptosCabineVerde',
    'totalSuspeitaCrime',
    'totalCriancas',
    'totalAdolescentes',
    'totalIdosos',
    'textoOcorrenciasRelevancia',
    'textoOrientacoesPublico',
    'textoEncerramento'
  ],
  Painel: ['Indicador', 'Valor'],
  Ocorrencias_Relevancia: [
    'idCaso',
    'dataServico',
    'talaoBopm',
    'nomeCompletoDesaparecido',
    'motivoRelevancia',
    'resumoNarrativo',
    'incluidoNoRelatorio',
    'responsavelRegistro'
  ],
  Config: ['chave', 'valor']
};

function doGet() {
  return criarRespostaJson({
    ok: true,
    service: 'cabineverde',
    message: 'Endpoint ativo'
  });
}

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Desaparecidos');
    var COL_INDEX_ID = 1; // coluna A

    if (!sheet) {
      throw new Error('Aba Desaparecidos não encontrada');
    }

    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('postData vazio');
    }

    var raw = e.postData.contents;
    var data = JSON.parse(raw);

    if (!data || !data.valores) {
      throw new Error('Payload inválido');
    }

    if (sheet.getName() !== 'Desaparecidos') {
      throw new Error('Aba incorreta: ' + sheet.getName());
    }

    if (!Array.isArray(data.valores)) {
      throw new Error('data.valores não é array');
    }

    if (data.valores.length !== 51) {
      throw new Error('Quantidade inválida de colunas: ' + data.valores.length);
    }

    var idCaso = data && data.payload ? data.payload.idCaso : '';
    var lastRowAntes = sheet.getLastRow();

    logGAS(
      'persistencia_desaparecidos',
      true,
      'iniciando persistência na aba Desaparecidos',
      JSON.stringify({
        spreadsheetId: ss.getId(),
        spreadsheetName: ss.getName(),
        sheetName: sheet.getName(),
        lastRowAntes: lastRowAntes,
        lastRowDepois: null,
        linhaGravada: null,
        colunasRecebidas: data.valores.length,
        idCaso: idCaso,
        primeiroValor: data.valores[0],
        decimoValor: data.valores[9]
      })
    );

    var linhaExistente = -1;
    if (lastRowAntes > 1) {
      var ids = sheet.getRange(2, COL_INDEX_ID, lastRowAntes - 1, 1).getValues();

      for (var i = 0; i < ids.length; i += 1) {
        if (ids[i][0] === idCaso) {
          linhaExistente = i + 2;
          break;
        }
      }
    }

    if (linhaExistente !== -1) {
      sheet.getRange(linhaExistente, 1, 1, data.valores.length).setValues([data.valores]);

      var linhaAtualizada = sheet.getRange(linhaExistente, 1, 1, data.valores.length).getValues()[0];
      var lastRowDepoisUpdate = sheet.getLastRow();

      logGAS(
        'confirmacao_update_desaparecidos',
        true,
        'update confirmado na linha ' + linhaExistente,
        JSON.stringify({
          spreadsheetId: ss.getId(),
          spreadsheetName: ss.getName(),
          sheetName: sheet.getName(),
          lastRowAntes: lastRowAntes,
          lastRowDepois: lastRowDepoisUpdate,
          linhaGravada: linhaExistente,
          colunasRecebidas: data.valores.length,
          idCaso: idCaso,
          primeiroValor: linhaAtualizada[0],
          decimoValor: linhaAtualizada[9],
          nomeDesaparecido: linhaAtualizada[2]
        })
      );
    } else {
      sheet.appendRow(data.valores);

      var linhaGravada = sheet.getLastRow();
      var linha = sheet.getRange(linhaGravada, 1, 1, data.valores.length).getValues()[0];
      var lastRowDepoisAppend = sheet.getLastRow();

      logGAS(
        'confirmacao_append_desaparecidos',
        true,
        'append confirmado na linha ' + linhaGravada,
        JSON.stringify({
          spreadsheetId: ss.getId(),
          spreadsheetName: ss.getName(),
          sheetName: sheet.getName(),
          lastRowAntes: lastRowAntes,
          lastRowDepois: lastRowDepoisAppend,
          linhaGravada: linhaGravada,
          colunasRecebidas: data.valores.length,
          idCaso: data.payload && data.payload.idCaso,
          primeiroValor: linha[0],
          decimoValor: linha[9]
        })
      );
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    var mensagemErro = err && err.message ? err.message : String(err);
    var rawErro = e && e.postData && e.postData.contents ? e.postData.contents : '';

    logGAS('erro_post', false, mensagemErro, rawErro);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, message: mensagemErro }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function logGAS(etapa, ok, mensagem, raw) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Logs_GAS');

  if (!sheet) {
    sheet = ss.insertSheet('Logs_GAS');
    sheet.appendRow(['timestamp', 'etapa', 'ok', 'mensagem', 'raw']);
  }

  sheet.appendRow([new Date(), etapa, ok, mensagem, raw]);
}

function encontrarLinhaPorId(sheet, idCaso) {
  var idLimpo = limparTexto(idCaso);
  if (!sheet || !idLimpo) {
    return -1;
  }

  var colunaId = indiceColunaPorNome('idCaso') + 1;
  var ultimaLinha = sheet.getLastRow();
  if (ultimaLinha < 2) {
    return -1;
  }

  var valoresId = sheet.getRange(2, colunaId, ultimaLinha - 1, 1).getValues();
  for (var i = 0; i < valoresId.length; i += 1) {
    if (limparTexto(valoresId[i][0]) === idLimpo) {
      return i + 2;
    }
  }

  return -1;
}

function atualizarLinha(sheet, linha, payload) {
  if (!sheet || !linha || linha < 2) {
    throw new Error('Linha inválida para atualização.');
  }

  var camposAtualizaveis = [
    'statusCaso',
    'localizado',
    'dataHoraLocalizacao',
    'formaLocalizacao',
    'observacoesOperacionais'
  ];

  camposAtualizaveis.forEach(function (campo) {
    if (Object.prototype.hasOwnProperty.call(payload, campo)) {
      var coluna = indiceColunaPorNome(campo) + 1;
      sheet.getRange(linha, coluna).setValue(normalizarValorPlanilha(payload[campo]));
    }
  });
}

function buscarCasoPorId(idCaso, planilha) {
  var idLimpo = limparTexto(idCaso);
  if (!idLimpo) {
    throw new Error('idCaso é obrigatório para busca.');
  }

  var planilhaAtual = planilha || SpreadsheetApp.openById(obterSpreadsheetId({}));
  var aba = planilhaAtual.getSheetByName(ABA_DESAPARECIDOS);
  if (!aba) {
    throw new Error('Aba "' + ABA_DESAPARECIDOS + '" não encontrada na planilha.');
  }

  var linha = encontrarLinhaPorId(aba, idLimpo);
  if (linha === -1) {
    return null;
  }

  var colunas = obterColunasDesaparecidos();
  var valores = aba.getRange(linha, 1, 1, colunas.length).getValues()[0];

  return {
    linha: linha,
    dados: mapearLinhaParaObjeto(colunas, valores)
  };
}

function garantirEstruturaPlanilha(planilha) {
  garantirAbaComCabecalho(planilha, 'Desaparecidos', ESTRUTURA_PLANILHA.Desaparecidos);
  garantirAbaComCabecalho(planilha, 'Logs_GAS', ESTRUTURA_PLANILHA.Logs_GAS);
  garantirAbaComCabecalho(planilha, 'Listas', ESTRUTURA_PLANILHA.Listas);
  garantirAbaComCabecalho(planilha, 'Relatorio_Diario', ESTRUTURA_PLANILHA.Relatorio_Diario);
  garantirAbaComCabecalho(planilha, 'Painel', ESTRUTURA_PLANILHA.Painel);
  garantirAbaComCabecalho(planilha, 'Ocorrencias_Relevancia', ESTRUTURA_PLANILHA.Ocorrencias_Relevancia);
  garantirAbaComCabecalho(planilha, 'Config', ESTRUTURA_PLANILHA.Config);

  preencherListasPadrao(planilha.getSheetByName('Listas'));
  preencherPainelPadrao(planilha.getSheetByName('Painel'));
  preencherConfigPadrao(planilha.getSheetByName('Config'));
}

function garantirAbaComCabecalho(planilha, nomeAba, colunas) {
  var aba = planilha.getSheetByName(nomeAba) || planilha.insertSheet(nomeAba);
  var cabecalhoAtual = [];

  if (aba.getLastRow() > 0) {
    cabecalhoAtual = aba.getRange(1, 1, 1, colunas.length).getValues()[0];
  }

  var cabecalhoDivergente = cabecalhoAtual.length !== colunas.length;
  if (!cabecalhoDivergente) {
    for (var i = 0; i < colunas.length; i += 1) {
      if (limparTexto(cabecalhoAtual[i]) !== colunas[i]) {
        cabecalhoDivergente = true;
        break;
      }
    }
  }

  if (cabecalhoDivergente || aba.getLastRow() === 0) {
    aba.getRange(1, 1, 1, colunas.length).setValues([colunas]);
  }

  return aba;
}

function preencherListasPadrao(aba) {
  if (!aba || aba.getLastRow() > 1) {
    return;
  }

  var linhas = [];
  adicionarLista(linhas, 'statusCaso', ['Aberto', 'Em análise', 'Em busca', 'Localizado', 'Encerrado']);
  adicionarLista(linhas, 'faixaEtaria', ['Criança', 'Pré-adolescente', 'Adolescente', 'Adulto', 'Idoso']);
  adicionarLista(linhas, 'classificacaoRisco', ['Alto', 'Moderado', 'Baixo']);
  adicionarLista(linhas, 'prioridade', ['Máxima', 'Alta', 'Média', 'Baixa']);
  adicionarLista(linhas, 'acaoSugerida', ['Despacho imediato', 'Cabine Verde', 'Monitoramento', 'Orientação', 'Encaminhamento investigativo']);
  adicionarLista(linhas, 'vinculoSolicitante', ['Pai', 'Mãe', 'Responsável', 'Familiar', 'Vizinho', 'Escola', 'Outro']);
  adicionarLista(linhas, 'turno', ['Diurno', 'Noturno']);
  adicionarLista(linhas, 'formaLocalizacao', ['Contato do solicitante', 'Busca local', 'Ferramenta inteligente', 'Viatura', 'Outro']);

  aba.getRange(2, 1, linhas.length, 2).setValues(linhas);
}

function adicionarLista(destino, tipoLista, valores) {
  valores.forEach(function (valor) {
    destino.push([tipoLista, valor]);
  });
}

function preencherPainelPadrao(aba) {
  if (!aba || aba.getLastRow() > 1) {
    return;
  }

  var indicadores = [
    'Casos do dia',
    'Casos abertos',
    'Casos localizados',
    'Crianças',
    'Idosos',
    'Suspeita de crime',
    'Com foto',
    'Com câmera',
    'Aptos Cabine Verde'
  ];

  var linhas = indicadores.map(function (indicador) {
    return [indicador, '0'];
  });

  aba.getRange(2, 1, linhas.length, 2).setValues(linhas);
}

function preencherConfigPadrao(aba) {
  if (!aba || aba.getLastRow() > 1) {
    return;
  }

  var agoraIso = new Date().toISOString();
  var linhas = [
    ['spreadsheetVersion', 'cabine-verde-2026-04-23'],
    ['sheetPrincipal', ABA_DESAPARECIDOS],
    ['ultimaAtualizacaoEstrutura', agoraIso],
    ['responsavelEstrutura', 'Apps Script Cabine Verde']
  ];

  aba.getRange(2, 1, linhas.length, 2).setValues(linhas);
}

function obterSpreadsheetId(body) {
  var valorBody = body && body.spreadsheetId ? limparTexto(body.spreadsheetId) : '';
  var valorProperties = limparTexto(
    PropertiesService.getScriptProperties().getProperty('CABINE_VERDE_SPREADSHEET_ID')
  );
  var spreadsheetId = valorBody || valorProperties;

  if (!spreadsheetId) {
    throw new Error('CABINE_VERDE_SPREADSHEET_ID não configurado no body ou Script Properties.');
  }

  return spreadsheetId;
}

function obterNomeAba(body) {
  var nomeAbaBody = body && (body.aba || body.sheetName) ? String(body.aba || body.sheetName) : '';
  var nomeAbaConfig = PropertiesService.getScriptProperties().getProperty('CABINE_VERDE_SHEET_NAME');
  var nomeAbaSolicitada = limparTexto(nomeAbaBody) || limparTexto(nomeAbaConfig) || ABA_DESAPARECIDOS;

  if (nomeAbaSolicitada !== ABA_DESAPARECIDOS) {
    throw new Error('A integração Cabine Verde aceita gravação somente na aba "' + ABA_DESAPARECIDOS + '".');
  }

  return ABA_DESAPARECIDOS;
}
