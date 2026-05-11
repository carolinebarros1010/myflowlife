
function obterOperadorPorEmail_(email) {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var abaOperadores = garantirAbaComCabecalho(planilha, 'OPERADORES', ESTRUTURA_PLANILHA.OPERADORES);
  var cabecalho = garantirColunasDaEstrutura(abaOperadores, ESTRUTURA_PLANILHA.OPERADORES).map(limparTexto);
  var idxEmail = cabecalho.indexOf('email');
  var idxPerfil = cabecalho.indexOf('perfil');
  if (idxEmail < 0 || idxPerfil < 0) return null;
  var alvo = limparTexto(email).toLowerCase();
  var dados = abaOperadores.getRange(2, 1, Math.max(abaOperadores.getLastRow() - 1, 0), abaOperadores.getLastColumn()).getValues();
  for (var i = 0; i < dados.length; i += 1) {
    if (limparTexto(dados[i][idxEmail]).toLowerCase() === alvo) {
      return { email: alvo, perfil: limparTexto(dados[i][idxPerfil]) };
    }
  }
  return null;
}

var COLUNAS_FOTOS_DESAPARECIDOS = [
  'idFoto','idCaso','talaoPMESP','nomeDesaparecido','dataHoraUpload','operadorResponsavel','origemFoto','tipoFoto','nomeArquivo','linkArquivo','fileIdDrive','fotoPrincipal','autorizacaoUsoImagem','restricaoDivulgacao','statusValidacao','nivelAcesso','observacoesFoto'
];

function salvarFotoDesaparecido_(dadosFoto) {
  if (typeof EXECUCAO_AUTORIZADA !== 'undefined' && !EXECUCAO_AUTORIZADA) {
    throw new Error('Execução bloqueada: EXECUCAO_AUTORIZADA=false.');
  }

  var idCaso = limparTexto(dadosFoto && dadosFoto.idCaso);
  var talaoPMESP = limparTexto(dadosFoto && dadosFoto.talaoPMESP);
  if (!idCaso || idCaso.indexOf('CV-') === 0) throw new Error('Upload bloqueado: idCaso temporário inválido.');
  if (!talaoPMESP) throw new Error('Upload bloqueado: talaoPMESP obrigatório.');

  var mimeType = limparTexto(dadosFoto && dadosFoto.mimeType) || 'image/jpeg';
  if (mimeType.indexOf('image/') !== 0) throw new Error('Upload bloqueado: mimeType inválido.');

  var bytes = Utilities.base64Decode(limparTexto(dadosFoto && dadosFoto.base64));
  var pastaRaiz = obterOuCriarPasta_('Cabine Verde');
  var pastaFotos = obterOuCriarSubpasta_(pastaRaiz, 'Fotos');
  var pastaCaso = obterOuCriarSubpasta_(pastaFotos, idCaso + '_' + talaoPMESP);

  var timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'America/Sao_Paulo', 'yyyyMMdd_HHmmss');
  var nomeArquivo = 'TEMP_' + idCaso + '_' + timestamp + '.jpg';
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

  return { idFoto: registro.idFoto, fileIdDrive: file.getId(), linkArquivo: file.getUrl(), nomeArquivo: nomeArquivo };
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
  var colunasCasos = obterSchemaCabineVerdeUnificado_().CASOS;
  var abaCasos = garantirAbaComCabecalho(planilha, 'CASOS', colunasCasos);
  var cabecalho = garantirColunasDaEstrutura(abaCasos, colunasCasos.concat(['quantidadeFotos', 'fotoPrincipalLink', 'statusFotos']));
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


function localizarFotoPorId_(idFoto) {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var aba = garantirAbaComCabecalho(planilha, 'FOTOS_DESAPARECIDOS', COLUNAS_FOTOS_DESAPARECIDOS);
  var cabecalho = garantirColunasDaEstrutura(aba, COLUNAS_FOTOS_DESAPARECIDOS);
  var idxIdFoto = cabecalho.indexOf('idFoto');
  var dados = aba.getRange(2, 1, Math.max(aba.getLastRow() - 1, 0), aba.getLastColumn()).getValues();
  for (var i = 0; i < dados.length; i += 1) {
    if (limparTexto(dados[i][idxIdFoto]) === limparTexto(idFoto)) {
      return { aba: aba, cabecalho: cabecalho, linha: i + 2, valores: dados[i] };
    }
  }
  return null;
}

function validarFotoDesaparecido_(idFoto, operador, status) {
  var statusNormalizado = limparTexto(status).toUpperCase();
  if (['VALIDADA', 'REJEITADA'].indexOf(statusNormalizado) === -1) throw new Error('Status inválido. Use VALIDADA ou REJEITADA.');

  var permissao = validarPermissaoAcao_({ email: limparTexto(operador && operador.email), perfil: limparTexto(operador && operador.perfil) }, 'VALIDAR_REJEITAR_FOTO');
  if (!permissao.permitido) throw new Error('Apenas SUPERVISOR/ADMIN pode validar foto.');

  var foto = localizarFotoPorId_(idFoto);
  if (!foto) throw new Error('Foto não encontrada para validação.');

  var idxStatus = foto.cabecalho.indexOf('statusValidacao');
  var idxIdCaso = foto.cabecalho.indexOf('idCaso');
  if (idxStatus < 0) throw new Error('Coluna statusValidacao não encontrada.');
  foto.aba.getRange(foto.linha, idxStatus + 1).setValue(statusNormalizado === 'VALIDADA' ? 'Validada' : 'Rejeitada');

  var idCaso = limparTexto(foto.valores[idxIdCaso]);
  atualizarResumoFotosNoCaso_(idCaso);
  registrarEventoOcorrencia(SpreadsheetApp.getActiveSpreadsheet(), idCaso, statusNormalizado === 'VALIDADA' ? 'FOTO_VALIDADA' : 'FOTO_REJEITADA', 'idFoto=' + limparTexto(idFoto) + '; operador=' + (permissao.email || limparTexto(operador && operador.email)));
  return { ok: true, idFoto: limparTexto(idFoto), statusValidacao: statusNormalizado };
}

function verificarUsoExcessivoFoto_(idFoto, operador) {
  var janelaMinutos = 10;
  var limiteAcessos = 5;
  var bloqueioMinutos = 15;
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var aba = garantirAbaComCabecalho(planilha, 'LOG_ACESSO_FOTOS', ['dataHora', 'idFoto', 'operador', 'perfilOperador', 'acao', 'resultado', 'motivoAcessoFoto', 'justificativa', 'justificativaValidada']);
  var ultimaLinha = aba.getLastRow();
  if (ultimaLinha < 2) return { excedeu: false, acessosNoPeriodo: 0, limiteAcessos: limiteAcessos, janelaMinutos: janelaMinutos };

  var agora = new Date();
  var limiteMs = janelaMinutos * 60 * 1000;
  var dados = aba.getRange(2, 1, ultimaLinha - 1, aba.getLastColumn()).getValues();
  var idFotoLimpo = limparTexto(idFoto);
  var operadorLimpo = limparTexto(operador).toLowerCase();
  var bloqueio = consultarBloqueioFoto_(operadorLimpo, idFotoLimpo);
  if (bloqueio.bloqueado) {
    return {
      excedeu: true,
      bloqueado: true,
      ate: bloqueio.ate,
      motivo: 'BLOQUEIO_TEMPORARIO_FOTO',
      limiteAcessos: limiteAcessos,
      janelaMinutos: janelaMinutos,
      bloqueioMinutos: bloqueioMinutos
    };
  }
  var total = 0;

  for (var i = 0; i < dados.length; i += 1) {
    var ts = new Date(dados[i][0]);
    var idLinha = limparTexto(dados[i][1]);
    var operadorLinha = limparTexto(dados[i][2]).toLowerCase();
    if (!idLinha || (agora.getTime() - ts.getTime()) > limiteMs) continue;
    if (idLinha === idFotoLimpo && operadorLinha === operadorLimpo) total += 1;
  }

  if (total > limiteAcessos) {
    var foto = localizarFotoPorId_(idFotoLimpo);
    var idCaso = foto ? limparTexto(foto.valores[foto.cabecalho.indexOf('idCaso')]) : '';
    registrarEventoOcorrencia(planilha, idCaso, 'USO_EXCESSIVO_FOTO', 'idFoto=' + idFotoLimpo + '; operador=' + operadorLimpo + '; acessos=' + total + '; limite=' + limiteAcessos + '; janelaMinutos=' + janelaMinutos);
    registrarBloqueioTemporarioFoto_(idFotoLimpo, operadorLimpo, bloqueioMinutos);
    return { excedeu: true, bloqueado: true, acessosNoPeriodo: total, limiteAcessos: limiteAcessos, janelaMinutos: janelaMinutos, bloqueioMinutos: bloqueioMinutos };
  }

  return { excedeu: false, acessosNoPeriodo: total, limiteAcessos: limiteAcessos, janelaMinutos: janelaMinutos };
}

function registrarBloqueioTemporarioFoto_(idFoto, operador, bloqueioMinutos) {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var aba = garantirAbaComCabecalho(planilha, 'BLOQUEIOS_FOTO', ['dataHoraInicio', 'dataHoraFim', 'idFoto', 'operador', 'ativo', 'motivo']);
  var inicio = new Date();
  var fim = new Date(inicio.getTime() + (bloqueioMinutos * 60 * 1000));
  aba.appendRow([formatarDataHora(inicio), formatarDataHora(fim), idFoto, operador, 'TRUE', 'BLOQUEIO_TEMPORARIO_FOTO']);
  var foto = localizarFotoPorId_(idFoto);
  var idCaso = foto ? limparTexto(foto.valores[foto.cabecalho.indexOf('idCaso')]) : '';
  registrarEventoOcorrencia(planilha, idCaso, 'BLOQUEIO_TEMPORARIO_FOTO', 'idFoto=' + idFoto + '; operador=' + operador + '; bloqueioMinutos=' + bloqueioMinutos + '; ate=' + formatarDataHora(fim));
}

function consultarBloqueioFoto_(operador, idFoto) {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var aba = planilha.getSheetByName('BLOQUEIOS_FOTO');
  if (!aba || aba.getLastRow() < 2) return { bloqueado: false };
  var dados = aba.getRange(2, 1, aba.getLastRow() - 1, aba.getLastColumn()).getValues();
  var agora = new Date();
  var operadorLimpo = limparTexto(operador).toLowerCase();
  var idFotoLimpo = limparTexto(idFoto);
  for (var i = dados.length - 1; i >= 0; i -= 1) {
    var fim = new Date(dados[i][1]);
    var idFotoLinha = limparTexto(dados[i][2]);
    var operadorLinha = limparTexto(dados[i][3]).toLowerCase();
    var ativo = limparTexto(dados[i][4]).toUpperCase();
    if (idFotoLinha !== idFotoLimpo || operadorLinha !== operadorLimpo || ativo !== 'TRUE') continue;
    if (fim.getTime() >= agora.getTime()) {
      return { bloqueado: true, ate: formatarDataHora(fim) };
    }
  }
  return { bloqueado: false };
}

function registrarLogMigracaoSeNecessario_(etapa, idCaso, mensagem) {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var aba = planilha.getSheetByName('LOG_MIGRACAO');
  if (!aba) return;
  aba.appendRow([formatarDataHora(new Date()), etapa, 'EXECUTADO', idCaso, mensagem]);
}

function validarPermissaoFoto_(operador, nivelAcesso) {
  var emailOperador = limparTexto(operador).toLowerCase();
  if (!emailOperador) return { permitido: false, motivo: 'Operador ausente.' };
  var cadastro = obterOperadorPorEmail_(emailOperador);
  if (!cadastro) return { permitido: false, motivo: 'Operador não cadastrado na aba OPERADORES.' };
  var perfilCheck = validarPerfilOperador_(cadastro, PERFIS_OPERADOR_VALIDOS);
  if (!perfilCheck.permitido) return { permitido: false, motivo: perfilCheck.motivo, perfil: perfilCheck.perfil };

  var nivel = limparTexto(nivelAcesso || 'INTERNO').toUpperCase();
  if (nivel === 'INTERNO') return validarPermissaoAcao_(cadastro, 'VISUALIZAR_FOTO_INTERNO');
  if (nivel === 'RESTRITO' || nivel === 'SIGILOSO') return validarPermissaoAcao_(cadastro, 'VISUALIZAR_FOTO_RESTRITO_SIGILOSO');
  return { permitido: false, motivo: 'Nível de acesso inválido para foto: ' + nivel };
}

function validarJustificativa_(justificativa) {
  var original = limparTexto(justificativa);
  var normalizada = original.replace(/\s+/g, ' ').trim();
  var validacao = normalizada.toLowerCase();
  var bloqueadas = ['ok', 'teste', '-', 'ver', 'foto', 'visualizar'];
  var apenasNumeros = /^\d+$/;
  var temPalavraMinima = validacao.split(' ').some(function (parte) { return limparTexto(parte).length > 3; });

  var valida = true;
  if (!normalizada || normalizada.length < 10) valida = false;
  if (bloqueadas.indexOf(validacao) !== -1) valida = false;
  if (apenasNumeros.test(validacao)) valida = false;
  if (!temPalavraMinima) valida = false;

  return {
    original: original,
    normalizada: normalizada,
    valida: valida
  };
}

var MOTIVOS_ACESSO_FOTO_VALIDOS = [
  'ATENDIMENTO_EM_ANDAMENTO',
  'VALIDACAO_IDENTIDADE',
  'SOLICITACAO_SUPERVISOR',
  'APOIO_EQUIPE_CAMPO',
  'AUDITORIA',
  'OUTRO'
];

function validarMotivoAcessoFoto_(motivo) {
  var motivoNormalizado = limparTexto(motivo).toUpperCase();
  var valido = MOTIVOS_ACESSO_FOTO_VALIDOS.indexOf(motivoNormalizado) !== -1;
  return {
    original: limparTexto(motivo),
    normalizado: motivoNormalizado,
    valido: valido
  };
}

function visualizarFotoDesaparecido_(idFoto, operador, justificativa, motivoAcessoFoto) {
  if (typeof EXECUCAO_AUTORIZADA !== 'undefined' && !EXECUCAO_AUTORIZADA) {
    throw new Error('Execução bloqueada: EXECUCAO_AUTORIZADA=false.');
  }
  var idFotoLimpo = limparTexto(idFoto);
  var operadorLimpo = limparTexto(operador);
  var justificativaAnalise = validarJustificativa_(justificativa);
  var motivoAnalise = validarMotivoAcessoFoto_(motivoAcessoFoto);
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
  var motivoObrigatorio = justificativaObrigatoria;
  var perfilOperador = limparTexto(permissao.perfil || 'N/A');

  if (motivoObrigatorio && !motivoAnalise.original) {
    registrarLogAcessoFoto_(idFotoLimpo, operadorLimpo, 'VISUALIZAR_FOTO', 'BLOQUEADO', motivoAnalise.original, justificativaAnalise.original, false, perfilOperador);
    throw new Error('Motivo de acesso inválido. Selecione uma opção válida.');
  }
  if (motivoAnalise.original && !motivoAnalise.valido) {
    registrarLogAcessoFoto_(idFotoLimpo, operadorLimpo, 'VISUALIZAR_FOTO', 'BLOQUEADO', motivoAnalise.original, justificativaAnalise.original, false, perfilOperador);
    throw new Error('Motivo de acesso inválido. Selecione uma opção válida.');
  }
  if (justificativaObrigatoria && !justificativaAnalise.valida) {
    registrarLogAcessoFoto_(idFotoLimpo, operadorLimpo, 'VISUALIZAR_FOTO', 'BLOQUEADO', motivoAnalise.normalizado, justificativaAnalise.original, false, perfilOperador);
    throw new Error('Justificativa inválida. Descreva o motivo da visualização.');
  }
  registrarLogAcessoFoto_(idFotoLimpo, operadorLimpo, 'VISUALIZAR_FOTO', permissao.permitido ? 'PERMITIDO' : 'BLOQUEADO', motivoAnalise.normalizado, justificativaAnalise.original, justificativaAnalise.valida, perfilOperador);
  if (!permissao.permitido) {
    registrarLogAcessoOperador_(planilha, 'ACESSO_NEGADO', 'SEM_PERMISSAO_FOTO', 'Visualização bloqueada para foto=' + idFotoLimpo + '; motivo=' + permissao.motivo, operadorLimpo);
    throw new Error('Acesso bloqueado: ' + permissao.motivo);
  }
  var riscoUso = verificarUsoExcessivoFoto_(idFotoLimpo, operadorLimpo);
  if (riscoUso.bloqueado) {
    registrarLogAcessoFoto_(idFotoLimpo, operadorLimpo, 'VISUALIZAR_FOTO', 'BLOQUEADO', motivoAnalise.normalizado, justificativaAnalise.original, justificativaAnalise.valida, perfilOperador);
    throw new Error('Visualização temporariamente bloqueada até ' + riscoUso.ate + '.');
  }

  var idCaso = limparTexto(alvo[idxIdCaso]);
  registrarEventoOcorrencia(planilha, idCaso, 'FOTO_VISUALIZADA', 'Operador=' + operadorLimpo + '; perfilOperador=' + (perfilOperador || 'N/A') + '; idFoto=' + idFotoLimpo + '; nivelAcesso=' + nivelAcesso + '; motivoAcessoFoto=' + (motivoAnalise.normalizado || 'N/A') + '; justificativa=' + (justificativaAnalise.original || 'N/A') + '; justificativaValida=' + (justificativaAnalise.valida ? 'TRUE' : 'FALSE'));
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

function registrarLogAcessoFoto_(idFoto, operador, acao, resultado, motivoAcessoFoto, justificativaOriginal, justificativaValidada, perfilOperador) {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var aba = garantirAbaComCabecalho(planilha, 'LOG_ACESSO_FOTOS', ['dataHora', 'idFoto', 'operador', 'perfilOperador', 'acao', 'resultado', 'motivoAcessoFoto', 'justificativa', 'justificativaValidada']);
  aba.appendRow([formatarDataHora(new Date()), idFoto, operador, limparTexto(perfilOperador), acao, resultado, limparTexto(motivoAcessoFoto), limparTexto(justificativaOriginal), justificativaValidada ? 'TRUE' : 'FALSE']);
}


function localizarRegistroFotoPrincipalPorCaso_(idCaso) {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var aba = planilha.getSheetByName('FOTOS_DESAPARECIDOS');
  if (!aba || aba.getLastRow() < 2) return null;
  var cab = aba.getRange(1, 1, 1, aba.getLastColumn()).getValues()[0].map(limparTexto);
  var idxIdCaso = cab.indexOf('idCaso');
  var idxPrincipal = cab.indexOf('fotoPrincipal');
  var idxFile = cab.indexOf('fileIdDrive');
  var idxLink = cab.indexOf('linkArquivo');
  var idxNome = cab.indexOf('nomeArquivo');
  if (idxIdCaso < 0 || idxPrincipal < 0) return null;
  var dados = aba.getRange(2, 1, aba.getLastRow() - 1, aba.getLastColumn()).getValues();
  for (var i = dados.length - 1; i >= 0; i -= 1) {
    if (limparTexto(dados[i][idxIdCaso]) !== limparTexto(idCaso)) continue;
    if (limparTexto(dados[i][idxPrincipal]) === 'Sim') {
      return { aba: aba, cabecalho: cab, linha: i + 2, fileIdDrive: limparTexto(dados[i][idxFile]), linkArquivo: limparTexto(dados[i][idxLink]), nomeArquivo: limparTexto(dados[i][idxNome]) };
    }
  }
  return null;
}

function excluirFotoDrivePorUrlOuFileId_(urlFoto, fileIdDrive, idCaso, motivo) {
  var file = null;
  var fileId = limparTexto(fileIdDrive);
  if (!fileId && urlFoto) {
    var match = String(urlFoto).match(/[\/\?]d\/([^\/\?]+)/);
    if (match && match[1]) fileId = match[1];
  }
  if (!fileId) return false;
  try {
    file = DriveApp.getFileById(fileId);
    file.setTrashed(true);
    registrarEventoOcorrencia(SpreadsheetApp.getActiveSpreadsheet(), limparTexto(idCaso), 'FOTO_EXCLUIDA', 'fileId=' + fileId + '; motivo=' + limparTexto(motivo));
    registrarLogMigracaoSeNecessario_('FOTO_EXCLUIDA', limparTexto(idCaso), 'Arquivo movido para lixeira: ' + fileId + '; motivo=' + limparTexto(motivo));
    return true;
  } catch (e) {
    registrarLogMigracaoSeNecessario_('FOTO_EXCLUSAO_FALHA', limparTexto(idCaso), 'Falha ao excluir fileId=' + fileId + '; erro=' + e);
    return false;
  }
}

function consolidarFotoCaso_(idCaso, urlFoto) {
  var idCasoLimpo = limparTexto(idCaso);
  var urlLimpa = limparTexto(urlFoto);
  if (!idCasoLimpo || !urlLimpa) return { ok: false, motivo: 'idCaso/urlFoto ausentes' };

  var atual = localizarRegistroFotoPrincipalPorCaso_(idCasoLimpo);
  if (!atual) return { ok: false, motivo: 'foto principal não localizada' };

  if (atual.linkArquivo !== urlLimpa) {
    excluirFotoDrivePorUrlOuFileId_(atual.linkArquivo, atual.fileIdDrive, idCasoLimpo, 'SUBSTITUICAO_FOTO');
  }

  try {
    var file = DriveApp.getFileById(atual.fileIdDrive);
    var extensao = file.getName().indexOf('.') > -1 ? file.getName().split('.').pop() : 'jpg';
    var nomeDefinitivo = 'FOTO_' + idCasoLimpo + '.' + extensao;
    file.setName(nomeDefinitivo);
    registrarEventoOcorrencia(SpreadsheetApp.getActiveSpreadsheet(), idCasoLimpo, 'FOTO_FINALIZADA', 'Foto consolidada: ' + nomeDefinitivo);
    registrarLogMigracaoSeNecessario_('FOTO_FINALIZADA', idCasoLimpo, 'Arquivo renomeado para definitivo: ' + nomeDefinitivo);
  } catch (e) {
    return { ok: false, motivo: 'falha ao renomear arquivo: ' + e };
  }
  return { ok: true };
}

function limparFotosTemporarias_() {
  var pastaRaiz = obterOuCriarPasta_('Cabine Verde');
  var pastaFotos = obterOuCriarSubpasta_(pastaRaiz, 'Fotos');
  var limiteMs = 2 * 60 * 60 * 1000;
  var agora = new Date().getTime();
  var apagadas = 0;
  var pastas = pastaFotos.getFolders();
  while (pastas.hasNext()) {
    var pastaCaso = pastas.next();
    var arquivos = pastaCaso.getFiles();
    while (arquivos.hasNext()) {
      var file = arquivos.next();
      var nome = limparTexto(file.getName());
      if (nome.indexOf('TEMP_') !== 0) continue;
      if ((agora - file.getDateCreated().getTime()) > limiteMs) {
        file.setTrashed(true);
        apagadas += 1;
        registrarLogMigracaoSeNecessario_('FOTO_TEMP_REMOVIDA', '', 'TEMP removida: ' + nome + '; fileId=' + file.getId());
      }
    }
  }
  return { ok: true, apagadas: apagadas };
}
