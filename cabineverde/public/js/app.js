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
const casos = JSON.parse(localStorage.getItem('cabine-verde-casos') || '[]');
const camposObrigatoriosEnvio = ['nomeCompletoDesaparecido', 'municipio', 'nomeSolicitante', 'telefoneSolicitante'];
const DEBUG_MODE = new URLSearchParams(window.location.search).get('debug') === '1';
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

  const caso = {
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
      <section class="cv-card cv-login-operacional" data-tela="0">
        <h2>Login Operacional</h2>
        <p>Informe seu e-mail institucional para acessar o sistema Cabine Verde.</p>
        <label for="operadorEmail">E-mail institucional do operador</label>
        <input id="operadorEmail" name="operadorEmail" type="email" required placeholder="seunome@dominio.com" autocomplete="email" />
        <button type="button" class="cv-button cv-button--primary" id="btnValidarOperador">Validar operador</button>
        <p id="mensagemLoginOperacional"></p>
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
    <section class="cv-card" data-tela="1">
      <h3>Tela 1 — Entrada Operacional</h3>
      <p>Operador: <strong>${operadorAtual.operadorNome || operadorAtual.operadorEmail || '-'}</strong> (${operadorAtual.operadorPerfil || '-'})</p>
      <form id="entrada-operacional-form" class="cv-form-section cv-operational-entry">
        <div class="cv-grid">
          <label for="entrada-talaoPMESP">Número do Talão PMESP<input id="entrada-talaoPMESP" required /></label>
          <label for="entrada-municipio">Município<input id="entrada-municipio" /></label>
        </div>
        <div class="cv-inline-actions">
          <button type="button" class="cv-button cv-button--primary" id="iniciarAtendimentoBtn">Iniciar atendimento</button>
          <button type="button" class="cv-button cv-button--ghost" id="trocarOperadorBtn">Trocar operador</button>
        </div>
      </form>
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
                <select name="fotoDisponivel" data-sync-key="fotoDisponivel">
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
          <div class="cv-inline-actions">
            <button type="button" class="cv-button cv-button--ghost" id="passoVoltarBtn">Voltar</button>
            <button type="button" class="cv-button cv-button--secondary" id="passoProximoBtn">Próximo</button>
          </div>
        </form>
      </section>
    </section>
    <section class="cv-card" data-tela="3" hidden>
      <h3>Tela 3 — Decisão Operacional</h3>
      <h4>Resumo operacional</h4><dl id="resumo"></dl>
      <div class="cv-grid">
        <label>Risco<input id="decisao-risco" readonly /></label>
        <label>Prioridade<input id="decisao-prioridade" readonly /></label>
        <label>Status<input id="decisao-status" readonly /></label>
      </div>
      <div class="cv-inline-actions">
        <button class="cv-button" type="button" id="menuSalvarCaso">Despacho</button>
        <button class="cv-button cv-button--secondary" type="button" id="menuGerarRelatorio">Encaminhamento</button>
        <button class="cv-button cv-button--ghost" type="button" id="voltarTriagemBtn">Voltar para triagem</button>
      </div>
    </section>
    <section class="cv-card"><h3>Feedback</h3><p id="feedback">Pronto para envio.</p></section>
    <details class="cv-card">
      <summary>Menu secundário</summary>
      <section class="cv-card"><h3>Casos</h3><ul>${casos.map((c) => `<li>${c.nomeCompletoDesaparecido} - ${c.classificacaoRisco}</li>`).join('')}</ul></section>
      <section class="cv-card">
      <h3>Consulta e auditoria de caso</h3>
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
      <section class="cv-card cv-relatorio-card">
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

  const sincronizarEAtualizar = (event) => {
    sincronizarCamposDuplicados(event);
    atualizarUI();
  };

  form.addEventListener('input', sincronizarEAtualizar);
  form.addEventListener('change', sincronizarEAtualizar);
  const telas = Array.from(document.querySelectorAll('[data-tela]'));
  const mostrarTela = (numero) => telas.forEach((tela) => { tela.hidden = tela.dataset.tela !== String(numero); });
  let passoAtual = 1;
  const atualizarPassos = () => {
    form.querySelectorAll('[data-passo]').forEach((bloco) => { bloco.hidden = Number(bloco.dataset.passo) !== passoAtual; });
    document.getElementById('indicador-passo').textContent = `PASSO ${passoAtual} de 5`;
  };
  document.getElementById('iniciarAtendimentoBtn')?.addEventListener('click', () => {
    const talao = document.getElementById('entrada-talaoPMESP').value.trim();
    if (!talao) return atualizarFeedback('Número do Talão PMESP é obrigatório.', true);
    form.querySelector('[name="talaoPMESP"]').value = talao;
    form.querySelector('[name="municipio"]').value = document.getElementById('entrada-municipio').value.trim();
    mostrarTela(2);
    atualizarPassos();
    form.querySelector('[name="nomeCompletoDesaparecido"]')?.focus();
  });
  document.getElementById('passoProximoBtn').addEventListener('click', () => {
    if (passoAtual < 5) {
      passoAtual += 1;
      atualizarPassos();
      return;
    }
    mostrarTela(3);
    const casoAtual = obterCasoDoFormulario();
    document.getElementById('decisao-risco').value = casoAtual.classificacaoRisco || '-';
    document.getElementById('decisao-prioridade').value = casoAtual.prioridade || '-';
    document.getElementById('decisao-status').value = casoAtual.statusCaso || '-';
  });
  document.getElementById('passoVoltarBtn').addEventListener('click', () => {
    if (passoAtual > 1) passoAtual -= 1;
    atualizarPassos();
  });
  document.getElementById('voltarTriagemBtn').addEventListener('click', () => mostrarTela(2));
  atualizarUI();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!operadorEstaValidadoLocalmente()) return atualizarFeedback('Operador não validado. Faça o login operacional para continuar.', true);
    const caso = obterCasoDoFormulario();
    if (!validarCamposMinimos(caso)) {
      atualizarFeedback('Preencha os campos mínimos: nome do desaparecido, município, nome do solicitante e telefone do solicitante.', true);
      return;
    }

    const retorno = await salvarCasoSheets(caso);
    if (DEBUG_MODE) {
      document.getElementById('gas-response').textContent = JSON.stringify(retorno, null, 2);
    }

    if (retorno.ok) {
      atualizarFeedback('Caso enviado para processamento.');
      casos.unshift(caso);
      localStorage.setItem('cabine-verde-casos', JSON.stringify(casos));
    } else {
      atualizarFeedback('Caso salvo localmente para envio.', true);
    }

    render();
    registrarEventosSessao();
  });

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

  document.getElementById('buscarCasoBtn')?.addEventListener('click', async () => {
    if (!operadorEstaValidadoLocalmente()) return atualizarFeedback('Operador não validado. Faça o login operacional para continuar.', true);
    const filtro = {
      idCaso: document.getElementById('audit-idCaso').value.trim(),
      talaoPMESP: document.getElementById('audit-talaoPMESP').value.trim(),
      nomeCompletoDesaparecido: document.getElementById('audit-nomeCompletoDesaparecido').value.trim()
    };
    if (!filtro.idCaso && !filtro.talaoPMESP && !filtro.nomeCompletoDesaparecido) return atualizarFeedback('Informe ao menos um filtro para consulta.', true);
    try {
      const resposta = await buscarCaso_(filtro);
      const caso = Array.isArray(resposta.casos) ? resposta.casos[0] : resposta.caso;
      if (!caso) throw new Error('Caso não localizado.');
      renderResultadoAuditoria(caso);
      atualizarFeedback('Caso localizado para auditoria.');
    } catch (error) {
      atualizarFeedback(error.message || 'Falha na consulta do caso.', true);
    }
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

  document.getElementById('menuSalvarCaso')?.addEventListener('click', () => form.requestSubmit());
  document.getElementById('menuGerarRelatorio')?.addEventListener('click', gerarRelatorio);
  document.getElementById('menuNovoCaso')?.addEventListener('click', () => {
    form.reset();
    atualizarUI();
    atualizarFeedback('Novo caso iniciado.');
  });
  document.getElementById('menuLimparFormulario')?.addEventListener('click', () => {
    form.reset();
    atualizarUI();
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
    try { await atualizarPainelQualidade(); } catch (error) { atualizarFeedback(error.message || 'Falha ao atualizar painel de qualidade.', true); }
  });
  ['qualidade-filtro-idCaso', 'qualidade-filtro-talaoPMESP', 'qualidade-filtro-severidade', 'qualidade-filtro-prioridadeTratamento', 'qualidade-filtro-statusTratamento'].forEach((id) =>
    document.getElementById(id).addEventListener('input', () => atualizarPainelQualidade().catch(() => {}))
  );
  document.querySelectorAll('.cv-prioridade-btn').forEach((botao) => {
    botao.addEventListener('click', () => {
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
      const resposta = await validarOperador_(email);
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
