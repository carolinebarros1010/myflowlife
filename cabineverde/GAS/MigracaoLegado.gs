var ABAS_OBRIGATORIAS_CABINE_VERDE = [
  'CASOS',
  'TRIAGEM_RESPOSTAS',
  'EVENTOS_OCORRENCIA',
  'INDICADORES_OPERACIONAIS',
  'LOG_MIGRACAO',
  'LEGADO_OBSERVACOES_BRUTAS',
  'VALIDACAO_MIGRACAO'
];

var CABECALHO_LOG_MIGRACAO = [
  'dataHora',
  'funcaoExecutada',
  'status',
  'modoExecucao',
  'backupConfirmado',
  'idCaso',
  'mensagem',
  'usuario',
  'origemExecucao'
];

var CABECALHO_LEGADO_OBSERVACOES_BRUTAS = [
  'dataHora',
  'idCaso',
  'linhaOrigem',
  'hashConteudo',
  'conteudoBruto',
  'operador'
];

var CABECALHO_VALIDACAO_MIGRACAO = [
  'dataHoraValidacao',
  'idCaso',
  'talaoPMESP',
  'campo',
  'problema',
  'severidade',
  'statusValidacao'
];

var COLUNAS_CASOS_OBRIGATORIAS_MIGRACAO = COLUNAS_CASOS.concat(['statusMigracao']);


var COLUNAS_CASOS_TRATADOS = [
  'idCaso',
  'talaoPMESP',
  'nomeCompletoDesaparecido',
  'sexoGenero',
  'idade',
  'faixaEtaria',
  'dataHoraUltimaVisualizacao',
  'localUltimaVisualizacao',
  'roupaUltimaVisualizacao',
  'meioTransporte',
  'classificacaoRisco',
  'prioridade',
  'statusCaso',
  'observacoesOperacionais',
  'statusMigracao',
  'statusUso',
  'dataHoraConsolidacaoUso'
];

var MAPEAMENTO_COLUNAS_LEGADO = {
  idCaso: ['idCaso', 'id', 'codigoCaso'],
  talaoPMESP: ['talaoPMESP', 'talaoBopm', 'talaoBOPM', 'talão', 'talao', 'numeroTalao'],
  statusCaso: ['statusCaso', 'status'],
  observacoesOperacionais: ['observacoesOperacionais', 'observacoes', 'observacao', 'obsOperacional']
};
var DRY_RUN_MIGRACAO = true;
var EXECUCAO_AUTORIZADA = false;


function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Cabine Verde')
    .addItem('1. Fazer backup da planilha', 'menuFazerBackupPlanilha_')
    .addItem('2. Ajustar estrutura automaticamente', 'menuAjustarEstruturaPlanilha_')
    .addItem('3. Migrar dados legados', 'menuMigrarDadosLegados_')
    .addItem('4. Validar integridade', 'menuValidarIntegridadeMigracao_')
    .addItem('5. Rodar rotina completa segura', 'menuRodarRotinaCompletaSegura_')
    .addItem('6. Restaurar último backup', 'menuRestaurarBackupMaisRecente_')
    .addItem('7. Auditar qualidade dos dados', 'menuAuditarQualidadeDados_')
    .addItem('8. Validar CASOS_TRATADOS', 'menuValidarCasosTratados_')
    .addItem('9. Consolidar status de uso', 'menuConsolidarStatusUsoCasosTratados_')
    .addToUi();
}

function iniciarContextoExecucao_(origem) {
  EXECUCAO_AUTORIZADA = true;
  PropertiesService.getScriptProperties().setProperty('ORIGEM_EXECUCAO', limparTexto(origem).toUpperCase() || 'INTERNA');
}

function finalizarContextoExecucao_() {
  EXECUCAO_AUTORIZADA = false;
  PropertiesService.getScriptProperties().deleteProperty('ORIGEM_EXECUCAO');
}

function executarComContextoAutorizado_(origemExecucao, callback) {
  try {
    iniciarContextoExecucao_(origemExecucao);
    return callback();
  } finally {
    finalizarContextoExecucao_();
  }
}

function menuFazerBackupPlanilha_() {
  return executarComContextoAutorizado_('MENU', function () { return fazerBackupPlanilha_({ dryRun: false }); });
}

function menuAjustarEstruturaPlanilha_() {
  return executarComContextoAutorizado_('MENU', function () { return ajustarEstruturaPlanilha_({ dryRun: obterDryRunEfetivo_() }); });
}

function menuMigrarDadosLegados_() {
  return executarComContextoAutorizado_('MENU', function () { return migrarDadosLegados_({ dryRun: obterDryRunEfetivo_() }); });
}

function menuValidarIntegridadeMigracao_() {
  return executarComContextoAutorizado_('MENU', function () { return validarIntegridadeMigracao_({ dryRun: obterDryRunEfetivo_() }); });
}

function menuRodarRotinaCompletaSegura_() {
  return executarComContextoAutorizado_('MENU', function () { return rodarRotinaCompletaSegura_(); });
}

function menuRestaurarBackupMaisRecente_() {
  return executarComContextoAutorizado_('MENU', function () { return restaurarBackupMaisRecente_(); });
}

function menuAuditarQualidadeDados_() {
  return executarComContextoAutorizado_('MENU', function () { return auditarQualidadeDados_(); });
}

function menuValidarCasosTratados_() {
  return executarComContextoAutorizado_('MENU', function () { return validarCasosTratados_(); });
}

function menuConsolidarStatusUsoCasosTratados_() {
  return executarComContextoAutorizado_('MENU', function () { return consolidarStatusUsoCasosTratados_(); });
}

function rodarRotinaCompletaSegura_() {
  return executarComContextoAutorizado_('INTERNA', function () {
  validarPreExecucaoMigracao_('SIMULACAO');
  registrarLogMigracao_('rodarRotinaCompletaSegura_', 'SIMULADO', '', 'Início obrigatório da simulação completa (dry run).', 'SIMULADO', true);
  ajustarEstruturaPlanilha_({ dryRun: true });
  migrarDadosLegados_({ dryRun: true });
  validarIntegridadeMigracao_({ dryRun: true });

  if (DRY_RUN_MIGRACAO) {
    registrarLogMigracao_('rodarRotinaCompletaSegura_', 'ALERTA', '', 'DRY_RUN_MIGRACAO=true. Altere manualmente para false antes da execução real.', 'SIMULADO', true);
    return;
  }

  fazerBackupPlanilha_({ dryRun: false });
  validarPreExecucaoMigracao_('EXECUCAO_REAL');
  ajustarEstruturaPlanilha_({ dryRun: false });
  migrarDadosLegados_({ dryRun: false });
  validarIntegridadeMigracao_({ dryRun: false });
  });
}

function fazerBackupPlanilha_(opcoes) {
  var dryRun = obterDryRunEfetivo_(opcoes);
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var sufixo = 'BACKUP_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'America/Sao_Paulo', 'yyyyMMdd_HHmmss');

  planilha.getSheets().forEach(function (sheet) {
    var nomeOriginal = sheet.getName();
    if (nomeOriginal.indexOf('BACKUP_') !== -1) return;
    var nomeBackup = limitarNomeAba_(nomeOriginal + '_' + sufixo);
    if (dryRun) {
      registrarLogMigracao_('fazerBackupPlanilha_', 'SIMULADO', '', 'Backup simulado da aba ' + nomeOriginal + ' -> ' + nomeBackup);
      return;
    }
    var copia = sheet.copyTo(planilha).setName(nomeBackup);
    planilha.setActiveSheet(copia);
    planilha.moveActiveSheet(planilha.getNumSheets());
  });

  registrarLogMigracao_('fazerBackupPlanilha_', dryRun ? 'SIMULADO' : 'EXECUTADO', '', dryRun ? 'Simulação de backup concluída.' : 'Backup concluído para abas elegíveis.');
}

function ajustarEstruturaPlanilha_(opcoes) {
  validarContextoExecucaoAutorizada_('ajustarEstruturaPlanilha_');
  var dryRun = obterDryRunEfetivo_(opcoes);
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var mapa = obterEstruturaAbas_();

  ABAS_OBRIGATORIAS_CABINE_VERDE.forEach(function (nomeAba) {
    var sheet = planilha.getSheetByName(nomeAba);
    if (!sheet) {
      if (dryRun) {
        registrarLogMigracao_('ajustarEstruturaPlanilha_', 'SIMULADO', '', 'Aba seria criada: ' + nomeAba);
        return;
      }
      sheet = planilha.insertSheet(nomeAba);
      registrarLogMigracao_('ajustarEstruturaPlanilha_', 'EXECUTADO', '', 'Aba criada: ' + nomeAba);
    }

    var cabecalhoEsperado = mapa[nomeAba] || [];
    garantirCabecalhoSemDuplicidade_(sheet, cabecalhoEsperado, nomeAba, dryRun);

    if (dryRun) {
      registrarLogMigracao_('ajustarEstruturaPlanilha_', 'SIMULADO', '', 'Congelamento/filtro/largura seriam aplicados na aba ' + nomeAba);
    } else {
      sheet.setFrozenRows(1);
      if (sheet.getMaxColumns() > 0 && sheet.getLastColumn() > 0) {
        sheet.setColumnWidths(1, sheet.getLastColumn(), 180);
        if (sheet.getFilter()) sheet.getFilter().remove();
        sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 1), sheet.getLastColumn()).createFilter();
      }
    }

    registrarLogMigracao_('ajustarEstruturaPlanilha_', dryRun ? 'SIMULADO' : 'EXECUTADO', '', 'Ajustes processados na aba ' + nomeAba);
  });
}

function migrarDadosLegados_(opcoes) {
  validarContextoExecucaoAutorizada_('migrarDadosLegados_');
  var dryRun = obterDryRunEfetivo_(opcoes);
  validarPreExecucaoMigracao_(dryRun ? 'SIMULACAO' : 'EXECUCAO_REAL');
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var sheetCasos = planilha.getSheetByName('CASOS');
  if (!sheetCasos || sheetCasos.getLastRow() < 2) {
    registrarLogMigracao_('migrarDadosLegados_', dryRun ? 'SIMULADO' : 'EXECUTADO', '', 'Sem dados legados para migrar.');
    return;
  }

  var cabecalho = obterCabecalho_(sheetCasos);
  var dados = sheetCasos.getRange(2, 1, sheetCasos.getLastRow() - 1, sheetCasos.getLastColumn()).getValues();
  var indiceStatusMigracao = obterOuCriarColuna_(sheetCasos, 'statusMigracao', dryRun);
  var cabecalhoAtualizado = obterCabecalho_(sheetCasos);

  dados.forEach(function (linha, indice) {
    var linhaPlanilha = indice + 2;
    var registro = linhaParaObjeto_(cabecalho, linha);
    var idCaso = limparTexto(obterPrimeiroValorDisponivel_(registro, MAPEAMENTO_COLUNAS_LEGADO.idCaso));

    if (!idCaso) {
      idCaso = 'LEGADO-LINHA-' + linhaPlanilha;
      if (dryRun) {
        registrarLogMigracao_('migrarDadosLegados_', 'SIMULADO', idCaso, 'idCaso ausente seria preenchido na linha ' + linhaPlanilha);
      } else {
        sheetCasos.getRange(linhaPlanilha, cabecalhoAtualizado.indexOf('idCaso') + 1).setValue(idCaso);
      }
    }

    var talaoLegado = limparTexto(obterPrimeiroValorDisponivel_(registro, MAPEAMENTO_COLUNAS_LEGADO.talaoPMESP));
    if (talaoLegado) {
      if (dryRun) {
        registrarLogMigracao_('migrarDadosLegados_', 'SIMULADO', idCaso, 'talaoPMESP seria atualizado com valor legado na linha ' + linhaPlanilha);
      } else {
        sheetCasos.getRange(linhaPlanilha, cabecalhoAtualizado.indexOf('talaoPMESP') + 1).setValue(talaoLegado);
      }
    }

    var statusCaso = limparTexto(obterPrimeiroValorDisponivel_(registro, MAPEAMENTO_COLUNAS_LEGADO.statusCaso)) || 'Legado migrado';
    if (dryRun) {
      registrarLogMigracao_('migrarDadosLegados_', 'SIMULADO', idCaso, 'statusCaso seria definido para "' + statusCaso + '" na linha ' + linhaPlanilha);
    } else {
      sheetCasos.getRange(linhaPlanilha, cabecalhoAtualizado.indexOf('statusCaso') + 1).setValue(statusCaso);
    }

    var observacoesOriginal = limparTexto(obterPrimeiroValorDisponivel_(registro, MAPEAMENTO_COLUNAS_LEGADO.observacoesOperacionais));
    var resultadoObservacao = extrairArvoreObservacoesLegadas_(idCaso, linhaPlanilha, observacoesOriginal, dryRun);
    if (dryRun) {
      registrarLogMigracao_('migrarDadosLegados_', 'SIMULADO', idCaso, 'observacoesOperacionais seria resumida na linha ' + linhaPlanilha);
      registrarLogMigracao_('migrarDadosLegados_', 'SIMULADO', idCaso, 'statusMigracao seria "' + resultadoObservacao.statusMigracao + '" na linha ' + linhaPlanilha);
    } else {
      sheetCasos.getRange(linhaPlanilha, cabecalhoAtualizado.indexOf('observacoesOperacionais') + 1).setValue(resultadoObservacao.resumo);
      sheetCasos.getRange(linhaPlanilha, indiceStatusMigracao).setValue(resultadoObservacao.statusMigracao);
      registrarLogMigracao_('migrarDadosLegados_', 'EXECUTADO', idCaso, 'Linha migrada com status: ' + resultadoObservacao.statusMigracao);
    }
  });
}

function extrairArvoreObservacoesLegadas_(idCaso, linhaOrigem, observacoesOperacionais, dryRun) {
  var texto = limparTexto(observacoesOperacionais);
  if (!texto) {
    return { resumo: '', statusMigracao: 'SEM_OBSERVACAO' };
  }

  var precisaArquivar = texto.length > 500 || texto.indexOf('[ÁRVORE DE DECISÃO') !== -1;
  if (!precisaArquivar) {
    return { resumo: gerarResumoOperacionalLegado_(texto), statusMigracao: 'MIGRADO_SEM_ARQUIVO_BRUTO' };
  }

  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var abaLegado = planilha.getSheetByName('LEGADO_OBSERVACOES_BRUTAS');
  if (!abaLegado) {
    if (dryRun) {
      registrarLogMigracao_('extrairArvoreObservacoesLegadas_', 'SIMULADO', idCaso, 'Aba LEGADO_OBSERVACOES_BRUTAS seria criada para arquivamento.');
    } else {
      abaLegado = planilha.insertSheet('LEGADO_OBSERVACOES_BRUTAS');
    }
  }
  if (abaLegado) {
    garantirCabecalhoSemDuplicidade_(abaLegado, CABECALHO_LEGADO_OBSERVACOES_BRUTAS, 'LEGADO_OBSERVACOES_BRUTAS', dryRun);
  }
  var hashConteudo = Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, texto)).substring(0, 16);

  if (dryRun) {
    registrarLogMigracao_('extrairArvoreObservacoesLegadas_', 'SIMULADO', idCaso, 'Observação bruta seria arquivada (hash: ' + hashConteudo + ').');
  } else {
    abaLegado.appendRow([
      formatarDataHora(new Date()),
      idCaso,
      linhaOrigem,
      hashConteudo,
      texto,
      Session.getActiveUser().getEmail() || 'sistema'
    ]);
    registrarLogMigracao_('extrairArvoreObservacoesLegadas_', 'EXECUTADO', idCaso, 'Observação bruta arquivada (hash: ' + hashConteudo + ').');
  }
  return {
    resumo: gerarResumoOperacionalLegado_(texto),
    statusMigracao: 'MIGRADO_COM_ARQUIVO_BRUTO'
  };
}

function gerarResumoOperacionalLegado_(texto) {
  var textoLimpo = limparTexto(texto).replace(/\s+/g, ' ');
  if (textoLimpo.length <= 220) return textoLimpo;
  return textoLimpo.substring(0, 217) + '...';
}

function validarIntegridadeMigracao_(opcoes) {
  validarContextoExecucaoAutorizada_('validarIntegridadeMigracao_');
  var dryRun = obterDryRunEfetivo_(opcoes);
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = planilha.getSheetByName('CASOS');
  if (!sheet || sheet.getLastRow() < 2) {
    registrarLogMigracao_('validarIntegridadeMigracao_', dryRun ? 'SIMULADO' : 'ALERTA', '', 'Sem linhas para validação.');
    return;
  }

  var cabecalho = obterCabecalho_(sheet);
  var dados = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  var ids = {};
  var talaoes = {};
  var linhasSemId = 0;
  var duplicadosId = [];
  var duplicadosTalao = [];

  dados.forEach(function (linha, i) {
    var registro = linhaParaObjeto_(cabecalho, linha);
    var idCaso = limparTexto(registro.idCaso);
    var talao = limparTexto(registro.talaoPMESP);

    if (!idCaso) linhasSemId += 1;
    if (idCaso) {
      if (ids[idCaso]) duplicadosId.push(idCaso);
      ids[idCaso] = true;
    }

    if (talao) {
      if (talaoes[talao]) duplicadosTalao.push(talao);
      talaoes[talao] = true;
    }
  });

  var status = duplicadosId.length ? 'ALERTA' : (dryRun ? 'SIMULADO' : 'EXECUTADO');
  registrarLogMigracao_('validarIntegridadeMigracao_', status, '', 'Total casos: ' + dados.length + '; sem idCaso: ' + linhasSemId + '; duplicados idCaso: ' + duplicadosId.length + '; duplicados talaoPMESP: ' + duplicadosTalao.length + '.');
}


function validarContextoExecucaoAutorizada_(funcao) {
  if (EXECUCAO_AUTORIZADA) return;
  registrarLogMigracao_(funcao || 'desconhecida', 'BLOQUEADO', '', 'Execução bloqueada: função só pode ser chamada via fluxo autorizado.', 'EXECUTADO', false, 'BLOQUEADA');
  throw new Error('Execução bloqueada: função só pode ser chamada via fluxo autorizado.');
}

function obterOrigemExecucaoAtual_() {
  var origem = PropertiesService.getScriptProperties().getProperty('ORIGEM_EXECUCAO');
  return origem || 'INTERNA';
}

function registrarLogMigracao_(funcaoExecutada, status, idCaso, mensagem, modoExecucao, backupConfirmado, origemExecucao) {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var abaLog = planilha.getSheetByName('LOG_MIGRACAO') || planilha.insertSheet('LOG_MIGRACAO');
  garantirCabecalhoSemDuplicidade_(abaLog, CABECALHO_LOG_MIGRACAO, 'LOG_MIGRACAO');

  abaLog.appendRow([
    formatarDataHora(new Date()),
    funcaoExecutada,
    status,
    modoExecucao || (status === 'SIMULADO' ? 'SIMULADO' : 'EXECUTADO'),
    backupConfirmado === undefined ? (verificarBackupRecente_() ? 'TRUE' : 'FALSE') : (backupConfirmado ? 'TRUE' : 'FALSE'),
    idCaso || '',
    mensagem || '',
    Session.getActiveUser().getEmail() || 'sistema',
    origemExecucao || obterOrigemExecucaoAtual_()
  ]);
}

function obterEstruturaAbas_() {
  return {
    CASOS: COLUNAS_CASOS_OBRIGATORIAS_MIGRACAO,
    TRIAGEM_RESPOSTAS: COLUNAS_TRIAGEM_RESPOSTAS,
    EVENTOS_OCORRENCIA: COLUNAS_EVENTOS_OCORRENCIA,
    INDICADORES_OPERACIONAIS: COLUNAS_INDICADORES_OPERACIONAIS,
    LOG_MIGRACAO: CABECALHO_LOG_MIGRACAO,
    LEGADO_OBSERVACOES_BRUTAS: CABECALHO_LEGADO_OBSERVACOES_BRUTAS,
    VALIDACAO_MIGRACAO: CABECALHO_VALIDACAO_MIGRACAO
  };
}

function garantirCabecalhoSemDuplicidade_(sheet, colunasEsperadas, nomeAba, dryRun) {
  var cabecalhoAtual = obterCabecalho_(sheet);
  var mapaSinonimos = construirMapaSinonimos_();

  (colunasEsperadas || []).forEach(function (colunaEsperada) {
    if (cabecalhoAtual.indexOf(colunaEsperada) !== -1) return;

    var sinonimos = mapaSinonimos[colunaEsperada] || [];
    var indiceSinonimo = -1;
    for (var i = 0; i < sinonimos.length; i += 1) {
      indiceSinonimo = cabecalhoAtual.indexOf(sinonimos[i]);
      if (indiceSinonimo !== -1) break;
    }

    if (indiceSinonimo !== -1) {
      if (dryRun) {
        registrarLogMigracao_('garantirCabecalhoSemDuplicidade_', 'SIMULADO', '', 'Header seria padronizado em ' + nomeAba + ': ' + sinonimos[i] + ' -> ' + colunaEsperada);
      } else {
        sheet.getRange(1, indiceSinonimo + 1).setValue(colunaEsperada);
        registrarLogMigracao_('garantirCabecalhoSemDuplicidade_', 'EXECUTADO', '', 'Padronização de header em ' + nomeAba + ': ' + sinonimos[i] + ' -> ' + colunaEsperada);
      }
    } else {
      if (dryRun) {
        registrarLogMigracao_('garantirCabecalhoSemDuplicidade_', 'SIMULADO', '', 'Coluna seria adicionada em ' + nomeAba + ': ' + colunaEsperada);
      } else {
        sheet.getRange(1, sheet.getLastColumn() + 1).setValue(colunaEsperada);
        registrarLogMigracao_('garantirCabecalhoSemDuplicidade_', 'EXECUTADO', '', 'Coluna adicionada em ' + nomeAba + ': ' + colunaEsperada);
      }
    }

    cabecalhoAtual = obterCabecalho_(sheet);
  });

  return cabecalhoAtual;
}

function construirMapaSinonimos_() {
  return {
    talaoPMESP: ['talaoBopm', 'talaoBOPM', 'talão', 'talao', 'numeroTalao'],
    observacoesOperacionais: ['observacoes', 'observacao', 'obsOperacional'],
    statusCaso: ['status']
  };
}

function obterCabecalho_(sheet) {
  var ultimaColuna = Math.max(sheet.getLastColumn(), 1);
  return sheet.getRange(1, 1, 1, ultimaColuna).getValues()[0].map(limparTexto).filter(Boolean);
}

function obterOuCriarColuna_(sheet, coluna, dryRun) {
  var cabecalho = obterCabecalho_(sheet);
  var indice = cabecalho.indexOf(coluna);
  if (indice !== -1) return indice + 1;
  if (dryRun) {
    registrarLogMigracao_('obterOuCriarColuna_', 'SIMULADO', '', 'Coluna seria criada: ' + coluna + ' na aba ' + sheet.getName());
    return cabecalho.length + 1;
  }
  sheet.getRange(1, sheet.getLastColumn() + 1).setValue(coluna);
  return sheet.getLastColumn();
}

function linhaParaObjeto_(cabecalho, linha) {
  var obj = {};
  cabecalho.forEach(function (coluna, i) {
    obj[coluna] = i < linha.length ? linha[i] : '';
  });
  return obj;
}

function obterPrimeiroValorDisponivel_(registro, chaves) {
  for (var i = 0; i < chaves.length; i += 1) {
    var chave = chaves[i];
    if (registro[chave] !== undefined && registro[chave] !== null && String(registro[chave]).trim() !== '') {
      return registro[chave];
    }
  }
  return '';
}

function limitarNomeAba_(nome) {
  return nome.length > 99 ? nome.substring(0, 99) : nome;
}

function obterDryRunEfetivo_(opcoes) {
  if (opcoes && typeof opcoes.dryRun === 'boolean') return opcoes.dryRun;
  return DRY_RUN_MIGRACAO;
}


/**
 * Valida pré-condições bloqueantes para migração.
 * - Bloqueia execução real quando DRY_RUN_MIGRACAO estiver ativo.
 * - Bloqueia execução real sem backup recente (30 min) ou confirmado em sessão.
 */
function validarPreExecucaoMigracao_(modo) {
  var modoNormalizado = limparTexto(modo).toUpperCase() || 'SIMULACAO';
  if (modoNormalizado !== 'EXECUCAO_REAL') {
    registrarLogMigracao_('validarPreExecucaoMigracao_', 'SIMULADO', '', 'Validação pré-execução concluída para simulação.', 'SIMULADO', true);
    return true;
  }

  if (DRY_RUN_MIGRACAO) {
    registrarLogMigracao_('validarPreExecucaoMigracao_', 'BLOQUEADO', '', 'Execução real bloqueada: DRY_RUN_MIGRACAO=true.', 'EXECUTADO', false);
    throw new Error('Execução bloqueada: DRY_RUN_MIGRACAO ativo para execução real.');
  }

  var backupConfirmado = verificarBackupRecente_();
  if (!backupConfirmado) {
    registrarLogMigracao_('validarPreExecucaoMigracao_', 'BLOQUEADO', '', 'Execução bloqueada: backup obrigatório não identificado.', 'EXECUTADO', false);
    throw new Error('Execução bloqueada: backup obrigatório não identificado.');
  }

  registrarLogMigracao_('validarPreExecucaoMigracao_', 'EXECUTADO', '', 'Pré-validação aprovada para execução real.', 'EXECUTADO', true);
  return true;
}

/**
 * Critério de backup recente:
 * - backup em até 30 minutos; ou
 * - registro de backup executado na sessão atual.
 */
function verificarBackupRecente_() {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var agora = new Date().getTime();
  var sheet = planilha.getSheetByName('LOG_MIGRACAO');
  if (!sheet || sheet.getLastRow() < 2) return false;

  var cabecalho = obterCabecalho_(sheet);
  var idxFuncao = cabecalho.indexOf('funcaoExecutada');
  var idxStatus = cabecalho.indexOf('status');
  var idxData = cabecalho.indexOf('dataHora');
  var idxUsuario = cabecalho.indexOf('usuario');
  if (idxFuncao === -1 || idxStatus === -1 || idxData === -1) return false;

  var dados = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  var usuarioAtual = Session.getActiveUser().getEmail() || 'sistema';

  for (var i = dados.length - 1; i >= 0; i -= 1) {
    var linha = dados[i];
    if (limparTexto(linha[idxFuncao]) !== 'fazerBackupPlanilha_') continue;
    if (limparTexto(linha[idxStatus]) !== 'EXECUTADO') continue;
    if (idxUsuario >= 0 && limparTexto(linha[idxUsuario]) && limparTexto(linha[idxUsuario]) !== usuarioAtual) continue;

    var dataLog = new Date(limparTexto(linha[idxData]));
    if (!isNaN(dataLog.getTime()) && (agora - dataLog.getTime()) <= (30 * 60 * 1000)) {
      return true;
    }
  }

  return false;
}

/**
 * Rollback assistido: restaura as abas operacionais a partir do backup mais recente.
 */
function restaurarBackupMaisRecente_() {
  validarContextoExecucaoAutorizada_('restaurarBackupMaisRecente_');
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var abasAlvo = ['CASOS', 'TRIAGEM_RESPOSTAS', 'EVENTOS_OCORRENCIA', 'INDICADORES_OPERACIONAIS'];
  var backupsPorAba = {};

  planilha.getSheets().forEach(function (sheet) {
    var nome = sheet.getName();
    abasAlvo.forEach(function (aba) {
      var prefixo = aba + '_BACKUP_';
      if (nome.indexOf(prefixo) === 0) {
        var ts = nome.substring(prefixo.length);
        backupsPorAba[aba] = backupsPorAba[aba] || [];
        backupsPorAba[aba].push({ sheet: sheet, timestamp: ts });
      }
    });
  });

  var possuiBackup = abasAlvo.some(function (aba) { return backupsPorAba[aba] && backupsPorAba[aba].length; });
  if (!possuiBackup) {
    registrarLogMigracao_('restaurarBackupMaisRecente_', 'BLOQUEADO', '', 'Nenhum backup disponível para restauração.', 'EXECUTADO', false);
    throw new Error('Nenhum backup disponível para restauração.');
  }

  abasAlvo.forEach(function (aba) {
    var candidatos = backupsPorAba[aba] || [];
    if (!candidatos.length) return;
    candidatos.sort(function (a, b) { return a.timestamp < b.timestamp ? 1 : -1; });
    var backup = candidatos[0].sheet;
    var destino = planilha.getSheetByName(aba) || planilha.insertSheet(aba);
    destino.clearContents();
    var ultLinha = Math.max(backup.getLastRow(), 1);
    var ultColuna = Math.max(backup.getLastColumn(), 1);
    var dados = backup.getRange(1, 1, ultLinha, ultColuna).getValues();
    destino.getRange(1, 1, ultLinha, ultColuna).setValues(dados);
  });

  registrarLogMigracao_('restaurarBackupMaisRecente_', 'EXECUTADO', '', 'Rollback concluído com backup mais recente por aba.', 'EXECUTADO', true);
}



function migrarLegadoParaCasosTratados_() {
  validarContextoExecucaoAutorizada_('migrarLegadoParaCasosTratados_');
  var dryRun = obterDryRunEfetivo_();
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var abaOrigem = obterAbaPorNomeFlexivel_(planilha, ['Desaparecidos', 'DESAPARECIDOS', 'desaparecidos']);
  var modoExecucao = dryRun ? 'SIMULADO' : 'EXECUTADO';

  if (!abaOrigem) {
    registrarLogMigracao_('migrarLegadoParaCasosTratados_', 'ALERTA', '', 'Aba origem Desaparecidos não encontrada.', modoExecucao);
    return;
  }

  var abaDestino = planilha.getSheetByName('CASOS_TRATADOS') || planilha.insertSheet('CASOS_TRATADOS');
  garantirCabecalhoSemDuplicidade_(abaDestino, COLUNAS_CASOS_TRATADOS, 'CASOS_TRATADOS', dryRun);
  var cabDestino = obterCabecalho_(abaDestino);
  var dados = abaOrigem.getDataRange().getValues();
  if (!dados || dados.length <= 1) {
    registrarLogMigracao_('migrarLegadoParaCasosTratados_', 'ALERTA', '', 'Aba origem encontrada, mas sem registros abaixo do cabeçalho.', modoExecucao);
    return;
  }
  var headers = dados[0] || [];
  var idxIdCaso = headers.indexOf('idCaso');
  if (idxIdCaso === -1) {
    throw new Error('Coluna idCaso não encontrada.');
  }
  var cabOrigem = headers.map(function (h) { return limparTexto(h); });

  var indicesDestino = {};
  cabDestino.forEach(function (coluna, indice) {
    indicesDestino[coluna] = indice;
  });

  var camposBase = {
    nomeCompletoDesaparecido: 'nomeCompletoDesaparecido',
    sexoGenero: 'sexoGenero',
    idade: 'idade',
    faixaEtaria: 'faixaEtaria',
    dataHoraUltimaVisualizacao: 'dataHoraUltimaVisualizacao',
    localUltimaVisualizacao: 'localUltimaVisualizacao',
    roupaUltimaVisualizacao: 'roupaUltimaVisualizacao',
    meioTransporte: 'meioTransporte',
    classificacaoRisco: 'classificacaoRisco',
    prioridade: 'prioridade',
    statusCaso: 'statusCaso'
  };
  var camposPreservar = [
    'dataHoraRegistro', 'dataServico', 'turno', 'equipe', 'operadorResponsavel', 'municipio', 'cpf', 'rg', 'nomeMae',
    'dataNascimento', 'dadosVeiculo', 'fotoDisponivel', 'linkFoto', 'telefoneDesaparecido', 'dispositivoLigado',
    'camerasResidencia', 'camerasUltimoLocal', 'aptoCabineVerde', 'nomeSolicitante', 'vinculoSolicitante',
    'telefoneSolicitante', 'vulnerabilidade', 'condicaoMentalCognitivaComportamental', 'limitacaoFisica',
    'usoMedicacaoEssencial', 'usoAlcoolOutrasDrogas', 'historicoDesaparecimentoAnterior', 'conflitoPrevio',
    'suspeitaCrime', 'locaisHabituais', 'buscasPreliminares', 'acaoSugerida', 'localizado', 'dataHoraLocalizacao',
    'formaLocalizacao', 'encerrado190', 'numeroBo'
  ];

  var idsExistentes = {};
  if (abaDestino.getLastRow() >= 2) {
    var dadosDestino = abaDestino.getRange(2, 1, abaDestino.getLastRow() - 1, abaDestino.getLastColumn()).getValues();
    dadosDestino.forEach(function (linha) {
      var id = limparTexto(linha[indicesDestino.idCaso]);
      if (id) idsExistentes[id] = true;
    });
  }

  var novasLinhas = [];
  var totalLinhasLidas = dados.length;
  var totalLinhasComIdCaso = 0;
  var totalSemIdCaso = 0;
  var totalMigrados = 0;
  var totalIncompletos = 0;
  var totalJaExistentes = 0;
  var totalErros = 0;
  for (var i = 1; i < dados.length; i += 1) {
    var linha = dados[i];
    var linhaPlanilha = i + 1;
    if (!linha) {
      totalSemIdCaso += 1;
      continue;
    }
    var idCasoLinha = linha[idxIdCaso];
    if (!idCasoLinha || String(idCasoLinha).trim() === '') {
      totalSemIdCaso += 1;
      continue;
    }
    totalLinhasComIdCaso += 1;

    var registro = linhaParaObjeto_(cabOrigem, linha);
    var idCaso = limparTexto(obterPrimeiroValorDisponivel_(registro, ['idCaso', 'idcaso', 'IDCASO']));
    if (!idCaso) continue;

    if (idsExistentes[idCaso]) {
      totalJaExistentes += 1;
      continue;
    }

    try {
      var observacaoBruta = normalizarTextoMigracao_(registro.observacoesOperacionais);
      var resumoObservacao = gerarResumoArvoreDecisaoLegado_(observacaoBruta);
      var precisaArquivarBruto = observacaoBruta && (observacaoBruta.length > 500 || observacaoBruta.indexOf('[ÁRVORE DE DECISÃO') !== -1);
      if (precisaArquivarBruto) {
        extrairArvoreObservacoesLegadas_(idCaso, linhaPlanilha, observacaoBruta, dryRun);
      }

      var linhaDestino = new Array(cabDestino.length).fill('');
      Object.keys(camposBase).forEach(function (origem) {
        var destino = camposBase[origem];
        if (indicesDestino[destino] === undefined) return;
        var valor = registro[origem];
        if (destino === 'sexoGenero') valor = normalizarSexoGeneroMigracao_(valor);
        else if (destino === 'meioTransporte') valor = normalizarMeioTransporteMigracao_(valor);
        else if (destino === 'idade') valor = normalizarInteiroMigracao_(valor);
        else valor = normalizarBooleanoOuTextoMigracao_(valor);
        linhaDestino[indicesDestino[destino]] = valor;
      });
      if (indicesDestino.idCaso !== undefined) {
        linhaDestino[indicesDestino.idCaso] = idCaso;
      }
      if (indicesDestino.talaoPMESP !== undefined) {
        linhaDestino[indicesDestino.talaoPMESP] = limparTexto(obterPrimeiroValorDisponivel_(registro, ['talaoBopm', 'talaoBOPM', 'talaoPMESP', 'talão', 'talao', 'numeroTalao']));
      }

      camposPreservar.forEach(function (campo) {
        if (indicesDestino[campo] === undefined) return;
        linhaDestino[indicesDestino[campo]] = normalizarBooleanoOuTextoMigracao_(registro[campo]);
      });

      if (indicesDestino.observacoesOperacionais !== undefined) {
        linhaDestino[indicesDestino.observacoesOperacionais] = resumoObservacao;
      }
      var talaoPMESP = indicesDestino.talaoPMESP !== undefined ? limparTexto(linhaDestino[indicesDestino.talaoPMESP]) : '';
      if (indicesDestino.statusMigracao !== undefined) {
        linhaDestino[indicesDestino.statusMigracao] = talaoPMESP ? 'MIGRADO' : 'INCOMPLETO';
      }
      if (talaoPMESP) totalMigrados += 1;
      else totalIncompletos += 1;

      novasLinhas.push(linhaDestino);
      idsExistentes[idCaso] = true;
    } catch (erro) {
      totalErros += 1;
      registrarLogMigracao_('migrarLegadoParaCasosTratados_', 'ERRO', idCaso, 'Falha de tratamento: ' + erro.message, modoExecucao);
    }
  }
  Logger.log('Total linhas lidas: ' + dados.length);
  Logger.log('Total com idCaso: ' + totalLinhasComIdCaso);
  if (totalLinhasComIdCaso === 0) {
    throw new Error('Nenhum idCaso encontrado na aba Desaparecidos.');
  }
  if (!novasLinhas.length && totalJaExistentes > 0) {
    registrarLogMigracao_('migrarLegadoParaCasosTratados_', 'ALERTA', '', 'Todos os casos válidos já estavam em CASOS_TRATADOS.', modoExecucao);
  } else if (dryRun) {
    registrarLogMigracao_('migrarLegadoParaCasosTratados_', 'SIMULADO', '', 'Migração simulada: ' + novasLinhas.length + ' registros seriam migrados, ' + totalIncompletos + ' incompletos por falta de talaoPMESP.', 'SIMULADO');
  } else if (novasLinhas.length) {
    abaDestino.getRange(abaDestino.getLastRow() + 1, 1, novasLinhas.length, cabDestino.length).setValues(novasLinhas);
    registrarLogMigracao_('migrarLegadoParaCasosTratados_', 'EXECUTADO', '', 'Migração executada: ' + novasLinhas.length + ' registros migrados, ' + totalIncompletos + ' incompletos.', 'EXECUTADO');
  } else {
    registrarLogMigracao_('migrarLegadoParaCasosTratados_', 'ALERTA', '', 'Linhas encontradas, mas nenhum idCaso preenchido.', modoExecucao);
  }

  registrarLogMigracao_(
    'migrarLegadoParaCasosTratados_',
    dryRun ? 'SIMULADO' : 'EXECUTADO',
    '',
    'Resumo migração | origem=' + abaOrigem.getName() +
      '; totalLinhasLidas=' + totalLinhasLidas +
      '; totalLinhasComIdCaso=' + totalLinhasComIdCaso +
      '; totalSemIdCaso=' + totalSemIdCaso +
      '; totalMigrados=' + totalMigrados +
      '; totalIncompletos=' + totalIncompletos +
      '; totalJaExistentes=' + totalJaExistentes +
      '; totalErros=' + totalErros +
      '; modo=' + (dryRun ? 'SIMULADO' : 'EXECUTADO'),
    modoExecucao
  );
}

function obterAbaPorNomeFlexivel_(ss, nomesPossiveis) {
  var planilha = ss || SpreadsheetApp.getActiveSpreadsheet();
  var nomes = (nomesPossiveis || []).map(function (nome) { return limparTexto(nome).toUpperCase(); });
  var abas = planilha.getSheets();
  for (var i = 0; i < abas.length; i += 1) {
    var aba = abas[i];
    var nomeAba = limparTexto(aba.getName()).toUpperCase();
    if (nomes.indexOf(nomeAba) !== -1) return aba;
  }
  for (var j = 0; j < nomesPossiveis.length; j += 1) {
    var candidata = planilha.getSheetByName(nomesPossiveis[j]);
    if (candidata) return candidata;
  }
  return null;
}

function normalizarTextoMigracao_(valor) {
  var texto = limparTexto(valor);
  if (!texto) return '';
  return texto.replace(/\s+/g, ' ');
}

function normalizarSexoGeneroMigracao_(valor) {
  var texto = normalizarTextoMigracao_(valor).toUpperCase();
  if (texto === 'MASCULIMPO' || texto === 'MASCULINO') return 'MASCULINO';
  if (texto === 'FEMININO') return 'FEMININO';
  return texto;
}

function normalizarMeioTransporteMigracao_(valor) {
  var texto = normalizarTextoMigracao_(valor).toUpperCase();
  if (texto === 'N/D' || texto === 'ND') return 'NAO INFORMADO';
  return texto;
}

function normalizarBooleanoOuTextoMigracao_(valor) {
  if (typeof valor === 'boolean') return valor;
  var texto = limparTexto(valor).toUpperCase();
  if (texto === 'TRUE') return true;
  if (texto === 'FALSE') return false;
  return normalizarTextoMigracao_(valor);
}

function normalizarInteiroMigracao_(valor) {
  var numero = Number(valor);
  if (!isNaN(numero) && numero >= 0) return Math.trunc(numero);
  return normalizarTextoMigracao_(valor);
}

function gerarResumoArvoreDecisaoLegado_(texto) {
  var bruto = normalizarTextoMigracao_(texto);
  if (!bruto) return '';
  if (bruto.indexOf('[ÁRVORE DE DECISÃO') !== -1 || bruto.length > 500) {
    return gerarResumoOperacionalLegado_(bruto);
  }
  return gerarResumoOperacionalLegado_(bruto);
}

function validarCasosTratados_() {
  validarContextoExecucaoAutorizada_('validarCasosTratados_');
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var abaCasosTratados = planilha.getSheetByName('CASOS_TRATADOS');
  var abaValidacao = planilha.getSheetByName('VALIDACAO_MIGRACAO') || planilha.insertSheet('VALIDACAO_MIGRACAO');
  garantirCabecalhoSemDuplicidade_(abaValidacao, CABECALHO_VALIDACAO_MIGRACAO, 'VALIDACAO_MIGRACAO', false);

  if (!abaCasosTratados || abaCasosTratados.getLastRow() < 2) {
    registrarLogMigracao_('validarCasosTratados_', 'ALERTA', '', 'Aba CASOS_TRATADOS ausente ou sem dados para validação.');
    registrarLogMigracao_('VALIDACAO_MIGRACAO_EXECUTADA', 'ALERTA', '', 'Validação executada sem dados elegíveis.');
    return;
  }

  var cabecalho = obterCabecalho_(abaCasosTratados);
  var dados = abaCasosTratados.getRange(2, 1, abaCasosTratados.getLastRow() - 1, abaCasosTratados.getLastColumn()).getValues();
  var registrosValidacao = [];
  var dataHora = formatarDataHora(new Date());

  dados.forEach(function (linha) {
    var registro = linhaParaObjeto_(cabecalho, linha);
    var idCaso = limparTexto(registro.idCaso);
    var talaoPMESP = limparTexto(registro.talaoPMESP);

    registrarProblemaValidacao_(registrosValidacao, dataHora, idCaso, talaoPMESP, 'nomeCompletoDesaparecido', limparTexto(registro.nomeCompletoDesaparecido) ? '' : 'nomeCompletoDesaparecido vazio', 'CRITICA');
    registrarProblemaValidacao_(registrosValidacao, dataHora, idCaso, talaoPMESP, 'idade', idadeValidaMigracao_(registro.idade) ? '' : 'idade inválida', 'ALTA');
    registrarProblemaValidacao_(registrosValidacao, dataHora, idCaso, talaoPMESP, 'dataHoraUltimaVisualizacao', dataHoraValidaMigracao_(registro.dataHoraUltimaVisualizacao) ? '' : 'dataHoraUltimaVisualizacao inválida', 'ALTA');
    registrarProblemaValidacao_(registrosValidacao, dataHora, idCaso, talaoPMESP, 'localUltimaVisualizacao', limparTexto(registro.localUltimaVisualizacao) ? '' : 'localUltimaVisualizacao vazio', 'ALTA');
    registrarProblemaValidacao_(registrosValidacao, dataHora, idCaso, talaoPMESP, 'classificacaoRisco', limparTexto(registro.classificacaoRisco) ? '' : 'classificacaoRisco vazio', 'CRITICA');
    registrarProblemaValidacao_(registrosValidacao, dataHora, idCaso, talaoPMESP, 'prioridade', limparTexto(registro.prioridade) ? '' : 'prioridade vazia', 'CRITICA');
    registrarProblemaValidacao_(registrosValidacao, dataHora, idCaso, talaoPMESP, 'observacoesOperacionais', observacaoCurtaMigracao_(registro.observacoesOperacionais) ? 'observacoes muito curtas' : '', 'MEDIA');
  });

  if (registrosValidacao.length) {
    abaValidacao.getRange(abaValidacao.getLastRow() + 1, 1, registrosValidacao.length, CABECALHO_VALIDACAO_MIGRACAO.length).setValues(registrosValidacao);
  }

  registrarLogMigracao_('VALIDACAO_MIGRACAO_EXECUTADA', 'EXECUTADO', '', 'Validação concluída. Problemas identificados: ' + registrosValidacao.length + '.');
}

function registrarProblemaValidacao_(acumulador, dataHora, idCaso, talaoPMESP, campo, problema, severidade) {
  if (!problema) return;
  acumulador.push([
    dataHora,
    idCaso || '',
    talaoPMESP || '',
    campo,
    problema,
    severidade,
    statusValidacaoPorSeveridade_(severidade)
  ]);
}

function statusValidacaoPorSeveridade_(severidade) {
  var nivel = limparTexto(severidade).toUpperCase();
  if (nivel === 'CRITICA') return 'REPROVADO_IMPEDE_USO';
  if (nivel === 'ALTA') return 'REPROVADO_ANALISE_COMPROMETIDA';
  if (nivel === 'MEDIA') return 'APROVADO_COM_RESTRICAO';
  return 'APROVADO';
}

function idadeValidaMigracao_(idade) {
  var numero = Number(idade);
  return !isNaN(numero) && numero >= 0 && numero <= 130;
}

function dataHoraValidaMigracao_(valor) {
  if (valor instanceof Date && !isNaN(valor.getTime())) return true;
  var texto = limparTexto(valor);
  if (!texto) return false;
  var data = new Date(texto);
  return !isNaN(data.getTime());
}

function observacaoCurtaMigracao_(valor) {
  var texto = limparTexto(valor).replace(/\s+/g, ' ');
  return texto.length > 0 && texto.length < 15;
}

function consolidarStatusUsoCasosTratados_() {
  validarContextoExecucaoAutorizada_('consolidarStatusUsoCasosTratados_');
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var abaCasosTratados = planilha.getSheetByName('CASOS_TRATADOS');
  var abaValidacao = planilha.getSheetByName('VALIDACAO_MIGRACAO');

  if (!abaCasosTratados || abaCasosTratados.getLastRow() < 2) {
    registrarLogMigracao_('consolidarStatusUsoCasosTratados_', 'ALERTA', '', 'Aba CASOS_TRATADOS ausente ou sem dados para consolidação.');
    return;
  }

  garantirCabecalhoSemDuplicidade_(abaCasosTratados, COLUNAS_CASOS_TRATADOS, 'CASOS_TRATADOS', false);
  var cabCasos = obterCabecalho_(abaCasosTratados);
  var idxIdCaso = cabCasos.indexOf('idCaso');
  var idxStatusUso = cabCasos.indexOf('statusUso');
  var idxDataHoraConsolidacao = cabCasos.indexOf('dataHoraConsolidacaoUso');
  var idxTalao = cabCasos.indexOf('talaoPMESP');
  if (idxIdCaso === -1 || idxStatusUso === -1 || idxDataHoraConsolidacao === -1) {
    registrarLogMigracao_('consolidarStatusUsoCasosTratados_', 'ERRO', '', 'Colunas obrigatórias ausentes em CASOS_TRATADOS para consolidação.');
    return;
  }

  var severidadePorCaso = {};
  if (abaValidacao && abaValidacao.getLastRow() >= 2) {
    var cabValidacao = obterCabecalho_(abaValidacao);
    var idxValIdCaso = cabValidacao.indexOf('idCaso');
    var idxValSeveridade = cabValidacao.indexOf('severidade');
    if (idxValIdCaso !== -1 && idxValSeveridade !== -1) {
      var dadosValidacao = abaValidacao.getRange(2, 1, abaValidacao.getLastRow() - 1, abaValidacao.getLastColumn()).getValues();
      dadosValidacao.forEach(function (linha) {
        var idCaso = limparTexto(linha[idxValIdCaso]);
        var severidade = limparTexto(linha[idxValSeveridade]).toUpperCase();
        if (!idCaso || !severidade) return;
        severidadePorCaso[idCaso] = severidadeMaisGrave_(severidadePorCaso[idCaso], severidade);
      });
    }
  }

  var dadosCasos = abaCasosTratados.getRange(2, 1, abaCasosTratados.getLastRow() - 1, abaCasosTratados.getLastColumn()).getValues();
  var dataHoraAtual = formatarDataHora(new Date());
  var totalApto = 0;
  var totalRestricao = 0;
  var totalNaoApto = 0;

  dadosCasos.forEach(function (linha, idx) {
    var idCaso = limparTexto(linha[idxIdCaso]);
    if (!idCaso) return;

    var severidade = severidadePorCaso[idCaso] || '';
    var statusUso = statusUsoPorSeveridade_(severidade);
    if (statusUso === 'NAO_APTO') totalNaoApto += 1;
    else if (statusUso === 'APTO_COM_RESTRICAO') totalRestricao += 1;
    else totalApto += 1;

    var linhaPlanilha = idx + 2;
    abaCasosTratados.getRange(linhaPlanilha, idxStatusUso + 1).setValue(statusUso);
    abaCasosTratados.getRange(linhaPlanilha, idxDataHoraConsolidacao + 1).setValue(dataHoraAtual);
  });

  registrarLogMigracao_(
    'STATUS_USO_CONSOLIDADO',
    'EXECUTADO',
    '',
    'Consolidação concluída. totalApto=' + totalApto + '; totalRestricao=' + totalRestricao + '; totalNaoApto=' + totalNaoApto + '.'
  );
}

function severidadeMaisGrave_(atual, candidata) {
  var ordem = { CRITICA: 4, ALTA: 3, MEDIA: 2, BAIXA: 1 };
  var sevAtual = limparTexto(atual).toUpperCase();
  var sevCandidata = limparTexto(candidata).toUpperCase();
  if (!ordem[sevAtual]) return sevCandidata;
  if (!ordem[sevCandidata]) return sevAtual;
  return ordem[sevCandidata] > ordem[sevAtual] ? sevCandidata : sevAtual;
}

function statusUsoPorSeveridade_(severidade) {
  var sev = limparTexto(severidade).toUpperCase();
  if (sev === 'CRITICA') return 'NAO_APTO';
  if (sev === 'ALTA') return 'APTO_COM_RESTRICAO';
  if (sev === 'MEDIA' || sev === 'BAIXA') return 'APTO_COM_OBSERVACAO';
  return 'APTO_PARA_USO';
}
