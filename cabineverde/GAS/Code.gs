/**
 * Cabine Verde - Endpoint Web App (Google Apps Script)
 *
 * Propriedades esperadas:
 * - CABINE_VERDE_SPREADSHEET_ID: ID da planilha de destino
 * - CABINE_VERDE_SHEET_NAME (opcional): nome da aba principal (default: Desaparecidos)
 */

var ESTRUTURA_PLANILHA = {
  Desaparecidos: COLUNAS_DESAPARECIDOS,
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
    var body = parseJsonSeguro(e);
    var planilhaId = obterSpreadsheetId(body);
    var nomeAba = obterNomeAba(body);
    var planilha = SpreadsheetApp.openById(planilhaId);

    garantirEstruturaPlanilha(planilha);

    var aba = planilha.getSheetByName(nomeAba);
    if (!aba) {
      throw new Error('Aba "' + nomeAba + '" não encontrada na planilha.');
    }

    var payload = body && body.payload && typeof body.payload === 'object' ? body.payload : {};
    var idCaso = limparTexto(payload.idCaso);
    if (!idCaso) {
      throw new Error('idCaso é obrigatório para criar ou atualizar registros.');
    }

    var linhaExistente = encontrarLinhaPorId(aba, idCaso);
    var numeroLinha;
    var action;

    if (linhaExistente === -1) {
      var linhaCompleta = mapearPayloadParaLinhaDesaparecidos(payload);
      aba.appendRow(linhaCompleta);
      numeroLinha = aba.getLastRow();
      action = 'created';
    } else {
      atualizarLinha(aba, linhaExistente, payload);
      numeroLinha = linhaExistente;
      action = 'updated';
    }

    return criarRespostaJson({
      ok: true,
      action: action,
      idCaso: idCaso,
      linha: numeroLinha,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return criarRespostaJson(
      {
        ok: false,
        error: error && error.message ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      400
    );
  }
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
