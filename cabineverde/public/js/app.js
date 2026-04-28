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

const perguntas = {
  Criança: ['Estava sob supervisão direta?', 'Há disputa familiar?'],
  'Pré-adolescente': ['Desaparecimento após escola?', 'Suspeita de aliciamento virtual?'],
  Adolescente: ['Indícios de fuga voluntária?', 'Ameaça em rede social?'],
  Adulto: ['Mudança abrupta de comportamento?', 'Indícios de violência?'],
  Idoso: ['Demência/desorientação?', 'Uso de medicação essencial?']
};

const atualizarFeedback = (mensagem, erro = false) => {
  const feedback = document.getElementById('feedback');
  if (!feedback) return;
  feedback.textContent = mensagem;
  feedback.classList.toggle('danger', erro);
};

const render = () => {
  app.innerHTML = `
  <div class="cv-shell">
    <header class="cv-header"><h1>Cabine Verde</h1><p>Triagem dinâmica e relatório operacional</p></header>
    <section class="cv-card">
      <form id="f" class="cv-form">
        <div class="cv-grid">
          <label>Nome<input name="nomeCompletoDesaparecido" required/></label>
          <label>Idade<input name="idade" type="number" required/></label>
          <label>Município<input name="municipio" required/></label>
          <label>Último local<input name="localUltimaVisualizacao"/></label>
          <label>Status<input name="statusCaso" value="Em triagem"/></label>
        </div>
        <div class="cv-grid">
          <label class="cv-check"><input type="checkbox" name="vulnerabilidade"/> Vulnerabilidade</label>
          <label class="cv-check"><input type="checkbox" name="suspeitaCrime"/> Suspeita de crime</label>
          <label class="cv-check"><input type="checkbox" name="fotoDisponivel"/> Foto disponível</label>
          <label class="cv-check"><input type="checkbox" name="dispositivoLigado"/> Dispositivo ligado</label>
          <label class="cv-check"><input type="checkbox" name="camerasResidencia"/> Câmeras residência</label>
          <label class="cv-check"><input type="checkbox" name="camerasUltimoLocal"/> Câmeras último local</label>
        </div>
        <button type="submit">Salvar</button>
        <button type="button" id="relatorioBtn">Gerar relatório</button>
      </form>
    </section>
    <section class="cv-card"><h3>Feedback</h3><p id="feedback">Pronto para envio.</p></section>
    <section class="cv-card"><h3>Perguntas dinâmicas</h3><ul id="perguntas"></ul></section>
    <section class="cv-card"><h3>Resumo</h3><pre id="resumo"></pre></section>
    <section class="cv-card"><h3>Payload Sheets</h3><pre id="payload"></pre></section>
    <section class="cv-card"><h3>Casos</h3><ul>${casos.map((c) => `<li>${c.nomeCompletoDesaparecido} - ${c.classificacaoRisco}</li>`).join('')}</ul></section>
    <section class="cv-card"><h3>Relatório diário</h3><textarea id="relatorio" rows="10"></textarea></section>
  </div>`;

  const form = document.getElementById('f');
  form.addEventListener('input', () => {
    const data = new FormData(form);
    const faixa = calcularFaixaEtaria(Number(data.get('idade') || 0));
    document.getElementById('perguntas').innerHTML = (perguntas[faixa] || []).map((p) => `<li>${p}</li>`).join('');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const caso = Object.fromEntries(data.entries());
    ['vulnerabilidade', 'suspeitaCrime', 'fotoDisponivel', 'dispositivoLigado', 'camerasResidencia', 'camerasUltimoLocal'].forEach((k) => (caso[k] = data.get(k) === 'on'));
    caso.idade = Number(caso.idade || 0);
    caso.faixaEtaria = calcularFaixaEtaria(caso.idade);
    caso.classificacaoRisco = calcularRisco(caso);
    caso.prioridade = calcularPrioridade(caso);
    caso.aptoCabineVerde = calcularAptoCabineVerde(caso);
    caso.acaoSugerida = caso.classificacaoRisco === 'Alto risco' ? 'Acionar protocolo prioritário.' : 'Monitorar e atualizar.';

    const retorno = await salvarCasoSheets(caso);
    const metadados = [retorno.idCaso ? `idCaso: ${retorno.idCaso}` : '', Number.isFinite(retorno.linha) ? `linha: ${retorno.linha}` : '', retorno.action ? `ação: ${retorno.action}` : '']
      .filter(Boolean)
      .join(' | ');

    if (retorno.ok) {
      atualizarFeedback(`${retorno.action === 'updated' ? 'Caso atualizado com sucesso' : 'Caso criado com sucesso'}${metadados ? ` (${metadados})` : ''}`);
      casos.unshift(caso);
      localStorage.setItem('cabine-verde-casos', JSON.stringify(casos));
    } else {
      const msg = retorno.message === 'Endpoint indisponível' ? 'Endpoint indisponível' : retorno.message === 'Erro de integração com Google Sheets' ? 'Erro de integração com Google Sheets' : 'Falha ao salvar caso';
      atualizarFeedback(`${msg}${metadados ? ` (${metadados})` : ''}`, true);
    }

    document.getElementById('resumo').textContent = JSON.stringify(caso, null, 2);
    document.getElementById('payload').textContent = JSON.stringify(gerarPayloadSheets(caso), null, 2);
    render();
  });

  document.getElementById('relatorioBtn').addEventListener('click', () => {
    document.getElementById('relatorio').value = gerarRelatorioOperacional(casos);
  });
};

(async () => {
  render();
  const health = await healthcheckSheets();
  if (!health.ok) atualizarFeedback('Endpoint indisponível', true);
})();
