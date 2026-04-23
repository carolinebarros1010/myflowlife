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
    message: 'Cabine Verde Sheets endpoint ativo',
    endpoint: 'exec',
    abaPrincipal: ABA_DESAPARECIDOS,
    versaoEstrutura: '2026-04-23',
    timestamp: new Date().toISOString()
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
    var linha = mapearPayloadParaLinhaDesaparecidos(payload);

    aba.appendRow(linha);
    var numeroLinha = aba.getLastRow();

    return criarRespostaJson({
      ok: true,
      service: 'cabineverde',
      message: 'Caso salvo com sucesso',
      aba: nomeAba,
      linha: numeroLinha,
      idCaso: payload.idCaso || '',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return criarRespostaJson(
      {
        ok: false,
        service: 'cabineverde',
        message: 'Falha ao salvar caso na planilha',
        erro: error && error.message ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      400
    );
  }
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
  return limparTexto(nomeAbaBody) || limparTexto(nomeAbaConfig) || ABA_DESAPARECIDOS;
}
