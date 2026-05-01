var ABAS_OBRIGATORIAS_CABINE_VERDE = [
  'CASOS',
  'TRIAGEM_RESPOSTAS',
  'EVENTOS_OCORRENCIA',
  'INDICADORES_OPERACIONAIS',
  'LOG_MIGRACAO',
  'LEGADO_OBSERVACOES_BRUTAS'
];

var CABECALHO_LOG_MIGRACAO = [
  'dataHora',
  'funcaoExecutada',
  'status',
  'modoExecucao',
  'backupConfirmado',
  'idCaso',
  'mensagem',
  'usuario'
];

var CABECALHO_LEGADO_OBSERVACOES_BRUTAS = [
  'dataHora',
  'idCaso',
  'linhaOrigem',
  'hashConteudo',
  'conteudoBruto',
  'operador'
];

var COLUNAS_CASOS_OBRIGATORIAS_MIGRACAO = COLUNAS_CASOS.concat(['statusMigracao']);

var MAPEAMENTO_COLUNAS_LEGADO = {
  idCaso: ['idCaso', 'id', 'codigoCaso'],
  talaoPMESP: ['talaoPMESP', 'talaoBopm', 'talaoBOPM', 'talão', 'talao', 'numeroTalao'],
  statusCaso: ['statusCaso', 'status'],
  observacoesOperacionais: ['observacoesOperacionais', 'observacoes', 'observacao', 'obsOperacional']
};
var DRY_RUN_MIGRACAO = true;

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Cabine Verde')
    .addItem('1. Fazer backup da planilha', 'fazerBackupPlanilha_')
    .addItem('2. Ajustar estrutura automaticamente', 'ajustarEstruturaPlanilha_')
    .addItem('3. Migrar dados legados', 'migrarDadosLegados_')
    .addItem('4. Validar integridade', 'validarIntegridadeMigracao_')
    .addItem('5. Rodar rotina completa segura', 'rodarRotinaCompletaSegura_')
    .addItem('6. Restaurar último backup', 'restaurarBackupMaisRecente_')
    .addToUi();
}

function rodarRotinaCompletaSegura_() {
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

function registrarLogMigracao_(funcaoExecutada, status, idCaso, mensagem, modoExecucao, backupConfirmado) {
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
    Session.getActiveUser().getEmail() || 'sistema'
  ]);
}

function obterEstruturaAbas_() {
  return {
    CASOS: COLUNAS_CASOS_OBRIGATORIAS_MIGRACAO,
    TRIAGEM_RESPOSTAS: COLUNAS_TRIAGEM_RESPOSTAS,
    EVENTOS_OCORRENCIA: COLUNAS_EVENTOS_OCORRENCIA,
    INDICADORES_OPERACIONAIS: COLUNAS_INDICADORES_OPERACIONAIS,
    LOG_MIGRACAO: CABECALHO_LOG_MIGRACAO,
    LEGADO_OBSERVACOES_BRUTAS: CABECALHO_LEGADO_OBSERVACOES_BRUTAS
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
