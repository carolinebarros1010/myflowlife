function auditarQualidadeDados_() {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var abaCasos = garantirAbaComCabecalho(planilha, 'CASOS', COLUNAS_CASOS);
  var colunasQualidade = ESTRUTURA_PLANILHA.QUALIDADE_DADOS;
  var abaQualidade = garantirAbaComCabecalho(planilha, 'QUALIDADE_DADOS', colunasQualidade);
  var cabecalhoQualidade = garantirColunasDaEstrutura(abaQualidade, colunasQualidade);
  var mapaPendentes = indexarPendenciasQualidade_(abaQualidade, cabecalhoQualidade);

  if (abaCasos.getLastRow() < 2) {
    registrarEventoOcorrencia(planilha, 'AUDITORIA_QUALIDADE_DADOS', 'AUDITORIA_QUALIDADE_DADOS', 'Sem casos para auditar.');
    return { ok: true, totalCasosAnalisados: 0, totalProblemas: 0, totalNovos: 0, totalDuplicados: 0 };
  }

  var cabecalhoCasos = garantirColunasDaEstrutura(abaCasos, COLUNAS_CASOS).map(limparTexto);
  var dados = abaCasos.getRange(2, 1, abaCasos.getLastRow() - 1, abaCasos.getLastColumn()).getValues();
  var dataHoraAuditoria = formatarDataHora(new Date());
  var registros = [];
  var totalDuplicados = 0;

  dados.forEach(function (linha) {
    var caso = {};
    cabecalhoCasos.forEach(function (coluna, indice) {
      caso[coluna] = limparTexto(linha[indice]);
    });

    var idCaso = caso.idCaso || 'SEM_IDCASO';
    var talaoPMESP = caso.talaoPMESP || '';

    if (!talaoPMESP) {
      totalDuplicados += adicionarRegistroQualidadeSeNovo_(registros, mapaPendentes, dataHoraAuditoria, idCaso, talaoPMESP, 'talaoPMESP', 'Caso sem talaoPMESP.', 'CRITICA', 'Preencher talão PMESP no registro do caso.');
    }
    if (!caso.nomeCompletoDesaparecido) {
      totalDuplicados += adicionarRegistroQualidadeSeNovo_(registros, mapaPendentes, dataHoraAuditoria, idCaso, talaoPMESP, 'nomeCompletoDesaparecido', 'Caso sem nomeCompletoDesaparecido.', 'CRITICA', 'Registrar o nome completo da pessoa desaparecida.');
    }
    if (!caso.idade && !caso.faixaEtaria) {
      totalDuplicados += adicionarRegistroQualidadeSeNovo_(registros, mapaPendentes, dataHoraAuditoria, idCaso, talaoPMESP, 'idade/faixaEtaria', 'Caso sem idade e sem faixaEtaria.', 'ALTA', 'Informar idade ou faixa etária para apoiar a triagem.');
    }
    if (!caso.dataHoraUltimaVisualizacao) {
      totalDuplicados += adicionarRegistroQualidadeSeNovo_(registros, mapaPendentes, dataHoraAuditoria, idCaso, talaoPMESP, 'dataHoraUltimaVisualizacao', 'Caso sem dataHoraUltimaVisualizacao.', 'ALTA', 'Registrar data e hora da última visualização.');
    }
    if (!caso.localUltimaVisualizacao) {
      totalDuplicados += adicionarRegistroQualidadeSeNovo_(registros, mapaPendentes, dataHoraAuditoria, idCaso, talaoPMESP, 'localUltimaVisualizacao', 'Caso sem localUltimaVisualizacao.', 'ALTA', 'Registrar local da última visualização.');
    }

    ['corPele', 'corCabelo', 'corOlhos', 'caracteristicasMarcantes'].forEach(function (campoFisico) {
      if (limparTexto(caso[campoFisico]).toUpperCase() === 'NAO INFORMADO') {
        totalDuplicados += adicionarRegistroQualidadeSeNovo_(registros, mapaPendentes, dataHoraAuditoria, idCaso, talaoPMESP, campoFisico, 'Campo físico preenchido como NAO INFORMADO.', 'MEDIA', 'Refinar dados físicos com entrevista complementar.');
      }
    });

    var fotoIndisponivel = limparTexto(caso.fotoDisponivel).toUpperCase();
    if (['FALSE', 'NAO', 'NÃO', '0'].indexOf(fotoIndisponivel) !== -1) {
      totalDuplicados += adicionarRegistroQualidadeSeNovo_(registros, mapaPendentes, dataHoraAuditoria, idCaso, talaoPMESP, 'fotoDisponivel', 'Caso com fotoDisponivel = FALSE.', 'MEDIA', 'Solicitar foto recente para ampliar chance de localização.');
    }
    if (!caso.classificacaoRisco) {
      totalDuplicados += adicionarRegistroQualidadeSeNovo_(registros, mapaPendentes, dataHoraAuditoria, idCaso, talaoPMESP, 'classificacaoRisco', 'Caso com classificacaoRisco vazia.', 'CRITICA', 'Executar triagem e definir classificação de risco.');
    }
    if (!caso.prioridade) {
      totalDuplicados += adicionarRegistroQualidadeSeNovo_(registros, mapaPendentes, dataHoraAuditoria, idCaso, talaoPMESP, 'prioridade', 'Caso com prioridade vazia.', 'CRITICA', 'Definir prioridade operacional.');
    }

    if (!possuiDecisaoOperacional_(caso)) {
      totalDuplicados += adicionarRegistroQualidadeSeNovo_(registros, mapaPendentes, dataHoraAuditoria, idCaso, talaoPMESP, 'decisaoOperacional', 'Caso sem decisão operacional registrada.', 'ALTA', 'Registrar decisão operacional no fluxo de eventos.');
    }
  });

  if (registros.length) {
    abaQualidade.getRange(abaQualidade.getLastRow() + 1, 1, registros.length, cabecalhoQualidade.length).setValues(registros);
  }

  registrarEventoOcorrencia(planilha, 'AUDITORIA_QUALIDADE_DADOS', 'AUDITORIA_QUALIDADE_DADOS', 'casosAnalisados=' + dados.length + '; problemasIdentificados=' + registros.length + '; problemasDuplicados=' + totalDuplicados + '; dataHoraAuditoria=' + dataHoraAuditoria);
  return { ok: true, totalCasosAnalisados: dados.length, totalProblemas: registros.length, totalNovos: registros.length, totalDuplicados: totalDuplicados, dataHoraAuditoria: dataHoraAuditoria };
}

function marcarProblemaQualidadeResolvido_(idCaso, campo, problema, responsavelTratamento) {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var colunasQualidade = ESTRUTURA_PLANILHA.QUALIDADE_DADOS;
  var abaQualidade = garantirAbaComCabecalho(planilha, 'QUALIDADE_DADOS', colunasQualidade);
  var cabecalho = garantirColunasDaEstrutura(abaQualidade, colunasQualidade).map(limparTexto);

  if (abaQualidade.getLastRow() < 2) {
    throw new Error('Nenhum problema de qualidade encontrado para resolução.');
  }

  var idxIdCaso = cabecalho.indexOf('idCaso');
  var idxCampo = cabecalho.indexOf('campo');
  var idxProblema = cabecalho.indexOf('problema');
  var idxStatus = cabecalho.indexOf('statusTratamento');
  var idxResponsavel = cabecalho.indexOf('responsavelTratamento');
  var idxDataHoraResolucao = cabecalho.indexOf('dataHoraResolucao');
  var dados = abaQualidade.getRange(2, 1, abaQualidade.getLastRow() - 1, abaQualidade.getLastColumn()).getValues();
  var idCasoLimpo = limparTexto(idCaso);
  var campoLimpo = limparTexto(campo);
  var problemaLimpo = limparTexto(problema);
  var responsavel = limparTexto(responsavelTratamento) || limparTexto(Session.getActiveUser().getEmail()) || 'NAO_INFORMADO';
  var dataHoraResolucao = formatarDataHora(new Date());

  for (var i = dados.length - 1; i >= 0; i -= 1) {
    var statusAtual = limparTexto(dados[i][idxStatus]).toUpperCase() || 'PENDENTE';
    if (
      limparTexto(dados[i][idxIdCaso]) === idCasoLimpo &&
      limparTexto(dados[i][idxCampo]) === campoLimpo &&
      limparTexto(dados[i][idxProblema]) === problemaLimpo &&
      statusAtual !== 'RESOLVIDO'
    ) {
      var linhaPlanilha = i + 2;
      abaQualidade.getRange(linhaPlanilha, idxStatus + 1).setValue('RESOLVIDO');
      abaQualidade.getRange(linhaPlanilha, idxResponsavel + 1).setValue(responsavel);
      abaQualidade.getRange(linhaPlanilha, idxDataHoraResolucao + 1).setValue(dataHoraResolucao);

      registrarEventoOcorrencia(planilha, idCasoLimpo, 'PROBLEMA_QUALIDADE_RESOLVIDO', 'campo=' + campoLimpo + '; problema=' + problemaLimpo + '; responsavel=' + responsavel + '; resolvidoEm=' + dataHoraResolucao);
      return { ok: true, idCaso: idCasoLimpo, campo: campoLimpo, problema: problemaLimpo, statusTratamento: 'RESOLVIDO', responsavelTratamento: responsavel, dataHoraResolucao: dataHoraResolucao };
    }
  }

  throw new Error('Problema de qualidade não encontrado para resolução: idCaso/campo/problema.');
}

function resumoQualidadeDados_() {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var colunasQualidade = ESTRUTURA_PLANILHA.QUALIDADE_DADOS;
  var abaQualidade = garantirAbaComCabecalho(planilha, 'QUALIDADE_DADOS', colunasQualidade);
  var cabecalho = garantirColunasDaEstrutura(abaQualidade, colunasQualidade).map(limparTexto);
  var idxSeveridade = cabecalho.indexOf('severidade');
  var idxStatus = cabecalho.indexOf('statusTratamento');

  if (abaQualidade.getLastRow() < 2) {
    return { totalProblemas: 0, totalCriticos: 0, totalPendentes: 0, totalResolvidos: 0, inconsistencias: [] };
  }

  var dados = abaQualidade.getRange(2, 1, abaQualidade.getLastRow() - 1, abaQualidade.getLastColumn()).getValues();
  var idxDataHoraAuditoria = cabecalho.indexOf('dataHoraAuditoria');
  var idxIdCaso = cabecalho.indexOf('idCaso');
  var idxTalaoPMESP = cabecalho.indexOf('talaoPMESP');
  var idxCampo = cabecalho.indexOf('campo');
  var idxProblema = cabecalho.indexOf('problema');
  var idxAcaoRecomendada = cabecalho.indexOf('acaoRecomendada');
  var idxResponsavelTratamento = cabecalho.indexOf('responsavelTratamento');
  var idxDataHoraResolucao = cabecalho.indexOf('dataHoraResolucao');
  var resumo = { totalProblemas: dados.length, totalCriticos: 0, totalPendentes: 0, totalResolvidos: 0, inconsistencias: [] };

  dados.forEach(function (linha) {
    var severidade = limparTexto(linha[idxSeveridade]).toUpperCase();
    var status = limparTexto(linha[idxStatus]).toUpperCase() || 'PENDENTE';
    if (severidade === 'CRITICA') resumo.totalCriticos += 1;
    if (status === 'PENDENTE') resumo.totalPendentes += 1;
    if (status === 'RESOLVIDO') resumo.totalResolvidos += 1;
    resumo.inconsistencias.push({
      dataHoraAuditoria: normalizarValorPlanilha(linha[idxDataHoraAuditoria]),
      idCaso: normalizarValorPlanilha(linha[idxIdCaso]),
      talaoPMESP: normalizarValorPlanilha(linha[idxTalaoPMESP]),
      campo: normalizarValorPlanilha(linha[idxCampo]),
      problema: normalizarValorPlanilha(linha[idxProblema]),
      severidade: severidade,
      acaoRecomendada: normalizarValorPlanilha(linha[idxAcaoRecomendada]),
      statusTratamento: status,
      responsavelTratamento: normalizarValorPlanilha(linha[idxResponsavelTratamento]),
      dataHoraResolucao: normalizarValorPlanilha(linha[idxDataHoraResolucao])
    });
  });

  return resumo;
}

function possuiDecisaoOperacional_(caso) {
  var acao = limparTexto(caso.acaoSugerida);
  var observacoes = limparTexto(caso.observacoesOperacionais);
  return !!acao || /DECISAO_OPERACIONAL|DECIS[AÃ]O OPERACIONAL/i.test(observacoes);
}

function indexarPendenciasQualidade_(abaQualidade, cabecalhoQualidade) {
  var idxIdCaso = cabecalhoQualidade.indexOf('idCaso');
  var idxCampo = cabecalhoQualidade.indexOf('campo');
  var idxProblema = cabecalhoQualidade.indexOf('problema');
  var idxStatus = cabecalhoQualidade.indexOf('statusTratamento');
  var mapa = {};

  if (abaQualidade.getLastRow() < 2) return mapa;

  var dados = abaQualidade.getRange(2, 1, abaQualidade.getLastRow() - 1, abaQualidade.getLastColumn()).getValues();
  dados.forEach(function (linha) {
    var status = limparTexto(linha[idxStatus]).toUpperCase() || 'PENDENTE';
    if (status !== 'PENDENTE') return;
    var chave = gerarChaveProblemaQualidade_(linha[idxIdCaso], linha[idxCampo], linha[idxProblema], status);
    mapa[chave] = true;
  });
  return mapa;
}

function adicionarRegistroQualidadeSeNovo_(registros, mapaPendentes, dataHoraAuditoria, idCaso, talaoPMESP, campo, problema, severidade, acaoRecomendada) {
  var chave = gerarChaveProblemaQualidade_(idCaso, campo, problema, 'PENDENTE');
  if (mapaPendentes[chave]) return 1;

  registros.push([
    dataHoraAuditoria,
    idCaso,
    talaoPMESP,
    campo,
    problema,
    severidade,
    acaoRecomendada,
    'PENDENTE',
    '',
    ''
  ]);
  mapaPendentes[chave] = true;
  return 0;
}

function gerarChaveProblemaQualidade_(idCaso, campo, problema, statusTratamento) {
  return [limparTexto(idCaso), limparTexto(campo), limparTexto(problema), limparTexto(statusTratamento).toUpperCase()].join('|');
}
