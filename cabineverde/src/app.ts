import { renderMainLayout } from './components/layout/MainLayout.js';
import { renderRegistroForm, renderTriageForm, statusFallback } from './components/form/TriageForm.js';
import { etapasTriagem, renderProgressSteps } from './components/triagem/ProgressSteps.js';
import { renderAgeSections } from './components/triagem/AgeSections.js';
import { renderCaseSummary } from './components/desaparecidos/CaseSummary.js';
import { renderCaseList } from './components/desaparecidos/CaseList.js';
import { renderCaseDetails } from './components/desaparecidos/CaseDetails.js';
import { renderReportView } from './components/relatorios/ReportView.js';
import { normalizarTelefone, normalizarTexto, toBoolean } from './utils/normalizers.js';
import { normalizarCamposFisicos } from './utils/camposFisicos.js';
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
import {
  carregarRascunhoLocal,
  carregarUltimoAutoRascunho,
  limparAutoRascunhoLocal,
  exportarRascunhoSessao,
  gerarSessionId,
  importarRascunhoSessao,
  obterChaveAutoRascunho,
  salvarAutoRascunhoLocal,
  salvarRascunhoLocal
} from './services/draftSessionService.js';
import { listarLogs, registrarLog } from './services/auditLogService.js';
import { renderSessionPanel } from './components/triagem/SessionPanel.js';
import { renderAuditLogPanel } from './components/desaparecidos/AuditLogPanel.js';
import { listarIndicadoresAtivos, sugerirAcaoIndicadores } from './modules/triagem/indicadoresOperacionais.js';

const sheetsService = new GoogleSheetsService();
const chaveEtapaAtual = 'cabine-verde-etapa-atual';
type PerfilOperacional = 'OPERADOR' | 'SUPERVISOR' | 'ADMIN' | 'AUDITOR';
type ModuloOperacional = 'registro' | 'triagem' | 'consulta' | 'qualidade' | 'relatorios' | 'midias' | 'admin';

const permissoesPorPerfil: Record<PerfilOperacional, ModuloOperacional[]> = {
  OPERADOR: ['registro', 'triagem'],
  SUPERVISOR: ['registro', 'triagem', 'consulta', 'qualidade', 'relatorios', 'midias'],
  ADMIN: ['registro', 'triagem', 'consulta', 'qualidade', 'relatorios', 'midias', 'admin'],
  AUDITOR: ['consulta', 'qualidade', 'relatorios']
};

const titulosModulos: Record<ModuloOperacional, string> = {
  registro: 'Registro de Ocorrência',
  triagem: 'Triagem',
  consulta: 'Consulta e Auditoria',
  qualidade: 'Qualidade dos Dados',
  relatorios: 'Relatórios',
  midias: 'Mídias/Fotos',
  admin: 'Administração'
};

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
let timeoutAutoRascunho: number | null = null;

const renderModuloCard = (id: ModuloOperacional, descricao: string, acoes: string[]): string => `
  <section class="cv-card cv-module" id="modulo-${id}" data-route="${id}" hidden>
    <header>
      <h2>${titulosModulos[id]}</h2>
      <p>${descricao}</p>
      <p><strong>Ações principais:</strong> ${acoes.join(' · ')}</p>
    </header>
    <div class="cv-module-content" id="modulo-${id}-conteudo"></div>
  </section>`;

const baseLayout = () => {
  const menu = `<nav class="cv-card cv-nav" id="cv-nav-modulos" aria-label="Navegação operacional"></nav>`;
  const modulos = [
    renderModuloCard('registro', 'Cadastro inicial simplificado para abertura rápida do caso.', ['Cadastrar novo desaparecido', 'Salvar e seguir para triagem']),
    renderModuloCard('triagem', 'Triagem operacional detalhada com dados herdados do registro.', ['Preencher triagem', 'Anexar foto', 'Salvar caso', 'Gerar relatório SIOPM']),
    renderModuloCard('consulta', 'Consulta estruturada com auditoria e histórico.', ['Buscar por idCaso, talão ou nome', 'Visualizar timeline', 'Revisar histórico de edições']),
    renderModuloCard('qualidade', 'Painel de inconsistências e tratamento.', ['Filtrar problemas', 'Resumo de criticidade', 'Marcar resolvido']),
    renderModuloCard('relatorios', 'Consolidação e exportação operacional.', ['Relatório diário', 'Relatório estatístico', 'Exportar PDF', 'Exportar texto SIOPM']),
    renderModuloCard('midias', 'Validação de fotos e evidências visuais.', ['Listar fotos por caso', 'Validar ou rejeitar foto', 'Controlar status de validação']),
    renderModuloCard('admin', 'Governança, segurança e manutenção da plataforma.', ['Operadores e perfis', 'Logs e auditoria', 'Backup, migração e rollback'])
  ].join('');
  const conteudoRegistro = [renderRegistroForm()].join('');
  const conteudoTriagem =
    [
    renderProgressSteps(),
    renderCaseStatusBanner(),
    '<section class="cv-operational-grid">',
    '<div>',
    renderTriageForm(),
    renderConditionalSection('crime-block', 'Indícios de crime', 'Detalhe ameaças, testemunhas e evidências digitais que justifiquem encaminhamento imediato aos canais competentes.'),
    renderConditionalSection('tech-block', 'Apoio tecnológico ativo', 'Registre câmeras, rastreio de dispositivo e fontes de mídia com potencial de localização.'),
    renderConditionalSection('age-block', 'Subfluxo por faixa etária', 'Perguntas dinâmicas para ampliar entendimento do risco específico.'),
    renderActionFooter(),
    '<section id="post-save-actions" class="cv-card" hidden><h4>Caso salvo</h4><div class="cv-inline-actions"><button type="button" class="cv-button cv-button--ghost" data-flow-action="ver-caso">Ver caso</button><button type="button" class="cv-button cv-button--ghost" data-flow-action="ir-consulta">Ir para consulta</button><button type="button" class="cv-button cv-button--secondary" data-flow-action="ver-timeline">Ver timeline</button></div></section>',
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
  return `${menu}${modulos}<section hidden id="registro-layout-cache">${conteudoRegistro}</section><section hidden id="triagem-layout-cache">${conteudoTriagem}</section>`;
};

const app = document.getElementById('app');
if (app) app.innerHTML = renderMainLayout(baseLayout());
const obterPerfilBackend = async (): Promise<PerfilOperacional> => {
  try {
    const resp = await fetch('/api/perfil-operador', { headers: { Accept: 'application/json' } });
    if (!resp.ok) throw new Error('Perfil indisponível');
    const dados = (await resp.json()) as { perfil?: PerfilOperacional };
    if (dados.perfil && dados.perfil in permissoesPorPerfil) return dados.perfil;
  } catch (_erro) {
    // fallback operacional para ambientes sem backend local
  }
  return 'OPERADOR';
};

const montarNavegacaoPorPerfil = (perfil: PerfilOperacional): void => {
  const nav = document.getElementById('cv-nav-modulos');
  if (!nav) return;
  const permitidos = permissoesPorPerfil[perfil];
  nav.innerHTML = permitidos
    .map((modulo) => `<button class="cv-button cv-button--ghost cv-nav-item" data-route="${modulo}" type="button">${titulosModulos[modulo]}</button>`)
    .join('');
  const moduloInicial = perfil === 'OPERADOR' ? 'registro' : permitidos[0];
  const abrirModulo = (modulo: ModuloOperacional): void => {
    document.querySelectorAll<HTMLElement>('.cv-module').forEach((el) => {
      el.hidden = el.dataset.route !== modulo;
    });
  };
  nav.querySelectorAll<HTMLButtonElement>('button[data-route]').forEach((btn) => {
    btn.addEventListener('click', () => abrirModulo(btn.dataset.route as ModuloOperacional));
  });
  abrirModulo(moduloInicial);
};

const montarConteudosModulares = (): void => {
  const registro = document.getElementById('modulo-registro-conteudo');
  const cacheRegistro = document.getElementById('registro-layout-cache');
  if (registro && cacheRegistro) {
    while (cacheRegistro.firstChild) registro.appendChild(cacheRegistro.firstChild);
    cacheRegistro.remove();
  }
  const triagem = document.getElementById('modulo-triagem-conteudo');
  const cacheTriagem = document.getElementById('triagem-layout-cache');
  if (triagem && cacheTriagem) {
    while (cacheTriagem.firstChild) triagem.appendChild(cacheTriagem.firstChild);
    cacheTriagem.remove();
  }

  const consulta = document.getElementById('modulo-consulta-conteudo');
  if (consulta) consulta.innerHTML = `${renderCaseDetails()}<section class="cv-card"><h4>Navegação contextual</h4><div class="cv-inline-actions"><button type="button" class="cv-button cv-button--ghost" data-flow-action="ver-fotos">Ver fotos</button><button type="button" class="cv-button cv-button--ghost" data-flow-action="ver-qualidade">Ver qualidade</button><button type="button" class="cv-button cv-button--secondary" data-flow-action="gerar-relatorio">Gerar relatório</button></div></section>${renderAuditLogPanel()}<div class="cv-card"><p>Edição condicionada à confirmação de e-mail e justificativa registrada em log.</p></div>`;
  const qualidade = document.getElementById('modulo-qualidade-conteudo');
  if (qualidade) qualidade.innerHTML = `${renderCaseList(listarCasos().length ? listarCasos() : casosMock, 'qualidade')}<div class="cv-card"><p>Resumo: totalProblemas, totalCriticos, totalPendentes e totalResolvidos.</p></div>`;
  const relatorios = document.getElementById('modulo-relatorios-conteudo');
  if (relatorios) relatorios.innerHTML = renderReportView();
  const midias = document.getElementById('modulo-midias-conteudo');
  if (midias) midias.innerHTML = `<div class="cv-card"><p>Listagem de fotos por caso com motivo, justificativa e status de validação/rejeição.</p><div class="cv-inline-actions"><button type="button" class="cv-button cv-button--ghost" data-flow-action="abrir-caso-relacionado">Abrir caso relacionado</button></div></div>`;
  const admin = document.getElementById('modulo-admin-conteudo');
  if (admin) admin.innerHTML = '<div class="cv-card"><p>Gestão de operadores, perfis, logs, backup, migração, rollback e auditoria Drive.</p></div>';
};

montarConteudosModulares();
obterPerfilBackend().then(montarNavegacaoPorPerfil);

const form = document.getElementById('triage-form') as HTMLFormElement | null;
const formRegistro = document.getElementById('registro-form') as HTMLFormElement | null;
const initial = Number(localStorage.getItem(chaveEtapaAtual) || 0);
let modoFormulario: 'criacao' | 'edicao' = 'criacao';
let idCasoEdicaoAtual = '';
let casoOriginalEdicao: Record<string, unknown> | null = null;
let urlFotoUploadAtual = '';
let referenciaCasoSalvo: { idCaso: string; talaoPMESP: string } | null = null;
let assinaturaUploadFotoConcluido = '';


const fotoDigitalDisponivelSelecionada = (valor: unknown): boolean => {
  if (valor === true) return true;
  const normalizado = String(valor ?? '').trim().toUpperCase();
  return ['SIM', 'TRUE', '1', 'ON'].includes(normalizado);
};

const mostrarBlocoUploadFoto = (seMostrar: boolean): void => {
  const bloco = document.getElementById('blocoUploadFotoDesaparecido');
  const acoes = document.getElementById('acoesUploadFotoDesaparecido');
  if (bloco) bloco.hidden = !seMostrar;
  if (acoes) acoes.hidden = !seMostrar;
};

const atualizarPreviewFoto = (url: string): void => {
  const preview = document.getElementById('previewFotoDesaparecido') as HTMLImageElement | null;
  if (!preview) return;
  if (!url) {
    preview.hidden = true;
    preview.removeAttribute('src');
    return;
  }
  preview.src = url;
  preview.hidden = false;
};

const atualizarStatusFotoPendente = (texto: string): void => {
  const status = document.getElementById('status-foto-pendente');
  if (status) status.textContent = texto;
};

const salvarFotoDepoisDaTriagem = async (): Promise<void> => {
  const arquivoFoto = form?.elements.namedItem('fotoDesaparecido') as HTMLInputElement | null;
  const fotoSelecionada = arquivoFoto?.files?.[0];
  const idCaso = referenciaCasoSalvo?.idCaso || triagemState.casoCompleto.id;
  const talaoPMESP = referenciaCasoSalvo?.talaoPMESP || triagemState.casoCompleto.talaoPMESP;
  if (!idCaso) return atualizarStatus('Upload bloqueado: caso ainda sem id definitivo.', true);
  if (idCaso.startsWith('CV-')) return atualizarStatus('Upload bloqueado: idCaso temporário inválido.', true);
  if (!talaoPMESP) return atualizarStatus('Não foi possível identificar o talão PMESP para anexar foto.', true);
  if (!fotoSelecionada) return atualizarStatus('Selecione uma foto antes de enviar.', true);
  if (!fotoSelecionada.type.startsWith('image/')) return atualizarStatus('Upload bloqueado: apenas imagens são permitidas.', true);
  if (fotoSelecionada.size > MAX_FOTO_BYTES) return atualizarStatus('Upload bloqueado: imagem excede 5MB.', true);
  const assinaturaUploadAtual = [idCaso, fotoSelecionada.name, fotoSelecionada.size, fotoSelecionada.lastModified].join(':');
  if (assinaturaUploadFotoConcluido === assinaturaUploadAtual && urlFotoUploadAtual) {
    return atualizarStatus('Esta foto já foi enviada para este caso.');
  }

  const upload = await sheetsService.uploadFotoCaso({
    base64: await converterArquivoParaBase64(fotoSelecionada),
    mimeType: fotoSelecionada.type,
    nomeArquivo: fotoSelecionada.name,
    idCaso,
    talaoPMESP,
    nomeDesaparecido: triagemState.dados.nomeCompletoDesaparecido,
    operadorResponsavel: obterOperadorAtual()
  });
  if (!upload.ok || !upload.urlFoto) return atualizarStatus(`Falha no upload da foto: ${upload.message}`, true);

  const atualizacao = await sheetsService.atualizarFotoCaso({
    idCaso,
    talaoPMESP,
    urlFoto: upload.urlFoto,
    linkFoto: upload.urlFoto,
    fotoDisponivel: 'Sim'
  });
  if (!atualizacao.ok) return atualizarStatus(`Foto enviada, mas não foi possível vincular no caso: ${atualizacao.message}`, true);
  urlFotoUploadAtual = upload.urlFoto;
  assinaturaUploadFotoConcluido = assinaturaUploadAtual;
  triagemState.dados.urlFoto = upload.urlFoto;
  triagemState.dados.linkFoto = upload.urlFoto;
  const campoUrlFoto = form?.elements.namedItem('urlFoto') as HTMLInputElement | null;
  const campoLinkFoto = form?.elements.namedItem('linkFoto') as HTMLInputElement | null;
  if (campoUrlFoto) campoUrlFoto.value = upload.urlFoto;
  if (campoLinkFoto) campoLinkFoto.value = upload.urlFoto;
  atualizarPreviewFoto(upload.urlFoto);
  atualizarStatusFotoPendente('Foto disponível: Sim');
  atualizarStatus('Foto vinculada ao caso com sucesso.');
};


const buildCasoFromForm = (dados: FormData): CasoDesaparecimento => {
  const talaoBopmCapturado = normalizarTexto(String(
    dados.get('talaoBopm')
      || dados.get('talaoBOPM')
      || dados.get('talaoBopmPMESP')
      || dados.get('talaoPMESP')
      || dados.get('talaoPMESPBOPM')
      || dados.get('bopm')
      || dados.get('numeroBopm')
      || ''
  ));

  const talaoPMESPCapturado = normalizarTexto(String(
    dados.get('talaoPMESP')
      || dados.get('talaoPMEsp')
      || dados.get('talao')
      || dados.get('numeroTalao')
      || talaoBopmCapturado
      || ''
  ));

  return normalizarCamposFisicos({
  id: normalizarTexto(String(dados.get('idCaso') || '')) || referenciaCasoSalvo?.idCaso || ultimoIdCasoSalvo || '',
  talaoPMESP: talaoPMESPCapturado,
  dataHoraRegistro: String(dados.get('dataHoraRegistro') || new Date().toISOString()),
  municipio: normalizarTexto(String(dados.get('municipio') || '')),
  talaoBopm: talaoBopmCapturado || talaoPMESPCapturado,
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
  fotoDisponivel: fotoDigitalDisponivelSelecionada(dados.get('fotoDisponivel')),
  linkFoto: normalizarTexto(String(dados.get('urlFoto') || dados.get('linkFoto') || '')),
  urlFoto: normalizarTexto(String(dados.get('urlFoto') || dados.get('linkFoto') || '')), 
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
  subfluxoPerguntas: Object.fromEntries(
    Array.from(dados.entries())
      .filter(([chave]) => chave.startsWith('arv_'))
      .map(([chave, valor]) => [chave, normalizarTexto(String(valor || ''))])
  )
});
};

const getDadosFormularioAtual = (): CasoDesaparecimento =>
  buildCasoFromForm(form ? new FormData(form) : new FormData());

type CampoPreenchivel = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

const primeiroValorDisponivel = (dados: Record<string, unknown>, chaves: string[]): string => {
  for (const chave of chaves) {
    const valor = dados[chave];
    if (valor !== undefined && valor !== null && String(valor).trim() !== '') return String(valor).trim();
  }
  return '';
};

const preencherSeVazio = (nomeCampo: string, valor: string, origem: string[]): void => {
  if (!valor) return;
  const campo = document.querySelector<CampoPreenchivel>(`[name="${nomeCampo}"], #${nomeCampo}`);
  if (!campo) return;
  const atual = String(campo.value || '').trim();
  if (atual && atual !== 'Não informado') return;
  campo.value = valor;
  campo.dispatchEvent(new Event('input', { bubbles: true }));
  campo.dispatchEvent(new Event('change', { bubbles: true }));
  console.info('[TRIAGEM] Autopreenchimento aplicado', { origem, destino: nomeCampo, valor });
};

const coletarDadosFormularioAtual = (): Record<string, unknown> => {
  const dadosRegistro = formRegistro ? Object.fromEntries(new FormData(formRegistro).entries()) : {};
  const dadosTriagem = form ? Object.fromEntries(new FormData(form).entries()) : {};
  return { ...dadosTriagem, ...dadosRegistro };
};

const autopreencherTriagemComDadosExistentes = (): void => {
  const dados = coletarDadosFormularioAtual();
  const mapa: Array<{ origem: string[]; destino: string }> = [
    { origem: ['municipio'], destino: 'arv_p1_municipio_resp' },
    { origem: ['nomeCompletoDesaparecido'], destino: 'arv_p1_nome_resp' },
    { origem: ['sexoGenero'], destino: 'arv_p1_sexo_resp' },
    { origem: ['idade'], destino: 'arv_p1_idade_resp' },
    { origem: ['fotoDigitalDisponivel', 'fotoDisponivel'], destino: 'arv_p1_foto_recente_resp' },
    { origem: ['dispositivoVinculado', 'dispositivoLigado'], destino: 'arv_p1_dispositivo_vinculado_resp' },
    { origem: ['dataHoraUltimaVisualizacao'], destino: 'arv_p2_data_hora_ultima_resp' },
    { origem: ['localUltimaVisualizacao'], destino: 'arv_p2_local_ultima_resp' },
    { origem: ['roupaUltimaVisualizacao'], destino: 'arv_p2_roupa_resp' },
    { origem: ['meioTransporte'], destino: 'arv_p2_meio_transporte_resp' },
    { origem: ['dadosVeiculoTransporte', 'dadosVeiculo'], destino: 'arv_p2_dados_veiculo_resp' },
    { origem: ['nomeSolicitante'], destino: 'arv_p3_vinculo_comp' },
    { origem: ['vinculoSolicitante'], destino: 'arv_p3_vinculo_resp' },
    { origem: ['telefoneSolicitante'], destino: 'arv_p3_telefone_comp' }
  ];
  mapa.forEach((item) => preencherSeVazio(item.destino, primeiroValorDisponivel(dados, item.origem), item.origem));
  const emergencia = primeiroValorDisponivel(dados, ['emergencia', 'tipoEmergencia', 'descricaoEmergencia']) || 'Pessoa desaparecida';
  preencherSeVazio('arv_p1_emergencia_resp', emergencia, ['emergencia', 'tipoEmergencia', 'descricaoEmergencia']);
};

let triagemState: TriagemState = calcularEstadoTriagem(getDadosFormularioAtual(), Math.min(initial, etapasTriagem.length - 1), 'Pronto para triagem.');

type TipoStatus = 'padrao' | 'rascunho' | 'oficial' | 'bloqueio';

const atualizarStatus = (mensagem: string, erro = false, tipo: TipoStatus = 'padrao'): void => {
  triagemState.status = mensagem;
  const status = document.getElementById('case-status-banner');
  const texto = document.getElementById('case-status-message');
  if (texto) texto.textContent = mensagem;
  status?.classList.toggle('danger', erro);
  status?.classList.toggle('warning', !erro && tipo === 'rascunho');
  status?.classList.toggle('success', !erro && tipo === 'oficial');
  status?.classList.toggle('blocked', tipo === 'bloqueio');
};

const obterOperadorAtual = (): string =>
  normalizarTexto(
    localStorage.getItem('cabineVerdeOperadorNome') ||
      localStorage.getItem('cabineVerdeOperadorEmail') ||
      triagemState.dados.nomeSolicitante ||
      'Operador'
  );

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

  const progresso = document.getElementById('triage-progress-text');
  if (progresso) {
    const percentual = Math.round(((triagemState.etapa + 1) / etapasTriagem.length) * 100);
    progresso.textContent = `Triagem: ${percentual}% concluída`;
  }

  const botaoProximo = document.getElementById('next-step') as HTMLButtonElement | null;
  if (botaoProximo) {
    botaoProximo.hidden = triagemState.etapa >= etapasTriagem.length - 1;
  }
};

const sincronizarCondicionais = (): void => {
  const faixa = calcularFaixaEtaria(triagemState.dados.idade);
  const container = document.getElementById('age-questions');
  if (container) container.innerHTML = renderPerguntasFaixa(faixa);

  const ageBlock = document.getElementById('age-block');
  if (ageBlock) ageBlock.hidden = !triagemState.dados.idade;

  const crimeBlock = document.getElementById('crime-block');
  const techBlock = document.getElementById('tech-block');
  const vulnerabilityBlock = document.getElementById('vulnerability-details');
  if (crimeBlock) crimeBlock.hidden = !triagemState.dados.suspeitaCrime;
  if (techBlock) techBlock.hidden = !(triagemState.dados.dispositivoLigado || triagemState.dados.camerasResidencia || triagemState.dados.camerasUltimoLocal || triagemState.dados.fotoDisponivel);
  if (vulnerabilityBlock) vulnerabilityBlock.hidden = !triagemState.dados.vulnerabilidade;
  const valorFoto = (form?.elements.namedItem('fotoDisponivel') as HTMLSelectElement | null)?.value;
  mostrarBlocoUploadFoto(fotoDigitalDisponivelSelecionada(valorFoto) || Boolean(urlFotoUploadAtual));
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


const preencherFormularioComCaso = (caso: Record<string, unknown>): void => {
  if (!form) return;
  const idCasoOriginal = normalizarTexto(String(caso.idCaso || caso.id || ''));
  if (!idCasoOriginal) return;
  casoOriginalEdicao = { ...caso };

  const campos = form.querySelectorAll<CampoPreenchivel>('input[name], input[id], select[name], select[id], textarea[name], textarea[id]');
  campos.forEach((campo) => {
    const chave = campo.getAttribute('name') || campo.getAttribute('id') || '';
    if (!chave || chave === 'idCaso') return;
    const valor = caso[chave];
    if (valor === undefined || valor === null) return;

    if (campo instanceof HTMLInputElement && campo.type === 'checkbox') campo.checked = Boolean(valor);
    else campo.value = String(valor);

    campo.dispatchEvent(new Event('input', { bubbles: true }));
    campo.dispatchEvent(new Event('change', { bubbles: true }));
  });

  const campoIdCaso = form.elements.namedItem('idCaso') as HTMLInputElement | null;
  if (campoIdCaso) campoIdCaso.value = idCasoOriginal;
  const urlFotoExistente = normalizarTexto(String(caso.urlFoto || caso.linkFoto || ''));
  if (urlFotoExistente) {
    const campoUrlFoto = form.elements.namedItem('urlFoto') as HTMLInputElement | null;
    const campoLinkFoto = form.elements.namedItem('linkFoto') as HTMLInputElement | null;
    if (campoUrlFoto) campoUrlFoto.value = urlFotoExistente;
    if (campoLinkFoto) campoLinkFoto.value = urlFotoExistente;
    urlFotoUploadAtual = urlFotoExistente;
    mostrarBlocoUploadFoto(true);
    atualizarPreviewFoto(urlFotoExistente);
    const status = document.getElementById('statusUploadFoto');
    if (status) status.textContent = 'Foto já vinculada ao caso.';
  }
  modoFormulario = 'edicao';
  idCasoEdicaoAtual = idCasoOriginal;
  atualizarStatus(`Editando caso: ${idCasoOriginal}`);
};

const coletarCamposVisiveisDoFormulario = (): { dados: Record<string, unknown>; camposPresentes: string[] } => {
  if (!form) return { dados: {}, camposPresentes: [] };
  const campos = form.querySelectorAll<CampoPreenchivel>('input[name], input[id], select[name], select[id], textarea[name], textarea[id]');
  const dados: Record<string, unknown> = {};
  const camposPresentes = new Set<string>();
  campos.forEach((campo) => {
    const chave = campo.getAttribute('name') || campo.getAttribute('id') || '';
    if (!chave || (campo instanceof HTMLInputElement && campo.type === 'file')) return;
    camposPresentes.add(chave);
    if (campo instanceof HTMLInputElement && campo.type === 'checkbox') {
      dados[chave] = campo.checked;
    } else {
      dados[chave] = campo.value;
    }
  });
  return { dados, camposPresentes: Array.from(camposPresentes) };
};

const montarPayloadCasoParaSalvar = (): CasoCompleto => {
  const dadosFormulario = getDadosFormularioAtual();
  if (modoFormulario !== 'edicao') return calcularEstadoTriagem(dadosFormulario, triagemState.etapa, triagemState.status).casoCompleto;

  const { dados, camposPresentes } = coletarCamposVisiveisDoFormulario();
  const payloadFinal: Record<string, unknown> = { ...(casoOriginalEdicao || {}) };
  if (urlFotoUploadAtual) { payloadFinal.urlFoto = urlFotoUploadAtual; payloadFinal.linkFoto = urlFotoUploadAtual; }
  camposPresentes.forEach((campo) => {
    payloadFinal[campo] = dados[campo];
  });
  Object.assign(payloadFinal, dadosFormulario);
  payloadFinal.idCaso = idCasoEdicaoAtual || String(payloadFinal.idCaso || payloadFinal.id || '');
  payloadFinal.id = String(payloadFinal.idCaso || payloadFinal.id || '');
  payloadFinal.modo = 'edicao';

  console.info('[EDICAO] casoOriginal campos:', Object.keys(casoOriginalEdicao || {}).length);
  console.info('[EDICAO] camposFormulario:', camposPresentes.length);
  console.info('[EDICAO] payloadFinal campos:', Object.keys(payloadFinal).length);
  console.info('[EDICAO] idCaso preservado:', payloadFinal.idCaso);
  return calcularEstadoTriagem(payloadFinal as CasoDesaparecimento, triagemState.etapa, triagemState.status).casoCompleto;
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

const salvarAutoRascunho = (): void => {
  const chave = obterChaveAutoRascunho(triagemState.dados.id, triagemState.dados.talaoPMESP);
  if (!chave) return;
  salvarAutoRascunhoLocal(chave, triagemState);
  atualizarStatus('Rascunho salvo no dispositivo.', false, 'rascunho');
};

const agendarAutoRascunho = (): void => {
  if (timeoutAutoRascunho) window.clearTimeout(timeoutAutoRascunho);
  timeoutAutoRascunho = window.setTimeout(() => salvarAutoRascunho(), 400);
};

const atualizarLista = (casos?: CasoCompleto[]): void => {
  const wrapper = document.getElementById('case-list-wrapper');
  if (wrapper) wrapper.innerHTML = renderCaseList(casos || listarCasos());
};


const navegarParaModulo = (modulo: ModuloOperacional): void => {
  document.querySelectorAll<HTMLElement>('.cv-module').forEach((el) => {
    el.hidden = el.dataset.route !== modulo;
  });
};

const renderAcoesPosSalvar = (idCaso: string): void => {
  const acoes = document.getElementById('post-save-actions');
  if (!acoes) return;
  acoes.hidden = false;
  acoes.setAttribute('data-case-id', idCaso);
};

const sincronizarIdCasoPersistente = (idCaso: string): void => {
  const idNormalizado = normalizarTexto(idCaso);
  if (!idNormalizado) return;
  ultimoIdCasoSalvo = idNormalizado;
  idCasoEdicaoAtual = idNormalizado;
  modoFormulario = 'edicao';
  const campoIdCaso = form?.elements.namedItem('idCaso') as HTMLInputElement | null;
  if (campoIdCaso) campoIdCaso.value = idNormalizado;
  triagemState.dados.id = idNormalizado;
};

const renderDetalheCaso = (caso: CasoCompleto): void => {
  const details = document.getElementById('case-details');
  if (!details) return;
  details.innerHTML = `
    <section><h4>Identificação</h4><p><strong>${caso.id}</strong> · ${caso.statusCaso}</p></section>
    <section><h4>Desaparecido</h4><p>${caso.nomeCompletoDesaparecido} · ${caso.idade} anos (${caso.faixaEtaria})</p></section>
    <section><h4>Contexto</h4><p>${caso.localUltimaVisualizacao || '-'} em ${caso.dataHoraUltimaVisualizacao || '-'}</p></section>
    <section><h4>Risco e vulnerabilidade</h4><p>${caso.classificacaoRisco} · Prioridade ${caso.prioridade} · Suspeita crime: ${caso.suspeitaCrime ? 'Sim' : 'Não'}</p></section>
    <section><h4>Apoio tecnológico</h4><p>Dispositivo: ${caso.dispositivoLigado ? 'Sim' : 'Não'} · Câmeras: ${caso.camerasResidencia || caso.camerasUltimoLocal ? 'Sim' : 'Não'} · Foto: ${caso.fotoDisponivel ? 'Sim' : 'Não'}</p><div class="cv-case-photo">${(caso.urlFoto || caso.linkFoto) ? `<img src="${caso.urlFoto || caso.linkFoto}" alt="Foto do desaparecido" />` : '<div class="cv-photo-placeholder">Sem foto</div>'}</div></section>
    <section><h4>Histórico de atualização</h4><p>Solicitante: ${caso.nomeSolicitante || '-'} · Atualizado em ${new Date().toLocaleString('pt-BR')}</p></section>`;
};

const aplicarFiltros = (): void => {
  const filtroId = (document.getElementById('filter-idCaso') as HTMLInputElement | null)?.value.toLowerCase() || '';
  const filtroTalao = (document.getElementById('filter-talao') as HTMLInputElement | null)?.value.toLowerCase() || '';
  const filtroStatus = (document.getElementById('filter-status') as HTMLSelectElement | null)?.value || '';
  const filtroRisco = (document.getElementById('filter-risco') as HTMLSelectElement | null)?.value || '';
  const filtroData = (document.getElementById('filter-data') as HTMLInputElement | null)?.value || '';

  const casos = listarCasos().filter((caso) => {
    const matchId = !filtroId || caso.id.toLowerCase().includes(filtroId);
    const talaoCaso = `${caso.talaoPMESP || ''} ${caso.talaoBopm || ''}`.toLowerCase();
    const matchTalao = !filtroTalao || talaoCaso.includes(filtroTalao);
    const matchStatus = !filtroStatus || caso.statusCaso === filtroStatus;
    const matchRisco = !filtroRisco || caso.classificacaoRisco === filtroRisco;
    const matchData = !filtroData || caso.dataHoraRegistro.startsWith(filtroData);
    return matchId && matchTalao && matchStatus && matchRisco && matchData;
  });

  atualizarLista(casos);
};


if (formRegistro) {
  formRegistro.addEventListener('submit', (event) => {
    event.preventDefault();
    const dadosRegistro = new FormData(formRegistro);
    if (form) {
      const mapCampos = ['talaoPMESP', 'nomeCompletoDesaparecido', 'idade', 'sexoGenero', 'municipio', 'dataHoraUltimaVisualizacao', 'nomeSolicitante', 'telefoneSolicitante'];
      mapCampos.forEach((campo) => {
        const valor = String(dadosRegistro.get(campo) || '');
        const destino = form.elements.namedItem(campo) as HTMLInputElement | null;
        if (destino) destino.value = valor;
      });
      atualizarStateDoFormulario();
      autopreencherTriagemComDadosExistentes();
      agendarAutoRascunho();
    }
    atualizarStatus('Registro salvo. Redirecionando para triagem.');
    navegarParaModulo('triagem');
  });
}

if (form) {
  const idCasoUrl = normalizarTexto(new URLSearchParams(window.location.search).get('idCaso') || '');
  if (idCasoUrl) sincronizarIdCasoPersistente(idCasoUrl);
  (document.getElementById('session-id') as HTMLInputElement | null)!.value = sessionId;
  const ultimoAutoRascunho = carregarUltimoAutoRascunho();
  if (ultimoAutoRascunho) {
    const desejaContinuar = window.confirm(`Encontramos um rascunho local (${ultimoAutoRascunho.chave}). Deseja continuar de onde parou?`);
    if (desejaContinuar) {
      triagemState = ultimoAutoRascunho.draft;
      preencherFormulario(triagemState.dados);
      atualizarStatus('Rascunho local restaurado.');
    }
  }
  atualizarEtapaVisual(triagemState.etapa);
  autopreencherTriagemComDadosExistentes();
  atualizarStateDoFormulario();
  renderLogs();

  form.addEventListener('input', atualizarStateDoFormulario);
  form.addEventListener('input', agendarAutoRascunho);
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
    if (isSaving) return;
    isSaving = true;
    const botaoSalvar = document.getElementById('save-registro') as HTMLButtonElement | null;
    if (botaoSalvar) botaoSalvar.disabled = true;
    try {
      atualizarStateDoFormulario();
    autopreencherTriagemComDadosExistentes();
    atualizarStateDoFormulario();
    triagemState.dados.statusCaso = StatusCaso.EM_BUSCA;
    const operadorAtual = obterOperadorAtual();
    triagemState.dados.operadorCriador = triagemState.dados.operadorCriador || operadorAtual;
    triagemState.dados.operadorUltimaAcao = operadorAtual;
    triagemState = calcularEstadoTriagem(triagemState.dados, triagemState.etapa, triagemState.status);
    triagemState = calcularEstadoTriagem(montarPayloadCasoParaSalvar(), triagemState.etapa, triagemState.status);

    salvarCasoLocal(triagemState.casoCompleto);
    const summary = document.getElementById('case-summary');
    if (summary) summary.textContent = gerarResumoCaso(triagemState.casoCompleto);
    renderDetalheCaso(triagemState.casoCompleto);
    renderAcoesPosSalvar(triagemState.casoCompleto.id);

    const payload = gerarPayloadSheets(triagemState.casoCompleto);
    payload.dados.modo = modoFormulario;
    if (modoFormulario === 'edicao' && idCasoEdicaoAtual) payload.dados.idCaso = idCasoEdicaoAtual;
    if (urlFotoUploadAtual) {
      payload.dados.urlFoto = urlFotoUploadAtual;
      payload.dados.linkFoto = urlFotoUploadAtual;
    }
    payload.dados.fotoDisponivel = payload.dados.urlFoto || payload.dados.linkFoto ? 'Sim' : 'Pendente';

    atualizarStatus('Gravação em andamento na planilha central...');
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

    const mensagemOperacional = retorno.ok
      ? `Registro confirmado na planilha (${retorno.aba || 'CASOS'}).`
      : `Falha no registro: ${retorno.message || 'causa não informada pelo endpoint'}`;
    atualizarStatus(mensagemOperacional, !retorno.ok, retorno.ok ? 'oficial' : 'padrao');
    if (!retorno.ok) {
      const chaveAuto = obterChaveAutoRascunho(triagemState.casoCompleto.id, triagemState.casoCompleto.talaoPMESP);
      if (chaveAuto) salvarAutoRascunhoLocal(chaveAuto, triagemState);
      atualizarStatus('Falha de conexão detectada: rascunho salvo localmente para retentativa.', true, 'rascunho');
    }
    if (retorno.ok) {
      referenciaCasoSalvo = { idCaso: retorno.idCaso || triagemState.casoCompleto.id, talaoPMESP: triagemState.casoCompleto.talaoPMESP };
      atualizarStatusFotoPendente(payload.dados.fotoDisponivel === 'Sim' ? 'Foto disponível: Sim' : 'Foto pendente.');
      const chaveAuto = obterChaveAutoRascunho(triagemState.casoCompleto.id, triagemState.casoCompleto.talaoPMESP);
      if (chaveAuto) limparAutoRascunhoLocal(chaveAuto);
      casoOriginalEdicao = null;
    }
      atualizarLista();
      aplicarFiltros();
    } finally {
      isSaving = false;
      if (botaoSalvar) botaoSalvar.disabled = false;
    }
  });
}

document.getElementById('btn-adicionar-foto-agora')?.addEventListener('click', () => {
  mostrarBlocoUploadFoto(true);
  atualizarStatus('Selecione a foto e clique novamente em "Adicionar foto agora" para enviar.');
  salvarFotoDepoisDaTriagem();
});

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
  salvarAutoRascunho();
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
  modoFormulario = 'criacao';
  idCasoEdicaoAtual = '';
  ultimoIdCasoSalvo = '';
  referenciaCasoSalvo = null;
  atualizarStateDoFormulario();
});

document.getElementById('copy-report')?.addEventListener('click', async () => {
  const report = document.getElementById('report-content') as HTMLTextAreaElement | null;
  if (report?.value) await navigator.clipboard.writeText(report.value);
  atualizarStatus('Relatório copiado para área de transferência.');
});

document.addEventListener('click', (event) => {
  const acao = (event.target as HTMLElement).closest('[data-flow-action]') as HTMLElement | null;
  if (!acao) return;
  const tipo = acao.getAttribute('data-flow-action');
  if (tipo === 'ir-consulta' || tipo === 'ver-caso' || tipo === 'ver-timeline') navegarParaModulo('consulta');
  if (tipo === 'ver-qualidade') navegarParaModulo('qualidade');
  if (tipo === 'ver-fotos' || tipo === 'abrir-caso-relacionado') navegarParaModulo('midias');
  if (tipo === 'gerar-relatorio') { navegarParaModulo('relatorios'); document.getElementById('generate-report')?.dispatchEvent(new Event('click')); }
  if (tipo === 'ver-timeline') atualizarStatus('Fluxo decisão: problema → caso → evidências → decisão (timeline).');
});

document.getElementById('case-list-wrapper')?.addEventListener('click', (event) => {
  const target = event.target as HTMLElement;
  const trigger = target.closest('[data-open-case]') as HTMLElement | null;
  if (!trigger) return;
  const caso = listarCasos().find((item) => item.id === trigger.getAttribute('data-open-case'));
  if (!caso) return;
  preencherFormularioComCaso(caso as unknown as Record<string, unknown>);
  triagemState = calcularEstadoTriagem(caso, triagemState.etapa, triagemState.status);
  renderDetalheCaso(caso);
  atualizarStateDoFormulario();
  const moduloDestino = trigger.getAttribute('data-go-module') as ModuloOperacional | null;
  if (moduloDestino) navegarParaModulo(moduloDestino);
  atualizarStatus(`Editando caso ${caso.id}.`);
});

['filter-idCaso', 'filter-talao', 'filter-status', 'filter-risco', 'filter-data'].forEach((id) => {
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


const configurarUploadFotoDesaparecido = (): void => {
  const fotoInput = document.getElementById('fotoDesaparecido') as HTMLInputElement | null;
  const status = document.getElementById('statusUploadFoto');
  const seletorFotoDisponivel = form?.elements.namedItem('fotoDisponivel') as HTMLSelectElement | null;
  if (!fotoInput || !status) return;

  const atualizarVisibilidade = (): void => {
    mostrarBlocoUploadFoto(fotoDigitalDisponivelSelecionada(seletorFotoDisponivel?.value) || Boolean(urlFotoUploadAtual));
  };
  seletorFotoDisponivel?.addEventListener('change', atualizarVisibilidade);
  atualizarVisibilidade();

  fotoInput.addEventListener('change', async () => {
    const foto = fotoInput.files?.[0];
    assinaturaUploadFotoConcluido = '';
    if (!foto) {
      status.textContent = 'Nenhuma imagem enviada.';
      atualizarPreviewFoto('');
      return;
    }
    if (!foto.type.startsWith('image/')) {
      status.textContent = 'Arquivo inválido. Selecione uma imagem.';
      return;
    }
    if (foto.size > MAX_FOTO_BYTES) {
      status.textContent = 'Arquivo inválido. A imagem deve ter até 5MB.';
      return;
    }
    atualizarPreviewFoto(URL.createObjectURL(foto));
    status.textContent = 'Imagem pronta para envio. Clique em Adicionar foto agora.';
  });
};

configurarUploadFotoDesaparecido();

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
