const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const Database = require('better-sqlite3');

const raiz = path.resolve(__dirname, '..');
const bancoPath = path.join(raiz, 'data', 'cabine-verde.sqlite');
const fotosPath = path.join(raiz, 'fotos');
let banco;

function abrirBanco() {
  if (!fs.existsSync(bancoPath)) throw new Error(`Banco local não encontrado: ${bancoPath}`);
  banco = new Database(bancoPath, { readonly: false });
  banco.exec(`CREATE TABLE IF NOT EXISTS operadores_local (email TEXT PRIMARY KEY, nome TEXT NOT NULL, re TEXT NOT NULL, posto_graduacao TEXT NOT NULL DEFAULT '', equipe TEXT NOT NULL, perfil TEXT NOT NULL DEFAULT 'OPERADOR', ativo INTEGER NOT NULL DEFAULT 1, criado_em TEXT NOT NULL, ultimo_acesso TEXT)`);
  banco.exec(`CREATE TABLE IF NOT EXISTS auditoria_local (id INTEGER PRIMARY KEY AUTOINCREMENT, id_caso TEXT NOT NULL, operador TEXT NOT NULL, justificativa TEXT NOT NULL, alteracoes_json TEXT NOT NULL, criado_em TEXT NOT NULL)`);
  banco.exec(`CREATE TABLE IF NOT EXISTS indicadores_producao_legado (id INTEGER PRIMARY KEY AUTOINCREMENT, periodo TEXT NOT NULL, dias_trabalhados INTEGER NOT NULL DEFAULT 0, localizadas_total INTEGER NOT NULL DEFAULT 0, localizadas_cabine INTEGER NOT NULL DEFAULT 0, localizadas_vtr INTEGER NOT NULL DEFAULT 0, localizadas_vulto_outros INTEGER NOT NULL DEFAULT 0, localizadas_preso INTEGER NOT NULL DEFAULT 0, localizadas_obito INTEGER NOT NULL DEFAULT 0, procedimentos_total INTEGER NOT NULL DEFAULT 0, fonte TEXT NOT NULL, incompleto INTEGER NOT NULL DEFAULT 1, importado_em TEXT NOT NULL)`);
  const colunasOperadores = banco.prepare('PRAGMA table_info(operadores_local)').all();
  if (!colunasOperadores.some(coluna => coluna.name === 'posto_graduacao')) banco.exec("ALTER TABLE operadores_local ADD COLUMN posto_graduacao TEXT NOT NULL DEFAULT ''");
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

function registrarIpc() {
  ipcMain.handle('cv:operadores', () => banco.prepare('SELECT email, nome, re, posto_graduacao AS postoGraduacao, equipe, perfil, ativo, criado_em AS criadoEm, ultimo_acesso AS ultimoAcesso FROM operadores_local WHERE ativo = 1 ORDER BY nome').all());
  ipcMain.handle('cv:registrar-operador', (_evento, dados) => {
    const email = String(dados?.email || '').trim().toLowerCase();
    const nome = String(dados?.nome || '').trim();
    const re = String(dados?.re || '').trim();
    const postoGraduacao = String(dados?.postoGraduacao || '').trim();
    const equipe = String(dados?.equipe || '').trim();
    if (!/^[^@\s]+@policiamilitar\.sp\.gov\.br$/.test(email)) return { ok: false, mensagem: 'Use um e-mail institucional @policiamilitar.sp.gov.br.' };
    if (!nome || !/^\d+$/.test(re) || !postoGraduacao || !equipe) return { ok: false, mensagem: 'Informe nome, RE numérico, Posto/Graduação e equipe.' };
    try { banco.prepare('INSERT INTO operadores_local(email, nome, re, posto_graduacao, equipe, criado_em) VALUES (?, ?, ?, ?, ?, ?)').run(email, nome, re, postoGraduacao, equipe, new Date().toISOString()); return { ok: true, operador: { email, nome, re, postoGraduacao, equipe, perfil: 'OPERADOR' } }; } catch { return { ok: false, mensagem: 'Este e-mail já está cadastrado.' }; }
  });
  ipcMain.handle('cv:entrar-operador', (_evento, emailInformado) => {
    const email = String(emailInformado || '').trim().toLowerCase();
    if (!/^[^@\s]+@policiamilitar\.sp\.gov\.br$/.test(email)) return { ok: false, mensagem: 'Use um e-mail institucional @policiamilitar.sp.gov.br.' };
    const operador = banco.prepare('SELECT email, nome, re, posto_graduacao AS postoGraduacao, equipe, perfil FROM operadores_local WHERE email = ? AND ativo = 1').get(email);
    if (!operador) return { ok: false, mensagem: 'Operador não cadastrado ou inativo.' };
    banco.prepare('UPDATE operadores_local SET ultimo_acesso = ? WHERE email = ?').run(new Date().toISOString(), email);
    return { ok: true, operador };
  });
  ipcMain.handle('cv:dashboard', () => {
    const registros = banco.prepare('SELECT dados_json, status_caso FROM casos').all().map(item => ({ ...JSON.parse(item.dados_json || '{}'), statusBanco: item.status_caso }));
    const producao = banco.prepare('SELECT * FROM indicadores_producao_legado ORDER BY id DESC LIMIT 1').get(); const locais = registros.filter(item => item.novoCasoLocal === true); const localizadasLocais = locais.filter(item => ['localizado vivo', 'localizado morto', 'localizado preso', 'vivo', 'morto', 'preso'].includes(String(item.resultadoLocalizacao || '').trim().toLowerCase())); const exclusivasLocais = locais.filter(item => campoVerdadeiro(item.atuacaoExclusivaCabineVerde) || String(item.recursoLocalizacao || '').trim().toLowerCase() === 'cabine verde');
    return {
    totalCasos: (producao ? producao.localizadas_total : registros.length) + locais.length,
    pessoasLocalizadas: (producao ? producao.localizadas_total : registros.filter(item => campoVerdadeiro(item.localizado) || ['localizado', 'encerrado'].includes(String(item.statusCaso || '').trim().toLowerCase()) || ['localizado', 'encerrado'].includes(String(item.statusBanco || '').trim().toLowerCase()) || ['localizado vivo', 'localizado morto', 'localizado preso', 'vivo', 'morto', 'preso'].includes(String(item.resultadoLocalizacao || '').trim().toLowerCase()) || Boolean(item.dataHoraLocalizacao && !['não', 'nao', 'não informado', 'nao informado'].includes(String(item.dataHoraLocalizacao).trim().toLowerCase()))).length) + localizadasLocais.length,
    atuacaoExclusivaCabineVerde: (producao ? producao.localizadas_cabine : registros.filter(item => campoVerdadeiro(item.atuacaoExclusivaCabineVerde) || String(item.recursoLocalizacao || '').trim().toLowerCase() === 'cabine verde' || (!item.resultadoLocalizacao && !item.recursoLocalizacao && campoVerdadeiro(item.aptoCabineVerde))).length) + exclusivasLocais.length,
    producaoLegado: producao ? { periodo: producao.periodo, diasTrabalhados: producao.dias_trabalhados, vtr: producao.localizadas_vtr, vultoOutros: producao.localizadas_vulto_outros, preso: producao.localizadas_preso, obito: producao.localizadas_obito, procedimentos: producao.procedimentos_total, incompleto: Boolean(producao.incompleto) } : null,
    incompletos: banco.prepare("SELECT COUNT(*) AS total FROM casos WHERE status_migracao = 'INCOMPLETO'").get().total,
    porStatus: banco.prepare('SELECT status_caso AS status, COUNT(*) AS total FROM casos GROUP BY status_caso ORDER BY total DESC').all(),
    porPrioridade: banco.prepare("SELECT json_extract(dados_json, '$.prioridade') AS prioridade, COUNT(*) AS total FROM casos GROUP BY prioridade ORDER BY total DESC").all(),
    observacoes: banco.prepare('SELECT COUNT(*) AS total FROM legado_observacoes').get().total
    };
  });
  ipcMain.handle('cv:casos', (_evento, termo = '') => {
    const busca = `%${String(termo).trim()}%`;
    return banco.prepare("SELECT id_caso AS idCaso, talao_pm AS talaoPMESP, nome_desaparecido AS nome, status_caso AS status, status_migracao AS statusMigracao, dados_json AS dadosJson FROM casos WHERE id_caso LIKE ? OR talao_pm LIKE ? OR nome_desaparecido LIKE ? ORDER BY importado_em DESC LIMIT 100").all(busca, busca, busca);
  });
  ipcMain.handle('cv:caso', (_evento, idCaso) => banco.prepare('SELECT * FROM casos WHERE id_caso = ?').get(idCaso));
  ipcMain.handle('cv:auditoria-casos', (_evento, termo = '') => {
    const busca = `%${String(termo).trim()}%`;
    return banco.prepare("SELECT id_caso AS idCaso, talao_pm AS talaoPMESP, nome_desaparecido AS nome, status_caso AS status, status_migracao AS statusMigracao, dados_json AS dadosJson FROM casos WHERE status_migracao = 'INCOMPLETO' OR id_caso LIKE ? OR talao_pm LIKE ? OR nome_desaparecido LIKE ? ORDER BY importado_em DESC LIMIT 100").all(busca, busca, busca);
  });
  ipcMain.handle('cv:historico-caso', (_evento, idCaso) => banco.prepare('SELECT * FROM auditoria_local WHERE id_caso = ? ORDER BY id DESC LIMIT 50').all(idCaso));
  ipcMain.handle('cv:salvar-desfecho-operacional', (_evento, dados) => {
    const idCaso = String(dados?.idCaso || '').trim(); const campos = dados?.campos || {}; const nome = String(dados?.nome || '').trim();
    if (!idCaso) return { ok: false, mensagem: 'Identifique o caso antes de salvar.' };
    const permitidos = ['resultadoLocalizacao', 'recursoLocalizacao', 'atuacaoExclusivaCabineVerde', 'dataHoraLocalizacao', 'observacoesLocalizacao']; const registro = banco.prepare('SELECT * FROM casos WHERE id_caso = ?').get(idCaso); const atual = registro ? JSON.parse(registro.dados_json || '{}') : {};
    const novo = { ...atual }; for (const chave of permitidos) if (chave in campos) novo[chave] = String(campos[chave] ?? '').trim();
    if (!registro) { novo.idCaso = idCaso; novo.nomeCompletoDesaparecido = nome; novo.statusCaso = 'Em triagem'; novo.novoCasoLocal = true; const agora = new Date().toISOString(); banco.prepare('INSERT INTO casos(id_caso,talao_pm,nome_desaparecido,status_caso,status_migracao,origem_arquivo,linha_origem,dados_json,bruto_json,importado_em) VALUES (?,?,?,?,?,?,?,?,?,?)').run(idCaso, '', nome, 'Em triagem', 'INCOMPLETO', 'OPERACAO_LOCAL', Date.now(), JSON.stringify(novo), JSON.stringify(novo), agora); return { ok: true, novo: true }; }
    banco.prepare('UPDATE casos SET nome_desaparecido = ?, dados_json = ?, status_migracao = ? WHERE id_caso = ?').run(nome || registro.nome_desaparecido, JSON.stringify(novo), 'INCOMPLETO', idCaso); banco.prepare('INSERT INTO auditoria_local(id_caso,operador,justificativa,alteracoes_json,criado_em) VALUES (?,?,?,?,?)').run(idCaso, String(dados?.operador || 'sessao-local'), 'Registro de desfecho operacional', JSON.stringify({ desfecho: novo }), new Date().toISOString()); return { ok: true, novo: false };
  });
  ipcMain.handle('cv:corrigir-caso', (_evento, dados) => {
    const idCaso = String(dados?.idCaso || '').trim(); const justificativa = String(dados?.justificativa || '').trim(); const campos = dados?.campos || {};
    if (!idCaso || !justificativa) return { ok: false, mensagem: 'Informe o caso e a justificativa da correção.' };
    const caso = banco.prepare('SELECT * FROM casos WHERE id_caso = ?').get(idCaso);
    if (!caso) return { ok: false, mensagem: 'Caso não encontrado.' };
    const permitidos = ['nome_desaparecido', 'talao_pm', 'status_caso', 'municipio', 'idade', 'sexoGenero', 'dataHoraUltimaVisualizacao', 'localUltimaVisualizacao', 'observacoesOperacionais', 'numeroBo', 'prioridade', 'classificacaoRisco', 'statusVitima', 'condicaoVitima', 'desfechoCaso', 'encaminhamento', 'resultadoLocalizacao', 'recursoLocalizacao', 'atuacaoExclusivaCabineVerde', 'dataHoraLocalizacao', 'observacoesLocalizacao'];
    const antigo = JSON.parse(caso.dados_json || '{}'); const novo = { ...antigo }; const alteracoes = {};
    for (const chave of permitidos) { if (!(chave in campos)) continue; const valor = String(campos[chave] ?? '').trim(); const anterior = chave === 'nome_desaparecido' ? caso.nome_desaparecido : chave === 'talao_pm' ? caso.talao_pm : chave === 'status_caso' ? caso.status_caso : antigo[chave] ?? ''; if (String(anterior ?? '') !== valor) { alteracoes[chave] = { anterior: anterior ?? '', novo: valor }; if (chave === 'nome_desaparecido' || chave === 'talao_pm' || chave === 'status_caso') novo[chave] = valor; else novo[chave] = chave === 'idade' && valor ? Number(valor) : valor; } }
    if (!Object.keys(alteracoes).length) return { ok: false, mensagem: 'Nenhuma alteração foi identificada.' };
    const nome = novo.nome_desaparecido ?? caso.nome_desaparecido; const talao = novo.talao_pm ?? caso.talao_pm; const status = novo.status_caso ?? caso.status_caso;
    banco.prepare('UPDATE casos SET nome_desaparecido = ?, talao_pm = ?, status_caso = ?, dados_json = ?, status_migracao = ? WHERE id_caso = ?').run(nome, talao, status, JSON.stringify(novo), 'CORRIGIDO', idCaso);
    banco.prepare('INSERT INTO auditoria_local(id_caso, operador, justificativa, alteracoes_json, criado_em) VALUES (?, ?, ?, ?, ?)').run(idCaso, String(dados?.operador || 'sessao-local'), justificativa, JSON.stringify(alteracoes), new Date().toISOString());
    return { ok: true, alteracoes };
  });
  ipcMain.handle('cv:fotos', (_evento, idCaso) => banco.prepare('SELECT * FROM fotos WHERE id_caso = ? ORDER BY id DESC').all(idCaso));
  ipcMain.handle('cv:adicionar-foto', async (_evento, idCaso) => {
    const escolha = await dialog.showOpenDialog({ properties: ['openFile'], filters: [{ name: 'Imagens', extensions: ['jpg', 'jpeg', 'png', 'webp'] }] });
    if (escolha.canceled || !escolha.filePaths[0]) return null;
    const origem = escolha.filePaths[0];
    const pastaCaso = path.join(fotosPath, String(idCaso).replace(/[^a-zA-Z0-9_-]/g, '_'));
    fs.mkdirSync(pastaCaso, { recursive: true });
    const extensao = path.extname(origem).toLowerCase() || '.jpg';
    const nome = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${extensao}`;
    const destino = path.join(pastaCaso, nome);
    fs.copyFileSync(origem, destino);
    const insercao = banco.prepare('INSERT INTO fotos(id_caso, dados_json, origem_arquivo, linha_origem) VALUES (?, ?, ?, ?)').run(idCaso, JSON.stringify({ nomeArquivo: nome, caminhoLocal: destino, tipo: extensao, autorizacaoUsoImagem: 'Pendente' }), 'local', Date.now());
    return { id: insercao.lastInsertRowid, nomeArquivo: nome, caminhoLocal: destino, autorizacaoUsoImagem: 'Pendente' };
  });
  ipcMain.handle('cv:registrar-consentimento-foto', (_evento, dados) => {
    const idFoto = Number(dados?.idFoto || 0);
    const autorizacao = String(dados?.autorizacao || '').trim();
    if (!idFoto || !['Sim', 'Não', 'Não informado'].includes(autorizacao)) return { ok: false, mensagem: 'Selecione uma resposta para a autorização de uso da imagem.' };
    const foto = banco.prepare('SELECT dados_json FROM fotos WHERE id = ?').get(idFoto);
    if (!foto) return { ok: false, mensagem: 'Imagem não encontrada.' };
    const metadados = JSON.parse(foto.dados_json || '{}');
    metadados.autorizacaoUsoImagem = autorizacao;
    metadados.termoAutorizacao = 'Uso exclusivo para busca, identificação e divulgação operacional interna pela Polícia Militar do Estado de São Paulo.';
    metadados.autorizacaoRegistradaEm = new Date().toISOString();
    banco.prepare('UPDATE fotos SET dados_json = ? WHERE id = ?').run(JSON.stringify(metadados), idFoto);
    return { ok: true, foto: { id: idFoto, ...metadados } };
  });
  ipcMain.handle('cv:auditoria', () => banco.prepare('SELECT * FROM dados_auxiliares WHERE aba IN (\'LOG_AUDITORIA\', \'HISTORICO_EDICOES\', \'QUALIDADE_DADOS\', \'VALIDACAO_MIGRACAO\') ORDER BY id DESC LIMIT 300').all());
}

app.whenReady().then(() => { fs.mkdirSync(fotosPath, { recursive: true }); abrirBanco(); registrarIpc(); criarJanela(); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
