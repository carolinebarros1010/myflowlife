import {
  calcularFaixaEtaria,
  calcularRisco,
  calcularPrioridade,
  calcularAptoCabineVerde,
  gerarPayloadSheets,
  gerarRelatorioOperacional,
  salvarCasoSheets,
  healthcheckSheets
} from './core.js';

const app = document.getElementById('app');
const casos = JSON.parse(localStorage.getItem('cabine-verde-casos') || '[]');
const DEBUG_ENVIO_GAS = true;
const camposObrigatoriosEnvio = ['nomeCompletoDesaparecido', 'municipio', 'nomeSolicitante', 'telefoneSolicitante'];
const mensagemCamposMinimos =
  'Preencha os campos mínimos: nome do desaparecido, município, nome do solicitante e telefone do solicitante.';

const textosFaixa = {
  Criança: {
    titulo: 'Bloco Criança (0–7)',
    motivo: 'Apareceu porque a idade informada está entre 0 e 7 anos.',
    perguntas: ['Estava sob supervisão direta?', 'Há disputa familiar?', 'Há adulto desconhecido ou veículo suspeito?']
  },
  'Pré-adolescente': {
    titulo: 'Bloco Pré-adolescente (8–11)',
    motivo: 'Apareceu porque a idade informada está entre 8 e 11 anos.',
    perguntas: ['Desaparecimento após escola?', 'Histórico de saída sem autorização?', 'Suspeita de aliciamento virtual?']
  },
  Adolescente: {
    titulo: 'Bloco Adolescente (12–17)',
    motivo: 'Apareceu porque a idade informada está entre 12 e 17 anos.',
    perguntas: ['Há indícios de fuga voluntária?', 'Houve conflito familiar/escolar recente?', 'Há ameaça em rede social?']
  },
  Adulto: {
    titulo: 'Bloco Adulto (18–59)',
    motivo: 'Apareceu porque a idade informada está entre 18 e 59 anos.',
    perguntas: ['Mudança abrupta de comportamento?', 'Histórico de conflito prévio?', 'Há indícios de violência?']
  },
  Idoso: {
    titulo: 'Bloco Idoso (60+)',
    motivo: 'Apareceu porque a idade informada é igual ou maior que 60 anos.',
    perguntas: ['Há demência/desorientação?', 'Uso de medicação essencial?', 'Há limitação de locomoção?']
  }
};

const atualizarFeedback = (mensagem, erro = false) => {
  const feedback = document.getElementById('feedback');
  if (!feedback) return;
  feedback.textContent = mensagem;
  feedback.classList.toggle('danger', erro);
};

const atualizarPainelDebug = ({ payload = null, status = '', resposta = null } = {}) => {
  const payloadEl = document.getElementById('debug-payload');
  const statusEl = document.getElementById('debug-status');
  const respostaEl = document.getElementById('debug-response');

  if (payloadEl && payload) payloadEl.textContent = JSON.stringify(payload, null, 2);
  if (statusEl && status) statusEl.textContent = status;
  if (respostaEl && resposta) respostaEl.textContent = JSON.stringify(resposta, null, 2);

  if (!DEBUG_ENVIO_GAS) return;
  if (payload) console.log('[CabineVerde][GAS] payload gerado', payload);
  if (status) console.log('[CabineVerde][GAS] status envio', status);
  if (resposta) console.log('[CabineVerde][GAS] resposta GAS', resposta);
};

const atualizarResumo = (caso = {}) => {
  const resumo = document.getElementById('resumo');
  if (!resumo) return;
  const linhas = [
    ['Nome', caso.nomeCompletoDesaparecido || '-'],
    ['Idade/Faixa', `${caso.idade || 0} / ${caso.faixaEtaria || calcularFaixaEtaria(Number(caso.idade || 0))}`],
    ['Solicitante', caso.nomeSolicitante || '-'],
    ['Telefone solicitante', caso.telefoneSolicitante || '-'],
    ['Vínculo solicitante', caso.vinculoSolicitante || '-'],
    ['Risco', caso.classificacaoRisco || calcularRisco(caso)],
    ['Prioridade', caso.prioridade || calcularPrioridade(caso)],
    ['Apto Cabine Verde', caso.aptoCabineVerde ? 'Sim' : 'Não'],
    ['Suspeita de crime', caso.suspeitaCrime ? 'Sim' : 'Não'],
    ['Foto disponível', caso.fotoDisponivel ? 'Sim' : 'Não'],
    ['Apoio tecnológico', caso.camerasResidencia || caso.camerasUltimoLocal ? 'Sim' : 'Não'],
    ['Vulnerabilidade', caso.vulnerabilidade ? 'Sim' : 'Não']
  ];

  resumo.innerHTML = linhas
    .map(([rotulo, valor]) => `<dt>${rotulo}</dt><dd>${valor}</dd>`)
    .join('');
};

const renderBlocosDinamicos = (caso = {}) => {
  const container = document.getElementById('blocosDinamicos');
  if (!container) return;

  const faixa = calcularFaixaEtaria(Number(caso.idade || 0));
  const blocoFaixa = textosFaixa[faixa];

  const blocos = [
    `
    <section class="cv-dynamic-block" aria-live="polite">
      <h4>${blocoFaixa.titulo}</h4>
      <p class="cv-dynamic-reason">${blocoFaixa.motivo}</p>
      <ul>${blocoFaixa.perguntas.map((pergunta) => `<li>${pergunta}</li>`).join('')}</ul>
    </section>
    `
  ];

  if (caso.suspeitaCrime) {
    blocos.push(`
      <section class="cv-dynamic-block">
        <h4>Bloco de indícios criminais</h4>
        <p class="cv-dynamic-reason">Apareceu porque “suspeita de crime” foi marcado como sim.</p>
        <label>Descreva os indícios observados
          <textarea name="indiciosCriminais" placeholder="Ex.: ameaça prévia, conflito, local de risco..."></textarea>
        </label>
      </section>
    `);
  }

  if (caso.fotoDisponivel) {
    blocos.push(`
      <section class="cv-dynamic-block">
        <h4>Bloco de imagem/foto</h4>
        <p class="cv-dynamic-reason">Apareceu porque “foto disponível” foi marcado como sim.</p>
        <label>Link da foto
          <input name="linkFoto" type="url" placeholder="https://..." value="${caso.linkFoto || ''}"/>
        </label>
      </section>
    `);
  }

  if (caso.camerasResidencia || caso.camerasUltimoLocal) {
    blocos.push(`
      <section class="cv-dynamic-block">
        <h4>Bloco de apoio tecnológico</h4>
        <p class="cv-dynamic-reason">Apareceu porque há câmeras na residência ou no último local.</p>
        <label>Detalhes do apoio tecnológico
          <textarea name="detalhesApoioTecnologico" placeholder="Ex.: tipo de câmera, horário, contato de acesso..."></textarea>
        </label>
      </section>
    `);
  }

  if (caso.vulnerabilidade) {
    blocos.push(`
      <section class="cv-dynamic-block">
        <h4>Bloco de detalhamento de vulnerabilidade</h4>
        <p class="cv-dynamic-reason">Apareceu porque “vulnerabilidade” foi marcado como sim.</p>
        <label>Condição mental/cognitiva/comportamental
          <input name="condicaoMentalCognitivaComportamental" value="${caso.condicaoMentalCognitivaComportamental || ''}" />
        </label>
        <label>Limitação física
          <input name="limitacaoFisica" value="${caso.limitacaoFisica || ''}" />
        </label>
        <label class="cv-check"><input type="checkbox" name="usoMedicacaoEssencial" ${caso.usoMedicacaoEssencial ? 'checked' : ''}/> Uso de medicação essencial</label>
      </section>
    `);
  }

  container.innerHTML = blocos.join('');
};

const obterCasoDoFormulario = (form) => {
  const data = new FormData(form);
  const caso = Object.fromEntries(data.entries());
  [
    'vulnerabilidade',
    'suspeitaCrime',
    'fotoDisponivel',
    'dispositivoLigado',
    'camerasResidencia',
    'camerasUltimoLocal',
    'usoMedicacaoEssencial'
  ].forEach((k) => (caso[k] = data.get(k) === 'on'));

  caso.idade = Number(caso.idade || 0);
  caso.faixaEtaria = calcularFaixaEtaria(caso.idade);
  caso.classificacaoRisco = calcularRisco(caso);
  caso.prioridade = calcularPrioridade(caso);
  caso.aptoCabineVerde = calcularAptoCabineVerde(caso);
  caso.acaoSugerida = caso.classificacaoRisco === 'Alto risco' ? 'Acionar protocolo prioritário.' : 'Monitorar e atualizar.';

  return caso;
};

const validarCamposMinimos = (caso) => {
  const pendencias = camposObrigatoriosEnvio.filter((campo) => !String(caso[campo] || '').trim());
  return {
    valido: pendencias.length === 0,
    pendencias
  };
};

const render = () => {
  app.innerHTML = `
  <div class="cv-shell">
    <header class="cv-header"><h1>Cabine Verde</h1><p>Triagem dinâmica e relatório operacional</p></header>
    <div class="cv-operational-grid">
      <section class="cv-card">
        <form id="f" class="cv-form">
          <div class="cv-grid">
            <label>Nome<input name="nomeCompletoDesaparecido" required/></label>
            <label>Idade<input name="idade" type="number" min="0" required/></label>
            <label>Município<input name="municipio" required/></label>
            <label>Último local<input name="localUltimaVisualizacao"/></label>
            <label>Status<input name="statusCaso" value="Em triagem"/></label>
          </div>
          <section class="cv-form-section">
            <h3>Dados do Solicitante</h3>
            <div class="cv-grid">
              <label>Nome do solicitante<input name="nomeSolicitante" required/></label>
              <label>Vínculo do solicitante<input name="vinculoSolicitante"/></label>
              <label>Telefone do solicitante<input name="telefoneSolicitante" required/></label>
            </div>
          </section>
          <div class="cv-grid">
            <label class="cv-check"><input type="checkbox" name="vulnerabilidade"/> Vulnerabilidade</label>
            <label class="cv-check"><input type="checkbox" name="suspeitaCrime"/> Suspeita de crime</label>
            <label class="cv-check"><input type="checkbox" name="fotoDisponivel"/> Foto disponível</label>
            <label class="cv-check"><input type="checkbox" name="dispositivoLigado"/> Dispositivo ligado</label>
            <label class="cv-check"><input type="checkbox" name="camerasResidencia"/> Câmeras residência</label>
            <label class="cv-check"><input type="checkbox" name="camerasUltimoLocal"/> Câmeras último local</label>
          </div>

          <section class="cv-card cv-conditional">
            <h3>Blocos dinâmicos da triagem</h3>
            <p>Os blocos aparecem automaticamente conforme idade e respostas operacionais.</p>
            <div id="blocosDinamicos"></div>
          </section>

          <button type="submit">Salvar caso</button>
          <button type="button" id="relatorioBtn">Gerar relatório</button>
        </form>
      </section>

      <aside class="cv-card cv-live-summary">
        <h3>Resumo lateral em tempo real</h3>
        <dl id="resumo"></dl>
      </aside>
    </div>

    <section class="cv-card"><h3>Feedback</h3><p id="feedback">Pronto para envio.</p></section>
    <section class="cv-card"><h3>Payload Sheets</h3><pre id="payload"></pre></section>
    <section class="cv-card"><h3>Retorno GAS</h3><pre id="gas-response">Aguardando envio.</pre></section>
    <section class="cv-card">
      <h3>Debug integração GAS</h3>
      <p><strong>Status:</strong> <span id="debug-status">Pronto para envio.</span></p>
      <details>
        <summary>Payload gerado</summary>
        <pre id="debug-payload"></pre>
      </details>
      <details>
        <summary>Resposta do GAS</summary>
        <pre id="debug-response"></pre>
      </details>
    </section>
    <section class="cv-card"><h3>Casos</h3><ul>${casos.map((c) => `<li>${c.nomeCompletoDesaparecido} - ${c.classificacaoRisco}</li>`).join('')}</ul></section>
    <section class="cv-card"><h3>Relatório diário</h3><textarea id="relatorio" rows="10"></textarea></section>
  </div>`;

  const form = document.getElementById('f');

  const atualizarUI = () => {
    const casoAtual = obterCasoDoFormulario(form);
    renderBlocosDinamicos(casoAtual);
    atualizarResumo(casoAtual);
    const payload = gerarPayloadSheets(casoAtual);
    document.getElementById('payload').textContent = JSON.stringify(payload, null, 2);
    atualizarPainelDebug({ payload, status: 'Payload pronto para envio.' });
  };

  form.addEventListener('input', atualizarUI);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const caso = obterCasoDoFormulario(form);
    const payload = gerarPayloadSheets(caso);
    const validacaoMinima = validarCamposMinimos(caso);
    if (!validacaoMinima.valido) {
      atualizarFeedback(mensagemCamposMinimos, true);
      atualizarPainelDebug({ payload, status: 'Envio bloqueado por validação de campos mínimos.' });
      return;
    }

    atualizarPainelDebug({ payload, status: 'Enviando payload para Apps Script...' });

    const retorno = await salvarCasoSheets(caso);
    atualizarPainelDebug({
      status: retorno.ok ? 'Envio concluído com sucesso.' : 'Falha no envio ao Apps Script.',
      resposta: retorno
    });
    const respostaEl = document.getElementById('gas-response');
    if (respostaEl) respostaEl.textContent = JSON.stringify(retorno, null, 2);
    const metadados = [retorno.idCaso ? `idCaso: ${retorno.idCaso}` : '', Number.isFinite(retorno.linha) ? `linha: ${retorno.linha}` : '', retorno.action ? `ação: ${retorno.action}` : '']
      .filter(Boolean)
      .join(' | ');

    if (retorno.ok) {
      atualizarFeedback(retorno.action === 'updated' ? 'Caso atualizado com sucesso' : 'Caso criado com sucesso');
      casos.unshift(caso);
      localStorage.setItem('cabine-verde-casos', JSON.stringify(casos));
    } else {
      atualizarFeedback(retorno.message || 'Falha ao salvar caso', true);
      if (retorno.message === 'Backend GAS não publicado ou doGet ausente') {
        const ajuda = 'Verifique se foi feito novo deploy do Apps Script';
        atualizarFeedback(`${retorno.message}. ${ajuda}`, true);
      }
    }

    if (metadados) {
      const feedback = document.getElementById('feedback');
      feedback.textContent = `${feedback.textContent} (${metadados})`;
    }

    render();
  });

  document.getElementById('relatorioBtn').addEventListener('click', () => {
    document.getElementById('relatorio').value = gerarRelatorioOperacional(casos);
  });

  atualizarUI();
};

(async () => {
  render();
  const health = await healthcheckSheets();
  if (health.ok) {
    atualizarFeedback('Endpoint ativo');
    return;
  }

  atualizarFeedback(health.message || 'Falha ao salvar caso', true);
  if (health.message === 'Backend GAS não publicado ou doGet ausente') {
    const feedback = document.getElementById('feedback');
    feedback.textContent = 'Backend GAS não publicado ou doGet ausente. Verifique se foi feito novo deploy do Apps Script';
  }
})();
