var COLUNAS_FOTOS_DESAPARECIDOS = [
  'idFoto','idCaso','talaoPMESP','nomeDesaparecido','dataHoraUpload','operadorResponsavel','origemFoto','tipoFoto','nomeArquivo','linkArquivo','fileIdDrive','fotoPrincipal','autorizacaoUsoImagem','restricaoDivulgacao','statusValidacao','nivelAcesso','observacoesFoto'
];

function salvarFotoDesaparecido_(dadosFoto) {
  if (typeof EXECUCAO_AUTORIZADA !== 'undefined' && !EXECUCAO_AUTORIZADA) {
    throw new Error('Execução bloqueada: EXECUCAO_AUTORIZADA=false.');
  }

  var idCaso = limparTexto(dadosFoto && dadosFoto.idCaso);
  var talaoPMESP = limparTexto(dadosFoto && dadosFoto.talaoPMESP);
  if (!idCaso) throw new Error('Upload bloqueado: idCaso obrigatório.');
  if (!talaoPMESP) throw new Error('Upload bloqueado: talaoPMESP obrigatório.');

  var mimeType = limparTexto(dadosFoto && dadosFoto.mimeType) || 'image/jpeg';
  if (mimeType.indexOf('image/') !== 0) throw new Error('Upload bloqueado: mimeType inválido.');

  var bytes = Utilities.base64Decode(limparTexto(dadosFoto && dadosFoto.base64));
  var pastaRaiz = obterOuCriarPasta_('Cabine Verde');
  var pastaFotos = obterOuCriarSubpasta_(pastaRaiz, 'Fotos');
  var pastaCaso = obterOuCriarSubpasta_(pastaFotos, idCaso + '_' + talaoPMESP);

  var timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'America/Sao_Paulo', 'yyyyMMdd_HHmmss');
  var nomeArquivo = idCaso + '_' + talaoPMESP + '_' + timestamp + '.jpg';
  var blob = Utilities.newBlob(bytes, mimeType, nomeArquivo);
  var file = pastaCaso.createFile(blob);
  file.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.VIEW);

  var registro = registrarFotoNaPlanilha_({
    idCaso: idCaso,
    talaoPMESP: talaoPMESP,
    nomeDesaparecido: limparTexto(dadosFoto.nomeDesaparecido),
    operadorResponsavel: limparTexto(dadosFoto.operadorResponsavel),
    origemFoto: limparTexto(dadosFoto.origemFoto),
    tipoFoto: limparTexto(dadosFoto.tipoFoto),
    nomeArquivo: nomeArquivo,
    linkArquivo: file.getUrl(),
    fileIdDrive: file.getId(),
    autorizacaoUsoImagem: !!dadosFoto.autorizacaoUsoImagem,
    fotoPrincipalSolicitada: !!dadosFoto.fotoPrincipal,
    nivelAcesso: limparTexto(dadosFoto.nivelAcesso) || 'INTERNO',
    observacoesFoto: limparTexto(dadosFoto.observacoesFoto)
  });

  atualizarResumoFotosNoCaso_(idCaso, file.getUrl());
  registrarEventoOcorrencia(SpreadsheetApp.getActiveSpreadsheet(), idCaso, 'FOTO_ANEXADA', 'Foto anexada ao caso: ' + nomeArquivo);
  registrarLogMigracaoSeNecessario_('FOTO_ANEXADA', idCaso, 'Upload de foto no Drive com metadados na planilha.');

  return { idFoto: registro.idFoto, fileIdDrive: file.getId(), linkArquivo: file.getUrl() };
}

function obterOuCriarPasta_(nome) {
  var it = DriveApp.getFoldersByName(nome);
  return it.hasNext() ? it.next() : DriveApp.createFolder(nome);
}

function obterOuCriarSubpasta_(parent, nome) {
  var it = parent.getFoldersByName(nome);
  return it.hasNext() ? it.next() : parent.createFolder(nome);
}

function registrarFotoNaPlanilha_(dados) {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var aba = garantirAbaComCabecalho(planilha, 'FOTOS_DESAPARECIDOS', COLUNAS_FOTOS_DESAPARECIDOS);
  var colunas = garantirColunasDaEstrutura(aba, COLUNAS_FOTOS_DESAPARECIDOS);
  var totalFotosCaso = contarFotosDoCaso_(dados.idCaso);
  var fotoPrincipal = dados.fotoPrincipalSolicitada || totalFotosCaso === 0;
  var idFoto = 'FOTO-' + new Date().getTime();
  var linha = {
    idFoto: idFoto,
    idCaso: dados.idCaso,
    talaoPMESP: dados.talaoPMESP,
    nomeDesaparecido: dados.nomeDesaparecido,
    dataHoraUpload: formatarDataHora(new Date()),
    operadorResponsavel: dados.operadorResponsavel,
    origemFoto: dados.origemFoto,
    tipoFoto: dados.tipoFoto,
    nomeArquivo: dados.nomeArquivo,
    linkArquivo: dados.linkArquivo,
    fileIdDrive: dados.fileIdDrive,
    fotoPrincipal: fotoPrincipal,
    autorizacaoUsoImagem: dados.autorizacaoUsoImagem,
    restricaoDivulgacao: !dados.autorizacaoUsoImagem,
    statusValidacao: 'Pendente',
    nivelAcesso: dados.nivelAcesso || 'INTERNO',
    observacoesFoto: dados.observacoesFoto
  };
  aba.appendRow(colunas.map(function (col) { return normalizarValorPlanilha(linha[col]); }));
  return { idFoto: idFoto };
}

function atualizarResumoFotosNoCaso_(idCaso, linkFoto) {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var abaCasos = garantirAbaComCabecalho(planilha, 'CASOS', COLUNAS_CASOS);
  var cabecalho = garantirColunasDaEstrutura(abaCasos, COLUNAS_CASOS.concat(['quantidadeFotos', 'fotoPrincipalLink', 'statusFotos']));
  var linhaCaso = localizarCasoPorIdCaso(abaCasos, idCaso, cabecalho);
  if (linhaCaso < 2) return;

  var total = contarFotosDoCaso_(idCaso);
  var statusFotos = existeFotoValidada_(idCaso) ? 'Validada' : 'Pendente de validação';
  var indiceFotoDisponivel = cabecalho.indexOf('fotoDisponivel');
  var indiceQuantidade = cabecalho.indexOf('quantidadeFotos');
  var indicePrincipal = cabecalho.indexOf('fotoPrincipalLink');
  var indiceStatus = cabecalho.indexOf('statusFotos');

  if (indiceFotoDisponivel >= 0) abaCasos.getRange(linhaCaso, indiceFotoDisponivel + 1).setValue('Sim');
  if (indiceQuantidade >= 0) abaCasos.getRange(linhaCaso, indiceQuantidade + 1).setValue(total);
  if (indicePrincipal >= 0) abaCasos.getRange(linhaCaso, indicePrincipal + 1).setValue(obterLinkFotoPrincipal_(idCaso) || linkFoto || '');
  if (indiceStatus >= 0) abaCasos.getRange(linhaCaso, indiceStatus + 1).setValue(statusFotos);
}

function contarFotosDoCaso_(idCaso) {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var aba = planilha.getSheetByName('FOTOS_DESAPARECIDOS');
  if (!aba || aba.getLastRow() < 2) return 0;
  var cab = aba.getRange(1, 1, 1, aba.getLastColumn()).getValues()[0].map(limparTexto);
  var idx = cab.indexOf('idCaso');
  if (idx < 0) return 0;
  var valores = aba.getRange(2, idx + 1, aba.getLastRow() - 1, 1).getValues();
  return valores.filter(function (row) { return limparTexto(row[0]) === limparTexto(idCaso); }).length;
}

function existeFotoValidada_(idCaso) {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var aba = planilha.getSheetByName('FOTOS_DESAPARECIDOS');
  if (!aba || aba.getLastRow() < 2) return false;
  var cab = aba.getRange(1, 1, 1, aba.getLastColumn()).getValues()[0].map(limparTexto);
  var idxCaso = cab.indexOf('idCaso');
  var idxStatus = cab.indexOf('statusValidacao');
  if (idxCaso < 0 || idxStatus < 0) return false;
  var dados = aba.getRange(2, 1, aba.getLastRow() - 1, aba.getLastColumn()).getValues();
  return dados.some(function (row) { return limparTexto(row[idxCaso]) === limparTexto(idCaso) && limparTexto(row[idxStatus]) === 'Validada'; });
}

function obterLinkFotoPrincipal_(idCaso) {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var aba = planilha.getSheetByName('FOTOS_DESAPARECIDOS');
  if (!aba || aba.getLastRow() < 2) return '';
  var cab = aba.getRange(1, 1, 1, aba.getLastColumn()).getValues()[0].map(limparTexto);
  var idxCaso = cab.indexOf('idCaso');
  var idxPrincipal = cab.indexOf('fotoPrincipal');
  var idxLink = cab.indexOf('linkArquivo');
  if (idxCaso < 0 || idxPrincipal < 0 || idxLink < 0) return '';
  var dados = aba.getRange(2, 1, aba.getLastRow() - 1, aba.getLastColumn()).getValues();
  for (var i = 0; i < dados.length; i += 1) {
    if (limparTexto(dados[i][idxCaso]) === limparTexto(idCaso) && limparTexto(dados[i][idxPrincipal]) === 'Sim') return limparTexto(dados[i][idxLink]);
  }
  return '';
}

function registrarLogMigracaoSeNecessario_(etapa, idCaso, mensagem) {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var aba = planilha.getSheetByName('LOG_MIGRACAO');
  if (!aba) return;
  aba.appendRow([formatarDataHora(new Date()), etapa, 'EXECUTADO', idCaso, mensagem]);
}

function validarPermissaoFoto_(operador, nivelAcesso) {
  var operadorLimpo = limparTexto(operador).toLowerCase();
  if (!operadorLimpo) return { permitido: false, motivo: 'Operador ausente.' };
  var nivel = limparTexto(nivelAcesso || 'INTERNO').toUpperCase();
  if (nivel === 'SIGILOSO' && operadorLimpo.indexOf('supervisor') === -1) return { permitido: false, motivo: 'Acesso SIGILOSO exige supervisor.' };
  if (nivel === 'RESTRITO' && operadorLimpo.indexOf('autorizado') === -1 && operadorLimpo.indexOf('supervisor') === -1) return { permitido: false, motivo: 'Acesso RESTRITO exige operador autorizado.' };
  return { permitido: true, motivo: 'PERMITIDO' };
}

function visualizarFotoDesaparecido_(idFoto, operador, justificativa) {
  if (typeof EXECUCAO_AUTORIZADA !== 'undefined' && !EXECUCAO_AUTORIZADA) {
    throw new Error('Execução bloqueada: EXECUCAO_AUTORIZADA=false.');
  }
  var idFotoLimpo = limparTexto(idFoto);
  var operadorLimpo = limparTexto(operador);
  var justificativaLimpa = limparTexto(justificativa);
  if (!idFotoLimpo) throw new Error('idFoto obrigatório.');
  if (!operadorLimpo) throw new Error('operador obrigatório.');

  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var aba = garantirAbaComCabecalho(planilha, 'FOTOS_DESAPARECIDOS', COLUNAS_FOTOS_DESAPARECIDOS);
  var cab = garantirColunasDaEstrutura(aba, COLUNAS_FOTOS_DESAPARECIDOS);
  var idxIdFoto = cab.indexOf('idFoto');
  var idxIdCaso = cab.indexOf('idCaso');
  var idxFileId = cab.indexOf('fileIdDrive');
  var idxNivel = cab.indexOf('nivelAcesso');
  var dados = aba.getRange(2, 1, Math.max(aba.getLastRow() - 1, 0), aba.getLastColumn()).getValues();
  var alvo = null;
  for (var i = 0; i < dados.length; i += 1) {
    if (limparTexto(dados[i][idxIdFoto]) === idFotoLimpo) { alvo = dados[i]; break; }
  }
  if (!alvo) throw new Error('Foto não encontrada para o idFoto informado.');

  var permissao = validarPermissaoFoto_(operadorLimpo, idxNivel >= 0 ? alvo[idxNivel] : 'INTERNO');
  var nivelAcesso = limparTexto(idxNivel >= 0 ? alvo[idxNivel] : 'INTERNO').toUpperCase() || 'INTERNO';
  var justificativaObrigatoria = nivelAcesso === 'RESTRITO' || nivelAcesso === 'SIGILOSO';
  if (justificativaObrigatoria && !justificativaLimpa) {
    registrarLogAcessoFoto_(idFotoLimpo, operadorLimpo, 'VISUALIZAR_FOTO', 'BLOQUEADO', 'Justificativa obrigatória ausente.');
    throw new Error('Acesso bloqueado: justificativa obrigatória para nível ' + nivelAcesso + '.');
  }
  registrarLogAcessoFoto_(idFotoLimpo, operadorLimpo, 'VISUALIZAR_FOTO', permissao.permitido ? 'PERMITIDO' : 'BLOQUEADO', justificativaLimpa);
  if (!permissao.permitido) throw new Error('Acesso bloqueado: ' + permissao.motivo);

  var idCaso = limparTexto(alvo[idxIdCaso]);
  registrarEventoOcorrencia(planilha, idCaso, 'FOTO_VISUALIZADA', 'Operador=' + operadorLimpo + '; idFoto=' + idFotoLimpo + '; nivelAcesso=' + nivelAcesso + '; justificativa=' + (justificativaLimpa || 'N/A'));
  var fileId = limparTexto(alvo[idxFileId]);
  var file = DriveApp.getFileById(fileId);
  file.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.VIEW);
  var blob = file.getBlob();
  return {
    idFoto: idFotoLimpo,
    idCaso: idCaso,
    mimeType: blob.getContentType(),
    conteudoBase64: Utilities.base64Encode(blob.getBytes())
  };
}

function registrarLogAcessoFoto_(idFoto, operador, acao, resultado, justificativa) {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var aba = garantirAbaComCabecalho(planilha, 'LOG_ACESSO_FOTOS', ['dataHora', 'idFoto', 'operador', 'acao', 'resultado', 'justificativa']);
  aba.appendRow([formatarDataHora(new Date()), idFoto, operador, acao, resultado, limparTexto(justificativa)]);
}
