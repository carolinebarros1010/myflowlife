import { renderMainLayout } from './components/layout/MainLayout.js';
import { renderTriageForm, statusFallback } from './components/form/TriageForm.js';
import { etapasTriagem, renderProgressSteps } from './components/triagem/ProgressSteps.js';
import { renderAgeSections } from './components/triagem/AgeSections.js';
import { renderCaseSummary } from './components/desaparecidos/CaseSummary.js';
import { renderCaseList } from './components/desaparecidos/CaseList.js';
import { renderCaseDetails } from './components/desaparecidos/CaseDetails.js';
import { renderReportView } from './components/relatorios/ReportView.js';
import { normalizarTelefone, normalizarTexto, toBoolean } from './utils/normalizers.js';
import { gerarResumoCaso } from './utils/summary.js';
import { GoogleSheetsService } from './services/sheetsService.js';
import { gerarPayloadSheets } from './utils/sheetsPayload.js';
import { listarCasos, salvarCasoLocal } from './services/caseRepository.js';
import { montarRelatorio, montarRelatorioEstatistico, montarRelatorioSIOPM } from './modules/relatorios/reportModule.js';
import { casosMock } from './data/mockCases.js';
import { renderPerguntasFaixa } from './components/triagem/ConditionalQuestions.js';
import { calcularFaixaEtaria } from './utils/age.js';
import type { CasoCompleto, CasoDesaparecimento } from './types/case.js';
import { StatusCaso } from './types/enums.js';
import { renderCaseStatusBanner } from './components/triagem/CaseStatusBanner.js';
import { renderRiskBadgePanel } from './components/triagem/RiskBadgePanel.js';
import { renderCaseLiveSummary } from './components/triagem/CaseLiveSummary.js';
import { renderActionFooter } from './components/triagem/ActionFooter.js';
import { renderConditionalSection } from './components/triagem/ConditionalSection.js';
import { renderRecentCasesPanel } from './components/desaparecidos/RecentCasesPanel.js';
import { calcularEstadoTriagem } from './modules/triagem/triagemState.js';
import type { TriagemState } from './modules/triagem/triagemState.js';
import { carregarRascunhoLocal, exportarRascunhoSessao, gerarSessionId, importarRascunhoSessao, salvarRascunhoLocal } from './services/draftSessionService.js';
import { listarLogs, registrarLog } from './services/auditLogService.js';
import { renderSessionPanel } from './components/triagem/SessionPanel.js';
import { renderAuditLogPanel } from './components/desaparecidos/AuditLogPanel.js';
import { listarIndicadoresAtivos, sugerirAcaoIndicadores } from './modules/triagem/indicadoresOperacionais.js';

const sheetsService = new GoogleSheetsService();
const chaveEtapaAtual = 'cabine-verde-etapa-atual';

const MAX_FOTO_BYTES = 5 * 1024 * 1024;

const converterArquivoParaBase64 = (arquivo: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const resultado = String(reader.result || '');
      const base64 = resultado.includes(',') ? resultado.split(',')[1] : resultado;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Falha ao converter arquivo para base64.'));
    reader.readAsDataURL(arquivo);
  });

const validarJustificativaVisualizacao = (justificativa: string): boolean => {
  const original = String(justificativa || '');
  const normalizada = original.trim().replace(/\s+/g, ' ');
  const analisada = normalizada.toLowerCase();
  const bloqueadas = new Set(['ok', 'teste', '-', 'ver', 'foto', 'visualizar']);
  const apenasNumeros = /^\d+$/;
  const temPalavraMinima = analisada.split(' ').some((parte) => parte.trim().length > 3);
  return normalizada.length >= 10 && !bloqueadas.has(analisada) && !apenasNumeros.test(analisada) && temPalavraMinima;
};
let sessionId = gerarSessionId();

const baseLayout = () =>
  [
    renderProgressSteps(),
    renderCaseStatusBanner(),
    '<section class="cv-operational-grid">',
    '<div>',
    renderTriageForm(),
    renderConditionalSection('crime-block', 'Indícios de crime', 'Detalhe ameaças, testemunhas e evidências digitais que justifiquem despacho imediato.'),
    renderConditionalSection('tech-block', 'Apoio tecnológico ativo', 'Registre câmeras, rastreio de dispositivo e fontes de mídia com potencial de localização.'),
    renderConditionalSection('age-block', 'Subfluxo por faixa etária', 'Perguntas dinâmicas para ampliar entendimento do risco específico.'),
    renderActionFooter(),
    '</div>',
    '<div>',
    renderRiskBadgePanel(),
    renderCaseLiveSummary(),
    renderSessionPanel(),
    renderCaseSummary(),
    '</div>',
    '</section>',
    renderRecentCasesPanel(),
    `<div id="case-list-wrapper">${renderCaseList(listarCasos().length ? listarCasos() : casosMock)}</div>`,
    renderCaseDetails(),
    renderAuditLogPanel(),
    renderReportView(),
    renderAgeSections()
  ].join('');

const app = document.getElementById('app');
if (app) app.innerHTML = renderMainLayout(baseLayout());

const form = document.getElementById('triage-form') as HTMLFormElement | null;
const initial = Number(localStorage.getItem(chaveEtapaAtual) || 0);

const buildCasoFromForm = (dados: FormData): CasoDesaparecimento => ({
  id: normalizarTexto(String(dados.get('idCaso') || '')) || `CV-${Date.now()}`,
  talaoPMESP: normalizarTexto(String(dados.get('talaoPMESP') || '')),
  dataHoraRegistro: String(dados.get('dataHoraRegistro') || new Date().toISOString()),
  municipio: normalizarTexto(String(dados.get('municipio') || '')),
  talaoBopm: normalizarTexto(String(dados.get('talaoBopm') || '')),
  nomeCompletoDesaparecido: normalizarTexto(String(dados.get('nomeCompletoDesaparecido') || '')),
  sexoGenero: normalizarTexto(String(dados.get('sexoGenero') || '')),
  idade: Number(dados.get('idade') || 0),
  cpf: normalizarTexto(String(dados.get('cpf') || '')),
  rg: normalizarTexto(String(dados.get('rg') || '')),
  nomeMae: normalizarTexto(String(dados.get('nomeMae') || '')),
  dataNascimento: String(dados.get('dataNascimento') || ''),
  corPele: normalizarTexto(String(dados.get('corPele') || '')),
  alturaAproximada: Number(dados.get('alturaAproximada') || 0),
  pesoAproximado: Number(dados.get('pesoAproximado') || 0),
  corCabelo: normalizarTexto(String(dados.get('corCabelo') || '')),
  corOlhos: normalizarTexto(String(dados.get('corOlhos') || '')),
  caracteristicasMarcantes: normalizarTexto(String(dados.get('caracteristicasMarcantes') || '')),
  statusFoto: 'pendente',
  fotoDisponivel: toBoolean(dados.get('fotoDisponivel')),
  linkFoto: '',
  telefoneDesaparecido: normalizarTelefone(String(dados.get('telefoneDesaparecido') || '')),
  dispositivoLigado: toBoolean(dados.get('dispositivoLigado')),
  dataHoraUltimaVisualizacao: String(dados.get('dataHoraUltimaVisualizacao') || ''),
  localUltimaVisualizacao: normalizarTexto(String(dados.get('localUltimaVisualizacao') || '')),
  roupaUltimaVisualizacao: normalizarTexto(String(dados.get('roupaUltimaVisualizacao') || '')),
  meioTransporte: normalizarTexto(String(dados.get('meioTransporte') || '')),
  dadosVeiculo: normalizarTexto(String(dados.get('dadosVeiculo') || '')),
  nomeSolicitante: normalizarTexto(String(dados.get('nomeSolicitante') || '')),
  vinculoSolicitante: normalizarTexto(String(dados.get('vinculoSolicitante') || '')),
  telefoneSolicitante: normalizarTelefone(String(dados.get('telefoneSolicitante') || '')),
  vulnerabilidade: toBoolean(dados.get('vulnerabilidade')),
  condicaoMentalCognitivaComportamental: normalizarTexto(String(dados.get('condicaoMentalCognitivaComportamental') || '')),
  limitacaoFisica: normalizarTexto(String(dados.get('limitacaoFisica') || '')),
  usoMedicacaoEssencial: toBoolean(dados.get('usoMedicacaoEssencial')),
  usoAlcoolOutrasDrogas: toBoolean(dados.get('usoAlcoolOutrasDrogas')),
  historicoDesaparecimentoAnterior: toBoolean(dados.get('historicoDesaparecimentoAnterior')),
  conflitoPrevio: toBoolean(dados.get('conflitoPrevio')),
  suspeitaCrime: toBoolean(dados.get('suspeitaCrime')),
  locaisHabituais: normalizarTexto(String(dados.get('locaisHabituais') || '')),
  buscasPreliminares: normalizarTexto(String(dados.get('buscasPreliminares') || '')),
  camerasResidencia: toBoolean(dados.get('camerasResidencia')),
  camerasUltimoLocal: toBoolean(dados.get('camerasUltimoLocal')),
  observacoesOperacionais: normalizarTexto(String(dados.get('observacoesOperacionais') || '')),
  statusCaso: (String(dados.get('statusCaso') || statusFallback) as StatusCaso) || StatusCaso.EM_TRIAGEM,
  subfluxoPerguntas: {}
});

const getDadosFormularioAtual = (): CasoDesaparecimento =>
  buildCasoFromForm(form ? new FormData(form) : new FormData());

let triagemState: TriagemState = calcularEstadoTriagem(getDadosFormularioAtual(), Math.min(initial, etapasTriagem.length - 1), 'Pronto para triagem.');

const atualizarStatus = (mensagem: string, erro = false): void => {
  triagemState.status = mensagem;
  const status = document.getElementById('case-status-banner');
  const texto = document.getElementById('case-status-message');
  if (texto) texto.textContent = mensagem;
  status?.classList.toggle('danger', erro);
};

const renderLogs = (): void => {
  const ul = document.getElementById('audit-log');
  if (!ul) return;
  const logs = listarLogs();
  ul.innerHTML = logs.length
    ? logs
        .map((log) => `<li><strong>${new Date(log.timestamp).toLocaleString('pt-BR')}</strong> · ${log.usuario} · ${log.acao}<br/><small>${log.alteracao}</small></li>`)
        .join('')
    : '<li>Sem registros.</li>';
};

const atualizarEtapaVisual = (novaEtapa: number): void => {
  triagemState = calcularEstadoTriagem(triagemState.dados, Math.max(0, Math.min(etapasTriagem.length - 1, novaEtapa)), triagemState.status);
  localStorage.setItem(chaveEtapaAtual, String(triagemState.etapa));

  document.querySelectorAll<HTMLElement>('.cv-step-section').forEach((secao) => {
    const indice = Number(secao.dataset.step || 0);
    secao.hidden = indice !== triagemState.etapa;
  });

  document.querySelectorAll<HTMLElement>('.cv-step-item').forEach((item) => {
    const indice = Number(item.dataset.step || 0);
    item.classList.toggle('active', indice === triagemState.etapa);
    item.classList.toggle('done', indice < triagemState.etapa);
  });
};

const sincronizarCondicionais = (): void => {
  const faixa = calcularFaixaEtaria(triagemState.dados.idade);
  const container = document.getElementById('age-questions');
  if (container) container.innerHTML = renderPerguntasFaixa(faixa);

  const ageBlock = document.getElementById('age-block');
  if (ageBlock) ageBlock.hidden = !triagemState.dados.idade;

  const crimeBlock = document.getElementById('crime-block');
  const techBlock = document.getElementById('tech-block');
  if (crimeBlock) crimeBlock.hidden = !triagemState.dados.suspeitaCrime;
  if (techBlock) techBlock.hidden = !(triagemState.dados.dispositivoLigado || triagemState.dados.camerasResidencia || triagemState.dados.camerasUltimoLocal || triagemState.dados.fotoDisponivel);
};

const renderResumo = (): void => {
  const caso = triagemState.casoCompleto;
  const indicadoresAtivos = listarIndicadoresAtivos(caso.indicadoresOperacionais);
  const sugestaoOperacional = sugerirAcaoIndicadores(caso.indicadoresOperacionais);
  const risco = document.getElementById('risk-panel-content');
  if (risco) {
    risco.innerHTML = `<span class="cv-badge">Faixa etária: ${caso.faixaEtaria}</span>
      <span class="cv-badge cv-badge--danger">Risco: ${caso.classificacaoRisco}</span>
      <span class="cv-badge">Prioridade: ${caso.prioridade}</span>
      <span class="cv-badge">Apto Cabine Verde: ${caso.aptoCabineVerde ? 'Sim' : 'Não'}</span>
      <span class="cv-badge">Criticidade: ${caso.criticidadeIndicadores}</span>
      <span class="cv-badge cv-badge--action">Ação sugerida: ${caso.acaoSugerida}</span>
      <span class="cv-badge">Indicadores ativos: ${indicadoresAtivos.length ? indicadoresAtivos.join(' · ') : 'Nenhum'}</span>
      <span class="cv-badge">Sugestão operacional: ${sugestaoOperacional}</span>`;
  }

  const live = document.getElementById('case-live-summary');
  if (live) {
    live.innerHTML = [
      ['Nome', caso.nomeCompletoDesaparecido || '-'],
      ['Idade/Faixa', `${caso.idade || '-'} / ${caso.faixaEtaria}`],
      ['Município', caso.municipio || '-'],
      ['Solicitante', caso.nomeSolicitante || '-'],
      ['Risco', caso.classificacaoRisco],
      ['Prioridade', caso.prioridade],
      ['Status', caso.statusCaso],
      ['Vulnerabilidade', caso.vulnerabilidade ? 'Sim' : 'Não'],
      ['Suspeita de crime', caso.suspeitaCrime ? 'Sim' : 'Não'],
      ['Indicadores ativos', indicadoresAtivos.length ? indicadoresAtivos.join('; ') : 'Nenhum'],
      ['Criticidade indicadores', caso.criticidadeIndicadores],
      ['Sugestão de ação', sugestaoOperacional],
      ['Apoio tecnológico', caso.aptoCabineVerde ? 'Adequado' : 'Parcial']
    ]
      .map(([chave, valor]) => `<dt>${chave}</dt><dd>${valor}</dd>`)
      .join('');
  }
};

const preencherFormulario = (dados: CasoDesaparecimento): void => {
  if (!form) return;
  Object.entries(dados).forEach(([chave, valor]) => {
    const field = form.elements.namedItem(chave) as HTMLInputElement | null;
    if (!field) return;
    if (field.type === 'checkbox') {
      field.checked = Boolean(valor);
    } else {
      field.value = typeof valor === 'string' || typeof valor === 'number' ? String(valor) : '';
    }
  });
};

const atualizarStateDoFormulario = (): void => {
  if (!form) return;
  triagemState = calcularEstadoTriagem(buildCasoFromForm(new FormData(form)), triagemState.etapa, triagemState.status);
  sincronizarCondicionais();
  renderResumo();
  if (!triagemState.validacoes.etapaValida) {
    atualizarStatus(`Campos pendentes: ${triagemState.validacoes.pendencias.join(', ')}`, true);
  } else {
    atualizarStatus('Etapa pronta para avançar.');
  }
};

const atualizarLista = (casos?: CasoCompleto[]): void => {
  const wrapper = document.getElementById('case-list-wrapper');
  if (wrapper) wrapper.innerHTML = renderCaseList(casos || listarCasos());
};

const renderDetalheCaso = (caso: CasoCompleto): void => {
  const details = document.getElementById('case-details');
  if (!details) return;
  details.innerHTML = `
    <section><h4>Identificação</h4><p><strong>${caso.id}</strong> · ${caso.statusCaso}</p></section>
    <section><h4>Desaparecido</h4><p>${caso.nomeCompletoDesaparecido} · ${caso.idade} anos (${caso.faixaEtaria})</p></section>
    <section><h4>Contexto</h4><p>${caso.localUltimaVisualizacao || '-'} em ${caso.dataHoraUltimaVisualizacao || '-'}</p></section>
    <section><h4>Risco e vulnerabilidade</h4><p>${caso.classificacaoRisco} · Prioridade ${caso.prioridade} · Suspeita crime: ${caso.suspeitaCrime ? 'Sim' : 'Não'}</p></section>
    <section><h4>Apoio tecnológico</h4><p>Dispositivo: ${caso.dispositivoLigado ? 'Sim' : 'Não'} · Câmeras: ${caso.camerasResidencia || caso.camerasUltimoLocal ? 'Sim' : 'Não'} · Foto: ${caso.fotoDisponivel ? 'Sim' : 'Não'}</p></section>
    <section><h4>Histórico de atualização</h4><p>Solicitante: ${caso.nomeSolicitante || '-'} · Atualizado em ${new Date().toLocaleString('pt-BR')}</p></section>`;
};

const aplicarFiltros = (): void => {
  const filtroId = (document.getElementById('filter-idCaso') as HTMLInputElement | null)?.value.toLowerCase() || '';
  const filtroStatus = (document.getElementById('filter-status') as HTMLSelectElement | null)?.value || '';
  const filtroRisco = (document.getElementById('filter-risco') as HTMLSelectElement | null)?.value || '';
  const filtroData = (document.getElementById('filter-data') as HTMLInputElement | null)?.value || '';

  const casos = listarCasos().filter((caso) => {
    const matchId = !filtroId || caso.id.toLowerCase().includes(filtroId);
    const matchStatus = !filtroStatus || caso.statusCaso === filtroStatus;
    const matchRisco = !filtroRisco || caso.classificacaoRisco === filtroRisco;
    const matchData = !filtroData || caso.dataHoraRegistro.startsWith(filtroData);
    return matchId && matchStatus && matchRisco && matchData;
  });

  atualizarLista(casos);
};

if (form) {
  (document.getElementById('session-id') as HTMLInputElement | null)!.value = sessionId;
  atualizarEtapaVisual(triagemState.etapa);
  atualizarStateDoFormulario();
  renderLogs();

  form.addEventListener('input', atualizarStateDoFormulario);
  const justificativaInput = form.elements.namedItem('justificativaVisualizacao') as HTMLInputElement | null;
  justificativaInput?.addEventListener('blur', () => {
    if (!justificativaInput.value) {
      justificativaInput.setCustomValidity('');
      return;
    }
    if (!validarJustificativaVisualizacao(justificativaInput.value)) {
      justificativaInput.setCustomValidity('Justificativa inválida. Descreva o motivo da visualização.');
      atualizarStatus('Justificativa inválida. Descreva o motivo da visualização.', true);
      return;
    }
    justificativaInput.setCustomValidity('');
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    atualizarStateDoFormulario();

    salvarCasoLocal(triagemState.casoCompleto);
    const summary = document.getElementById('case-summary');
    if (summary) summary.textContent = gerarResumoCaso(triagemState.casoCompleto);
    renderDetalheCaso(triagemState.casoCompleto);

    const payload = gerarPayloadSheets(triagemState.casoCompleto);
    const arquivoFoto = form.elements.namedItem('fotoDesaparecido') as HTMLInputElement | null;
    const fotoSelecionada = arquivoFoto?.files?.[0];
    if (fotoSelecionada) {
      if (!fotoSelecionada.type.startsWith('image/')) {
        atualizarStatus('Upload bloqueado: apenas imagens são permitidas.', true);
        return;
      }
      if (fotoSelecionada.size > MAX_FOTO_BYTES) {
        atualizarStatus('Upload bloqueado: imagem excede 5MB.', true);
        return;
      }

      payload.foto = {
        base64: await converterArquivoParaBase64(fotoSelecionada),
        nomeArquivo: fotoSelecionada.name,
        mimeType: fotoSelecionada.type
      };
      payload.dados.origemFoto = normalizarTexto(String((form.elements.namedItem('origemFoto') as HTMLSelectElement | null)?.value || ''));
      payload.dados.tipoFoto = normalizarTexto(String((form.elements.namedItem('tipoFoto') as HTMLSelectElement | null)?.value || ''));
      payload.dados.autorizacaoUsoImagem = toBoolean((form.elements.namedItem('autorizacaoUsoImagem') as HTMLInputElement | null)?.checked);
      payload.dados.operadorResponsavel = normalizarTexto(triagemState.dados.nomeSolicitante || 'Operador');
      payload.dados.nomeDesaparecido = triagemState.dados.nomeCompletoDesaparecido;
      payload.dados.idCaso = triagemState.casoCompleto.id;
      payload.dados.talaoPMESP = triagemState.casoCompleto.talaoPMESP;
    }

    const retorno = await sheetsService.salvar(payload);
    const report = document.getElementById('report-content') as HTMLTextAreaElement | null;
    const metaRetorno = [
      retorno.idCaso ? `idCaso: ${retorno.idCaso}` : '',
      typeof retorno.linha === 'number' ? `linha: ${retorno.linha}` : '',
      retorno.action ? `ação: ${retorno.action}` : ''
    ]
      .filter(Boolean)
      .join(' | ');
    if (report) {
      report.value = retorno.ok
        ? `${retorno.action === 'updated' ? 'Caso atualizado com sucesso' : 'Caso criado com sucesso'}\n${retorno.message}${metaRetorno ? `\n${metaRetorno}` : ''}`
        : `${retorno.message === 'Endpoint indisponível' ? 'Endpoint indisponível' : 'Erro de integração com Google Sheets'}\n${retorno.message}${metaRetorno ? `\n${metaRetorno}` : ''}`;
    }

    registrarLog({
      timestamp: new Date().toISOString(),
      acao: retorno.action === 'updated' ? 'Atualização de caso' : 'Criação de caso',
      usuario: triagemState.dados.nomeSolicitante || 'Operador',
      alteracao: `${triagemState.casoCompleto.id} · ${triagemState.casoCompleto.statusCaso}`
    });
    renderLogs();

    atualizarStatus(retorno.ok ? 'Persistência concluída com sucesso.' : retorno.message === 'Endpoint indisponível' ? 'Endpoint indisponível' : 'Erro de integração com Google Sheets', !retorno.ok);
    atualizarLista();
    aplicarFiltros();
  });
}

document.getElementById('prev-step')?.addEventListener('click', () => atualizarEtapaVisual(triagemState.etapa - 1));
document.getElementById('next-step')?.addEventListener('click', () => {
  atualizarStateDoFormulario();
  if (!triagemState.validacoes.etapaValida) return;
  atualizarEtapaVisual(triagemState.etapa + 1);
  atualizarStatus('Etapa avançada com sucesso.');
});

document.querySelectorAll('[data-go-step]').forEach((button) => {
  button.addEventListener('click', () => atualizarEtapaVisual(Number((button as HTMLElement).getAttribute('data-go-step') || 0)));
});

document.getElementById('update-case')?.addEventListener('click', () => {
  const idCaso = (form?.elements.namedItem('idCaso') as HTMLInputElement | null)?.value;
  if (!idCaso) return atualizarStatus('Para atualizar um caso, preencha o ID do caso.', true);
  form?.requestSubmit();
});

document.getElementById('generate-report')?.addEventListener('click', () => {
  const casos = listarCasos();
  const texto = montarRelatorio(casos, {
    numeroRelatorio: String(casos.length + 1).padStart(3, '0'),
    dataReferencia: new Date().toLocaleDateString('pt-BR'),
    equipe: 'Equipe Cabine Verde',
    complementoManual: ''
  });

  const report = document.getElementById('report-content') as HTMLTextAreaElement | null;
  if (report) report.value = texto;
  atualizarStatus('Relatório atualizado para revisão.');
});

document.getElementById('save-draft')?.addEventListener('click', () => {
  atualizarStateDoFormulario();
  salvarRascunhoLocal(sessionId, triagemState);
  atualizarStatus(`Rascunho salvo na sessão ${sessionId}.`);
});

document.getElementById('load-draft')?.addEventListener('click', () => {
  const input = document.getElementById('session-id') as HTMLInputElement | null;
  const id = input?.value || sessionId;
  const draft = carregarRascunhoLocal(id);
  if (!draft) return atualizarStatus('Rascunho não encontrado para a sessão informada.', true);
  sessionId = id;
  triagemState = draft;
  preencherFormulario(draft.dados);
  atualizarEtapaVisual(draft.etapa);
  atualizarStateDoFormulario();
  atualizarStatus(`Rascunho da sessão ${id} carregado.`);
});

document.getElementById('share-session')?.addEventListener('click', async () => {
  atualizarStateDoFormulario();
  const token = exportarRascunhoSessao(triagemState);
  const report = document.getElementById('report-content') as HTMLTextAreaElement | null;
  if (report) report.value = `Token de sessão para migração entre dispositivos:\n${token}`;
  await navigator.clipboard.writeText(token);
  atualizarStatus('Token de sessão copiado. Pode ser importado em outra estação.');
});

document.getElementById('apply-session')?.addEventListener('click', () => {
  const input = document.getElementById('session-id') as HTMLInputElement | null;
  const valor = input?.value || '';
  if (!valor) return;

  const draftPorToken = importarRascunhoSessao(valor);
  if (draftPorToken) {
    triagemState = draftPorToken;
    preencherFormulario(draftPorToken.dados);
    atualizarEtapaVisual(draftPorToken.etapa);
    atualizarStateDoFormulario();
    return atualizarStatus('Sessão importada por token com sucesso.');
  }

  sessionId = valor;
  atualizarStatus(`Sessão operacional definida: ${sessionId}`);
});

document.getElementById('new-case')?.addEventListener('click', () => {
  form?.reset();
  triagemState = calcularEstadoTriagem(getDadosFormularioAtual(), 0, 'Novo caso iniciado.');
  sessionId = gerarSessionId();
  const sessionInput = document.getElementById('session-id') as HTMLInputElement | null;
  if (sessionInput) sessionInput.value = sessionId;
  atualizarEtapaVisual(0);
  atualizarStateDoFormulario();
});

document.getElementById('copy-report')?.addEventListener('click', async () => {
  const report = document.getElementById('report-content') as HTMLTextAreaElement | null;
  if (report?.value) await navigator.clipboard.writeText(report.value);
  atualizarStatus('Relatório copiado para área de transferência.');
});

document.getElementById('case-list-wrapper')?.addEventListener('click', (event) => {
  const target = event.target as HTMLElement;
  const trigger = target.closest('[data-open-case]') as HTMLElement | null;
  if (!trigger) return;
  const caso = listarCasos().find((item) => item.id === trigger.getAttribute('data-open-case'));
  if (!caso) return;
  preencherFormulario(caso);
  triagemState = calcularEstadoTriagem(caso, triagemState.etapa, triagemState.status);
  renderDetalheCaso(caso);
  atualizarStateDoFormulario();
  atualizarStatus(`Caso ${caso.id} carregado no modo edição.`);
});

['filter-idCaso', 'filter-status', 'filter-risco', 'filter-data'].forEach((id) => {
  document.getElementById(id)?.addEventListener('input', aplicarFiltros);
  document.getElementById(id)?.addEventListener('change', aplicarFiltros);
});


document.getElementById('view-report')?.addEventListener('click', () => {
  const report = document.getElementById('report-content') as HTMLTextAreaElement | null;
  if (!report?.value) {
    const casos = listarCasos();
    report!.value = `${montarRelatorio(casos, { numeroRelatorio: String(casos.length + 1).padStart(3, '0'), dataReferencia: new Date().toLocaleDateString('pt-BR'), equipe: 'Equipe Cabine Verde', complementoManual: '' })}

${montarRelatorioEstatistico(casos)}`;
  }
  report?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  atualizarStatus('Relatório exibido para revisão operacional.');
});

document.getElementById('export-report-siopm')?.addEventListener('click', async () => {
  const texto = montarRelatorioSIOPM(listarCasos());
  const report = document.getElementById('report-content') as HTMLTextAreaElement | null;
  if (report) report.value = texto;
  await navigator.clipboard.writeText(texto);
  atualizarStatus('Texto SIOPM gerado e copiado.');
});

document.getElementById('export-report-pdf')?.addEventListener('click', () => {
  window.print();
  atualizarStatus('Exportação PDF acionada via impressão do navegador.');
});

(document.getElementById('fotoDesaparecido') as HTMLInputElement | null)?.addEventListener('change', () => {
  const fotoInput = document.getElementById('fotoDesaparecido') as HTMLInputElement | null;
  const status = document.getElementById('foto-status');
  if (!status) return;
  status.textContent = fotoInput?.files?.length ? 'Status da foto: enviada' : 'Status da foto: pendente';
});

(document.getElementById('autorizacaoUsoImagem') as HTMLInputElement | null)?.addEventListener('change', (event) => {
  const status = document.getElementById('foto-status');
  if (!status) return;
  status.textContent = (event.target as HTMLInputElement).checked ? 'Status da foto: validada' : status.textContent;
});


const atualizarStatusSistema = async (): Promise<void> => {
  const banco = document.getElementById('status-banco-central');
  const sync = document.getElementById('status-sincronizacao');
  const health = await sheetsService.healthcheck();
  if (banco) banco.textContent = `Banco central: ${health.ok ? 'ativo' : 'inativo'}`;
  if (sync) sync.textContent = `Sincronização: ${health.ok ? 'online' : 'offline'}`;
};

void atualizarStatusSistema();
setInterval(() => void atualizarStatusSistema(), 30000);

document.getElementById('send-feedback')?.addEventListener('click', async () => {
  const feedback = (form?.elements.namedItem('feedbackOperacional') as HTMLInputElement | null)?.value?.trim() || '';
  if (!feedback) return atualizarStatus('Informe um feedback operacional antes de enviar.', true);
  const base = triagemState.casoCompleto;
  const payload = gerarPayloadSheets(base);
  payload.abas.push({
    aba: 'FEEDBACK',
    colunas: ['idCaso', 'timestampEvento', 'tipoEvento', 'feedback', 'operador'],
    valores: [base.id, new Date().toISOString(), 'FEEDBACK_ENVIADO', feedback, base.nomeSolicitante || 'Operador']
  });
  const retorno = await sheetsService.salvar(payload);
  atualizarStatus(retorno.ok ? 'Feedback enviado com sucesso.' : `Falha ao enviar feedback: ${retorno.message}`, !retorno.ok);
});
