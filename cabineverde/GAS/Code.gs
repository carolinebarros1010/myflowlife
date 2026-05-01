
var PERFIS_OPERADOR_VALIDOS = ['OPERADOR', 'SUPERVISOR', 'ADMIN', 'AUDITOR'];

function normalizarPerfilOperador_(perfil) {
  return limparTexto(perfil).toUpperCase();
}

function validarPerfilOperador_(operador, perfisPermitidos) {
  var email = limparTexto(operador && operador.email).toLowerCase();
  var perfil = normalizarPerfilOperador_(operador && operador.perfil);
  var permitidos = Array.isArray(perfisPermitidos) && perfisPermitidos.length
    ? perfisPermitidos.map(function (item) { return normalizarPerfilOperador_(item); })
    : PERFIS_OPERADOR_VALIDOS.slice();

  if (PERFIS_OPERADOR_VALIDOS.indexOf(perfil) === -1) {
    return { permitido: false, perfil: perfil, motivo: 'Perfil inválido: ' + (perfil || 'N/A') };
  }
  if (permitidos.indexOf(perfil) === -1) {
    return { permitido: false, perfil: perfil, motivo: 'Perfil sem permissão para a ação.' };
  }
  return { permitido: true, perfil: perfil, email: email, motivo: 'PERMITIDO' };
}

function validarPermissaoAcao_(operador, acao) {
  var matriz = {
    REGISTRAR_CASO: ['OPERADOR', 'SUPERVISOR', 'ADMIN'],
    ANEXAR_FOTO: ['OPERADOR', 'SUPERVISOR', 'ADMIN'],
    VISUALIZAR_FOTO_INTERNO: ['OPERADOR', 'SUPERVISOR', 'ADMIN'],
    VALIDAR_REJEITAR_FOTO: ['SUPERVISOR', 'ADMIN'],
    VISUALIZAR_FOTO_RESTRITO_SIGILOSO: ['SUPERVISOR', 'ADMIN'],
    AJUSTAR_ESTRUTURA: ['ADMIN'],
    MIGRACAO: ['ADMIN'],
    GERIR_OPERADORES: ['ADMIN'],
    CONFIGURACOES: ['ADMIN'],
    CONSULTAR_LOGS: ['AUDITOR', 'ADMIN']
  };
  var permitidos = matriz[acao] || PERFIS_OPERADOR_VALIDOS;
  return validarPerfilOperador_(operador, permitidos);
}

var ESTRUTURA_PLANILHA = {
  CASOS: COLUNAS_CASOS,
  TRIAGEM_RESPOSTAS: COLUNAS_TRIAGEM_RESPOSTAS,
  EVENTOS_OCORRENCIA: COLUNAS_EVENTOS_OCORRENCIA,
  INDICADORES_OPERACIONAIS: COLUNAS_INDICADORES_OPERACIONAIS,
  FOTOS_DESAPARECIDOS: typeof COLUNAS_FOTOS_DESAPARECIDOS !== 'undefined' ? COLUNAS_FOTOS_DESAPARECIDOS : [],
  OPERADORES: ['email','nome','perfil','ativo','ultimaAtualizacao'],
  Logs_GAS: ['timestamp', 'etapa', 'ok', 'mensagem', 'rawPostData', 'payloadIdCaso']
};


function validarOperadorAtual_() {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var abaOperadores = garantirAbaComCabecalho(planilha, 'OPERADORES', ESTRUTURA_PLANILHA.OPERADORES);
  var cabecalho = garantirColunasDaEstrutura(abaOperadores, ESTRUTURA_PLANILHA.OPERADORES).map(limparTexto);
  var emailAtual = limparTexto(Session.getActiveUser().getEmail()).toLowerCase();

  if (!emailAtual) {
    registrarLogAcessoOperador_(planilha, 'OPERADOR_BLOQUEADO', 'BLOQUEADO_SEM_EMAIL', 'Usuário sem e-mail identificado na sessão Google.', '');
    throw new Error('Usuário não autorizado. Solicite acesso ao administrador.');
  }

  var idxEmail = cabecalho.indexOf('email');
  var idxAtivo = cabecalho.indexOf('ativo');
  var idxPerfil = cabecalho.indexOf('perfil');
  if (idxEmail === -1 || idxAtivo === -1 || idxPerfil === -1) {
    registrarLogAcessoOperador_(planilha, 'OPERADOR_BLOQUEADO', 'ERRO_ESTRUTURA_OPERADORES', 'Aba OPERADORES sem colunas obrigatórias (email/ativo/perfil).', emailAtual);
    throw new Error('Usuário não autorizado. Solicite acesso ao administrador.');
  }

  var ultimaLinha = abaOperadores.getLastRow();
  var encontrado = null;
  if (ultimaLinha >= 2) {
    var dados = abaOperadores.getRange(2, 1, ultimaLinha - 1, abaOperadores.getLastColumn()).getValues();
    for (var i = 0; i < dados.length; i += 1) {
      var emailLinha = limparTexto(dados[i][idxEmail]).toLowerCase();
      if (emailLinha === emailAtual) {
        encontrado = dados[i];
        break;
      }
    }
  }

  if (!encontrado) {
    registrarLogAcessoOperador_(planilha, 'OPERADOR_BLOQUEADO', 'NAO_CADASTRADO', 'E-mail não encontrado na aba OPERADORES.', emailAtual);
    throw new Error('Usuário não autorizado. Solicite acesso ao administrador.');
  }

  var ativoNormalizado = limparTexto(encontrado[idxAtivo]).toUpperCase();
  var operadorAtivo = ['TRUE','VERDADEIRO','SIM','ATIVO','1'].indexOf(ativoNormalizado) !== -1;

  if (!operadorAtivo) {
    registrarLogAcessoOperador_(planilha, 'OPERADOR_BLOQUEADO', 'OPERADOR_INATIVO', 'Operador localizado, porém inativo na aba OPERADORES.', emailAtual);
    throw new Error('Usuário não autorizado. Solicite acesso ao administrador.');
  }

  var perfilValidacao = validarPerfilOperador_({ email: emailAtual, perfil: encontrado[idxPerfil] }, PERFIS_OPERADOR_VALIDOS);
  if (!perfilValidacao.permitido) {
    registrarLogAcessoOperador_(planilha, 'OPERADOR_BLOQUEADO', 'PERFIL_INVALIDO', perfilValidacao.motivo, emailAtual);
    throw new Error("Usuário não autorizado. Solicite acesso ao administrador.");
  }

  registrarLogAcessoOperador_(planilha, 'OPERADOR_LOGADO', 'PERMITIDO', 'Operador autenticado com sucesso.', emailAtual);
  return { autorizado: true, email: emailAtual, perfil: perfilValidacao.perfil };
}

function registrarLogAcessoOperador_(planilha, tipoEvento, status, mensagem, email) {
  var colunasLog = ['dataHora','tipoEvento','status','mensagem','email','perfil','resultado','motivoBloqueio'];
  var abaLog = garantirAbaComCabecalho(planilha, 'LOG_ACESSO', colunasLog);
  var cabecalhoLog = garantirColunasDaEstrutura(abaLog, colunasLog).map(limparTexto);
  var evento = {
    dataHora: formatarDataHora(new Date()),
    tipoEvento: limparTexto(tipoEvento),
    status: limparTexto(status),
    mensagem: limparTexto(mensagem),
    email: limparTexto(email),
    perfil: '',
    resultado: limparTexto(status),
    motivoBloqueio: limparTexto(status).indexOf('BLOQUEADO') !== -1 ? limparTexto(mensagem) : ''
  };
  abaLog.appendRow(cabecalhoLog.map(function (coluna) { return normalizarValorPlanilha(evento[coluna]); }));

  if (typeof registrarLogMigracao_ === 'function') {
    registrarLogMigracao_('validarOperadorAtual_', limparTexto(status), '', limparTexto(mensagem), 'EXECUTADO', true, limparTexto(tipoEvento));
  }
}


function serializarDadosEvento_(dados) {
  try {
    return JSON.stringify(dados || {});
  } catch (err) {
    return limparTexto(dados);
  }
}

function registrarEventoOperacional_(planilha, idCaso, tipoEvento, dadosEvento) {
  var descricao = 'dados=' + serializarDadosEvento_(dadosEvento || {});
  registrarEventoOcorrencia(planilha, idCaso, tipoEvento, descricao);
}

function registrarDecisaoOperacional_(idCaso, operador, classificacao, prioridade, justificativa) {
  var idCasoLimpo = limparTexto(idCaso);
  if (!idCasoLimpo) throw new Error('idCaso obrigatório para registrar decisão operacional.');

  var operadorValidado = validarPerfilOperador_(operador || {}, PERFIS_OPERADOR_VALIDOS);
  if (!operadorValidado.permitido) throw new Error('Operador inválido para decisão operacional: ' + operadorValidado.motivo);

  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  registrarEventoOperacional_(planilha, idCasoLimpo, 'DECISAO_OPERACIONAL', {
    classificacaoRisco: limparTexto(classificacao),
    prioridade: limparTexto(prioridade),
    justificativa: limparTexto(justificativa),
    operador: operadorValidado.email || limparTexto(operador && operador.email)
  });

  return { ok: true, idCaso: idCasoLimpo, tipoEvento: 'DECISAO_OPERACIONAL' };
}

function doGet() {
  validarOperadorAtual_();
  return criarRespostaJson({ ok: true, service: 'cabineverde', message: 'Endpoint ativo' });
}

function doPost(e) {
  try {
    var operadorAtual = validarOperadorAtual_();
    var body = parsePayload(e);
    var acao = limparTexto(body.action).toUpperCase();
    var validacaoAcao = validarPermissaoAcao_(operadorAtual, acao === "VISUALIZARFOTODESAPARECIDO" ? "VISUALIZAR_FOTO_INTERNO" : "REGISTRAR_CASO");
    if (!validacaoAcao.permitido) {
      registrarLogAcessoOperador_(SpreadsheetApp.getActiveSpreadsheet(), "ACESSO_NEGADO", "SEM_PERMISSAO_ACAO", "Ação bloqueada: " + acao + "; motivo=" + validacaoAcao.motivo, operadorAtual.email);
      throw new Error("Ação não permitida para o perfil do operador.");
    }
    if (body.action === 'visualizarFotoDesaparecido') {
      var respostaFoto = visualizarFotoDesaparecido_(body.idFoto, body.operador, body.justificativa, body.motivoAcessoFoto);
      return criarRespostaJson({ ok: true, message: 'Visualização autorizada', conteudoBase64: respostaFoto.conteudoBase64, mimeType: respostaFoto.mimeType, idCaso: respostaFoto.idCaso, idFoto: respostaFoto.idFoto });
    }
    if (body.action === 'listarCasos') {
      var casos = listarCasosComProtecao_(operadorAtual);
      return criarRespostaJson({ ok: true, action: 'listarCasos', casos: casos });
    }
    if (body.action === 'verificarSegurancaDrive') {
      var resultadoSeguranca = verificarSegurancaDrive_(!!body.corrigirAutomaticamente);
      return criarRespostaJson({ ok: true, action: 'verificarSegurancaDrive', resultado: resultadoSeguranca });
    }
    var planilha = SpreadsheetApp.getActiveSpreadsheet();
    Object.keys(ESTRUTURA_PLANILHA).forEach(function (aba) {
      garantirAbaComCabecalho(planilha, aba, ESTRUTURA_PLANILHA[aba]);
    });

    var registros = body.abas && Array.isArray(body.abas) ? body.abas : [body];
    var idCaso = limparTexto((body.payload && body.payload.idCaso) || (body.dados && body.dados.idCaso));

    registros.forEach(function (registro) {
      persistirRegistro(planilha, registro);
    });

    if (body.foto && body.foto.base64) {
      salvarFotoDesaparecido_({
        idCaso: limparTexto(body.payload && body.payload.idCaso),
        talaoPMESP: limparTexto(body.payload && body.payload.talaoPMESP),
        nomeDesaparecido: limparTexto(body.payload && body.payload.nomeDesaparecido),
        operadorResponsavel: limparTexto(body.payload && body.payload.operadorResponsavel),
        origemFoto: limparTexto(body.payload && body.payload.origemFoto),
        tipoFoto: limparTexto(body.payload && body.payload.tipoFoto),
        nivelAcesso: limparTexto(body.payload && body.payload.nivelAcesso),
        autorizacaoUsoImagem: body.payload && body.payload.autorizacaoUsoImagem,
        base64: body.foto.base64,
        nomeArquivo: body.foto.nomeArquivo,
        mimeType: body.foto.mimeType
      });
    }

    registrarLogTecnico(planilha, { etapa: 'persistencia_multiabas', ok: true, mensagem: 'Registros persistidos', rawPostData: extrairRawPostData(e), payloadIdCaso: idCaso });
    return criarRespostaJson({ ok: true, action: 'updated', idCaso: idCaso, message: 'Gravação multiabas concluída' });
  } catch (err) {
    var mensagemErro = err && err.message ? err.message : String(err);
    var planilhaLogs = obterPlanilhaLogs();
    registrarLogTecnico(planilhaLogs, { etapa: 'erro_post', ok: false, mensagem: mensagemErro, rawPostData: extrairRawPostData(e), payloadIdCaso: extrairIdCasoBruto(e) });
    return criarRespostaJson({ ok: false, message: mensagemErro }, 500);
  }
}

function listarCasosComProtecao_(operadorAtual) {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var aba = garantirAbaComCabecalho(planilha, 'CASOS', COLUNAS_CASOS);
  if (aba.getLastRow() < 2) return [];
  var cabecalho = garantirColunasDaEstrutura(aba, COLUNAS_CASOS);
  var dados = aba.getRange(2, 1, aba.getLastRow() - 1, aba.getLastColumn()).getValues();
  var perfil = normalizarPerfilOperador_(operadorAtual && operadorAtual.perfil);
  return dados.map(function (linha) {
    var item = {};
    for (var i = 0; i < cabecalho.length; i += 1) {
      item[cabecalho[i]] = normalizarValorPlanilha(linha[i]);
    }
    item.cpfDesaparecido = mascararDadosSensivel_(item.cpfDesaparecido, perfil);
    item.rgDesaparecido = mascararDadosSensivel_(item.rgDesaparecido, perfil);
    return item;
  });
}

function mascararDadosSensivel_(valor, perfil) {
  var texto = limparTexto(valor);
  var perfilNormalizado = normalizarPerfilOperador_(perfil);
  if (!texto) return '';
  if (perfilNormalizado === 'SUPERVISOR' || perfilNormalizado === 'ADMIN') return texto;
  if (perfilNormalizado === 'AUDITOR') return '***AUDITORIA_CONTROLADA***';
  var apenasDigitos = texto.replace(/\D/g, '');
  if (apenasDigitos.length >= 4) {
    return '***.***.***-' + apenasDigitos.slice(-2);
  }
  return '***' + texto.slice(-2);
}

function verificarSegurancaDrive_(corrigirAutomaticamente) {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var pastaRaiz = obterOuCriarPasta_('Cabine Verde');
  var pastaFotos = obterOuCriarSubpasta_(pastaRaiz, 'Fotos');
  var itensAnalisados = 0;
  var arquivosExpostos = 0;
  var arquivosCorrigidos = 0;
  var filas = [pastaFotos];
  while (filas.length) {
    var atual = filas.shift();
    var arquivos = atual.getFiles();
    while (arquivos.hasNext()) {
      var arquivo = arquivos.next();
      itensAnalisados += 1;
      var acesso = arquivo.getSharingAccess();
      if (acesso !== DriveApp.Access.PRIVATE) {
        arquivosExpostos += 1;
        if (corrigirAutomaticamente) {
          arquivo.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.VIEW);
          arquivosCorrigidos += 1;
        }
        registrarEventoOcorrencia(planilha, '', 'ARQUIVO_EXPOSTO', 'fileId=' + arquivo.getId() + '; nome=' + arquivo.getName() + '; acesso=' + acesso + '; corrigido=' + (corrigirAutomaticamente ? 'TRUE' : 'FALSE'));
      }
    }
    var subpastas = atual.getFolders();
    while (subpastas.hasNext()) filas.push(subpastas.next());
  }
  return { itensAnalisados: itensAnalisados, arquivosExpostos: arquivosExpostos, arquivosCorrigidos: arquivosCorrigidos, correcaoAutomatica: !!corrigirAutomaticamente };
}

function rotinaDiariaSeguranca_() {
  var resultado = verificarSegurancaDrive_(true);
  gerarRelatorioSeguranca_(resultado);
  return resultado;
}

function gerarRelatorioSeguranca_(resultado) {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var colunas = ['dataHora', 'itensAnalisados', 'arquivosExpostos', 'arquivosCorrigidos', 'correcaoAutomatica'];
  var aba = garantirAbaComCabecalho(planilha, 'RELATORIO_SEGURANCA', colunas);
  aba.appendRow([
    formatarDataHora(new Date()),
    normalizarValorPlanilha(resultado && resultado.itensAnalisados),
    normalizarValorPlanilha(resultado && resultado.arquivosExpostos),
    normalizarValorPlanilha(resultado && resultado.arquivosCorrigidos),
    resultado && resultado.correcaoAutomatica ? 'TRUE' : 'FALSE'
  ]);
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
    var talaoPMESPRecebido = limparTexto(registroPorColuna.talaoPMESP);
    var linhaPorIdCaso = localizarCasoPorIdCaso(sheet, idCaso, cabecalhoAtual);
    var linhaPorTalaoPMESP = localizarCasoPorTalaoPMESP(sheet, talaoPMESPRecebido, cabecalhoAtual);

    validarConsistenciaCaso(planilha, {
      idCaso: idCaso,
      talaoPMESP: talaoPMESPRecebido,
      linhaPorIdCaso: linhaPorIdCaso,
      linhaPorTalaoPMESP: linhaPorTalaoPMESP
    });

    var linhaFinal = cabecalhoAtual.map(function (nomeColuna) {
      return normalizarValorPlanilha(registroPorColuna[nomeColuna]);
    });

    if (linhaPorIdCaso > 1) {
      sheet.getRange(linhaPorIdCaso, 1, 1, linhaFinal.length).setValues([linhaFinal]);
      return;
    }

    sheet.appendRow(linhaFinal);
    registrarEventoOperacional_(planilha, idCaso, 'CASO_CRIADO', {
      idCaso: idCaso,
      talaoPMESP: talaoPMESPRecebido,
      operador: limparTexto(registroPorColuna.operadorResponsavel),
      dataHora: formatarDataHora(new Date()),
      statusInicial: limparTexto(registroPorColuna.statusCaso) || 'Em triagem'
    });
    return;
  }

  sheet.appendRow(valores);
}


function localizarCasoPorIdCaso(sheet, idCaso, cabecalhoAtual) {
  return encontrarLinhaPorColuna(sheet, idCaso, 'idCaso', cabecalhoAtual);
}

function localizarCasoPorTalaoPMESP(sheet, talaoPMESP, cabecalhoAtual) {
  return encontrarLinhaPorColuna(sheet, talaoPMESP, 'talaoPMESP', cabecalhoAtual);
}

function encontrarLinhaPorColuna(sheet, valorBusca, nomeColuna, cabecalhoAtual) {
  var valorLimpo = limparTexto(valorBusca);
  if (!valorLimpo || sheet.getLastRow() < 2) return -1;
  var indiceColuna = (cabecalhoAtual || []).indexOf(nomeColuna);
  if (indiceColuna === -1) return -1;

  var valores = sheet.getRange(2, indiceColuna + 1, sheet.getLastRow() - 1, 1).getValues();
  for (var i = 0; i < valores.length; i += 1) {
    if (limparTexto(valores[i][0]) === valorLimpo) return i + 2;
  }

  return -1;
}

function validarConsistenciaCaso(planilha, contexto) {
  var idCaso = limparTexto(contexto.idCaso);
  var talaoPMESP = limparTexto(contexto.talaoPMESP);
  var linhaPorIdCaso = contexto.linhaPorIdCaso;
  var linhaPorTalaoPMESP = contexto.linhaPorTalaoPMESP;

  if (linhaPorIdCaso > 1) {
    var sheetCasos = planilha.getSheetByName('CASOS');
    var cabecalho = sheetCasos.getRange(1, 1, 1, sheetCasos.getLastColumn()).getValues()[0].map(limparTexto);
    var indiceTalao = cabecalho.indexOf('talaoPMESP');
    var talaoSalvo = indiceTalao >= 0 ? limparTexto(sheetCasos.getRange(linhaPorIdCaso, indiceTalao + 1).getValue()) : '';

    if (talaoPMESP && talaoSalvo && talaoPMESP !== talaoSalvo) {
      registrarEventoOcorrencia(planilha, idCaso, 'CONFLITO_TALAO_PMESP', 'Bloqueio: idCaso existente com talaoPMESP divergente.');
      throw new Error('Conflito de consistência: idCaso já cadastrado com outro talaoPMESP. Atualização bloqueada.');
    }
    return;
  }

  if (linhaPorTalaoPMESP > 1) {
    var sheetCasosExistente = planilha.getSheetByName('CASOS');
    var cabecalhoExistente = sheetCasosExistente.getRange(1, 1, 1, sheetCasosExistente.getLastColumn()).getValues()[0].map(limparTexto);
    var indiceIdCaso = cabecalhoExistente.indexOf('idCaso');
    var idCasoExistente = indiceIdCaso >= 0 ? limparTexto(sheetCasosExistente.getRange(linhaPorTalaoPMESP, indiceIdCaso + 1).getValue()) : '';
    if (!idCaso || idCaso !== idCasoExistente) {
      var colunasAtualizadas = garantirColunasDaEstrutura(sheetCasosExistente, ESTRUTURA_PLANILHA.CASOS.concat(['flagDuplicidade']));
      var indiceFlagDuplicidade = colunasAtualizadas.indexOf('flagDuplicidade');
      if (indiceFlagDuplicidade >= 0) {
        sheetCasosExistente.getRange(linhaPorTalaoPMESP, indiceFlagDuplicidade + 1).setValue(true);
      }

      registrarEventoOcorrencia(planilha, idCaso || idCasoExistente, 'POSSIVEL_DUPLICIDADE_TALAO_PMESP', 'severidade=CRITICA; acao=BLOQUEADO_AUTOMATICAMENTE; talaoPMESP já vinculado a outro idCaso.');
      throw new Error('Duplicidade operacional detectada: talaoPMESP já vinculado a outro caso.');
    }
  }
}

function registrarEventoOcorrencia(planilha, idCaso, tipoEvento, descricaoEvento) {
  var sheetEventos = garantirAbaComCabecalho(planilha, 'EVENTOS_OCORRENCIA', ESTRUTURA_PLANILHA.EVENTOS_OCORRENCIA);
  var cabecalhoEventos = garantirColunasDaEstrutura(sheetEventos, ESTRUTURA_PLANILHA.EVENTOS_OCORRENCIA);
  var eventoPorColuna = {
    idCaso: limparTexto(idCaso),
    timestampEvento: formatarDataHora(new Date()),
    tipoEvento: limparTexto(tipoEvento),
    descricaoEvento: limparTexto(descricaoEvento),
    statusCaso: '',
    prioridade: '',
    classificacaoRisco: ''
  };

  var linhaEvento = cabecalhoEventos.map(function (nomeColuna) {
    return normalizarValorPlanilha(eventoPorColuna[nomeColuna]);
  });

  sheetEventos.appendRow(linhaEvento);
}

function mapearPorColuna(colunas, valores) {
  var registro = {};
  (colunas || []).forEach(function (coluna, indice) {
    registro[coluna] = indice < valores.length ? valores[indice] : '';
  });
  return registro;
}
