import {
  calcularFaixaEtaria,
  calcularRisco,
  calcularPrioridade,
  calcularAptoCabineVerde,
  gerarPayloadSheets,
  gerarRelatorioOperacional,
  salvarCasoSheets,
  healthcheckSheets,
  buscarCaso_,
  gerarTimelineCaso_,
  editarCasoControlado_,
  resumoQualidadeDados_,
  marcarProblemaQualidadeResolvido_,
  registrarConsultaCaso_,
  validarOperador_,
  salvarOperadorLocal,
  limparOperadorLocal,
  obterOperadorLocal,
  operadorEstaValidadoLocalmente,
  sessaoOperadorExpirada,
  ARVORE_DECISAO_CONFIG,
  OPCOES_SIM_NAO_NI,
  avaliarAlertasArvore,
  contarPerguntasRespondidas,
  mapearIndicadoresOperacionais,
  calcularCriticidadeIndicadores,
  listarIndicadoresAtivos,
  sugerirAcaoIndicadores,
} from './core.js';

const app = document.getElementById('app');

const splashScreen = document.getElementById('cv-splash');
const revelarAplicativo = () => {
  if (!app) return;
  app.classList.remove('is-hidden');
  app.setAttribute('aria-hidden', 'false');
};

const iniciarSplashScreen = () => {
  if (!splashScreen) {
    revelarAplicativo();
    return;
  }

  const reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tempoSplash = reduzirMovimento ? 900 : 2800;

  window.setTimeout(() => {
    splashScreen.classList.add('is-exiting');
    revelarAplicativo();
    window.setTimeout(() => splashScreen.remove(), reduzirMovimento ? 200 : 900);
  }, tempoSplash);
};

iniciarSplashScreen();
const casos = JSON.parse(localStorage.getItem('cabine-verde-casos') || '[]');
const camposObrigatoriosEnvio = ['nomeCompletoDesaparecido', 'municipio', 'nomeSolicitante', 'telefoneSolicitante'];
const DEBUG_MODE = new URLSearchParams(window.location.search).get('debug') === '1';
const lerParametrosTriagemUrl = () => {
  const params = new URLSearchParams(window.location.search);
  const idCaso = String(params.get('idCaso') || '').trim();
  const talaoPMESP = String(
    params.get('talaoPMESP') || params.get('talaoBopm') || params.get('talao') || params.get('numeroTalao') || ''
  ).trim();
  const nomeCompletoDesaparecido = String(params.get('nomeCompletoDesaparecido') || '').trim();
  return { idCaso, talaoPMESP, nomeCompletoDesaparecido };
};
const PERFIL_OPERADOR = () => String(localStorage.getItem('cabineVerdeOperadorPerfil') || 'OPERADOR').toUpperCase();
const NOME_OPERADOR = () => String(localStorage.getItem('cabineVerdeOperadorNome') || 'Operador Cabine Verde').trim();
const podeEditarCaso = () => ['SUPERVISOR', 'ADMIN'].includes(PERFIL_OPERADOR());
const mascararDadoSensivel = (valor) => (podeEditarCaso() ? valor || '-' : '***');

const MIRROR_FIELDS = [
  ['nomeCompletoDesaparecido', 'arvore__passo1_nome'],
  ['municipio', 'arvore__passo1_municipio'],
  ['sexoGenero', 'arvore__passo1_sexo_genero'],
  ['idade', 'arvore__passo1_idade'],
  ['fotoDisponivel', 'arvore__passo1_foto_digital'],
  ['dispositivoLigado', 'arvore__passo1_dispositivo'],
  ['telefoneDesaparecido', 'comp__passo1_dispositivo'],
  ['dataHoraUltimaVisualizacao', 'arvore__passo2_data_hora'],
  ['localUltimaVisualizacao', 'arvore__passo2_local'],
  ['roupaUltimaVisualizacao', 'arvore__passo2_roupa'],
  ['meioTransporte', 'arvore__passo2_transporte'],
  ['dadosVeiculo', 'arvore__passo2_caracteristicas_transporte'],
  ['vulnerabilidade', 'arvore__passo4_condicao_mental'],
  ['suspeitaCrime', 'arvore__passo4_suspeita_crime'],
  ['camerasResidencia', 'arvore__passo5_cameras_residencia'],
  ['camerasUltimoLocal', 'arvore__passo5_cameras_ultimo_local']
];

const MIRROR_FIELD_INDEX = MIRROR_FIELDS.reduce((acc, par) => {
  par.forEach((nomeCampo) => {
    acc[nomeCampo] = par[0];
  });
  return acc;
}, {});

const atualizarFeedback = (mensagem, erro = false) => {
  const feedback = document.getElementById('feedback');
  if (!feedback) return;
  feedback.textContent = mensagem;
  feedback.classList.toggle('danger', erro);
};

const sanitizarTextoFeedback = (valor) => {
  const texto = String(valor ?? '').trim();
  return texto
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
};

const renderFeedbackOperacional = (tipo = 'info', dados = {}) => {
  const feedback = document.getElementById('feedback');
  if (!feedback) return;

  const mapeamentoTipo = {
    sucesso: 'success',
    erro: 'error',
    alerta: 'alert',
    info: 'info'
  };
  const tipoClasse = mapeamentoTipo[tipo] || 'info';
  feedback.className = '';
  feedback.classList.add('cv-feedback-card', `cv-feedback-card--${tipoClasse}`);

  if (tipo === 'sucesso') {
    const titulo = sanitizarTextoFeedback(dados.titulo || 'Caso registrado');
    const mensagem = sanitizarTextoFeedback(
      dados.mensagem || 'As informações foram salvas e seguirão para acompanhamento operacional.'
    );
    const talao = sanitizarTextoFeedback(dados.talao || dados.talaoPMESP || dados.protocolo || '-');
    const status = sanitizarTextoFeedback(dados.statusCaso || dados.status || '-');
    const prioridade = sanitizarTextoFeedback(dados.prioridade || dados.classificacaoRisco || dados.risco || '-');
    const prioridadeRotulo = dados.prioridade ? 'Prioridade' : 'Prioridade/Risco';

    feedback.innerHTML = `
      <strong class="cv-feedback-title">${titulo}</strong>
      <p>${mensagem}</p>
      <dl class="cv-feedback-meta">
        <div><dt>Talão/Protocolo</dt><dd>${talao}</dd></div>
        <div><dt>Status do caso</dt><dd>${status}</dd></div>
        <div><dt>${prioridadeRotulo}</dt><dd>${prioridade}</dd></div>
      </dl>
      <p class="cv-feedback-hope">ESPERANÇA</p>
    `;
    return;
  }

  if (tipo === 'erro') {
    const titulo = sanitizarTextoFeedback(dados.titulo || 'Não foi possível concluir o envio');
    const mensagem = sanitizarTextoFeedback(dados.mensagem || 'O sistema seguirá em monitoramento institucional. Verifique a conexão e tente novamente em instantes.');
    feedback.innerHTML = `<strong class="cv-feedback-title">${titulo}</strong><p>${mensagem}</p>`;
    return;
  }

  const mensagemPadrao = tipo === 'alerta' ? 'Atenção operacional necessária.' : 'Atualização operacional disponível.';
  const mensagem = sanitizarTextoFeedback(dados.mensagem || dados.titulo || mensagemPadrao);
  feedback.innerHTML = `<p>${mensagem}</p>`;
};

const logBotaoOperacional = (nomeBotao, payload = {}) => {
  console.log('BOTÃO CLICADO:', nomeBotao);
  console.log('PAYLOAD ENVIADO:', payload);
};

const renderPergunta = (pergunta) => {
  const nomeResposta = `arvore__${pergunta.id}`;
  const nomeComplemento = `comp__${pergunta.id}`;
  const syncKeyResposta = MIRROR_FIELD_INDEX[nomeResposta] ? ` data-sync-key="${MIRROR_FIELD_INDEX[nomeResposta]}"` : '';
  const syncKeyComplemento = MIRROR_FIELD_INDEX[nomeComplemento] ? ` data-sync-key="${MIRROR_FIELD_INDEX[nomeComplemento]}"` : '';
  const resposta =
    pergunta.tipo === 'simNao'
      ? `<select name="${nomeResposta}"${syncKeyResposta}>${OPCOES_SIM_NAO_NI.map((item) => `<option value="${item}">${item || 'Selecione'}</option>`).join('')}</select>`
      : `<input name="${nomeResposta}" type="text"${syncKeyResposta}/>`;

  const complemento = pergunta.complementoLabel
    ? `<label class="cv-complemento">Complemento (${pergunta.complementoLabel})<input type="text" name="${nomeComplemento}"${syncKeyComplemento}/></label>`
    : '';

  return `<article class="cv-pergunta"><p>${pergunta.pergunta}</p>${resposta}${complemento}</article>`;
};

const renderArvore = () => {
  const passos = ARVORE_DECISAO_CONFIG.passos
    .map((passo) => `<section class="cv-form-section"><h3>${passo.titulo}</h3>${passo.perguntas.map(renderPergunta).join('')}</section>`)
    .join('');

  const subabas = Object.entries(ARVORE_DECISAO_CONFIG.subabas)
    .map(
      ([faixa, subaba]) =>
        `<section class="cv-form-section cv-subaba" data-faixa="${faixa}"><h3>${subaba.titulo}</h3>${subaba.perguntas
          .map(renderPergunta)
          .join('')}</section>`
    )
    .join('');

  return `${passos}<section class="cv-form-section"><h3>Subabas por faixa etária</h3><p>A subaba correta abre automaticamente após preencher a idade.</p>${subabas}</section>`;
};

const obterArvoreFormulario = (form, faixaEtaria) => {
  const data = new FormData(form);
  const respostas = {};
  const complementos = {};

  ARVORE_DECISAO_CONFIG.passos.forEach((passo) => {
    passo.perguntas.forEach((pergunta) => {
      respostas[pergunta.id] = String(data.get(`arvore__${pergunta.id}`) || '').trim();
      complementos[pergunta.id] = String(data.get(`comp__${pergunta.id}`) || '').trim();
    });
  });

  const subabaAtiva = ARVORE_DECISAO_CONFIG.subabas[faixaEtaria];
  if (subabaAtiva) {
    subabaAtiva.perguntas.forEach((pergunta) => {
      respostas[pergunta.id] = String(data.get(`arvore__${pergunta.id}`) || '').trim();
      complementos[pergunta.id] = String(data.get(`comp__${pergunta.id}`) || '').trim();
    });
  }

  return { respostas, complementos };
};

const exibirSubabaPorIdade = (idade) => {
  const faixaEtaria = calcularFaixaEtaria(Number(idade || 0));
  document.querySelectorAll('.cv-subaba').forEach((subaba) => {
    subaba.classList.toggle('active', subaba.dataset.faixa === faixaEtaria);
  });
  return faixaEtaria;
};

const lerValorCampo = (campo) => {
  if (!campo) return '';
  if (campo.type === 'checkbox') return campo.checked;
  if (campo.type === 'radio') return campo.checked ? campo.value : null;
  return campo.value;
};

const escreverValorCampo = (campo, valor) => {
  if (!campo) return;
  if (campo.type === 'checkbox') {
    campo.checked = Boolean(valor);
    return;
  }
  if (campo.type === 'radio') {
    campo.checked = campo.value === valor;
    return;
  }
  campo.value = valor ?? '';
};

const sincronizarCamposDuplicados = (event) => {
  const origem = event.target;
  if (!(origem instanceof HTMLElement)) return;
  const chave = origem.dataset.syncKey;
  if (!chave) return;

  const form = document.getElementById('f');
  if (!form) return;

  const valor = lerValorCampo(origem);
  if (origem.type === 'radio' && valor === null) return;

  const equivalentes = form.querySelectorAll(`[data-sync-key="${chave}"]`);
  equivalentes.forEach((campo) => {
    if (campo === origem) return;
    escreverValorCampo(campo, valor);
  });
};

const obterCasoDoFormulario = () => {
  const form = document.getElementById('f');
  const data = new FormData(form);
  const idade = Number(data.get('idade') || 0);
  const faixaEtaria = calcularFaixaEtaria(idade);
  const { respostas, complementos } = obterArvoreFormulario(form, faixaEtaria);

  const observacoesOperador = String(data.get('observacoesOperador') || '').trim();
  const alertas = avaliarAlertasArvore(respostas, faixaEtaria);

  const indicadoresOperacionais = mapearIndicadoresOperacionais(respostas);
  const criticidadeIndicadores = calcularCriticidadeIndicadores(indicadoresOperacionais);
  const suspeitaCrime = respostas.passo4_suspeita_crime === 'Sim' || respostas.adulto_indicios_violencia === 'Sim';
  const vulnerabilidade =
    respostas.passo4_condicao_mental === 'Sim' ||
    respostas.passo4_limitacao_fisica === 'Sim' ||
    respostas.passo4_depende_supervisao === 'Sim' ||
    faixaEtaria === 'Criança' ||
    faixaEtaria === 'Idoso';

  const talaoPMESP = String(data.get('talaoPMESP') || data.get('talaoBopm') || data.get('numeroTalao') || '').trim();
  const talaoBopm = String(data.get('talaoBopm') || talaoPMESP).trim();

  const caso = {
    talaoPMESP,
    talaoBopm,
    nomeCompletoDesaparecido: String(data.get('nomeCompletoDesaparecido') || '').trim(),
    municipio: String(data.get('municipio') || '').trim(),
    nomeSolicitante: String(data.get('nomeSolicitante') || '').trim(),
    vinculoSolicitante: String(data.get('vinculoSolicitante') || '').trim(),
    telefoneSolicitante: String(data.get('telefoneSolicitante') || '').trim(),
    sexoGenero: String(data.get('sexoGenero') || '').trim(),
    idade,
    faixaEtaria,
    statusCaso: String(data.get('statusCaso') || 'Em triagem').trim(),
    dataHoraUltimaVisualizacao: String(data.get('dataHoraUltimaVisualizacao') || '').trim(),
    localUltimaVisualizacao: respostas.passo2_local || '',
    roupaUltimaVisualizacao: respostas.passo2_roupa || '',
    meioTransporte: respostas.passo2_transporte || '',
    dadosVeiculo: respostas.passo2_caracteristicas_transporte || '',
    fotoDisponivel: respostas.passo1_foto_digital === 'Sim',
    linkFoto: complementos.passo1_foto_digital || '',
    dispositivoLigado: respostas.passo5_aparelho_ligado === 'Sim' || respostas.passo1_dispositivo === 'Sim',
    camerasResidencia: respostas.passo5_cameras_residencia === 'Sim',
    camerasUltimoLocal: respostas.passo5_cameras_ultimo_local === 'Sim',
    vulnerabilidade,
    condicaoMentalCognitivaComportamental: complementos.passo4_condicao_mental || '',
    limitacaoFisica: complementos.passo4_limitacao_fisica || '',
    usoMedicacaoEssencial: respostas.passo4_medicacao === 'Sim' || respostas.idoso_medicacao_continua === 'Sim',
    usoAlcoolOutrasDrogas: respostas.passo4_alcool_drogas === 'Sim',
    historicoDesaparecimentoAnterior: respostas.passo4_desapareceu_antes === 'Sim',
    conflitoPrevio: respostas.passo4_conflito === 'Sim',
    suspeitaCrime,
    locaisHabituais: [complementos.passo3_locais_frequentes, respostas.passo3_estudo_trabalho].filter(Boolean).join(' | '),
    buscasPreliminares: [
      `Locais habituais: ${respostas.passo5_procuraram_locais || 'Não informado'}`,
      `Cômodos: ${respostas.passo5_procuraram_comodos || 'Não informado'}`,
      `Tentativa contato: ${respostas.passo5_tentativa_contato || 'Não informado'}`
    ].join(' | '),
    numeroBo: complementos.passo5_registro_delegacia || '',
    observacoesOperacionais: observacoesOperador,
    indicadoresOperacionais,
    criticidadeIndicadores,
    respostasArvore: respostas,
    complementosArvore: complementos,
    alertasArvore: alertas
  };

  caso.aptoCabineVerde = calcularAptoCabineVerde(caso, indicadoresOperacionais);
  caso.classificacaoRisco = calcularRisco(caso, indicadoresOperacionais);
  caso.prioridade = calcularPrioridade(caso, indicadoresOperacionais);
  caso.acaoSugerida = sugerirAcaoIndicadores(indicadoresOperacionais);

  return caso;
};

const atualizarResumo = (caso) => {
  const resumo = document.getElementById('resumo');
  const { respondidas } = contarPerguntasRespondidas(caso.respostasArvore, caso.complementosArvore);
  const alertas = avaliarAlertasArvore(caso.respostasArvore, caso.faixaEtaria);
  const indicadoresAtivos = listarIndicadoresAtivos(caso.indicadoresOperacionais);

  resumo.innerHTML = [
    ['Nome do desaparecido', caso.nomeCompletoDesaparecido || '-'],
    ['Idade/faixa etária', `${caso.idade || '-'} / ${caso.faixaEtaria}`],
    ['Município', caso.municipio || '-'],
    ['Solicitante', caso.nomeSolicitante || '-'],
    ['Telefone', caso.telefoneSolicitante || '-'],
    ['Risco', caso.classificacaoRisco],
    ['Prioridade', caso.prioridade],
    ['Status', caso.statusCaso || '-'],
    ['Subaba ativa', caso.faixaEtaria],
    ['Indicadores operacionais ativos', indicadoresAtivos.length ? indicadoresAtivos.join(' | ') : '-'],
    ['Perguntas respondidas', String(respondidas)],
    ['Alertas relevantes', alertas.join(' | ') || '-'],
    ['Apto Cabine Verde', caso.aptoCabineVerde ? 'Sim' : 'Não']
  ]
    .map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`)
    .join('');
};

const validarCamposMinimos = (caso) => camposObrigatoriosEnvio.every((campo) => String(caso[campo] || '').trim());

const render = () => {
  if (sessaoOperadorExpirada()) {
    limparOperadorLocal();
    atualizarFeedback('Sessão expirada após 12 horas. Faça novo login operacional.', true);
  }
  const operadorValidado = operadorEstaValidadoLocalmente();
  const operadorAtual = obterOperadorLocal();
  if (!operadorValidado) {
    app.innerHTML = `
    <div class="cv-shell">
      <header class="cv-header"><h1>Cabine Verde</h1><p>Triagem dinâmica de pessoas desaparecidas</p></header>
      <section class="cv-card cv-login-operacional cv-login-hero" data-tela="0">
        <p class="cv-login-brand">CABINE VERDE</p>
        <h2>Acesso Operacional</h2>
        <p class="cv-login-subtitle">Painel Integrado Operacional</p>
        <p class="cv-login-helper">
          Informe seu e-mail institucional para acessar a triagem, o acompanhamento e a auditoria dos casos.
        </p>

        <label for="operadorEmail">E-mail institucional</label>
        <input id="operadorEmail" name="operadorEmail" type="email" required placeholder="operador@cabineverde.gov" autocomplete="email" />

        <button type="button" class="cv-button cv-button--primary" id="btnValidarOperador">Entrar</button>
        <p id="mensagemLoginOperacional"></p>

        <small class="cv-login-footer">ESPERANÇA</small>
      </section>
    </div>`;
    return;
  }
  app.innerHTML = `
  <div class="cv-shell">
    <header class="cv-header"><h1>Cabine Verde</h1><p>Triagem dinâmica de pessoas desaparecidas</p></header>
    <section class="cv-card cv-login-operacional" data-tela="0" hidden>
      <h2>Login Operacional</h2>
      <p>Informe seu e-mail institucional para acessar o sistema Cabine Verde.</p>
      <label for="operadorEmail">E-mail institucional do operador</label>
      <input id="operadorEmail" name="operadorEmail" type="email" required placeholder="seunome@dominio.com" autocomplete="email" />
      <button type="button" class="cv-button cv-button--primary" id="btnValidarOperador">Validar operador</button>
      <p id="mensagemLoginOperacional"></p>
    </section>
    <section class="cv-card cv-selection-panel cv-selection-screen" data-tela="1">
      <div id="painelSelecaoOperacional">
        <header class="cv-selection-topbar">
          <div>
            <p class="cv-login-brand">CABINE VERDE</p>
            <h3>Painel Integrado Operacional</h3>
          </div>
          <p class="cv-selection-operator">${operadorAtual.operadorNome || operadorAtual.operadorEmail || '-'} · ${operadorAtual.operadorPerfil || '-'}</p>
        </header>
        <p class="cv-selection-intro">Selecione o serviço desejado.</p>
        <div class="cv-selection-group">
          <h4 class="cv-selection-group-title">Área Pública / Atendimento</h4>
          <article class="cv-service-card cv-public-card">
            <header class="cv-service-card__header">
              <p class="cv-service-card__icon" aria-hidden="true">🗂️</p>
              <h4 class="cv-service-card__title">Inserção de Caso</h4>
              <p class="cv-service-card__description">Realize o pré-cadastro de um desaparecimento, informando dados do desaparecido, informações relevantes e meios de contato.</p>
            </header>
            <div class="cv-service-actions">
              <button type="button" class="cv-button cv-button--primary" id="btnAcessarInsercaoCaso">Acessar</button>
            </div>
          </article>
        </div>
        <div class="cv-selection-group">
          <h4 class="cv-selection-group-title">Área Restrita / Operacional</h4>
          <div class="cv-service-grid">
            <article class="cv-service-card cv-internal-card">
              <header class="cv-service-card__header">
                <h4 class="cv-service-card__title">Relatório</h4>
                <p class="cv-service-card__description">Consulte e copie o relatório operacional dos casos registrados.</p>
              </header>
              <div class="cv-service-actions">
                <button type="button" class="cv-button cv-button--secondary" id="btnAcessarRelatorio">Acessar</button>
              </div>
            </article>
            <article class="cv-service-card cv-internal-card">
              <header class="cv-service-card__header">
                <h4 class="cv-service-card__title">Auditoria</h4>
                <p class="cv-service-card__description">Consulte casos, histórico, qualidade dos dados e rastreabilidade operacional.</p>
              </header>
              <div class="cv-service-actions">
                <button type="button" class="cv-button cv-button--secondary" id="btnAcessarAuditoria">Acessar</button>
              </div>
            </article>
          </div>
        </div>
      </div>

      <section id="entradaOperacionalModulo" class="cv-module-entry cv-entry-module" hidden>
        <div class="cv-entry-card">
          <p class="cv-entry-kicker">Entrada Operacional</p>
          <h4 class="cv-entry-title">Inserção de Caso</h4>
          <p class="cv-entry-helper">Informe o número do talão e o município para iniciar a triagem dinâmica do caso.</p>
          <form id="entrada-operacional-form" class="cv-form-section cv-operational-entry">
            <div class="cv-grid">
              <label for="entrada-talaoPMESP">Número do Talão PMESP<input id="entrada-talaoPMESP" required /></label>
              <label for="entrada-municipio">Município<input id="entrada-municipio" /></label>
            </div>
            <p class="cv-entry-note">Após iniciar o atendimento, o sistema abrirá as perguntas de triagem do Cabine Verde.</p>
            <div class="cv-entry-actions">
              <button type="button" class="cv-button cv-button--primary" id="iniciarAtendimentoBtn">Iniciar atendimento</button>
              <button type="button" class="cv-button cv-button--secondary" id="btnVoltarPainelOperacional">Voltar ao Painel</button>
              <button type="button" class="cv-button cv-button--ghost" id="trocarOperadorBtn">Trocar operador</button>
            </div>
          </form>
        </div>
      </section>
    </section>
    <section class="cv-card" data-tela="2" hidden>
      <h3>Tela 2 — Triagem</h3>
      <div class="cv-inline-actions">
        <span id="indicador-passo">PASSO 1 de 5</span>
      </div>
      <section class="cv-card">
        <form id="f" class="cv-form">
          <section class="cv-form-section" data-passo="1">
            <h3>Dados principais</h3>
            <div class="cv-grid">
              <label for="talaoPMESP">Número do Talão PMESP<input id="talaoPMESP" name="talaoPMESP" data-sync-key="talaoPMESP" required placeholder="Ex: 7450" /></label>
              <input type="hidden" name="talaoBopm" data-sync-key="talaoPMESP" />
              <label>Nome da pessoa desaparecida<input name="nomeCompletoDesaparecido" data-sync-key="nomeCompletoDesaparecido" required /></label>
              <label>Sexo ou gênero<input name="sexoGenero" data-sync-key="sexoGenero" /></label>
              <label>Idade<input name="idade" data-sync-key="idade" type="number" min="0" required /></label>
              <label>Município<input name="municipio" data-sync-key="municipio" required /></label>
              <label>Data/hora última visualização<input name="dataHoraUltimaVisualizacao" data-sync-key="dataHoraUltimaVisualizacao" type="datetime-local" /></label>
              <label>Local da última visualização<input name="localUltimaVisualizacao" data-sync-key="localUltimaVisualizacao" /></label>
              <label>Roupa da última visualização<input name="roupaUltimaVisualizacao" data-sync-key="roupaUltimaVisualizacao" /></label>
              <label>Meio de transporte<input name="meioTransporte" data-sync-key="meioTransporte" /></label>
              <label>Dados do veículo/transporte<input name="dadosVeiculo" data-sync-key="dadosVeiculo" /></label>
              <label>Foto digital disponível?
                <select name="fotoDisponivel" id="fotoDisponivel" data-sync-key="fotoDisponivel">
                  ${OPCOES_SIM_NAO_NI.map((item) => `<option value="${item}">${item || 'Selecione'}</option>`).join('')}
                </select>
              </label>
              <label>Há dispositivo vinculado?
                <select name="dispositivoLigado" data-sync-key="dispositivoLigado">
                  ${OPCOES_SIM_NAO_NI.map((item) => `<option value="${item}">${item || 'Selecione'}</option>`).join('')}
                </select>
              </label>
              <label>Telefone/dispositivo da pessoa<input name="telefoneDesaparecido" data-sync-key="telefoneDesaparecido" /></label>
              <label>Vulnerabilidade identificada?
                <select name="vulnerabilidade" data-sync-key="vulnerabilidade">
                  ${OPCOES_SIM_NAO_NI.map((item) => `<option value="${item}">${item || 'Selecione'}</option>`).join('')}
                </select>
              </label>
              <label>Suspeita de crime?
                <select name="suspeitaCrime" data-sync-key="suspeitaCrime">
                  ${OPCOES_SIM_NAO_NI.map((item) => `<option value="${item}">${item || 'Selecione'}</option>`).join('')}
                </select>
              </label>
              <label>Câmeras na residência?
                <select name="camerasResidencia" data-sync-key="camerasResidencia">
                  ${OPCOES_SIM_NAO_NI.map((item) => `<option value="${item}">${item || 'Selecione'}</option>`).join('')}
                </select>
              </label>
              <label>Câmeras no último local?
                <select name="camerasUltimoLocal" data-sync-key="camerasUltimoLocal">
                  ${OPCOES_SIM_NAO_NI.map((item) => `<option value="${item}">${item || 'Selecione'}</option>`).join('')}
                </select>
              </label>
              <label>Status<input name="statusCaso" value="Em triagem" /></label>
            </div>
          </section>
          <section class="cv-form-section" data-passo="2">
            <h3>Dados do Solicitante</h3>
            <div class="cv-grid">
              <label>Nome do solicitante<input name="nomeSolicitante" required /></label>
              <label>Vínculo do solicitante<input name="vinculoSolicitante" /></label>
              <label>Telefone do solicitante<input name="telefoneSolicitante" required /></label>
            </div>
          </section>
          <section class="cv-form-section" data-passo="3">
            ${renderArvore()}
          </section>
          <section class="cv-form-section" data-passo="4">
            <h3>Observações operacionais do operador</h3>
            <label>Observações<textarea name="observacoesOperador" rows="4"></textarea></label>
          </section>
          <section class="cv-form-section" data-passo="5">
            <h3>Fechamento da Triagem</h3>
            <p class="cv-section-helper">Revise os dados e avance para a decisão operacional.</p>
          </section>
          <div class="cv-inline-actions cv-step-header-actions" role="group" aria-label="Navegação entre etapas da triagem">
            <button type="button" class="cv-button cv-button--ghost" id="passoVoltarBtn">Voltar</button>
            <button type="button" class="cv-button cv-button--secondary" id="passoProximoBtn">Próximo</button>
          </div>
        </form>
      </section>
    </section>
    <section class="cv-card" data-tela="3" hidden>
      <h3>Tela 3 — Fechamento da Triagem</h3>
      <h4>Resumo operacional</h4><dl id="resumo"></dl>
      <div class="cv-grid">
        <label>Risco<input id="decisao-risco" readonly /></label>
        <label>Prioridade<input id="decisao-prioridade" readonly /></label>
        <label>Status<input id="decisao-status" readonly /></label>
      </div>
      <div id="blocoUploadFotoDesaparecido" class="cv-photo-upload" hidden>
        <label for="fotoDesaparecido">Inserir foto do desaparecido</label>
        <input type="file" id="fotoDesaparecido" name="fotoDesaparecido" accept="image/*" capture="environment" />
        <div id="statusUploadFoto" class="cv-photo-status">Nenhuma imagem selecionada.</div>
        <img id="previewFotoDesaparecido" class="cv-photo-preview" alt="Prévia da foto do desaparecido" hidden />
        <button class="cv-button cv-button--secondary" type="button" id="btn-adicionar-foto-agora">Adicionar foto agora</button>
      </div>
      <div class="cv-inline-actions">
        <button class="cv-button" type="button" id="menuSalvarCaso">Salvar caso</button>
        <button class="cv-button cv-button--secondary" type="button" id="menuGerarRelatorio">Finalizar triagem</button>
        <button class="cv-button cv-button--ghost" type="button" id="voltarTriagemBtn">Voltar para triagem</button>
      </div>
      <div class="cv-section-helper">
        <p><strong>Salvar caso:</strong> grava as informações na planilha.</p>
        <p><strong>Finalizar triagem:</strong> salva e encerra a etapa de triagem.</p>
        <p><strong>Buscar caso:</strong> apenas consulta dados existentes.</p>
        <p><strong>Atualizar painel:</strong> apenas consulta qualidade dos dados.</p>
      </div>
    </section>
    <section class="cv-card"><h3>Feedback</h3><p id="feedback">Pronto para envio.</p></section>
    <details class="cv-card">
      <summary>Menu secundário</summary>
      <section class="cv-card"><h3>Casos</h3><ul>${casos.map((c) => `<li>${c.nomeCompletoDesaparecido} - ${c.classificacaoRisco}</li>`).join('')}</ul></section>
      <section class="cv-card" id="secaoAuditoriaOperacional">
      <h3>Consulta e auditoria de caso</h3>
      <label>Busca livre<input id="audit-campoBusca" placeholder="Talão, nome, idCaso, município..." /></label>
      <div class="cv-grid">
        <label>idCaso<input id="audit-idCaso" /></label>
        <label>talão PMESP<input id="audit-talaoPMESP" /></label>
        <label>Nome completo<input id="audit-nomeCompletoDesaparecido" /></label>
      </div>
      <button class="cv-button cv-button--secondary" type="button" id="buscarCasoBtn">Buscar caso</button>
      <article id="audit-resultado" class="cv-case-detail-grid">Informe ao menos um filtro para consulta.</article>
      <details>
        <summary>Timeline</summary>
        <ul id="audit-timeline"></ul>
      </details>
      </section>
      <section class="cv-card cv-relatorio-card" id="secaoRelatorioOperacional">
      <details id="relatorioContainer">
        <summary>Relatório operacional</summary>
        <textarea id="relatorio" rows="10" placeholder="Clique em &quot;Gerar relatório&quot; para montar o texto."></textarea>
        <div class="cv-relatorio-actions">
          <button type="button" class="cv-button cv-button--ghost" id="copiarRelatorioBtn">Copiar relatório</button>
        </div>
      </details>
      </section>
      <section class="cv-card">
      <h3>Painel de Qualidade dos Dados</h3>
      <div class="cv-prioridade-rapida" role="group" aria-label="Filtro rápido por prioridade de tratamento">
        <button class="cv-button cv-prioridade-btn" type="button" data-prioridade="URGENTE">URGENTE</button>
        <button class="cv-button cv-prioridade-btn cv-prioridade-btn--alta" type="button" data-prioridade="ALTA">ALTA</button>
        <button class="cv-button cv-prioridade-btn cv-prioridade-btn--media" type="button" data-prioridade="MEDIA">MEDIA</button>
        <button class="cv-button cv-prioridade-btn cv-prioridade-btn--baixa" type="button" data-prioridade="BAIXA">BAIXA</button>
      </div>
      <div class="cv-grid cv-grid--filters">
        <label>Total problemas<input id="qtd-totalProblemas" readonly /></label>
        <label>Total críticos<input id="qtd-totalCriticos" readonly /></label>
        <label>Total pendentes<input id="qtd-totalPendentes" readonly /></label>
        <label>Total resolvidos<input id="qtd-totalResolvidos" readonly /></label>
      </div>
      <div class="cv-grid cv-grid--filters">
        <label>Filtro idCaso<input id="qualidade-filtro-idCaso" /></label>
        <label>Filtro talão PMESP<input id="qualidade-filtro-talaoPMESP" /></label>
        <label>Filtro severidade<input id="qualidade-filtro-severidade" placeholder="CRITICA/ALTA/MEDIA" /></label>
        <label>Filtro prioridade tratamento<input id="qualidade-filtro-prioridadeTratamento" placeholder="URGENTE/ALTA/MEDIA/BAIXA" /></label>
        <label>Filtro status<input id="qualidade-filtro-statusTratamento" placeholder="PENDENTE/RESOLVIDO" /></label>
      </div>
      <button class="cv-button cv-button--secondary" type="button" id="atualizarQualidadeBtn">Atualizar painel</button>
      <div id="qualidade-lista" class="cv-case-detail-grid">Carregando inconsistências da aba QUALIDADE_DADOS...</div>
      </section>
    </details>
    <section class="cv-card cv-debug-panel${DEBUG_MODE ? '' : ' is-hidden'}" id="painelDebug">
      <h3>Debug integração GAS</h3>
      <p>Modo técnico ativo via <code>?debug=1</code>.</p>
      <h4>Payload gerado</h4>
      <pre id="payload"></pre>
      <h4>Resposta do GAS</h4>
      <pre id="gas-response">Aguardando envio.</pre>
    </section>
  </div>`;

  const form = document.getElementById('f');
  const atualizarUI = () => {
    const idade = form.querySelector('[name="idade"]').value;
    exibirSubabaPorIdade(idade);
    const caso = obterCasoDoFormulario();
    atualizarResumo(caso);
    if (DEBUG_MODE) {
      document.getElementById('payload').textContent = JSON.stringify(gerarPayloadSheets(caso), null, 2);
    }
  };


  const configurarUploadFotoDesaparecido = () => {
    const bloco = document.getElementById('blocoUploadFotoDesaparecido');
    const fotoInput = document.getElementById('fotoDesaparecido');
    const statusUpload = document.getElementById('statusUploadFoto');
    const preview = document.getElementById('previewFotoDesaparecido');
    const selectFoto = document.querySelector('[name="fotoDigitalDisponivel"], [name="fotoDisponivel"], #fotoDigitalDisponivel, #fotoDisponivel');

    console.info('[FOTO] select encontrado:', selectFoto);
    console.info('[FOTO] bloco encontrado:', bloco);

    if (!bloco || !statusUpload || !preview || !fotoInput || !selectFoto) return;

    const mostrarBlocoUploadFoto = () => {
      const valor = String(selectFoto?.value || '').trim().toLowerCase();
      const visivel = valor === 'sim' || valor === 'true' || valor === '1';
      bloco.hidden = !visivel;
      console.info('[FOTO] valor selecionado:', selectFoto?.value);
      console.info('[FOTO] bloco visível:', !bloco?.hidden);
    };

    if (!selectFoto.dataset.fotoUploadBind) {
      selectFoto.addEventListener('change', mostrarBlocoUploadFoto);
      selectFoto.dataset.fotoUploadBind = '1';
    }

    if (!fotoInput.dataset.fotoPreviewBind) {
      fotoInput.addEventListener('change', () => {
        const arquivo = fotoInput.files?.[0];
        if (!arquivo) {
          statusUpload.textContent = 'Nenhuma imagem selecionada.';
          preview.hidden = true;
          preview.removeAttribute('src');
          return;
        }
        preview.src = URL.createObjectURL(arquivo);
        preview.hidden = false;
        statusUpload.textContent = 'Imagem pronta para envio. Clique em Adicionar foto agora.';
      });
      fotoInput.dataset.fotoPreviewBind = '1';
    }

    mostrarBlocoUploadFoto();
  };

  const sincronizarEAtualizar = (event) => {
    sincronizarCamposDuplicados(event);
    atualizarUI();
  configurarUploadFotoDesaparecido();
  };

  form?.addEventListener('input', sincronizarEAtualizar);
  form?.addEventListener('change', sincronizarEAtualizar);
  const telas = Array.from(document.querySelectorAll('[data-tela]'));
  const mostrarTela = (numero) => telas.forEach((tela) => { tela.hidden = tela.dataset.tela !== String(numero); });
  let passoAtual = 1;
  const atualizarPassos = () => {
    form.querySelectorAll('[data-passo]').forEach((bloco) => { bloco.hidden = Number(bloco.dataset.passo) !== passoAtual; });
    document.getElementById('indicador-passo').textContent = `PASSO ${passoAtual} de 5`;
  };
  

  const navegarParaSecaoOperacional = ({ secaoId, detailsId }) => {
    const secao = document.getElementById(secaoId);
    const details = detailsId ? document.getElementById(detailsId) : null;

    if (details && 'open' in details) details.open = true;

    const menuSecundario = details?.closest('details');
    if (menuSecundario && 'open' in menuSecundario) menuSecundario.open = true;

    const destino = secao || details;
    if (destino && typeof destino.scrollIntoView === 'function') {
      destino.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const mostrarSplashEsperanca = (callback) => {
    const overlay = document.createElement('div');
    overlay.className = 'cv-transition-splash';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = '<span class="cv-transition-splash__word">ESPERANÇA</span>';
    document.body.appendChild(overlay);

    const reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duracao = reduzirMovimento ? 900 : 1050;
    const removerOverlay = () => {
      overlay.classList.remove('is-visible');
      window.setTimeout(() => overlay.remove(), reduzirMovimento ? 100 : 260);
    };

    window.requestAnimationFrame(() => {
      overlay.classList.add('is-visible');
    });

    window.setTimeout(() => {
      try {
        if (typeof callback === 'function') callback();
      } finally {
        removerOverlay();
      }
    }, duracao);
  };

  document.getElementById('btnAcessarRelatorio')?.addEventListener('click', () => {
    mostrarSplashEsperanca(() => {
      navegarParaSecaoOperacional({ secaoId: 'secaoRelatorioOperacional', detailsId: 'relatorioContainer' });
    });
  });

  document.getElementById('btnAcessarAuditoria')?.addEventListener('click', () => {
    mostrarSplashEsperanca(() => {
      navegarParaSecaoOperacional({ secaoId: 'secaoAuditoriaOperacional' });
    });
  });

  document.getElementById('btnAcessarInsercaoCaso')?.addEventListener('click', () => {
    mostrarSplashEsperanca(() => {
      const painelSelecaoOperacional = document.getElementById('painelSelecaoOperacional');
      const entradaOperacionalModulo = document.getElementById('entradaOperacionalModulo');
      if (painelSelecaoOperacional) painelSelecaoOperacional.hidden = true;
      if (entradaOperacionalModulo) entradaOperacionalModulo.hidden = false;
      const campoEntrada = document.getElementById('entrada-talaoPMESP');
      campoEntrada?.focus();
      campoEntrada?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });

  document.getElementById('btnVoltarPainelOperacional')?.addEventListener('click', () => {
    mostrarSplashEsperanca(() => {
      const painelSelecaoOperacional = document.getElementById('painelSelecaoOperacional');
      const entradaOperacionalModulo = document.getElementById('entradaOperacionalModulo');
      if (entradaOperacionalModulo) entradaOperacionalModulo.hidden = true;
      if (painelSelecaoOperacional) painelSelecaoOperacional.hidden = false;
    });
  });

  document.getElementById('iniciarAtendimentoBtn')?.addEventListener('click', () => {
    const talao = document.getElementById('entrada-talaoPMESP').value.trim();
    if (!talao) return atualizarFeedback('Número do Talão PMESP é obrigatório.', true);
    form.querySelector('[name="talaoPMESP"]').value = talao;
    const campoTalaoBopm = form.querySelector('[name="talaoBopm"]');
    if (campoTalaoBopm) campoTalaoBopm.value = talao;
        form.querySelector('[name="municipio"]').value = document.getElementById('entrada-municipio').value.trim();
    mostrarTela(2);
    atualizarPassos();
    configurarUploadFotoDesaparecido();
    form.querySelector('[name="nomeCompletoDesaparecido"]')?.focus();
  });
  document.getElementById('passoProximoBtn')?.addEventListener('click', () => {
    if (passoAtual < 5) {
      passoAtual += 1;
      atualizarPassos();
      configurarUploadFotoDesaparecido();
      return;
    }
    mostrarTela(3);
    const casoAtual = obterCasoDoFormulario();
    document.getElementById('decisao-risco').value = casoAtual.classificacaoRisco || '-';
    document.getElementById('decisao-prioridade').value = casoAtual.prioridade || '-';
    document.getElementById('decisao-status').value = casoAtual.statusCaso || '-';
  });
  document.getElementById('passoVoltarBtn')?.addEventListener('click', () => {
    if (passoAtual > 1) passoAtual -= 1;
    atualizarPassos();
    configurarUploadFotoDesaparecido();
  });
  document.getElementById('voltarTriagemBtn')?.addEventListener('click', () => { mostrarTela(2); configurarUploadFotoDesaparecido(); });
  atualizarUI();
  configurarUploadFotoDesaparecido();

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const botaoSubmit = form.querySelector('button[type="submit"], #btnMain');
    if (botaoSubmit?.disabled) return;
    if (!operadorEstaValidadoLocalmente()) return atualizarFeedback('Operador não validado. Faça o login operacional para continuar.', true);
    const caso = obterCasoDoFormulario();
    if (DEBUG_MODE) console.debug('[TRIAGEM] valor do talão antes do submit:', { talaoPMESP: caso.talaoPMESP, talaoBopm: caso.talaoBopm });
    if (!caso.talaoBopm) {
      atualizarFeedback('Número do Talão PMESP é obrigatório.', true);
      return;
    }
    if (!validarCamposMinimos(caso)) {
      atualizarFeedback('Preencha os campos mínimos: nome do desaparecido, município, nome do solicitante e telefone do solicitante.', true);
      return;
    }

    try {
      if (botaoSubmit) {
        botaoSubmit.disabled = true;
        botaoSubmit.dataset.originalText = botaoSubmit.textContent || '';
        botaoSubmit.textContent = 'Enviando...';
      }

      logBotaoOperacional('Finalizar triagem', caso);
      if (DEBUG_MODE) console.debug('[TRIAGEM] payload enviado para salvarCasoSheets:', caso);
      const retorno = await salvarCasoSheets(caso);
    console.log('RESPOSTA GAS:', retorno);
    if (DEBUG_MODE) {
      document.getElementById('gas-response').textContent = JSON.stringify(retorno, null, 2);
    }

    if (retorno.ok && retorno.status !== 'duplicado_ignorado') {
      const identificadorRetorno =
        retorno?.data?.idCaso ||
        retorno?.idCaso ||
        retorno?.data?.protocolo ||
        retorno?.protocolo ||
        retorno?.data?.talaoPMESP ||
        retorno?.data?.talaoBopm;
      renderFeedbackOperacional('sucesso', {
        talao: caso.talaoPMESP || caso.talaoBopm || identificadorRetorno,
        statusCaso: caso.statusCaso,
        prioridade: caso.prioridade,
        classificacaoRisco: caso.classificacaoRisco
      });
      casos.unshift(caso);
      localStorage.setItem('cabine-verde-casos', JSON.stringify(casos));
    } else if (retorno.status === 'duplicado_ignorado') {
      atualizarFeedback('Envio duplicado ignorado pelo backend (idempotência ativa).');
    } else {
      renderFeedbackOperacional('erro');
    }

    render();
    registrarEventosSessao();
    } catch (error) {
      console.error('Falha ao enviar caso para salvarCasoSheets:', error);
      renderFeedbackOperacional('erro');
    } finally {
      if (botaoSubmit) {
        botaoSubmit.disabled = false;
        botaoSubmit.textContent = botaoSubmit.dataset.originalText || 'FINALIZAR CADASTRO';
      }
    }
  });

  const carregarCasoTriagemViaUrl = async () => {
    const filtro = lerParametrosTriagemUrl();
    if (!filtro.idCaso && !filtro.talaoPMESP && !filtro.nomeCompletoDesaparecido) return;

    try {
      const resposta = await buscarCaso_(filtro);
      if (!resposta?.ok || !resposta?.caso) throw new Error(resposta?.mensagem || 'Caso não encontrado para edição.');
      preencherFormularioComCaso(resposta.caso);
      mostrarTela(2);
      passoAtual = 1;
      atualizarPassos();
      atualizarFeedback('Caso carregado automaticamente para continuidade da triagem.');
    } catch (error) {
      atualizarFeedback(error.message || 'Não foi possível carregar o caso informado pela URL.', true);
    }
  };

  const renderResultadoAuditoria = (caso) => {
    const resumoFotos = caso.fotoDisponivel ? 'Foto registrada (link protegido).' : 'Sem foto registrada.';
    document.getElementById('audit-resultado').innerHTML = `
      <p><strong>${caso.idCaso || caso.id || '-'}</strong> · ${caso.statusCaso || '-'}</p>
      <p>Desaparecido: ${caso.nomeCompletoDesaparecido || '-'} · Talão PMESP: ${caso.talaoPMESP || '-'}</p>
      <p>Risco: ${caso.classificacaoRisco || '-'} · Prioridade: ${caso.prioridade || '-'}</p>
      <p>Resumo de fotos: ${resumoFotos}</p>
      <p>CPF: ${mascararDadoSensivel(caso.cpf)} · RG: ${mascararDadoSensivel(caso.rg)}</p>
      <div class="cv-relatorio-actions">
        <button class="cv-button cv-button--ghost" type="button" id="verTimelineBtn" data-id="${caso.idCaso || caso.id}">Ver timeline</button>
        ${podeEditarCaso ? `<button class="cv-button" type="button" id="editarCasoBtn" data-id="${caso.idCaso || caso.id}">Editar caso</button>` : ''}
      </div>`;
  };

  const encaminharParaAuditoria = () => {
    const campoBusca = document.getElementById('audit-campoBusca');
    const termoCampoBusca = campoBusca?.value?.trim() || '';
    const termoFallback = [
      document.getElementById('audit-idCaso')?.value?.trim() || '',
      document.getElementById('audit-talaoPMESP')?.value?.trim() || '',
      document.getElementById('audit-nomeCompletoDesaparecido')?.value?.trim() || ''
    ].find(Boolean) || '';
    const termo = (termoCampoBusca || termoFallback).trim();

    if (!termo) {
      atualizarFeedback('Informe o talão, nome ou identificador do caso.', true);
      return;
    }

    window.location.href = `./auditoria.html?termo=${encodeURIComponent(termo)}`;
  };

  document.getElementById('buscarCasoBtn')?.addEventListener('click', () => {
    if (!operadorEstaValidadoLocalmente()) return atualizarFeedback('Operador não validado. Faça o login operacional para continuar.', true);
    encaminharParaAuditoria();
  });

  document.getElementById('audit-resultado')?.addEventListener('click', async (event) => {
    const alvo = event.target;
    if (!(alvo instanceof HTMLElement)) return;
    if (alvo.id === 'verTimelineBtn') {
      const idCaso = alvo.dataset.id || '';
      try {
        const resposta = await gerarTimelineCaso_(idCaso);
        const eventos = (resposta.timeline || []).sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime());
        document.getElementById('audit-timeline').innerHTML = eventos.length
          ? eventos.map((ev) => `<li><strong>${new Date(ev.dataHora).toLocaleString('pt-BR')}</strong> · ${ev.evento}</li>`).join('')
          : '<li>Sem eventos de timeline.</li>';
      } catch (error) {
        atualizarFeedback(error.message || 'Falha ao gerar timeline.', true);
      }
    }
    if (alvo.id === 'editarCasoBtn') {
      const idCaso = alvo.dataset.id || '';
      const emailConfirmacaoOperador = window.prompt('Confirme seu email corporativo para editar o caso:', '') || '';
      if (!emailConfirmacaoOperador.trim()) return atualizarFeedback('Confirmação de email obrigatória para editar caso.', true);
      const justificativaEdicao = window.prompt('Justificativa da edição (obrigatória):', '') || '';
      if (!justificativaEdicao.trim()) return atualizarFeedback('Justificativa obrigatória para editar caso.', true);
      const observacoesOperacionais = window.prompt('Nova observação operacional:', '') || '';
      try {
        await editarCasoControlado_(
          idCaso,
          { perfil: PERFIL_OPERADOR(), nome: 'Operador Cabine Verde' },
          { observacoesOperacionais },
          justificativaEdicao,
          emailConfirmacaoOperador
        );
        atualizarFeedback('Caso editado com sucesso. Histórico atualizado.');
      } catch (error) {
        atualizarFeedback(error.message || 'Falha ao editar caso.', true);
      }
    }
  });

  const gerarRelatorio = () => {
    document.getElementById('relatorio').value = gerarRelatorioOperacional(casos);
    document.getElementById('relatorioContainer').open = true;
    atualizarFeedback('Relatório gerado.');
  };

  document.getElementById('menuSalvarCaso')?.addEventListener('click', () => {
    logBotaoOperacional('Salvar caso', { action: 'salvarCaso' });
    console.log('action: salvarCaso');
    form.requestSubmit();
  });
  document.getElementById('menuGerarRelatorio')?.addEventListener('click', () => {
    logBotaoOperacional('Finalizar triagem', { action: 'salvarCaso', etapa: 'encerramentoTriagem' });
    form.requestSubmit();
  });
  document.getElementById('menuNovoCaso')?.addEventListener('click', () => {
    form.reset();
    atualizarUI();
  configurarUploadFotoDesaparecido();
    atualizarFeedback('Novo caso iniciado.');
  });
  document.getElementById('menuLimparFormulario')?.addEventListener('click', () => {
    form.reset();
    atualizarUI();
  configurarUploadFotoDesaparecido();
    atualizarFeedback('Formulário limpo.');
  });
  document.getElementById('menuVerResumo')?.addEventListener('click', () => {
    document.getElementById('resumo').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  document.getElementById('copiarRelatorioBtn')?.addEventListener('click', async () => {
    const texto = document.getElementById('relatorio').value.trim();
    if (!texto) {
      atualizarFeedback('Gerar relatório antes de copiar.', true);
      return;
    }
    await navigator.clipboard.writeText(texto);
    atualizarFeedback('Relatório gerado.');
  });

  const lerFiltrosQualidade = () => ({
    idCaso: document.getElementById('qualidade-filtro-idCaso').value.trim().toLowerCase(),
    talaoPMESP: document.getElementById('qualidade-filtro-talaoPMESP').value.trim().toLowerCase(),
    severidade: document.getElementById('qualidade-filtro-severidade').value.trim().toLowerCase(),
    prioridadeTratamento: document.getElementById('qualidade-filtro-prioridadeTratamento').value.trim().toLowerCase(),
    statusTratamento: document.getElementById('qualidade-filtro-statusTratamento').value.trim().toLowerCase()
  });
  const ordemPrioridadeTratamento = { URGENTE: 0, ALTA: 1, MEDIA: 2, BAIXA: 3 };
  const obterPrioridadeTratamento = (item) => {
    const prioridade = String(item.prioridadeTratamento || '').toUpperCase();
    if (prioridade) return prioridade;
    const campo = String(item.campo || '');
    if (campo === 'talaoPMESP' || campo === 'classificacaoRisco') return 'URGENTE';
    const severidade = String(item.severidade || '').toUpperCase();
    if (severidade === 'CRITICA') return 'URGENTE';
    if (severidade === 'ALTA') return 'ALTA';
    if (severidade === 'MEDIA') return 'MEDIA';
    return 'BAIXA';
  };
  const aplicarFiltroQualidade = (item, filtro) =>
    (!filtro.idCaso || String(item.idCaso || '').toLowerCase().includes(filtro.idCaso)) &&
    (!filtro.talaoPMESP || String(item.talaoPMESP || '').toLowerCase().includes(filtro.talaoPMESP)) &&
    (!filtro.severidade || String(item.severidade || '').toLowerCase().includes(filtro.severidade)) &&
    (!filtro.prioridadeTratamento || obterPrioridadeTratamento(item).toLowerCase().includes(filtro.prioridadeTratamento)) &&
    (!filtro.statusTratamento || String(item.statusTratamento || '').toLowerCase().includes(filtro.statusTratamento));
  const filtrarPorPerfil = (lista) => {
    if (['SUPERVISOR', 'ADMIN', 'AUDITOR'].includes(PERFIL_OPERADOR())) return lista;
    if (PERFIL_OPERADOR() !== 'OPERADOR') return lista;
    const idsRegistrados = new Set(casos.filter((c) => String(c.operadorResponsavel || '').trim().toLowerCase() === NOME_OPERADOR().toLowerCase()).map((c) => c.idCaso || c.id));
    return lista.filter((item) => String(item.statusTratamento || '').toUpperCase() === 'PENDENTE' && (idsRegistrados.size ? idsRegistrados.has(item.idCaso) : true));
  };
  const renderListaQualidade = (resumo) => {
    document.getElementById('qtd-totalProblemas').value = String(resumo.totalProblemas || 0);
    document.getElementById('qtd-totalCriticos').value = String(resumo.totalCriticos || 0);
    document.getElementById('qtd-totalPendentes').value = String(resumo.totalPendentes || 0);
    document.getElementById('qtd-totalResolvidos').value = String(resumo.totalResolvidos || 0);
    const inconsistencias = Array.isArray(resumo.inconsistencias) ? resumo.inconsistencias : [];
    const lista = filtrarPorPerfil(inconsistencias)
      .map((item) => ({ ...item, prioridadeTratamento: obterPrioridadeTratamento(item) }))
      .filter((item) => aplicarFiltroQualidade(item, lerFiltrosQualidade()))
      .sort((a, b) => (ordemPrioridadeTratamento[a.prioridadeTratamento] ?? 99) - (ordemPrioridadeTratamento[b.prioridadeTratamento] ?? 99));
    const alvo = document.getElementById('qualidade-lista');
    alvo.innerHTML = lista.length ? lista.map((item) => `<section class="cv-prioridade-card cv-prioridade-card--${String(item.prioridadeTratamento || 'BAIXA').toLowerCase()}">
      <p><strong>${item.idCaso || '-'}</strong> · Talão: ${item.talaoPMESP || '-'} · ${item.severidade || '-'} · <strong>Tratamento: ${item.prioridadeTratamento || 'BAIXA'}</strong></p>
      <p>Campo: ${item.campo || '-'} · Status: ${item.statusTratamento || 'PENDENTE'}</p>
      <p>${item.problema || '-'}</p>
      ${['SUPERVISOR', 'ADMIN'].includes(PERFIL_OPERADOR()) && String(item.statusTratamento || '').toUpperCase() !== 'RESOLVIDO' ? `<button class="cv-button" data-cmd="resolver-qualidade" data-idcaso="${item.idCaso || ''}" data-campo="${item.campo || ''}" data-problema="${item.problema || ''}">Marcar como resolvido</button>` : ''}
    </section>`).join('') : '<p>Nenhuma inconsistência para os filtros/perfil informados.</p>';
  };
  const atualizarPainelQualidade = async () => {
    const resumo = await resumoQualidadeDados_();
    renderListaQualidade(resumo);
  };
  document.getElementById('atualizarQualidadeBtn')?.addEventListener('click', async () => {
    try {
      logBotaoOperacional('Atualizar painel', { action: 'resumoQualidadeDados_' });
      await atualizarPainelQualidade();
      console.log('RESPOSTA GAS:', { ok: true, action: 'resumoQualidadeDados_' });
    } catch (error) { atualizarFeedback(error.message || 'Falha ao atualizar painel de qualidade.', true); }
  });
  ['qualidade-filtro-idCaso', 'qualidade-filtro-talaoPMESP', 'qualidade-filtro-severidade', 'qualidade-filtro-prioridadeTratamento', 'qualidade-filtro-statusTratamento'].forEach((id) =>
    document.getElementById(id)?.addEventListener('input', () => atualizarPainelQualidade().catch(() => {}))
  );
  document.querySelectorAll('.cv-prioridade-btn').forEach((botao) => {
    botao?.addEventListener('click', () => {
      document.getElementById('qualidade-filtro-prioridadeTratamento').value = botao.dataset.prioridade || '';
      atualizarPainelQualidade().catch(() => {});
    });
  });
  document.getElementById('qualidade-lista')?.addEventListener('click', async (event) => {
    const alvo = event.target;
    if (!(alvo instanceof HTMLElement) || alvo.dataset.cmd !== 'resolver-qualidade') return;
    if (!['SUPERVISOR', 'ADMIN'].includes(PERFIL_OPERADOR())) return atualizarFeedback('Apenas SUPERVISOR/ADMIN pode marcar como resolvido.', true);
    await marcarProblemaQualidadeResolvido_(alvo.dataset.idcaso || '', alvo.dataset.campo || '', alvo.dataset.problema || '', NOME_OPERADOR());
    atualizarFeedback('Problema marcado como resolvido.');
    await atualizarPainelQualidade();
  });
  atualizarPainelQualidade().catch(() => atualizarFeedback('Falha ao carregar painel de qualidade.', true));
  carregarCasoTriagemViaUrl().catch(() => {});
};

const registrarEventosSessao = () => {
  const validarEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const mensagemLogin = document.getElementById('mensagemLoginOperacional');
  document.getElementById('btnValidarOperador')?.addEventListener('click', async () => {
    const input = document.getElementById('operadorEmail');
    const email = String(input?.value || '').trim().toLowerCase();
    if (!validarEmail(email)) {
      if (mensagemLogin) mensagemLogin.textContent = 'Informe um e-mail institucional válido.';
      return;
    }
    if (mensagemLogin) mensagemLogin.textContent = 'Validando operador...';
    try {
      logBotaoOperacional('Validar operador', { operadorEmail: email });
      const resposta = await validarOperador_(email);
      console.log('RESPOSTA GAS:', resposta);
      if (resposta?.autorizado && resposta?.operador) {
        salvarOperadorLocal(resposta.operador);
        atualizarFeedback('Operador validado com sucesso. Acesso liberado.');
        render();
        registrarEventosSessao();
        return;
      }
      if (mensagemLogin) mensagemLogin.textContent = resposta?.mensagem || 'Operador não autorizado. Verifique o e-mail ou solicite cadastro.';
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Não foi possível validar o operador. Verifique a conexão e tente novamente.';
      if (mensagemLogin) mensagemLogin.textContent = mensagem;
    }
  });
  document.getElementById('trocarOperadorBtn')?.addEventListener('click', () => {
    limparOperadorLocal();
    render();
    registrarEventosSessao();
  });

};

(async () => {
  render();
  registrarEventosSessao();
  const health = await healthcheckSheets();
  atualizarFeedback(health.ok ? 'Endpoint ativo' : health.message || 'Caso salvo localmente para envio.', !health.ok);
})();
