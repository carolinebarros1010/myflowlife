const { app, BrowserWindow, ipcMain, dialog, shell, nativeImage, clipboard } = require('electron');
const path = require('path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const http = require('node:http');
const https = require('node:https');
const { execFile } = require('node:child_process');
const Database = require('better-sqlite3');

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');

const raiz = path.resolve(__dirname, '..');
const pastaPersistencia = app.isPackaged ? path.join(app.getPath('appData'), 'Cabine Verde') : raiz;
const pastaDados = path.join(pastaPersistencia, 'dados');
const bancoPath = path.join(pastaDados, 'cabine-verde.sqlite');
const fotosPath = path.join(pastaPersistencia, 'fotos');
const pastaFotosCasos = path.join(fotosPath, 'casos');
const pastaFotosLegado = path.join(fotosPath, 'legado');
const configuracaoPath = path.join(pastaPersistencia, 'configuracao.json');
let banco;

function lerConfiguracao() {
  const padrao = { modo: 'central', apiBaseUrl: process.env.CABINE_VERDE_API_URL || 'http://10.59.186.112' };
  try { return { ...padrao, ...JSON.parse(fs.readFileSync(configuracaoPath, 'utf8')) }; } catch { return padrao; }
}
function salvarConfiguracao(configuracao) { const atual = { ...lerConfiguracao(), modo: configuracao?.modo === 'central' ? 'central' : 'local', apiBaseUrl: String(configuracao?.apiBaseUrl || process.env.CABINE_VERDE_API_URL || 'http://10.59.186.112').trim().replace(/\/$/, '') }; fs.mkdirSync(pastaPersistencia, { recursive: true }); fs.writeFileSync(configuracaoPath, JSON.stringify(atual, null, 2), 'utf8'); return atual; }
function requisicaoHttp(endereco, opcoes = {}) { return new Promise((resolve, reject) => { const url = new URL(endereco); const cliente = url.protocol === 'https:' ? https : http; const headers = { ...(opcoes.headers || {}) }; const corpoEnvio = opcoes.body === undefined || opcoes.body === null ? null : Buffer.from(String(opcoes.body), 'utf8'); if (corpoEnvio) headers['Content-Length'] = String(corpoEnvio.length); const requisicao = cliente.request(url, { method: opcoes.method || 'GET', headers }, resposta => { const partes = []; resposta.on('data', parte => partes.push(parte)); resposta.on('end', () => { const corpo = Buffer.concat(partes); resolve({ statusCode: resposta.statusCode || 0, text: async () => corpo.toString('utf8'), buffer: async () => corpo }); }); }); requisicao.setTimeout(120000, () => requisicao.destroy(new Error('Tempo limite de 120 segundos excedido.'))); requisicao.on('error', reject); if (corpoEnvio) requisicao.write(corpoEnvio); requisicao.end(); }); }
async function requisicaoServidor(caminho, opcoes = {}) { const config = lerConfiguracao(); const resposta = await requisicaoHttp(`${config.apiBaseUrl}${caminho}`, { ...opcoes, headers: { 'Content-Type': 'application/json', ...(opcoes.headers || {}) } }); const texto = await resposta.text(); let dados; try { dados = texto ? JSON.parse(texto) : {}; } catch { throw new Error('O servidor retornou JSON invÃ¡lido.'); } if (resposta.statusCode < 200 || resposta.statusCode >= 300) throw new Error(dados.erro || `Servidor respondeu HTTP ${resposta.statusCode}.`); return dados; }
function modoCentralAtivo() { return lerConfiguracao().modo === 'central'; }
async function salvarOcorrenciaCentral(idCaso, dados, existente = false) {
  const payload = { id: String(idCaso), ...dados, dados: { ...dados } };
  if (existente) return requisicaoServidor(`/api/ocorrencias/${encodeURIComponent(idCaso)}`, { method: 'PUT', body: JSON.stringify(payload) });
  try { return await requisicaoServidor('/api/ocorrencias', { method: 'POST', body: JSON.stringify(payload) }); }
  catch (erro) { const mensagem = String(erro.message || '').toLowerCase(); if (!mensagem.includes('409') && !mensagem.includes('cadastrad')) throw erro; return requisicaoServidor(`/api/ocorrencias/${encodeURIComponent(idCaso)}`, { method: 'PUT', body: JSON.stringify(payload) }); }
}
async function prepararManifestoCentral() { const config = lerConfiguracao(); const [fotos, ocorrencias] = await Promise.all([requisicaoServidor('/api/fotos'), requisicaoServidor('/api/ocorrencias')]); const porId = new Map((Array.isArray(ocorrencias) ? ocorrencias : []).map(item => [String(item.id), item])); const manifesto = []; for (const foto of (Array.isArray(fotos) ? fotos : [])) { const caminho = path.join(pastaFotosLegado, 'central', String(foto.idOcorrencia).replace(/[^a-zA-Z0-9_-]/g, '_'), foto.nomeArquivo); fs.mkdirSync(path.dirname(caminho), { recursive: true }); if (!fs.existsSync(caminho)) { const resposta = await requisicaoHttp(`${config.apiBaseUrl}${foto.url}`); if (resposta.statusCode < 200 || resposta.statusCode >= 300) continue; fs.writeFileSync(caminho, await resposta.buffer()); } const caso = porId.get(String(foto.idOcorrencia)) || {}; manifesto.push({ id: foto.url, idCaso: String(foto.idOcorrencia), nome: caso.nome || caso.nome_desaparecido || 'Sem nome', talao: caso.talao_pm || caso.talaoPMESP || 'Sem talÃ£o', nomeArquivo: foto.nomeArquivo, caminhoLocal: caminho }); } const manifestoPath = path.join(pastaFotosLegado, 'central', 'manifest.json'); fs.writeFileSync(manifestoPath, JSON.stringify(manifesto, null, 2), 'utf8'); return manifestoPath; }

function prepararArmazenamento() {
  fs.mkdirSync(pastaDados, { recursive: true });
  fs.mkdirSync(pastaFotosCasos, { recursive: true });
  fs.mkdirSync(pastaFotosLegado, { recursive: true });
  if (!fs.existsSync(bancoPath)) {
    const bancoInicial = app.isPackaged ? path.join(process.resourcesPath, 'data', 'cabine-verde.sqlite') : path.join(raiz, 'data', 'cabine-verde.sqlite');
    if (!fs.existsSync(bancoInicial)) throw new Error(`Banco local nÃ£o encontrado: ${bancoInicial}`);
    fs.copyFileSync(bancoInicial, bancoPath);
  }
}

function abrirBanco() {
  if (!fs.existsSync(bancoPath)) throw new Error(`Banco local nÃ£o encontrado: ${bancoPath}`);
  banco = new Database(bancoPath, { readonly: false });
  banco.exec(`CREATE TABLE IF NOT EXISTS operadores_local (email TEXT PRIMARY KEY, nome TEXT NOT NULL, re TEXT NOT NULL, posto_graduacao TEXT NOT NULL DEFAULT '', equipe TEXT NOT NULL, perfil TEXT NOT NULL DEFAULT 'OPERADOR', ativo INTEGER NOT NULL DEFAULT 1, criado_em TEXT NOT NULL, ultimo_acesso TEXT)`);
  banco.exec(`CREATE TABLE IF NOT EXISTS auditoria_local (id INTEGER PRIMARY KEY AUTOINCREMENT, id_caso TEXT NOT NULL, operador TEXT NOT NULL, justificativa TEXT NOT NULL, alteracoes_json TEXT NOT NULL, criado_em TEXT NOT NULL)`);
  banco.exec(`CREATE TABLE IF NOT EXISTS indicadores_producao_legado (id INTEGER PRIMARY KEY AUTOINCREMENT, periodo TEXT NOT NULL, dias_trabalhados INTEGER NOT NULL DEFAULT 0, localizadas_total INTEGER NOT NULL DEFAULT 0, localizadas_cabine INTEGER NOT NULL DEFAULT 0, localizadas_vtr INTEGER NOT NULL DEFAULT 0, localizadas_vulto_outros INTEGER NOT NULL DEFAULT 0, localizadas_preso INTEGER NOT NULL DEFAULT 0, localizadas_obito INTEGER NOT NULL DEFAULT 0, procedimentos_total INTEGER NOT NULL DEFAULT 0, fonte TEXT NOT NULL, incompleto INTEGER NOT NULL DEFAULT 1, importado_em TEXT NOT NULL)`);
  banco.exec(`CREATE TABLE IF NOT EXISTS producao_diaria (id INTEGER PRIMARY KEY AUTOINCREMENT, data TEXT NOT NULL, operador_email TEXT NOT NULL, operador_nome TEXT NOT NULL, estagiario TEXT NOT NULL DEFAULT '', analise_cadastros INTEGER NOT NULL DEFAULT 0, contatos_declarantes INTEGER NOT NULL DEFAULT 0, localizacoes_talao INTEGER NOT NULL DEFAULT 0, transferencias_6190 INTEGER NOT NULL DEFAULT 0, coleta_fotos INTEGER NOT NULL DEFAULT 0, transferencia_audio INTEGER NOT NULL DEFAULT 0, atualizacoes_siopm INTEGER NOT NULL DEFAULT 0, ocorrencias_geradas INTEGER NOT NULL DEFAULT 0, observacao TEXT NOT NULL DEFAULT '', criado_em TEXT NOT NULL, atualizado_em TEXT NOT NULL)`);
  banco.exec(`CREATE TABLE IF NOT EXISTS producao_consolidada (id TEXT PRIMARY KEY, tipo TEXT NOT NULL, data_inicio TEXT, data_final TEXT, data TEXT, dia_semana TEXT, operador TEXT, dias_trabalhados INTEGER NOT NULL DEFAULT 0, localizacao_desaparecido INTEGER NOT NULL DEFAULT 0, localizacoes_cabine INTEGER NOT NULL DEFAULT 0, localizacoes_vtr INTEGER NOT NULL DEFAULT 0, localizacoes_vulto_outros INTEGER NOT NULL DEFAULT 0, localizacoes_preso INTEGER NOT NULL DEFAULT 0, localizacoes_obito INTEGER NOT NULL DEFAULT 0, analise_cadastros INTEGER NOT NULL DEFAULT 0, contatos_declarantes INTEGER NOT NULL DEFAULT 0, localizacoes_talao INTEGER NOT NULL DEFAULT 0, transferencias_6190 INTEGER NOT NULL DEFAULT 0, coleta_fotos INTEGER NOT NULL DEFAULT 0, transferencia_audio INTEGER NOT NULL DEFAULT 0, atualizacoes_siopm INTEGER NOT NULL DEFAULT 0, ocorrencias_geradas INTEGER NOT NULL DEFAULT 0, observacao TEXT NOT NULL DEFAULT '', origem_aba TEXT NOT NULL DEFAULT '', linha_origem INTEGER NOT NULL DEFAULT 0)`);
  banco.exec(`CREATE TABLE IF NOT EXISTS vitimas_caso (id INTEGER PRIMARY KEY AUTOINCREMENT, id_caso TEXT NOT NULL, ordem INTEGER NOT NULL, nome TEXT NOT NULL DEFAULT '', dados_json TEXT NOT NULL DEFAULT '{}', criado_em TEXT NOT NULL, atualizado_em TEXT NOT NULL, UNIQUE(id_caso, ordem))`);
  const colunasOperadores = banco.prepare('PRAGMA table_info(operadores_local)').all();
  if (!colunasOperadores.some(coluna => coluna.name === 'posto_graduacao')) banco.exec("ALTER TABLE operadores_local ADD COLUMN posto_graduacao TEXT NOT NULL DEFAULT ''");
}

function normalizarEntrevistasSalvas() {
  const registros = banco.prepare("SELECT id_caso, nome_desaparecido, dados_json FROM casos WHERE dados_json LIKE '%respostasArvore%'").all();
  const agora = new Date().toISOString();
  const atualizar = banco.transaction(() => {
    for (const registro of registros) {
      let dados;
      try { dados = JSON.parse(registro.dados_json || '{}'); } catch { continue; }
      const respostas = dados.respostasArvore && typeof dados.respostasArvore === 'object' ? dados.respostasArvore : {};
      const nome = String(registro.nome_desaparecido || respostas.__nomeCaso || respostas.p3 || respostas.passo1_nome || respostas.nomeCompletoDesaparecido || '').trim();
      const talao = String(respostas.__talaoPMESP || respostas.talao_pm || respostas.talao || '').trim();
      if (nome || talao) banco.prepare('UPDATE casos SET nome_desaparecido = CASE WHEN ? <> \'\' THEN ? ELSE nome_desaparecido END, talao_pm = CASE WHEN ? <> \'\' THEN ? ELSE talao_pm END WHERE id_caso = ?').run(nome, nome, talao, talao, registro.id_caso);
      const temVitima = banco.prepare('SELECT 1 FROM vitimas_caso WHERE id_caso = ? LIMIT 1').get(registro.id_caso);
      if (!temVitima) banco.prepare('INSERT INTO vitimas_caso(id_caso,ordem,nome,dados_json,criado_em,atualizado_em) VALUES (?,?,?,?,?,?)').run(registro.id_caso, 1, nome, JSON.stringify({ ordem: 1, respostasArvore: respostas, complementosArvore: dados.complementosArvore || {}, ultimaEdicaoArvore: dados.ultimaEdicaoArvore || { painel: 'ENTREVISTA_INICIAL', dataHora: agora, operador: 'migracao-automatica' } }), agora, agora);
    }
  });
  atualizar();
}

function criarJanela() {
  const janela = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1100,
    minHeight: 720,
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false }
  });
  if (app.isPackaged) janela.loadFile(path.join(raiz, 'dist-local', 'index.html'));
  else janela.loadURL('http://localhost:5173');
}

function campoVerdadeiro(valor) { return valor === true || valor === 1 || ['true', 'sim', 'yes', '1', 'localizado'].includes(String(valor ?? '').trim().toLowerCase()); }
function nomeSeguroArquivo(valor, fallback = 'SEM-INFORMACAO') { const normalizado = String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80); return normalizado || fallback; }
function dataDashboard(valor) { const texto = String(valor || '').trim(); if (!texto) return null; const data = new Date(texto.length === 10 ? `${texto}T12:00:00` : texto); return Number.isNaN(data.getTime()) ? null : data; }
function classificarLocalizacao(dados) { const categoria = `${dados.categoria || ''} ${dados.resultado || ''} ${dados.recurso || ''}`.toLowerCase(); if (categoria.includes('morta') || categoria.includes('Ã³bito') || categoria.includes('obito')) return 'obito'; if (categoria.includes('preso') || categoria.includes('prisÃ£o') || categoria.includes('prisao')) return 'preso'; if (categoria.includes('vtr') || categoria.includes('viatura')) return 'vtr'; if (categoria.includes('muralha') || categoria.includes('cabine')) return 'cabine'; return 'vultoOutros'; }
function enriquecerCandidatos(candidatos) { return (candidatos || []).map(item => { const imagem = nativeImage.createFromPath(String(item.caminhoLocal || '')); return { ...item, dataUrl: imagem.isEmpty() ? '' : imagem.toDataURL() }; }); }

function salvarPrimeiraVitima(idCaso, respostas, complementos, operador, central = modoCentralAtivo()) {
  const agora = new Date().toISOString();
  const respostasArvore = respostas || {};
  const complementosArvore = complementos || {};
  const nome = String(respostasArvore.__nomeCaso || respostasArvore.passo1_nome || respostasArvore.nomeCompletoDesaparecido || '').trim();
  const talao = String(respostasArvore.__talaoPMESP || '').trim();
  if (central) return (async () => {
    if (nome || talao) await requisicaoServidor(`/api/ocorrencias/${encodeURIComponent(idCaso)}`, { method: 'PUT', body: JSON.stringify({ nome, talao_pm: talao, atualizado_em: agora }) });
    const lista = await requisicaoServidor(`/api/vitimas?idCaso=${encodeURIComponent(idCaso)}`);
    let vitima = (Array.isArray(lista) ? lista : []).find(item => Number(item.ordem) === 1);
    if (!vitima) {
      vitima = await requisicaoServidor('/api/vitimas', { method: 'POST', body: JSON.stringify({ idCaso, ordem: 1, nome, respostasArvore, complementosArvore, ultimaEdicaoArvore: { painel: 'ENTREVISTA', dataHora: agora, operador } }) });
    } else {
      vitima = await requisicaoServidor(`/api/vitimas/${encodeURIComponent(String(vitima.idVitima || vitima.id))}`, { method: 'PUT', body: JSON.stringify({ idCaso, nome, respostasArvore, complementosArvore, ultimaEdicaoArvore: { painel: 'ENTREVISTA', dataHora: agora, operador }, operador }) });
    }
    return { id: vitima.idVitima || vitima.id, ordem: vitima.ordem || 1, confirmadoNoBanco: true };
  })();
  if (nome || talao) banco.prepare('UPDATE casos SET nome_desaparecido = CASE WHEN ? <> \'\' THEN ? ELSE nome_desaparecido END, talao_pm = CASE WHEN ? <> \'\' THEN ? ELSE talao_pm END WHERE id_caso = ?').run(nome, nome, talao, talao, idCaso);
  const existente = banco.prepare('SELECT * FROM vitimas_caso WHERE id_caso = ? AND ordem = 1').get(idCaso);
  if (existente) {
    const atual = JSON.parse(existente.dados_json || '{}');
    const novo = { ...atual, ordem: 1, respostasArvore: { ...(atual.respostasArvore || {}), ...respostasArvore }, complementosArvore: { ...(atual.complementosArvore || {}), ...complementosArvore }, ultimaEdicaoArvore: { painel: 'ENTREVISTA', dataHora: agora, operador } };
    banco.prepare('UPDATE vitimas_caso SET nome = ?, dados_json = ?, atualizado_em = ? WHERE id = ?').run(nome || existente.nome, JSON.stringify(novo), agora, existente.id);
    return { id: existente.id, ordem: 1, confirmadoNoBanco: true };
  }
  const id = banco.prepare('INSERT INTO vitimas_caso(id_caso,ordem,nome,dados_json,criado_em,atualizado_em) VALUES (?,?,?,?,?,?)').run(idCaso, 1, nome, JSON.stringify({ ordem: 1, respostasArvore, complementosArvore, ultimaEdicaoArvore: { painel: 'ENTREVISTA', dataHora: agora, operador } }), agora, agora).lastInsertRowid;
  return { id, ordem: 1, confirmadoNoBanco: true };
}

function registrarIpc() {
  ipcMain.handle('cv:configuracao', () => lerConfiguracao());
  ipcMain.handle('cv:buscar-pessoas-f2', async (_evento, dados = {}) => {
    if (!modoCentralAtivo()) return { ok: false, mensagem: 'A Nova AnÃ¡lise F2 exige o modo Servidor HTTP â€” dados centralizados.', pessoas: [] };
    try {
      const parametros = new URLSearchParams();
      if (dados.termo) parametros.set('termo', String(dados.termo));
      if (dados.dataTalao) parametros.set('dataTalao', String(dados.dataTalao));
      if (dados.talao) parametros.set('talao', String(dados.talao));
      if (dados.status) parametros.set('status', String(dados.status));
      if (dados.condicao) parametros.set('condicao', String(dados.condicao));
      if (dados.estagio) parametros.set('estagio', String(dados.estagio));
      if (dados.contato) parametros.set('contato', String(dados.contato));
      return { ok: true, pessoas: await requisicaoServidor(`/api/pessoas/busca?${parametros.toString()}`) };
    } catch (erro) { return { ok: false, mensagem: `Servidor central indisponÃ­vel: ${erro.message}`, pessoas: [] }; }
  });
  ipcMain.handle('cv:criar-pessoa-f2', async (_evento, dados = {}) => {
    if (!modoCentralAtivo()) return { ok: false, mensagem: 'A Nova AnÃ¡lise F2 exige o modo Servidor HTTP â€” dados centralizados.' };
    try { return { ok: true, pessoa: await requisicaoServidor('/api/pessoas', { method: 'POST', body: JSON.stringify(dados) }) }; }
    catch (erro) { return { ok: false, mensagem: `Servidor central indisponÃ­vel: ${erro.message}` }; }
  });
  ipcMain.handle('cv:analises-f2', async (_evento, idPessoa = '') => {
    if (!modoCentralAtivo()) return { ok: false, mensagem: 'A Nova AnÃ¡lise F2 exige o modo Servidor HTTP â€” dados centralizados.', analises: [] };
    try { return { ok: true, analises: await requisicaoServidor(`/api/analises?idPessoa=${encodeURIComponent(String(idPessoa))}`) }; }
    catch (erro) { return { ok: false, mensagem: `Servidor central indisponÃ­vel: ${erro.message}`, analises: [] }; }
  });
  ipcMain.handle('cv:criar-analise-f2', async (_evento, dados = {}) => {
    if (!modoCentralAtivo()) return { ok: false, mensagem: 'A Nova AnÃ¡lise F2 exige o modo Servidor HTTP â€” dados centralizados.' };
    try { return { ok: true, analise: await requisicaoServidor('/api/analises', { method: 'POST', body: JSON.stringify(dados) }) }; }
    catch (erro) { return { ok: false, mensagem: `Servidor central indisponÃ­vel: ${erro.message}` }; }
  });
  ipcMain.handle('cv:eventos-f2', async (_evento, idPessoa = '') => {
    if (!modoCentralAtivo()) return { ok: false, mensagem: 'A Nova AnÃ¡lise F2 exige o modo Servidor HTTP â€” dados centralizados.', eventos: [] };
    try { return { ok: true, eventos: await requisicaoServidor(`/api/eventos?idPessoa=${encodeURIComponent(String(idPessoa))}`) }; }
    catch (erro) { return { ok: false, mensagem: `Servidor central indisponÃ­vel: ${erro.message}`, eventos: [] }; }
  });
  ipcMain.handle('cv:criar-qualificacao-f2', async (_evento, dados = {}) => {
    if (!modoCentralAtivo()) return { ok: false, mensagem: 'A Nova AnÃ¡lise F2 exige o modo Servidor HTTP â€” dados centralizados.' };
    try { return { ok: true, qualificacao: await requisicaoServidor('/api/qualificacoes', { method: 'POST', body: JSON.stringify(dados) }) }; }
    catch (erro) { return { ok: false, mensagem: `Servidor central indisponÃ­vel: ${erro.message}` }; }
  });
  ipcMain.handle('cv:criar-pista-f2', async (_evento, dados = {}) => {
    if (!modoCentralAtivo()) return { ok: false, mensagem: 'A Nova AnÃ¡lise F2 exige o modo Servidor HTTP â€” dados centralizados.' };
    try { return { ok: true, pista: await requisicaoServidor('/api/pistas', { method: 'POST', body: JSON.stringify(dados) }) }; }
    catch (erro) { return { ok: false, mensagem: `Servidor central indisponÃ­vel: ${erro.message}` }; }
  });
  ipcMain.handle('cv:salvar-configuracao', (_evento, dados) => salvarConfiguracao(dados));
  ipcMain.handle('cv:testar-servidor', async (_evento, dados) => { try { const config = salvarConfiguracao({ ...dados, modo: 'central' }); const resposta = await requisicaoHttp(`${config.apiBaseUrl}/api/status`); const texto = await resposta.text(); const corpo = texto ? JSON.parse(texto) : {}; return resposta.statusCode >= 200 && resposta.statusCode < 300 ? { ok: true, configuracao: config, servidor: corpo } : { ok: false, mensagem: `Servidor respondeu HTTP ${resposta.statusCode}.` }; } catch (erro) { return { ok: false, mensagem: `Servidor Cabine Verde indisponÃ­vel. ${erro.message}` }; } });
  ipcMain.handle('cv:listar-producao-diaria', async (_evento, filtro = {}) => { const inicio = String(filtro.inicio || '0000-01-01'); const fim = String(filtro.fim || '9999-12-31'); const operadorEmail = String(filtro.operadorEmail || ''); if (modoCentralAtivo()) { try { const query = new URLSearchParams({ inicio, fim }); if (operadorEmail) query.set('operadorEmail', operadorEmail); const registros = await requisicaoServidor(`/api/producao-diaria?${query}`); return Array.isArray(registros) ? registros : []; } catch (erro) { console.error('Falha ao consultar produção diária central:', erro.message); return []; } } return banco.prepare(`SELECT * FROM producao_diaria WHERE data BETWEEN ? AND ? ${operadorEmail ? 'AND operador_email = ?' : ''} ORDER BY data DESC, operador_nome`).all(...(operadorEmail ? [inicio, fim, operadorEmail] : [inicio, fim])); });
  ipcMain.handle('cv:listar-producao-consolidada', async (_evento, filtro = {}) => {
    const inicio = String(filtro.inicio || '0000-01-01');
    const fim = String(filtro.fim || '9999-12-31');
    if (modoCentralAtivo()) {
      try { return await requisicaoServidor(`/api/consulta/producao-consolidada?inicio=${encodeURIComponent(inicio)}&fim=${encodeURIComponent(fim)}`); }
      catch (erro) { console.error('Falha ao consultar produção consolidada central:', erro.message); return { resumoMensal: [], registrosDiarios: [], totais: {} }; }
    }
    const mensal = banco.prepare("SELECT id, data_inicio AS dataInicio, data_final AS dataFinal, dias_trabalhados AS diasTrabalhados, localizacao_desaparecido AS localizacaoDesaparecido, localizacoes_cabine AS localizacoesCabine, localizacoes_vtr AS localizacoesVtr, localizacoes_vulto_outros AS localizacoesVultoOutros, localizacoes_preso AS localizacoesPreso, localizacoes_obito AS localizacoesObito, analise_cadastros AS analiseCadastros, contatos_declarantes AS contatosDeclarantes, localizacoes_talao AS localizacoesTalao, transferencias_6190 AS transferencias6190, coleta_fotos AS coletaFotos, transferencia_audio AS transferenciaAudio, atualizacoes_siopm AS atualizacoesSiopm, ocorrencias_geradas AS ocorrenciasGeradas, observacao, origem_aba AS origemAba, linha_origem AS linhaOrigem FROM producao_consolidada WHERE tipo = 'mensal' AND COALESCE(data_final, data_inicio) >= ? AND data_inicio <= ? ORDER BY data_inicio").all(inicio, fim);
    const diariosConsolidados = banco.prepare("SELECT id, data, dia_semana AS diaSemana, operador, analise_cadastros AS analiseCadastros, contatos_declarantes AS contatosDeclarantes, localizacoes_talao AS localizacoesTalao, transferencias_6190 AS transferencias6190, coleta_fotos AS coletaFotos, transferencia_audio AS transferenciaAudio, atualizacoes_siopm AS atualizacoesSiopm, ocorrencias_geradas AS ocorrenciasGeradas, observacao, origem_aba AS origemAba, linha_origem AS linhaOrigem FROM producao_consolidada WHERE tipo = 'diario' AND data >= ? AND data <= ? ORDER BY data, id").all(inicio, fim);
    const diariosOperacao = banco.prepare("SELECT id, data, operador_nome AS operador, analise_cadastros AS analiseCadastros, contatos_declarantes AS contatosDeclarantes, localizacoes_talao AS localizacoesTalao, transferencias_6190 AS transferencias6190, coleta_fotos AS coletaFotos, transferencia_audio AS transferenciaAudio, atualizacoes_siopm AS atualizacoesSiopm, ocorrencias_geradas AS ocorrenciasGeradas, observacao, 'OPERACAO_LOCAL' AS origemAba, 0 AS linhaOrigem FROM producao_diaria WHERE data >= ? AND data <= ? ORDER BY data, id").all(inicio, fim);
    const diarios = [...diariosConsolidados, ...diariosOperacao].sort((a, b) => String(a.data).localeCompare(String(b.data)) || Number(a.id || 0) - Number(b.id || 0));
    const camposProducao = ['analiseCadastros', 'contatosDeclarantes', 'localizacoesTalao', 'transferencias6190', 'coletaFotos', 'transferenciaAudio', 'atualizacoesSiopm', 'ocorrenciasGeradas'];
    const mensalPorMes = new Map(mensal.map((linha) => [String(linha.dataInicio || '').slice(0, 7), linha]));
    diariosOperacao.forEach((diario) => {
      const mes = String(diario.data || '').slice(0, 7);
      const linha = mensalPorMes.get(mes);
      if (!linha) {
        const novaLinha = { id: `mensal-operacao-${mes}`, dataInicio: `${mes}-01`, dataFinal: diario.data, diasTrabalhados: 1, localizacaoDesaparecido: 0, localizacoesCabine: 0, localizacoesVtr: 0, localizacoesVultoOutros: 0, localizacoesPreso: 0, localizacoesObito: 0 };
        camposProducao.forEach((campo) => { novaLinha[campo] = Number(diario[campo] || 0); });
        mensal.push(novaLinha);
        mensalPorMes.set(mes, novaLinha);
        return;
      }
      camposProducao.forEach((campo) => { linha[campo] = Number(linha[campo] || 0) + Number(diario[campo] || 0); });
    });
    mensal.sort((a, b) => String(a.dataInicio).localeCompare(String(b.dataInicio)));
    return { fonte: 'SQLITE', resumoMensal: mensal, registrosDiarios: diarios, totais: {}, totalRegistrosDiarios: diarios.length };
  });
  ipcMain.handle('cv:salvar-producao-diaria', async (_evento, dados = {}) => { const obrigatorios = ['data', 'operadorEmail', 'operadorNome']; if (obrigatorios.some(campo => !String(dados[campo] || '').trim())) return { ok: false, mensagem: 'Data e operador são obrigatórios.' }; if (modoCentralAtivo()) { try { const existentes = await requisicaoServidor(`/api/producao-diaria?inicio=${encodeURIComponent(dados.data)}&fim=${encodeURIComponent(dados.data)}&operadorEmail=${encodeURIComponent(dados.operadorEmail)}`); const id = Array.isArray(existentes) && existentes[0]?.id; const resposta = await requisicaoServidor(id ? `/api/producao-diaria/${encodeURIComponent(String(id))}` : '/api/producao-diaria', { method: id ? 'PUT' : 'POST', body: JSON.stringify(dados) }); return { ok: true, ...resposta, atualizado: Boolean(id) }; } catch (erro) { return { ok: false, mensagem: `Servidor central indisponível: ${erro.message}` }; } } const agora = new Date().toISOString(); const campos = ['data','operadorEmail','operadorNome','estagiario','analiseCadastros','contatosDeclarantes','localizacoesTalao','transferencias6190','coletaFotos','transferenciaAudio','atualizacoesSiopm','ocorrenciasGeradas','observacao']; const valores = campos.map(campo => campo === 'estagiario' || campo === 'observacao' ? String(dados[campo] || '') : campo === 'data' || campo === 'operadorEmail' || campo === 'operadorNome' ? String(dados[campo] || '') : Math.max(0, Number(dados[campo] || 0))); const existente = banco.prepare('SELECT id FROM producao_diaria WHERE data = ? AND operador_email = ?').get(dados.data, dados.operadorEmail); if (existente) { banco.prepare('UPDATE producao_diaria SET operador_nome=?, estagiario=?, analise_cadastros=?, contatos_declarantes=?, localizacoes_talao=?, transferencias_6190=?, coleta_fotos=?, transferencia_audio=?, atualizacoes_siopm=?, ocorrencias_geradas=?, observacao=?, atualizado_em=? WHERE id=?').run(valores[2], valores[3], valores[4], valores[5], valores[6], valores[7], valores[8], valores[9], valores[10], valores[11], valores[12], agora, existente.id); return { ok: true, id: existente.id, atualizado: true }; } const id = banco.prepare('INSERT INTO producao_diaria(data,operador_email,operador_nome,estagiario,analise_cadastros,contatos_declarantes,localizacoes_talao,transferencias_6190,coleta_fotos,transferencia_audio,atualizacoes_siopm,ocorrencias_geradas,observacao,criado_em,atualizado_em) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(...valores, agora, agora).lastInsertRowid; return { ok: true, id, atualizado: false }; });
  ipcMain.handle('cv:operadores', () => banco.prepare('SELECT email, nome, re, posto_graduacao AS postoGraduacao, equipe, perfil, ativo, criado_em AS criadoEm, ultimo_acesso AS ultimoAcesso FROM operadores_local WHERE ativo = 1 ORDER BY nome').all());
  ipcMain.handle('cv:registrar-operador', (_evento, dados) => {
    const email = String(dados?.email || '').trim().toLowerCase();
    const nome = String(dados?.nome || '').trim();
    const re = String(dados?.re || '').trim();
    const postoGraduacao = String(dados?.postoGraduacao || '').trim();
    const equipe = String(dados?.equipe || '').trim();
    if (!/^[^@\s]+@policiamilitar\.sp\.gov\.br$/.test(email)) return { ok: false, mensagem: 'Use um e-mail institucional @policiamilitar.sp.gov.br.' };
    if (!nome || !/^\d+$/.test(re) || !postoGraduacao || !equipe) return { ok: false, mensagem: 'Informe nome, RE numÃ©rico, Posto/GraduaÃ§Ã£o e equipe.' };
    try { banco.prepare('INSERT INTO operadores_local(email, nome, re, posto_graduacao, equipe, criado_em) VALUES (?, ?, ?, ?, ?, ?)').run(email, nome, re, postoGraduacao, equipe, new Date().toISOString()); return { ok: true, operador: { email, nome, re, postoGraduacao, equipe, perfil: 'OPERADOR' } }; } catch { return { ok: false, mensagem: 'Este e-mail jÃ¡ estÃ¡ cadastrado.' }; }
  });
  ipcMain.handle('cv:entrar-operador', (_evento, emailInformado) => {
    const email = String(emailInformado || '').trim().toLowerCase();
    if (!/^[^@\s]+@policiamilitar\.sp\.gov\.br$/.test(email)) return { ok: false, mensagem: 'Use um e-mail institucional @policiamilitar.sp.gov.br.' };
    const operador = banco.prepare('SELECT email, nome, re, posto_graduacao AS postoGraduacao, equipe, perfil FROM operadores_local WHERE email = ? AND ativo = 1').get(email);
    if (!operador) return { ok: false, mensagem: 'Operador nÃ£o cadastrado ou inativo.' };
    banco.prepare('UPDATE operadores_local SET ultimo_acesso = ? WHERE email = ?').run(new Date().toISOString(), email);
    return { ok: true, operador };
  });
  ipcMain.handle('cv:dashboard', (_evento, filtro = {}) => {
    const registros = banco.prepare('SELECT dados_json, status_caso FROM casos').all().map(item => ({ ...JSON.parse(item.dados_json || '{}'), statusBanco: item.status_caso }));
    const producao = banco.prepare('SELECT * FROM indicadores_producao_legado ORDER BY id DESC LIMIT 1').get(); const locais = registros.filter(item => item.novoCasoLocal === true); const localizadasLocais = locais.filter(item => ['localizado vivo', 'localizado morto', 'localizado preso', 'vivo', 'morto', 'preso'].includes(String(item.resultadoLocalizacao || '').trim().toLowerCase())); const exclusivasLocais = locais.filter(item => campoVerdadeiro(item.atuacaoExclusivaCabineVerde) || String(item.recursoLocalizacao || '').trim().toLowerCase() === 'cabine verde');
    const inicio = dataDashboard(filtro.inicio); const fim = dataDashboard(filtro.fim); const temFiltro = inicio && fim; const legadoDetalhado = banco.prepare('SELECT dados_json FROM localizacoes_legado').all().map(item => JSON.parse(item.dados_json || '{}')).filter(item => { const data = dataDashboard(item.data); return !temFiltro || (data && data >= inicio && data <= new Date(fim.getTime() + 86400000 - 1)); }); const contagem = { cabine: 0, vtr: 0, vultoOutros: 0, preso: 0, obito: 0 }; legadoDetalhado.forEach(item => { contagem[classificarLocalizacao(item)] += 1; }); const incrementos = {}; locais.forEach(item => { const categoria = classificarLocalizacao(item); incrementos[categoria] = (incrementos[categoria] || 0) + 1; }); const base = temFiltro ? { total: legadoDetalhado.length, ...contagem } : { total: (producao?.localizadas_total || legadoDetalhado.length) + localizadasLocais.length, cabine: (producao?.localizadas_cabine || contagem.cabine) + (incrementos.cabine || 0), vtr: (producao?.localizadas_vtr || contagem.vtr) + (incrementos.vtr || 0), vultoOutros: (producao?.localizadas_vulto_outros || contagem.vultoOutros) + (incrementos.vultoOutros || 0), preso: (producao?.localizadas_preso || contagem.preso) + (incrementos.preso || 0), obito: (producao?.localizadas_obito || contagem.obito) + (incrementos.obito || 0) }; const totalClassificacao = base.total || 1;
    return {
    totalCasos: (producao ? producao.localizadas_total : registros.length) + locais.length,
    pessoasLocalizadas: (producao ? producao.localizadas_total : registros.filter(item => campoVerdadeiro(item.localizado) || ['localizado', 'encerrado'].includes(String(item.statusCaso || '').trim().toLowerCase()) || ['localizado', 'encerrado'].includes(String(item.statusBanco || '').trim().toLowerCase()) || ['localizado vivo', 'localizado morto', 'localizado preso', 'vivo', 'morto', 'preso'].includes(String(item.resultadoLocalizacao || '').trim().toLowerCase()) || Boolean(item.dataHoraLocalizacao && !['nÃ£o', 'nao', 'nÃ£o informado', 'nao informado'].includes(String(item.dataHoraLocalizacao).trim().toLowerCase()))).length) + localizadasLocais.length,
    atuacaoExclusivaCabineVerde: (producao ? producao.localizadas_cabine : registros.filter(item => campoVerdadeiro(item.atuacaoExclusivaCabineVerde) || String(item.recursoLocalizacao || '').trim().toLowerCase() === 'cabine verde' || (!item.resultadoLocalizacao && !item.recursoLocalizacao && campoVerdadeiro(item.aptoCabineVerde))).length) + exclusivasLocais.length,
    producaoLegado: producao ? { periodo: producao.periodo, diasTrabalhados: producao.dias_trabalhados, localizados: producao.localizadas_total, cabine: producao.localizadas_cabine, vtr: producao.localizadas_vtr, vultoOutros: producao.localizadas_vulto_outros, preso: producao.localizadas_preso, obito: producao.localizadas_obito, procedimentos: producao.procedimentos_total, incompleto: Boolean(producao.incompleto) } : null,
    producaoOperacao: { casos: locais.length, localizados: localizadasLocais.length, cabine: exclusivasLocais.length },
    dashboardOperacional: { total: base.total, categorias: [{ id: 'cabine', valor: base.cabine, percentual: (base.cabine / totalClassificacao) * 100, titulo: 'LOCALIZAÃ‡ÃƒO DIRETA PELA EQUIPE MURALHA', cor: 'amarelo' }, { id: 'vtr', valor: base.vtr, percentual: (base.vtr / totalClassificacao) * 100, titulo: 'LOCALIZAÃ‡ÃƒO COM APOIO DE VTR', cor: 'azul' }, { id: 'vultoOutros', valor: base.vultoOutros, percentual: (base.vultoOutros / totalClassificacao) * 100, titulo: 'VULTO / IMPRENSA E OUTROS', cor: 'vermelho' }, { id: 'preso', valor: base.preso, percentual: (base.preso / totalClassificacao) * 100, titulo: 'LOCALIZAÃ‡ÃƒO COM RESULTADO PRISÃƒO', cor: 'laranja' }, { id: 'obito', valor: base.obito, percentual: (base.obito / totalClassificacao) * 100, titulo: 'LOCALIZAÃ‡ÃƒO COM RESULTADO Ã“BITO', cor: 'cinza' }], periodo: temFiltro ? { inicio: filtro.inicio, fim: filtro.fim } : { inicio: '2026-04-22', fim: '2026-08-28' } },
    incompletos: banco.prepare("SELECT COUNT(*) AS total FROM casos WHERE status_migracao = 'INCOMPLETO'").get().total,
    porStatus: banco.prepare('SELECT status_caso AS status, COUNT(*) AS total FROM casos GROUP BY status_caso ORDER BY total DESC').all(),
    porPrioridade: banco.prepare("SELECT json_extract(dados_json, '$.prioridade') AS prioridade, COUNT(*) AS total FROM casos GROUP BY prioridade ORDER BY total DESC").all(),
    observacoes: banco.prepare('SELECT COUNT(*) AS total FROM legado_observacoes').get().total
    };
  });
  ipcMain.handle('cv:copiar-painel', async (evento, retangulo = {}) => { const janela = BrowserWindow.fromWebContents(evento.sender); if (!janela) return { ok: false, mensagem: 'Janela do painel nÃ£o encontrada.' }; const escala = janela.webContents.getZoomFactor(); const bounds = { x: Math.max(0, Math.round(Number(retangulo.x || 0) * escala)), y: Math.max(0, Math.round(Number(retangulo.y || 0) * escala)), width: Math.max(1, Math.round(Number(retangulo.width || 1) * escala)), height: Math.max(1, Math.round(Number(retangulo.height || 1) * escala)) }; const imagem = await janela.webContents.capturePage(bounds); clipboard.writeImage(imagem); return { ok: true }; });
  ipcMain.handle('cv:copiar-imagem', (_evento, dataUrl) => { const imagem = nativeImage.createFromDataURL(String(dataUrl || '')); if (imagem.isEmpty()) return { ok: false, mensagem: 'NÃ£o foi possÃ­vel gerar a imagem do painel.' }; clipboard.writeImage(imagem); return { ok: true }; });
  ipcMain.handle('cv:casos', async (_evento, termo = '') => { if (modoCentralAtivo()) { try { const lista = await requisicaoServidor(`/api/busca?termo=${encodeURIComponent(String(termo || ''))}`); return (Array.isArray(lista) ? lista : []).map(item => ({ idCaso: String(item.id ?? item.idCaso ?? item.idCasoHistorico ?? ''), talaoPMESP: item.talaoPMESP || item.talao_pm || item.talao || '', nome: item.nome || item.nome_desaparecido || item.nomeCompletoDesaparecido || 'Sem nome', status: item.status || item.status_caso || item.statusCaso || 'Sem status', statusMigracao: item.tipoRegistro === 'HISTORICO_V7' ? 'HISTORICO_V7' : (item.statusMigracao || 'CENTRAL'), dadosJson: JSON.stringify({ ...(item.dados || {}), ...item }) })).slice(0, 100); } catch (erro) { console.error('Falha ao consultar servidor central:', erro.message); return []; } } const busca = `%${String(termo).trim()}%`; return banco.prepare("SELECT id_caso AS idCaso, talao_pm AS talaoPMESP, nome_desaparecido AS nome, status_caso AS status, status_migracao AS statusMigracao, dados_json AS dadosJson FROM casos WHERE id_caso LIKE ? OR talao_pm LIKE ? OR nome_desaparecido LIKE ? OR dados_json LIKE ? ORDER BY importado_em DESC LIMIT 100").all(busca, busca, busca, busca); });
  ipcMain.handle('cv:caso', async (_evento, idCaso) => { if (modoCentralAtivo()) { if (!/^\d+$/.test(String(idCaso))) return null; const item = await requisicaoServidor(`/api/ocorrencias/${encodeURIComponent(idCaso)}`); return { id_caso: String(item.id ?? idCaso), talao_pm: item.talaoPMESP || item.talao_pm || item.talao || '', nome_desaparecido: item.nome || item.nome_desaparecido || item.nomeCompletoDesaparecido || 'Sem nome', status_caso: item.status || item.status_caso || item.statusCaso || 'Sem status', status_migracao: item.statusMigracao || 'CENTRAL', dados_json: JSON.stringify({ ...(item.dados || {}), ...item }) }; } return banco.prepare('SELECT * FROM casos WHERE id_caso = ?').get(idCaso); });
  ipcMain.handle('cv:vitimas-caso', async (_evento, idCaso) => { if (modoCentralAtivo()) { try { const lista = await requisicaoServidor(`/api/vitimas?idCaso=${encodeURIComponent(String(idCaso))}`); return (Array.isArray(lista) ? lista : []).map(item => ({ ...item, id: item.id || item.idVitima, id_caso: item.idCaso, dados_json: JSON.stringify(item) })); } catch (erro) { throw new Error('Falha ao consultar vítimas centrais: ' + erro.message); } } return banco.prepare('SELECT * FROM vitimas_caso WHERE id_caso = ? ORDER BY ordem').all(idCaso); });
  ipcMain.handle('cv:adicionar-vitima', async (_evento, dados) => { const idCaso = String(dados?.idCaso || '').trim(); if (!idCaso) return { ok: false, mensagem: 'Caso nÃ£o informado.' }; if (modoCentralAtivo()) { try { return { ok: true, ...(await requisicaoServidor('/api/vitimas', { method: 'POST', body: JSON.stringify({ idCaso, operador: dados?.operador || 'sessao-local' }) })) }; } catch (erro) { return { ok: false, mensagem: `Servidor central indisponÃ­vel: ${erro.message}` }; } } const ultima = banco.prepare('SELECT COALESCE(MAX(ordem), 0) AS ordem FROM vitimas_caso WHERE id_caso = ?').get(idCaso).ordem; const agora = new Date().toISOString(); const ordem = Number(ultima) + 1; const id = banco.prepare('INSERT INTO vitimas_caso(id_caso,ordem,nome,dados_json,criado_em,atualizado_em) VALUES (?,?,?,?,?,?)').run(idCaso, ordem, '', JSON.stringify({ ordem, respostasArvore: {} }), agora, agora).lastInsertRowid; banco.prepare('INSERT INTO auditoria_local(id_caso,operador,justificativa,alteracoes_json,criado_em) VALUES (?,?,?,?,?)').run(idCaso, String(dados?.operador || 'sessao-local'), `Nova vÃ­tima vinculada ao caso Â· vÃ­tima ${ordem}`, JSON.stringify({ idVitima: id, ordem }), agora); return { ok: true, id, ordem }; });
  ipcMain.handle('cv:auditoria-casos', async (_evento, termo = '') => {
    if (modoCentralAtivo()) {
      try {
        const busca = String(termo).trim().toLowerCase();
        const lista = await requisicaoServidor(`/api/busca?termo=${encodeURIComponent(String(termo || ''))}`);
        return (Array.isArray(lista) ? lista : []).filter(item => !busca || JSON.stringify(item).toLowerCase().includes(busca)).map(item => ({ idCaso: String(item.id ?? item.idCaso ?? ''), talaoPMESP: item.talaoPMESP || item.talao_pm || item.talao || '', nome: item.nome || item.nome_desaparecido || item.nomeCompletoDesaparecido || 'Sem nome', status: item.status || item.status_caso || item.statusCaso || 'Sem status', statusMigracao: item.statusMigracao || 'CENTRAL', dadosJson: JSON.stringify({ ...(item.dados || {}), ...item }) })).slice(0, 100);
      } catch (erro) { console.error('Falha ao consultar auditoria central:', erro.message); return []; }
    }
    const busca = `%${String(termo).trim()}%`;
    return banco.prepare("SELECT id_caso AS idCaso, talao_pm AS talaoPMESP, nome_desaparecido AS nome, status_caso AS status, status_migracao AS statusMigracao, dados_json AS dadosJson FROM casos WHERE status_migracao = 'INCOMPLETO' OR id_caso LIKE ? OR talao_pm LIKE ? OR nome_desaparecido LIKE ? OR dados_json LIKE ? ORDER BY importado_em DESC LIMIT 100").all(busca, busca, busca, busca);
  });
  ipcMain.handle('cv:historico-caso', async (_evento, idCaso) => {
    if (modoCentralAtivo()) {
      try { return await requisicaoServidor(`/api/eventos?idCaso=${encodeURIComponent(String(idCaso))}`); }
      catch (erro) { throw new Error('Falha ao consultar histórico central: ' + erro.message); }
    }
    return banco.prepare('SELECT * FROM auditoria_local WHERE id_caso = ? ORDER BY id DESC').all(idCaso);
  });
  ipcMain.handle('cv:salvar-desfecho-operacional', async (_evento, dados) => {
    const idCaso = String(dados?.idCaso || '').trim(); const campos = dados?.campos || {}; const nome = String(dados?.nome || '').trim();
    if (!idCaso) return { ok: false, mensagem: 'Identifique o caso antes de salvar.' };
    if (modoCentralAtivo()) { try { const resposta = await salvarOcorrenciaCentral(idCaso, { nome, ...campos, atualizado_em: new Date().toISOString() }, !idCaso.startsWith('NOVO-')); return { ok: true, central: true, caso: resposta }; } catch (erro) { return { ok: false, mensagem: `Servidor central indisponÃ­vel: ${erro.message}` }; } }
    const permitidos = ['statusVitima', 'condicaoVitima', 'desfechoCaso', 'encaminhamento', 'resultadoLocalizacao', 'recursoLocalizacao', 'atuacaoExclusivaCabineVerde', 'dataHoraLocalizacao', 'observacoesLocalizacao']; const registro = banco.prepare('SELECT * FROM casos WHERE id_caso = ?').get(idCaso); const atual = registro ? JSON.parse(registro.dados_json || '{}') : {};
    const novo = { ...atual }; for (const chave of permitidos) if (chave in campos) novo[chave] = String(campos[chave] ?? '').trim();
    if (!registro) { novo.idCaso = idCaso; novo.nomeCompletoDesaparecido = nome; novo.statusCaso = 'Em triagem'; novo.novoCasoLocal = true; const agora = new Date().toISOString(); banco.prepare('INSERT INTO casos(id_caso,talao_pm,nome_desaparecido,status_caso,status_migracao,origem_arquivo,linha_origem,dados_json,bruto_json,importado_em) VALUES (?,?,?,?,?,?,?,?,?,?)').run(idCaso, '', nome, 'Em triagem', 'INCOMPLETO', 'OPERACAO_LOCAL', Date.now(), JSON.stringify(novo), JSON.stringify(novo), agora); return { ok: true, novo: true }; }
    banco.prepare('UPDATE casos SET nome_desaparecido = ?, dados_json = ?, status_migracao = ? WHERE id_caso = ?').run(nome || registro.nome_desaparecido, JSON.stringify(novo), 'INCOMPLETO', idCaso); banco.prepare('INSERT INTO auditoria_local(id_caso,operador,justificativa,alteracoes_json,criado_em) VALUES (?,?,?,?,?)').run(idCaso, String(dados?.operador || 'sessao-local'), 'Registro de desfecho operacional', JSON.stringify({ desfecho: novo }), new Date().toISOString()); return { ok: true, novo: false };
  });
  ipcMain.handle('cv:salvar-painel-arvore', async (_evento, dados) => { const idCaso = String(dados?.idCaso || '').trim(); const painel = String(dados?.painel || ''); const operador = String(dados?.operador || 'sessao-local'); const respostas = dados?.respostas || {}; const complementos = dados?.complementos || {}; const agora = new Date().toISOString(); if (!idCaso || !painel) return { ok: false, mensagem: 'Identifique o caso e o painel antes de salvar.' }; if (modoCentralAtivo()) { try { const existente = !idCaso.startsWith('NOVO-'); const resposta = await salvarOcorrenciaCentral(idCaso, { ...(!existente || dados?.nome ? { nome: dados?.nome || '' } : {}), ...(!existente || dados?.talaoPMESP ? { talao_pm: dados?.talaoPMESP || '' } : {}), ...(!existente ? { status: 'Em triagem' } : {}), painel, respostasArvore: respostas, complementosArvore: complementos, ultimaEdicaoArvore: { painel, dataHora: agora, operador } }, existente); const idCasoPersistido = String(resposta.id || idCaso); const vitima = await salvarPrimeiraVitima(idCasoPersistido, respostas, complementos, operador, true); return { ok: true, central: true, dataHora: agora, painel, caso: resposta, vitima, confirmadoNoBanco: true }; } catch (erro) { return { ok: false, mensagem: `Servidor central indisponÃ­vel: ${erro.message}` }; } } const registro = banco.prepare('SELECT * FROM casos WHERE id_caso = ?').get(idCaso); const atual = registro ? JSON.parse(registro.dados_json || '{}') : {}; const novo = { ...atual, respostasArvore: { ...(atual.respostasArvore || {}), ...respostas }, complementosArvore: { ...(atual.complementosArvore || {}), ...complementos }, ultimaEdicaoArvore: { painel, dataHora: agora, operador } }; if (!registro) banco.prepare('INSERT INTO casos(id_caso,talao_pm,nome_desaparecido,status_caso,status_migracao,origem_arquivo,linha_origem,dados_json,bruto_json,importado_em) VALUES (?,?,?,?,?,?,?,?,?,?)').run(idCaso, '', '', 'Em triagem', 'INCOMPLETO', 'OPERACAO_LOCAL', Date.now(), JSON.stringify(novo), JSON.stringify(novo), agora); else banco.prepare('UPDATE casos SET dados_json = ?, status_migracao = ? WHERE id_caso = ?').run(JSON.stringify(novo), registro.status_migracao || 'INCOMPLETO', idCaso); const vitima = salvarPrimeiraVitima(idCaso, respostas, complementos, operador, false); banco.prepare('INSERT INTO auditoria_local(id_caso,operador,justificativa,alteracoes_json,criado_em) VALUES (?,?,?,?,?)').run(idCaso, operador, `Salvamento do painel ${painel}`, JSON.stringify({ painel, dataHora: agora, respostas: Object.keys(respostas).length, vitima: true }), agora); return { ok: true, dataHora: agora, painel, vitima, confirmadoNoBanco: true }; });
  ipcMain.handle('cv:corrigir-caso', async (_evento, dados) => {
    const idCaso = String(dados?.idCaso || '').trim(); const justificativa = String(dados?.justificativa || '').trim(); const campos = dados?.campos || {};
    if (!idCaso || !justificativa) return { ok: false, mensagem: 'Informe o caso e a justificativa da correÃ§Ã£o.' };
    if (modoCentralAtivo()) { try { const resposta = await salvarOcorrenciaCentral(idCaso, { ...campos, justificativa, atualizado_em: new Date().toISOString() }, !idCaso.startsWith('NOVO-')); return { ok: true, central: true, caso: resposta }; } catch (erro) { return { ok: false, mensagem: `Servidor central indisponÃ­vel: ${erro.message}` }; } }
    const caso = banco.prepare('SELECT * FROM casos WHERE id_caso = ?').get(idCaso);
    if (!caso) return { ok: false, mensagem: 'Caso nÃ£o encontrado.' };
    const permitidos = ['nome_desaparecido', 'talao_pm', 'status_caso', 'statusAtendimento', 'status', 'municipio', 'idade', 'sexoGenero', 'dataHoraUltimaVisualizacao', 'localUltimaVisualizacao', 'observacoesOperacionais', 'numeroBo', 'prioridade', 'classificacaoRisco', 'statusVitima', 'condicaoVitima', 'desfechoCaso', 'encaminhamento', 'resultadoLocalizacao', 'recursoLocalizacao', 'atuacaoExclusivaCabineVerde', 'teveMidia', 'categoriaAdministrativa', 'dataHoraLocalizacao', 'observacoesLocalizacao'];
    const antigo = JSON.parse(caso.dados_json || '{}'); const novo = { ...antigo }; const alteracoes = {};
    for (const chave of permitidos) { if (!(chave in campos)) continue; const valor = String(campos[chave] ?? '').trim(); const anterior = chave === 'nome_desaparecido' ? caso.nome_desaparecido : chave === 'talao_pm' ? caso.talao_pm : chave === 'status_caso' ? caso.status_caso : antigo[chave] ?? ''; if (String(anterior ?? '') !== valor) { alteracoes[chave] = { anterior: anterior ?? '', novo: valor }; if (chave === 'nome_desaparecido' || chave === 'talao_pm' || chave === 'status_caso') novo[chave] = valor; else novo[chave] = chave === 'idade' && valor ? Number(valor) : valor; } }
    if (!Object.keys(alteracoes).length) return { ok: false, mensagem: 'Nenhuma alteraÃ§Ã£o foi identificada.' };
    const desfecho = String(novo.desfechoCaso || '').toLowerCase(); const statusVitima = String(novo.statusVitima || '').toLowerCase(); const statusFinal = desfecho.includes('óbito') || desfecho.includes('morta') || statusVitima.includes('morta') ? 'LOCALIZADO_SEM_VIDA' : desfecho.includes('presa') || desfecho.includes('custod') ? 'LOCALIZADO_CUSTODIA' : desfecho.includes('encerrado') || desfecho.includes('localizad') || statusVitima.includes('localizad') ? 'LOCALIZADO' : '';
    if (statusFinal && String(novo.status_caso || caso.status_caso || '').toUpperCase() !== statusFinal) { novo.status_caso = statusFinal; novo.statusAtendimento = statusFinal; novo.status = statusFinal; alteracoes.status_caso = { anterior: caso.status_caso || '', novo: statusFinal }; }
    const nome = novo.nome_desaparecido ?? caso.nome_desaparecido; const talao = novo.talao_pm ?? caso.talao_pm; const status = statusFinal || campos.statusAtendimento || campos.status || novo.status_caso || caso.status_caso;
    banco.prepare('UPDATE casos SET nome_desaparecido = ?, talao_pm = ?, status_caso = ?, dados_json = ?, status_migracao = ? WHERE id_caso = ?').run(nome, talao, status, JSON.stringify(novo), 'CORRIGIDO', idCaso);
    banco.prepare('INSERT INTO auditoria_local(id_caso, operador, justificativa, alteracoes_json, criado_em) VALUES (?, ?, ?, ?, ?)').run(idCaso, String(dados?.operador || 'sessao-local'), justificativa, JSON.stringify(alteracoes), new Date().toISOString());
    return { ok: true, alteracoes };
  });
  ipcMain.handle('cv:fotos', async (_evento, idCaso) => { if (modoCentralAtivo()) { try { const lista = await requisicaoServidor('/api/fotos'); const base = lerConfiguracao().apiBaseUrl; return (Array.isArray(lista) ? lista : []).filter(item => String(item.idOcorrencia ?? item.idCaso ?? '') === String(idCaso)).map(item => ({ ...item, id: item.url, idCaso: item.idOcorrencia || item.idCaso, dados_json: JSON.stringify({ nomeArquivo: item.nomeArquivo, caminhoLocal: `${base}${item.url}`, autorizacaoUsoImagem: item.autorizacao || 'Pendente' }) })); } catch (erro) { throw new Error('Falha ao consultar fotos centrais: ' + erro.message); } } return banco.prepare('SELECT * FROM fotos WHERE id_caso = ? ORDER BY id DESC').all(idCaso); });
  ipcMain.handle('cv:buscar-fotos', async (_evento, termo = '') => {
    if (modoCentralAtivo()) { try { const termoTexto = String(termo || '').trim(); const sufixo = termoTexto ? `?termo=${encodeURIComponent(termoTexto)}` : ''; const lista = await requisicaoServidor(`/api/fotos${sufixo}`); return (Array.isArray(lista) ? lista : []).map(item => ({ id: item.url, idCaso: item.idOcorrencia || item.idCaso, nome: String(item.nome || item.nomeVitima || '').trim() || 'Sem nome', talao: String(item.talao || '').trim() || 'Sem talão', dataTalao: item.dataTalao || '', nomeArquivo: item.nomeArquivo, caminhoLocal: `${lerConfiguracao().apiBaseUrl}${item.url}`, url: `${lerConfiguracao().apiBaseUrl}${item.url}`, autorizacao: item.autorizacao || 'Pendente' })); } catch (erro) { return []; } }
    const busca = `%${String(termo).trim()}%`;
    return banco.prepare("SELECT f.id, f.id_caso AS idCaso, f.dados_json AS dadosJson, c.nome_desaparecido AS nomeCaso, c.talao_pm AS talaoCaso FROM fotos f LEFT JOIN casos c ON c.id_caso = f.id_caso WHERE f.id_caso LIKE ? OR c.nome_desaparecido LIKE ? OR c.talao_pm LIKE ? OR f.dados_json LIKE ? ORDER BY f.id DESC LIMIT 100").all(busca, busca, busca, busca).map(item => { const foto = JSON.parse(item.dadosJson || '{}'); return { id: item.id, idCaso: item.idCaso, nome: String(foto.nome || foto.nomeVitima || item.nomeCaso || '').trim() || 'Sem nome', talao: String(foto.talao || item.talaoCaso || '').trim() || 'Sem talão', dataTalao: foto.dataTalao || '', nomeArquivo: foto.nomeArquivo || 'Imagem', caminhoLocal: foto.caminhoLocal || '', autorizacao: foto.autorizacaoUsoImagem || 'Pendente' }; });
  });
  ipcMain.handle('cv:selecionar-imagem-confronto', async () => { const escolha = await dialog.showOpenDialog({ properties: ['openFile'], filters: [{ name: 'Imagens', extensions: ['jpg', 'jpeg', 'png', 'webp'] }] }); if (escolha.canceled || !escolha.filePaths[0]) return null; const caminho = escolha.filePaths[0]; const imagem = nativeImage.createFromPath(caminho); return { nomeArquivo: path.basename(caminho), caminhoLocal: caminho, dataUrl: imagem.isEmpty() ? '' : imagem.toDataURL() }; });
  ipcMain.handle('cv:confrontar-imagem', async (_evento, caminho, limiar = 60) => { const manifesto = modoCentralAtivo() ? await prepararManifestoCentral() : ''; return new Promise((resolve) => { const script = path.join(app.isPackaged ? process.resourcesPath : raiz, 'tools', 'confrontar-imagens.py'); const motorEmpacotado = path.join(process.resourcesPath, 'motor-facial', process.platform === 'win32' ? 'confrontar-imagens.exe' : 'confrontar-imagens'); const empacotado = app.isPackaged && fs.existsSync(motorEmpacotado); const programa = empacotado ? motorEmpacotado : 'python'; const argumentos = empacotado ? [] : [script]; if (manifesto) argumentos.push('--manifest', manifesto); let raizModelo = '';

if (empacotado) {
  const modelosEmpacotados = path.join(
    process.resourcesPath,
    'motor-facial',
    'modelos'
  );

  raizModelo = path.join(
    app.getPath('userData'),
    'modelos'
  );

  fs.mkdirSync(raizModelo, { recursive: true });

  const modeloPrincipal = path.join(
    raizModelo,
    'models',
    'buffalo_l',
    'w600k_r50.onnx'
  );

  if (!fs.existsSync(modeloPrincipal)) {
    if (!fs.existsSync(modelosEmpacotados)) {
      return resolve({
        ok: false,
        mensagem: 'Os modelos do motor facial não foram encontrados na instalação.'
      });
    }

    fs.cpSync(modelosEmpacotados, raizModelo, {
      recursive: true,
      force: true
    });
  }
} argumentos.push('--referencia', String(caminho || ''), '--banco', bancoPath, '--fotos', fotosPath, '--limite', '10', '--limiar', String(Math.max(0, Math.min(100, Number(limiar) || 60)))); if (raizModelo) argumentos.push('--model-root', raizModelo); execFile(programa, argumentos, { windowsHide: true, maxBuffer: 8 * 1024 * 1024 }, (erroExecucao, stdout) => { if (erroExecucao) return resolve({ ok: false, mensagem: erroExecucao.message }); try { const resposta = JSON.parse(stdout); resposta.candidatos = enriquecerCandidatos(resposta.candidatos); resolve(resposta); } catch { resolve({ ok: false, mensagem: 'O motor facial retornou uma resposta invÃ¡lida.' }); } });  }); });
  ipcMain.handle('cv:abrir-foto', async (_evento, caminho) => { const valor = String(caminho || ''); if (/^https?:\/\//i.test(valor)) { await shell.openExternal(valor); return { ok: true }; } const resolvido = path.resolve(valor); const raizFotos = path.resolve(fotosPath); if (!resolvido.startsWith(raizFotos + path.sep)) return { ok: false, mensagem: 'Caminho de imagem nÃ£o autorizado.' }; const erro = await shell.openPath(resolvido); return erro ? { ok: false, mensagem: erro } : { ok: true }; });
  ipcMain.handle('cv:adicionar-foto', async (_evento, idCaso, metadados = {}) => {
    const escolha = await dialog.showOpenDialog({ properties: ['openFile'], filters: [{ name: 'Imagens', extensions: ['jpg', 'jpeg', 'png', 'webp'] }] });
    if (escolha.canceled || !escolha.filePaths[0]) return null;
    const origem = escolha.filePaths[0];
    const metadadosFoto = { idCaso: String(idCaso), nome: String(metadados?.nome || '').trim(), dataTalao: String(metadados?.dataTalao || '').trim(), talao: String(metadados?.talao || '').trim(), operador: String(metadados?.operador || 'sessao-local').trim(), inseridoEm: new Date().toISOString() };
    const prefixoArquivo = `${nomeSeguroArquivo(metadadosFoto.dataTalao, 'SEM-DATA')}_${nomeSeguroArquivo(metadadosFoto.talao, 'SEM-TALAO')}_${nomeSeguroArquivo(metadadosFoto.nome, 'SEM-NOME')}`;
    if (modoCentralAtivo()) { try { const extensaoCentral = path.extname(origem).toLowerCase() || '.jpg'; const nomeCentral = `${prefixoArquivo}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}${extensaoCentral}`; const resposta = await requisicaoServidor('/api/fotos', { method: 'POST', body: JSON.stringify({ idOcorrencia: String(idCaso), nomeArquivo: nomeCentral, conteudoBase64: fs.readFileSync(origem).toString('base64'), ...metadadosFoto }) }); return { id: resposta.url, idCaso: String(idCaso), nomeArquivo: nomeCentral, url: resposta.url, ...metadadosFoto, autorizacaoUsoImagem: 'Pendente' }; } catch (erro) { return { ok: false, mensagem: `Servidor central indisponÃ­vel: ${erro.message}` }; } }
    // A pasta física é identificada pelos metadados operacionais, não pelo ID interno.
    // O idCaso continua gravado no banco e no registro da foto para auditoria e consulta.
    const chavePasta = `${nomeSeguroArquivo(metadadosFoto.dataTalao, 'SEM-DATA')}_${nomeSeguroArquivo(metadadosFoto.talao, 'SEM-TALAO')}_${nomeSeguroArquivo(metadadosFoto.nome, 'SEM-NOME')}`;
    const pastaCaso = path.join(pastaFotosCasos, chavePasta);
    fs.mkdirSync(pastaCaso, { recursive: true });
    const extensao = path.extname(origem).toLowerCase() || '.jpg';
    const nome = `${prefixoArquivo}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}${extensao}`;
    const destino = path.join(pastaCaso, nome);
    fs.copyFileSync(origem, destino);
    const insercao = banco.prepare('INSERT INTO fotos(id_caso, dados_json, origem_arquivo, linha_origem) VALUES (?, ?, ?, ?)').run(idCaso, JSON.stringify({ nomeArquivo: nome, caminhoLocal: destino, tipo: extensao, ...metadadosFoto, autorizacaoUsoImagem: 'Pendente' }), 'local', Date.now());
    return { id: insercao.lastInsertRowid, nomeArquivo: nome, caminhoLocal: destino, ...metadadosFoto, autorizacaoUsoImagem: 'Pendente' };
  });
  ipcMain.handle('cv:registrar-consentimento-foto', async (_evento, dados) => {
    if (modoCentralAtivo()) { try { const resposta = await requisicaoServidor('/api/fotos/consentimento', { method: 'POST', body: JSON.stringify({ url: dados?.url || dados?.id, autorizacao: dados?.autorizacao }) }); return { ok: true, foto: resposta }; } catch (erro) { return { ok: false, mensagem: `Servidor central indisponÃ­vel: ${erro.message}` }; } }
    const idFoto = Number(dados?.idFoto || 0);
    const autorizacao = String(dados?.autorizacao || '').trim();
    if (!idFoto || !['Sim', 'NÃ£o', 'NÃ£o informado'].includes(autorizacao)) return { ok: false, mensagem: 'Selecione uma resposta para a autorizaÃ§Ã£o de uso da imagem.' };
    const foto = banco.prepare('SELECT dados_json FROM fotos WHERE id = ?').get(idFoto);
    if (!foto) return { ok: false, mensagem: 'Imagem nÃ£o encontrada.' };
    const metadados = JSON.parse(foto.dados_json || '{}');
    metadados.autorizacaoUsoImagem = autorizacao;
    metadados.termoAutorizacao = 'Uso exclusivo para busca, identificaÃ§Ã£o e divulgaÃ§Ã£o operacional interna pela PolÃ­cia Militar do Estado de SÃ£o Paulo.';
    metadados.autorizacaoRegistradaEm = new Date().toISOString();
    banco.prepare('UPDATE fotos SET dados_json = ? WHERE id = ?').run(JSON.stringify(metadados), idFoto);
    return { ok: true, foto: { id: idFoto, ...metadados } };
  });
  ipcMain.handle('cv:auditoria', () => banco.prepare('SELECT * FROM dados_auxiliares WHERE aba IN (\'LOG_AUDITORIA\', \'HISTORICO_EDICOES\', \'QUALIDADE_DADOS\', \'VALIDACAO_MIGRACAO\') ORDER BY id DESC LIMIT 300').all());
}

function executarDashboardLocal(filtro = {}) {
  const registros = banco.prepare('SELECT dados_json, status_caso FROM casos').all().map(item => ({ ...JSON.parse(item.dados_json || '{}'), statusBanco: item.status_caso }));
  const producao = banco.prepare('SELECT * FROM indicadores_producao_legado ORDER BY id DESC LIMIT 1').get();
  const total = producao?.localizadas_total || registros.length;
  const categorias = { cabine: producao?.localizadas_cabine || 0, vtr: producao?.localizadas_vtr || 0, vultoOutros: producao?.localizadas_vulto_outros || 0, preso: producao?.localizadas_preso || 0, obito: producao?.localizadas_obito || 0 };
  const midia = { sim: registros.filter(item => String(item.teveMidia || '').trim().toLowerCase() === 'sim').length, nao: registros.filter(item => ['não', 'nao'].includes(String(item.teveMidia || '').trim().toLowerCase())).length };
  const divisor = total || 1;
  return { totalCasos: total, pessoasLocalizadas: total, atuacaoExclusivaCabineVerde: categorias.cabine, midia, incompletos: banco.prepare("SELECT COUNT(*) AS total FROM casos WHERE status_migracao = 'INCOMPLETO'").get().total, porStatus: banco.prepare('SELECT status_caso AS status, COUNT(*) AS total FROM casos GROUP BY status_caso ORDER BY total DESC').all(), porPrioridade: banco.prepare("SELECT json_extract(dados_json, '$.prioridade') AS prioridade, COUNT(*) AS total FROM casos GROUP BY prioridade ORDER BY total DESC").all(), observacoes: banco.prepare('SELECT COUNT(*) AS total FROM legado_observacoes').get().total, dashboardOperacional: { total, categorias: [{ id: 'cabine', valor: categorias.cabine, percentual: categorias.cabine / divisor * 100, titulo: 'LOCALIZAÃ‡ÃƒO DIRETA PELA EQUIPE MURALHA', cor: 'amarelo' }, { id: 'vtr', valor: categorias.vtr, percentual: categorias.vtr / divisor * 100, titulo: 'LOCALIZAÃ‡ÃƒO COM APOIO DE VTR', cor: 'azul' }, { id: 'vultoOutros', valor: categorias.vultoOutros, percentual: categorias.vultoOutros / divisor * 100, titulo: 'VULTO / IMPRENSA E OUTROS', cor: 'vermelho' }, { id: 'preso', valor: categorias.preso, percentual: categorias.preso / divisor * 100, titulo: 'LOCALIZAÃ‡ÃƒO COM RESULTADO PRISÃƒO', cor: 'laranja' }, { id: 'obito', valor: categorias.obito, percentual: categorias.obito / divisor * 100, titulo: 'LOCALIZAÃ‡ÃƒO COM RESULTADO Ã“BITO', cor: 'cinza' }, { id: 'midiaSim', valor: midia.sim, percentual: midia.sim / divisor * 100, titulo: 'CASOS COM MÍDIA/FOTO', cor: 'azul' }, { id: 'midiaNao', valor: midia.nao, percentual: midia.nao / divisor * 100, titulo: 'CASOS SEM MÍDIA/FOTO', cor: 'cinza' }], periodo: { inicio: '2026-04-22', fim: '2026-08-14' } } };
}

function montarDashboardCentral(filtro = {}) {
  const lista = Array.isArray(filtro.registros) ? filtro.registros : [];
  const inicio = dataDashboard(filtro.inicio);
  const fim = dataDashboard(filtro.fim);
  const temFiltro = inicio && fim;
  const registros = lista.map(item => {
    const dados = item && item.dados && typeof item.dados === 'object' ? item.dados : {};
    return { ...item, ...dados };
  }).filter(item => {
    if (!temFiltro) return true;
    const data = dataDashboard(item.data || item.dataHora || item.dataRegistro || item.criado_em || item.dataLocalizacao);
    return data && data >= inicio && data <= new Date(fim.getTime() + 86400000 - 1);
  });
  const localizado = item => campoVerdadeiro(item.localizado) || ['localizado', 'localizado vivo', 'localizado morto', 'localizado preso', 'vivo', 'morto', 'preso', 'encerrado'].includes(String(item.resultadoLocalizacao || item.statusCaso || item.status || '').trim().toLowerCase());
  const registrosLocalizados = registros.filter(localizado);
  const datasRegistros = registros.map(item => dataDashboard(item.data || item.dataHora || item.dataRegistro || item.criado_em || item.dataAbertura)).filter(Boolean).sort((a, b) => a.getTime() - b.getTime());
  const periodoCentral = temFiltro ? { inicio: filtro.inicio, fim: filtro.fim } : { inicio: datasRegistros[0]?.toISOString().slice(0, 10) || new Date().toISOString().slice(0, 10), fim: datasRegistros.at(-1)?.toISOString().slice(0, 10) || new Date().toISOString().slice(0, 10) };
  const contagem = { cabine: 0, vtr: 0, vultoOutros: 0, preso: 0, obito: 0 };
  registrosLocalizados.forEach(item => { contagem[classificarLocalizacao(item)] += 1; });
  const exclusivo = item => campoVerdadeiro(item.atuacaoExclusivaCabineVerde) || ['cabine verde', 'muralha', 'cabine'].includes(String(item.recursoLocalizacao || item.recurso || '').trim().toLowerCase());
  const porStatus = Object.entries(registros.reduce((resultado, item) => { const chave = item.statusCaso || item.status_caso || item.status || 'Sem status'; resultado[chave] = (resultado[chave] || 0) + 1; return resultado; }, {})).map(([status, total]) => ({ status, total }));
  const porPrioridade = Object.entries(registros.reduce((resultado, item) => { const chave = item.prioridade || 'NÃ£o informada'; resultado[chave] = (resultado[chave] || 0) + 1; return resultado; }, {})).map(([prioridade, total]) => ({ prioridade, total }));
  const total = registrosLocalizados.length;
  const divisor = total || 1;
  return {
    totalCasos: total,
    pessoasLocalizadas: total,
    atuacaoExclusivaCabineVerde: registrosLocalizados.filter(exclusivo).length,
    incompletos: registros.filter(item => String(item.statusMigracao || item.status_migracao || '').toUpperCase() === 'INCOMPLETO').length,
    porStatus,
    porPrioridade,
    observacoes: registros.filter(item => item.observacoes || item.observacao).length,
    fonteIndicadores: 'BASE_CENTRAL_API',
    producaoLegado: null,
    producaoOperacao: { casos: registros.length, localizados: total, cabine: registrosLocalizados.filter(exclusivo).length },
    dashboardOperacional: { total, categorias: [
      { id: 'cabine', valor: contagem.cabine, percentual: contagem.cabine / divisor * 100, titulo: 'LOCALIZAÃ‡ÃƒO DIRETA PELA EQUIPE MURALHA', cor: 'amarelo' },
      { id: 'vtr', valor: contagem.vtr, percentual: contagem.vtr / divisor * 100, titulo: 'LOCALIZAÃ‡ÃƒO COM APOIO DE VTR', cor: 'azul' },
      { id: 'vultoOutros', valor: contagem.vultoOutros, percentual: contagem.vultoOutros / divisor * 100, titulo: 'VULTO / IMPRENSA E OUTROS', cor: 'vermelho' },
      { id: 'preso', valor: contagem.preso, percentual: contagem.preso / divisor * 100, titulo: 'LOCALIZAÃ‡ÃƒO COM RESULTADO PRISÃƒO', cor: 'laranja' },
      { id: 'obito', valor: contagem.obito, percentual: contagem.obito / divisor * 100, titulo: 'LOCALIZAÃ‡ÃƒO COM RESULTADO Ã“BITO', cor: 'cinza' }
    ], periodo: periodoCentral }
  };
}

function registrarCasosCentral() {
  function registrosLocalizacoesOficiais() {
    return banco.prepare('SELECT id, dados_json FROM localizacoes_legado ORDER BY id DESC').all().map((linha) => {
      let dados = {};
      try { dados = JSON.parse(linha.dados_json || '{}'); } catch { dados = {}; }
      const idCaso = `HIST-V7-${linha.id}`;
      const dadosJson = JSON.stringify({ ...dados, tipoRegistro: 'HISTORICO_V7', origemBase: 'V7_ATRIBUICAO_CAUSAL', idCaso });
      return {
        idCaso,
        talaoPMESP: dados.talao || '',
        nome: dados.nome || 'Sem nome',
        status: 'LOCALIZADO',
        statusCaso: 'LOCALIZADO',
        statusMigracao: 'HISTORICO_V7',
        finalizado: true,
        dadosJson
      };
    });
  }

  ipcMain.removeHandler('cv:casos');
  ipcMain.handle('cv:casos', async (_evento, termo = '') => {
    if (!modoCentralAtivo()) {
      const busca = String(termo || '').trim().toLowerCase();
      const operacionais = banco.prepare("SELECT id_caso AS idCaso, talao_pm AS talaoPMESP, nome_desaparecido AS nome, status_caso AS status, status_migracao AS statusMigracao, importado_em AS dataInsercao, dados_json AS dadosJson FROM casos WHERE status_caso <> 'LEGADO' ORDER BY importado_em DESC").all();
      const registros = [...operacionais, ...registrosLocalizacoesOficiais()];
      return busca ? registros.filter((item) => JSON.stringify(item).toLowerCase().includes(busca)) : registros;
    }
    try {
      const central = await requisicaoServidor(`/api/busca?termo=${encodeURIComponent(String(termo || ''))}`);
      const mapa = new Map();
      for (const item of (Array.isArray(central) ? central : [])) mapa.set(String(item.id ?? item.idCaso ?? ''), { idCaso: String(item.id ?? item.idCaso ?? ''), talaoPMESP: item.talaoPMESP || item.talao_pm || item.talao || '', nome: item.nome || item.nome_desaparecido || item.nomeCompletoDesaparecido || 'Sem nome', status: item.status || item.status_caso || item.statusCaso || 'Sem status', statusMigracao: item.statusMigracao || 'CENTRAL', dataInsercao: item.dataInsercao || item.importado_em || item.dataCadastro || item.dataInsercao, dadosJson: JSON.stringify({ ...(item.dados || {}), ...item }) });
      const busca = String(termo).trim().toLowerCase();
      return [...mapa.values()].filter(item => !busca || JSON.stringify(item).toLowerCase().includes(busca));
    } catch (erro) { console.error('Falha ao consultar casos centralizados:', erro.message); return []; }
  });
  ipcMain.removeHandler('cv:caso');
  ipcMain.handle('cv:caso', async (_evento, idCaso) => {
    if (!modoCentralAtivo()) {
      const caso = banco.prepare('SELECT * FROM casos WHERE id_caso = ? AND status_caso <> \'LEGADO\'').get(idCaso);
      if (caso) return caso;
      const historico = registrosLocalizacoesOficiais().find((item) => item.idCaso === String(idCaso));
      return historico ? { id_caso: historico.idCaso, talao_pm: historico.talaoPMESP, nome_desaparecido: historico.nome, status_caso: historico.statusCaso, status_migracao: historico.statusMigracao, dados_json: historico.dadosJson } : null;
    }
    try {
      const item = await requisicaoServidor(`/api/ocorrencias/${encodeURIComponent(idCaso)}`);
      return { id_caso: String(item.id ?? idCaso), talao_pm: item.talaoPMESP || item.talao_pm || item.talao || '', nome_desaparecido: item.nome || item.nome_desaparecido || item.nomeCompletoDesaparecido || 'Sem nome', status_caso: item.status || item.status_caso || item.statusCaso || 'Sem status', status_migracao: item.statusMigracao || 'CENTRAL', dados_json: JSON.stringify({ ...(item.dados || {}), ...item }) };
    } catch (erro) { throw new Error('Não foi possível consultar o caso atualizado no servidor central: ' + erro.message); }
  });
}

function registrarSalvamentoVitima() {
  ipcMain.handle('cv:salvar-vitima', async (_evento, dados) => {
    const idCaso = String(dados?.idCaso || '').trim();
    const idVitimaTexto = String(dados?.idVitima || '').trim();
    const idVitima = Number(idVitimaTexto || 0);
    const painel = String(dados?.painel || '').trim();
    if (!idCaso || !idVitimaTexto || !painel) return { ok: false, mensagem: 'Identifique o caso, a vÃ­tima e o painel antes de salvar.' };
    if (modoCentralAtivo()) {
      try {
        const resposta = await requisicaoServidor(`/api/vitimas/${encodeURIComponent(idVitimaTexto)}`, { method: 'PUT', body: JSON.stringify({ idCaso, nome: dados?.nome || '', respostasArvore: dados?.respostas || {}, complementosArvore: dados?.complementos || {}, ultimaEdicaoArvore: { painel, dataHora: new Date().toISOString(), operador: String(dados?.operador || 'sessao-local') }, operador: dados?.operador || 'sessao-local' }) });
        return { ok: true, central: true, dataHora: resposta.atualizadoEm || new Date().toISOString(), painel, idVitima: resposta.id || idVitimaTexto, ordem: resposta.ordem };
      } catch (erro) { return { ok: false, mensagem: `Servidor central indisponÃ­vel: ${erro.message}` }; }
    }
    const vitima = banco.prepare('SELECT * FROM vitimas_caso WHERE id = ? AND id_caso = ?').get(idVitima, idCaso);
    if (!vitima) return { ok: false, mensagem: 'VÃ­tima nÃ£o encontrada neste caso.' };
    const atual = JSON.parse(vitima.dados_json || '{}');
    const agora = new Date().toISOString();
    const novo = { ...atual, ordem: vitima.ordem, respostasArvore: { ...(atual.respostasArvore || {}), ...(dados.respostas || {}) }, complementosArvore: { ...(atual.complementosArvore || {}), ...(dados.complementos || {}) }, ultimaEdicaoArvore: { painel, dataHora: agora, operador: String(dados?.operador || 'sessao-local') } };
    const nome = String(novo.respostasArvore.passo1_nome || novo.respostasArvore.nomeCompletoDesaparecido || vitima.nome || '').trim();
    banco.prepare('UPDATE vitimas_caso SET nome = ?, dados_json = ?, atualizado_em = ? WHERE id = ?').run(nome, JSON.stringify(novo), agora, idVitima);
    banco.prepare('INSERT INTO auditoria_local(id_caso,operador,justificativa,alteracoes_json,criado_em) VALUES (?,?,?,?,?)').run(idCaso, String(dados?.operador || 'sessao-local'), `Salvamento do painel da vÃ­tima ${vitima.ordem}`, JSON.stringify({ idVitima, ordem: vitima.ordem, painel, dataHora: agora }), agora);
    return { ok: true, dataHora: agora, painel, idVitima, ordem: vitima.ordem };
  });
}

function registrarDashboardCentral() {
  ipcMain.removeHandler('cv:dashboard');
  ipcMain.handle('cv:dashboard', async (_evento, filtro = {}) => {
    try {
      if (!modoCentralAtivo()) return executarDashboardLocal(filtro);
      const parametros = new URLSearchParams();
      if (filtro.inicio) parametros.set('inicio', filtro.inicio);
      if (filtro.fim) parametros.set('fim', filtro.fim);
      const sufixo = parametros.toString() ? `?${parametros.toString()}` : '';
      const indicadores = await requisicaoServidor(`/api/indicadores${sufixo}`);
      return { ...indicadores, indicadoresBase: indicadores };
    } catch (erro) {
      console.error('Falha ao carregar indicadores centrais:', erro);
      return { ok: false, mensagem: `Indicadores centrais indisponÃ­veis: ${erro.message}` };
    }
  });
}

app.whenReady().then(() => { prepararArmazenamento(); abrirBanco(); normalizarEntrevistasSalvas(); registrarIpc(); registrarDashboardCentral(); registrarCasosCentral(); registrarSalvamentoVitima(); criarJanela(); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
