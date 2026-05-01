function auditarQualidadeDados_() {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var abaCasos = garantirAbaComCabecalho(planilha, 'CASOS', COLUNAS_CASOS);
  var colunasQualidade = ESTRUTURA_PLANILHA.QUALIDADE_DADOS;
  var abaQualidade = garantirAbaComCabecalho(planilha, 'QUALIDADE_DADOS', colunasQualidade);
  var cabecalhoQualidade = garantirColunasDaEstrutura(abaQualidade, colunasQualidade);

  if (abaCasos.getLastRow() < 2) {
    registrarEventoOcorrencia(planilha, 'AUDITORIA_QUALIDADE_DADOS', 'AUDITORIA_QUALIDADE_DADOS', 'Sem casos para auditar.');
    return { ok: true, totalCasosAnalisados: 0, totalProblemas: 0 };
  }

  var cabecalhoCasos = garantirColunasDaEstrutura(abaCasos, COLUNAS_CASOS).map(limparTexto);
  var dados = abaCasos.getRange(2, 1, abaCasos.getLastRow() - 1, abaCasos.getLastColumn()).getValues();
  var dataHoraAuditoria = formatarDataHora(new Date());
  var registros = [];

  dados.forEach(function (linha) {
    var caso = {};
    cabecalhoCasos.forEach(function (coluna, indice) {
      caso[coluna] = limparTexto(linha[indice]);
    });

    var idCaso = caso.idCaso || 'SEM_IDCASO';
    var talaoPMESP = caso.talaoPMESP || '';

    if (!talaoPMESP) {
      adicionarRegistroQualidade_(registros, dataHoraAuditoria, idCaso, talaoPMESP, 'talaoPMESP', 'Caso sem talaoPMESP.', 'CRITICA', 'Preencher talão PMESP no registro do caso.');
    }
    if (!caso.nomeCompletoDesaparecido) {
      adicionarRegistroQualidade_(registros, dataHoraAuditoria, idCaso, talaoPMESP, 'nomeCompletoDesaparecido', 'Caso sem nomeCompletoDesaparecido.', 'CRITICA', 'Registrar o nome completo da pessoa desaparecida.');
    }
    if (!caso.idade && !caso.faixaEtaria) {
      adicionarRegistroQualidade_(registros, dataHoraAuditoria, idCaso, talaoPMESP, 'idade/faixaEtaria', 'Caso sem idade e sem faixaEtaria.', 'ALTA', 'Informar idade ou faixa etária para apoiar a triagem.');
    }
    if (!caso.dataHoraUltimaVisualizacao) {
      adicionarRegistroQualidade_(registros, dataHoraAuditoria, idCaso, talaoPMESP, 'dataHoraUltimaVisualizacao', 'Caso sem dataHoraUltimaVisualizacao.', 'ALTA', 'Registrar data e hora da última visualização.');
    }
    if (!caso.localUltimaVisualizacao) {
      adicionarRegistroQualidade_(registros, dataHoraAuditoria, idCaso, talaoPMESP, 'localUltimaVisualizacao', 'Caso sem localUltimaVisualizacao.', 'ALTA', 'Registrar local da última visualização.');
    }

    ['corPele', 'corCabelo', 'corOlhos', 'caracteristicasMarcantes'].forEach(function (campoFisico) {
      if (limparTexto(caso[campoFisico]).toUpperCase() === 'NAO INFORMADO') {
        adicionarRegistroQualidade_(registros, dataHoraAuditoria, idCaso, talaoPMESP, campoFisico, 'Campo físico preenchido como NAO INFORMADO.', 'MEDIA', 'Refinar dados físicos com entrevista complementar.');
      }
    });

    var fotoIndisponivel = limparTexto(caso.fotoDisponivel).toUpperCase();
    if (['FALSE', 'NAO', 'NÃO', '0'].indexOf(fotoIndisponivel) !== -1) {
      adicionarRegistroQualidade_(registros, dataHoraAuditoria, idCaso, talaoPMESP, 'fotoDisponivel', 'Caso com fotoDisponivel = FALSE.', 'MEDIA', 'Solicitar foto recente para ampliar chance de localização.');
    }
    if (!caso.classificacaoRisco) {
      adicionarRegistroQualidade_(registros, dataHoraAuditoria, idCaso, talaoPMESP, 'classificacaoRisco', 'Caso com classificacaoRisco vazia.', 'CRITICA', 'Executar triagem e definir classificação de risco.');
    }
    if (!caso.prioridade) {
      adicionarRegistroQualidade_(registros, dataHoraAuditoria, idCaso, talaoPMESP, 'prioridade', 'Caso com prioridade vazia.', 'CRITICA', 'Definir prioridade operacional.');
    }

    if (!possuiDecisaoOperacional_(caso)) {
      adicionarRegistroQualidade_(registros, dataHoraAuditoria, idCaso, talaoPMESP, 'decisaoOperacional', 'Caso sem decisão operacional registrada.', 'ALTA', 'Registrar decisão operacional no fluxo de eventos.');
    }
  });

  if (registros.length) {
    abaQualidade.getRange(abaQualidade.getLastRow() + 1, 1, registros.length, cabecalhoQualidade.length).setValues(registros);
  }

  registrarEventoOcorrencia(planilha, 'AUDITORIA_QUALIDADE_DADOS', 'AUDITORIA_QUALIDADE_DADOS', 'casosAnalisados=' + dados.length + '; problemasIdentificados=' + registros.length + '; dataHoraAuditoria=' + dataHoraAuditoria);
  return { ok: true, totalCasosAnalisados: dados.length, totalProblemas: registros.length, dataHoraAuditoria: dataHoraAuditoria };
}

function possuiDecisaoOperacional_(caso) {
  var acao = limparTexto(caso.acaoSugerida);
  var observacoes = limparTexto(caso.observacoesOperacionais);
  return !!acao || /DECISAO_OPERACIONAL|DECIS[AÃ]O OPERACIONAL/i.test(observacoes);
}

function adicionarRegistroQualidade_(registros, dataHoraAuditoria, idCaso, talaoPMESP, campo, problema, severidade, acaoRecomendada) {
  registros.push([
    dataHoraAuditoria,
    idCaso,
    talaoPMESP,
    campo,
    problema,
    severidade,
    acaoRecomendada,
    'PENDENTE'
  ]);
}
