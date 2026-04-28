import {
  calcularFaixaEtaria,
  calcularRisco,
  calcularPrioridade,
  calcularAptoCabineVerde,
  gerarPayloadSheets,
  gerarRelatorioOperacional,
  salvarCasoSheets,
  healthcheckSheets,
  ARVORE_DECISAO_CONFIG,
  OPCOES_SIM_NAO_NI,
  gerarObservacoesArvore,
  avaliarAlertasArvore,
  contarPerguntasRespondidas,
  mapearIndicadoresOperacionais,
  calcularCriticidadeIndicadores,
  listarIndicadoresAtivos,
  sugerirAcaoIndicadores,
  anexarIndicadoresObservacoes
} from './core.js';

const app = document.getElementById('app');
const casos = JSON.parse(localStorage.getItem('cabine-verde-casos') || '[]');
const camposObrigatoriosEnvio = ['nomeCompletoDesaparecido', 'municipio', 'nomeSolicitante', 'telefoneSolicitante'];

const atualizarFeedback = (mensagem, erro = false) => {
  const feedback = document.getElementById('feedback');
  if (!feedback) return;
  feedback.textContent = mensagem;
  feedback.classList.toggle('danger', erro);
};

const renderPergunta = (pergunta) => {
  const nomeResposta = `arvore__${pergunta.id}`;
  const nomeComplemento = `comp__${pergunta.id}`;
  const resposta =
    pergunta.tipo === 'simNao'
      ? `<select name="${nomeResposta}">${OPCOES_SIM_NAO_NI.map((item) => `<option value="${item}">${item || 'Selecione'}</option>`).join('')}</select>`
      : `<input name="${nomeResposta}" type="text"/>`;

  const complemento = pergunta.complementoLabel
    ? `<label class="cv-complemento">Complemento (${pergunta.complementoLabel})<input type="text" name="${nomeComplemento}"/></label>`
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

const obterCasoDoFormulario = () => {
  const form = document.getElementById('f');
  const data = new FormData(form);
  const idade = Number(data.get('idade') || 0);
  const faixaEtaria = calcularFaixaEtaria(idade);
  const { respostas, complementos } = obterArvoreFormulario(form, faixaEtaria);

  const observacoesOperador = String(data.get('observacoesOperador') || '').trim();
  const { texto: observacoesArvore, alertas } = gerarObservacoesArvore({
    respostas,
    complementos,
    faixaEtaria,
    observacoesOperador
  });

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
    observacoesOperacionais: anexarIndicadoresObservacoes(observacoesArvore, indicadoresOperacionais),
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
    ['Faixa etária', caso.faixaEtaria],
    ['Subaba ativa', caso.faixaEtaria],
    ['Perguntas respondidas', String(respondidas)],
    ['Alertas relevantes', alertas.join(' | ') || '-'],
    ['Indicadores ativos', indicadoresAtivos.length ? indicadoresAtivos.join(' | ') : '-'],
    ['Criticidade indicadores', caso.criticidadeIndicadores],
    ['Sugestão de ação', caso.acaoSugerida],
    ['Suspeita de crime', caso.suspeitaCrime ? 'Sim' : 'Não'],
    ['Vulnerabilidade', caso.vulnerabilidade ? 'Sim' : 'Não'],
    ['Aptidão Cabine Verde', caso.aptoCabineVerde ? 'Sim' : 'Não']
  ]
    .map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`)
    .join('');
};

const validarCamposMinimos = (caso) => camposObrigatoriosEnvio.every((campo) => String(caso[campo] || '').trim());

const render = () => {
  app.innerHTML = `
  <div class="cv-shell">
    <header class="cv-header"><h1>Cabine Verde</h1><p>Triagem dinâmica de pessoas desaparecidas</p></header>
    <div class="cv-operational-grid">
      <section class="cv-card">
        <form id="f" class="cv-form">
          <section class="cv-form-section">
            <h3>Dados principais</h3>
            <div class="cv-grid">
              <label>Nome da pessoa desaparecida<input name="nomeCompletoDesaparecido" required /></label>
              <label>Sexo ou gênero<input name="sexoGenero" /></label>
              <label>Idade<input name="idade" type="number" min="0" required /></label>
              <label>Município<input name="municipio" required /></label>
              <label>Data/hora última visualização<input name="dataHoraUltimaVisualizacao" type="datetime-local" /></label>
              <label>Status<input name="statusCaso" value="Em triagem" /></label>
            </div>
          </section>
          <section class="cv-form-section">
            <h3>Dados do Solicitante</h3>
            <div class="cv-grid">
              <label>Nome do solicitante<input name="nomeSolicitante" required /></label>
              <label>Vínculo do solicitante<input name="vinculoSolicitante" /></label>
              <label>Telefone do solicitante<input name="telefoneSolicitante" required /></label>
            </div>
          </section>
          ${renderArvore()}
          <section class="cv-form-section">
            <h3>Observações operacionais do operador</h3>
            <label>Observações<textarea name="observacoesOperador" rows="4"></textarea></label>
          </section>
          <div class="cv-action-footer">
            <button class="cv-button" type="submit">Salvar caso</button>
            <button class="cv-button cv-button--secondary" type="button" id="relatorioBtn">Gerar relatório</button>
          </div>
        </form>
      </section>
      <aside class="cv-card cv-live-summary"><h3>Resumo lateral em tempo real</h3><dl id="resumo"></dl></aside>
    </div>
    <section class="cv-card"><h3>Feedback</h3><p id="feedback">Pronto para envio.</p></section>
    <section class="cv-card"><h3>Payload Sheets</h3><pre id="payload"></pre></section>
    <section class="cv-card"><h3>Retorno GAS</h3><pre id="gas-response">Aguardando envio.</pre></section>
    <section class="cv-card"><h3>Casos</h3><ul>${casos.map((c) => `<li>${c.nomeCompletoDesaparecido} - ${c.classificacaoRisco}</li>`).join('')}</ul></section>
    <section class="cv-card"><h3>Relatório diário</h3><textarea id="relatorio" rows="10"></textarea></section>
  </div>`;

  const form = document.getElementById('f');
  const atualizarUI = () => {
    const idade = form.querySelector('[name="idade"]').value;
    exibirSubabaPorIdade(idade);
    const caso = obterCasoDoFormulario();
    atualizarResumo(caso);
    document.getElementById('payload').textContent = JSON.stringify(gerarPayloadSheets(caso), null, 2);
  };

  form.addEventListener('input', atualizarUI);
  atualizarUI();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const caso = obterCasoDoFormulario();
    if (!validarCamposMinimos(caso)) {
      atualizarFeedback('Preencha os campos mínimos: nome do desaparecido, município, nome do solicitante e telefone do solicitante.', true);
      return;
    }

    const retorno = await salvarCasoSheets(caso);
    document.getElementById('gas-response').textContent = JSON.stringify(retorno, null, 2);

    if (retorno.ok) {
      atualizarFeedback(retorno.message || 'Caso enviado para processamento (modo silencioso)');
      casos.unshift(caso);
      localStorage.setItem('cabine-verde-casos', JSON.stringify(casos));
    } else {
      atualizarFeedback(retorno.message || 'Falha ao salvar caso', true);
    }

    render();
  });

  document.getElementById('relatorioBtn').addEventListener('click', () => {
    document.getElementById('relatorio').value = gerarRelatorioOperacional(casos);
  });
};

(async () => {
  render();
  const health = await healthcheckSheets();
  atualizarFeedback(health.ok ? 'Endpoint ativo' : health.message || 'Falha ao salvar caso', !health.ok);
})();
