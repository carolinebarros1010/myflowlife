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
const DEBUG_MODE = new URLSearchParams(window.location.search).get('debug') === '1';

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
  app.innerHTML = `
  <div class="cv-shell">
    <header class="cv-header"><h1>Cabine Verde</h1><p>Triagem dinâmica de pessoas desaparecidas</p></header>
    <div class="cv-operational-grid">
      <section class="cv-card">
        <form id="f" class="cv-form">
          <section class="cv-form-section">
            <h3>Dados principais</h3>
            <p class="cv-section-helper">Preenchimento rápido operacional. Campos equivalentes na árvore oficial são sincronizados automaticamente.</p>
            <div class="cv-grid">
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
        </form>
      </section>
      <aside class="cv-card cv-live-summary"><h3>Resumo operacional</h3><dl id="resumo"></dl></aside>
    </div>
    <section class="cv-card"><h3>Feedback</h3><p id="feedback">Pronto para envio.</p></section>
    <section class="cv-card"><h3>Casos</h3><ul>${casos.map((c) => `<li>${c.nomeCompletoDesaparecido} - ${c.classificacaoRisco}</li>`).join('')}</ul></section>
    <section class="cv-card cv-relatorio-card">
      <details id="relatorioContainer">
        <summary>Relatório operacional</summary>
        <textarea id="relatorio" rows="10" placeholder="Clique em &quot;Gerar relatório&quot; para montar o texto."></textarea>
        <div class="cv-relatorio-actions">
          <button type="button" class="cv-button cv-button--ghost" id="copiarRelatorioBtn">Copiar relatório</button>
        </div>
      </details>
    </section>
    <section class="cv-card cv-debug-panel${DEBUG_MODE ? '' : ' is-hidden'}" id="painelDebug">
      <h3>Debug integração GAS</h3>
      <p>Modo técnico ativo via <code>?debug=1</code>.</p>
      <h4>Payload gerado</h4>
      <pre id="payload"></pre>
      <h4>Resposta do GAS</h4>
      <pre id="gas-response">Aguardando envio.</pre>
    </section>
    <nav class="cv-fixed-menu" aria-label="Ações operacionais">
      <button class="cv-button" type="button" id="menuSalvarCaso">Salvar caso</button>
      <button class="cv-button cv-button--secondary" type="button" id="menuGerarRelatorio">Gerar relatório</button>
      <button class="cv-button cv-button--ghost" type="button" id="menuNovoCaso">Novo caso</button>
      <button class="cv-button cv-button--ghost" type="button" id="menuLimparFormulario">Limpar formulário</button>
      <button class="cv-button cv-button--ghost" type="button" id="menuVerResumo">Ver resumo</button>
    </nav>
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
  atualizarUI();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
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
  });

  const gerarRelatorio = () => {
    document.getElementById('relatorio').value = gerarRelatorioOperacional(casos);
    document.getElementById('relatorioContainer').open = true;
    atualizarFeedback('Relatório gerado.');
  };

  document.getElementById('menuSalvarCaso').addEventListener('click', () => form.requestSubmit());
  document.getElementById('menuGerarRelatorio').addEventListener('click', gerarRelatorio);
  document.getElementById('menuNovoCaso').addEventListener('click', () => {
    form.reset();
    atualizarUI();
    atualizarFeedback('Novo caso iniciado.');
  });
  document.getElementById('menuLimparFormulario').addEventListener('click', () => {
    form.reset();
    atualizarUI();
    atualizarFeedback('Formulário limpo.');
  });
  document.getElementById('menuVerResumo').addEventListener('click', () => {
    document.getElementById('resumo').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  document.getElementById('copiarRelatorioBtn').addEventListener('click', async () => {
    const texto = document.getElementById('relatorio').value.trim();
    if (!texto) {
      atualizarFeedback('Gerar relatório antes de copiar.', true);
      return;
    }
    await navigator.clipboard.writeText(texto);
    atualizarFeedback('Relatório gerado.');
  });
};

(async () => {
  render();
  const health = await healthcheckSheets();
  atualizarFeedback(health.ok ? 'Endpoint ativo' : health.message || 'Caso salvo localmente para envio.', !health.ok);
})();
