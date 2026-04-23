import { renderMainLayout } from './components/layout/MainLayout.js';
import { renderTriageForm, statusFallback } from './components/form/TriageForm.js';
import { renderProgressSteps } from './components/triagem/ProgressSteps.js';
import { renderAgeSections } from './components/triagem/AgeSections.js';
import { renderVulnerabilityBlock } from './components/triagem/VulnerabilityBlock.js';
import { renderCrimeSuspicionBlock } from './components/triagem/CrimeSuspicionBlock.js';
import { renderTechSupportBlock } from './components/triagem/TechSupportBlock.js';
import { renderCaseSummary } from './components/desaparecidos/CaseSummary.js';
import { renderCaseList } from './components/desaparecidos/CaseList.js';
import { renderCaseDetails } from './components/desaparecidos/CaseDetails.js';
import { renderReportView } from './components/relatorios/ReportView.js';
import { normalizarTelefone, normalizarTexto, toBoolean } from './utils/normalizers.js';
import { enriquecerCaso } from './modules/triagem/triageEngine.js';
import { gerarResumoCaso } from './utils/summary.js';
import { GoogleSheetsService } from './services/sheetsService.js';
import { gerarPayloadSheets } from './utils/sheetsPayload.js';
import { listarCasos, salvarCasoLocal } from './services/caseRepository.js';
import { montarRelatorio } from './modules/relatorios/reportModule.js';
import { casosMock } from './data/mockCases.js';
import { renderPerguntasFaixa } from './components/triagem/ConditionalQuestions.js';
import { calcularFaixaEtaria } from './utils/age.js';
import type { CasoDesaparecimento } from './types/case.js';
import { StatusCaso } from './types/enums.js';

const sheetsService = new GoogleSheetsService();

const baseLayout = () => [
  renderProgressSteps(),
  renderTriageForm(),
  renderVulnerabilityBlock(),
  renderCrimeSuspicionBlock(),
  renderTechSupportBlock(),
  renderAgeSections(),
  renderCaseSummary(),
  renderCaseDetails(),
  renderReportView(),
  `<div id="case-list-wrapper">${renderCaseList(listarCasos().length ? listarCasos() : casosMock)}</div>`
].join('');

const app = document.getElementById('app');
if (app) {
  app.innerHTML = renderMainLayout(baseLayout());
}

const form = document.getElementById('triage-form') as HTMLFormElement | null;

const atualizarPerguntasDinamicas = (idade: number): void => {
  const faixa = calcularFaixaEtaria(idade);
  const container = document.getElementById('age-questions');
  if (container) container.innerHTML = renderPerguntasFaixa(faixa);
};

const atualizarBlocosContextuais = (dados: FormData): void => {
  const suspeitaCrime = toBoolean(dados.get('suspeitaCrime'));
  const tech = toBoolean(dados.get('dispositivoLigado')) || toBoolean(dados.get('camerasResidencia')) || toBoolean(dados.get('camerasUltimoLocal'));

  const crimeBlock = document.getElementById('crime-block');
  const techBlock = document.getElementById('tech-block');
  if (crimeBlock) crimeBlock.hidden = !suspeitaCrime;
  if (techBlock) techBlock.hidden = !tech;
};

const buildCasoFromForm = (dados: FormData): CasoDesaparecimento => ({
  id: `CV-${Date.now()}`,
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
  fotoDisponivel: toBoolean(dados.get('fotoDisponivel')),
  linkFoto: normalizarTexto(String(dados.get('linkFoto') || '')),
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

const atualizarLista = (): void => {
  const wrapper = document.getElementById('case-list-wrapper');
  if (wrapper) wrapper.innerHTML = renderCaseList(listarCasos());
};

if (form) {
  form.addEventListener('input', () => {
    const dados = new FormData(form);
    atualizarPerguntasDinamicas(Number(dados.get('idade') || 0));
    atualizarBlocosContextuais(dados);
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const dados = new FormData(form);
    atualizarBlocosContextuais(dados);
    const caso = enriquecerCaso(buildCasoFromForm(dados));
    salvarCasoLocal(caso);

    const summary = document.getElementById('case-summary');
    if (summary) summary.textContent = gerarResumoCaso(caso);

    const details = document.getElementById('case-details');
    if (details) details.textContent = JSON.stringify(caso, null, 2);

    const payload = gerarPayloadSheets(caso);
    const retorno = await sheetsService.salvar(payload);
    const report = document.getElementById('report-content') as HTMLTextAreaElement | null;
    if (report) {
      report.value = retorno.ok
        ? `caso salvo com sucesso
${retorno.message}`
        : `falha ao salvar
${retorno.message}`;
    }

    atualizarLista();
  });
}

const botaoRelatorio = document.getElementById('generate-report');
botaoRelatorio?.addEventListener('click', () => {
  const casos = listarCasos();
  const texto = montarRelatorio(casos, {
    numeroRelatorio: String(casos.length + 1).padStart(3, '0'),
    dataReferencia: new Date().toLocaleDateString('pt-BR'),
    equipe: 'Equipe Cabine Verde',
    complementoManual: ''
  });

  const report = document.getElementById('report-content') as HTMLTextAreaElement | null;
  if (report) report.value = texto;
});

document.getElementById('copy-report')?.addEventListener('click', async () => {
  const report = document.getElementById('report-content') as HTMLTextAreaElement | null;
  if (report?.value) await navigator.clipboard.writeText(report.value);
});
