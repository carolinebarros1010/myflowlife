console.log("🚀 app.js carregado com sucesso!");

/* ===== V24 – Gerador de Corrida (microciclo) =====
   - progressão sequencial por fase
   - volumes por nível (1.5× / 2× / 2–3×)
   - esforço (1–10) ajusta variação de ritmo (±5–10%)
*/

const byId = (id) => document.getElementById(id);
const $ = (sel) => document.querySelector(sel);

/* ======= Som (WebAudio) ======= */
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function beep(freq = 880, dur = 120, type = "sine", vol = 0.08) {
  try {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.value = vol;
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); setTimeout(()=>o.stop(), dur);
  } catch(e) {
    console.warn("Som não disponível:", e);
  }
}

function playFeedback(type = "click") {
  if (type === "success") beep(1100, 120, "triangle", 0.08);
  else if (type === "error") beep(300, 200, "square", 0.1);
  else beep(800, 80, "sine", 0.07);
}

/* ======= Helpers ======= */
function toSecPace(p) {
  if (!p) return 330; // padrão 5:30
  const [m, s] = p.split(":").map(x => parseInt(x, 10));
  return (m * 60 + (isNaN(s) ? 0 : s));
}

function paceStr(sec) {
  const s = Math.round(sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function clamp(n, a, b){ return Math.min(b, Math.max(a, n)); }
function rng(min, max){ return Math.random() * (max - min) + min; }
function round2(n){ return Math.round(n*100)/100; }

function formatRange(min, max, unit = "min") {
  const minRound = Math.round(min);
  const maxRound = Math.round(max);
  if (minRound === maxRound) return `${minRound} ${unit}`;
  return `${minRound}–${maxRound} ${unit}`;
}

function buildEstrutura(min, max) {
  const aquecimentoMin = min * 0.2;
  const aquecimentoMax = max * 0.2;
  const principalMin = min * 0.6;
  const principalMax = max * 0.6;
  const desaquecMin = min * 0.2;
  const desaquecMax = max * 0.2;
  return {
    aquecimento: `Aquecimento: ${formatRange(aquecimentoMin, aquecimentoMax)}`,
    principal: `Parte principal: ${formatRange(principalMin, principalMax)}`,
    desaquecimento: `Desaquecimento: ${formatRange(desaquecMin, desaquecMax)}`,
  };
}

function getModalidadeConfig(modalidade) {
  if (modalidade === "bike") return { min: 1.3, max: 1.5 };
  if (modalidade === "remo") return { min: 1.1, max: 1.25 };
  if (modalidade === "natacao") return { min: 1.4, max: 1.6 };
  if (modalidade === "natacao_aberta") return { min: 1.5, max: 1.7 };
  if (modalidade === "eliptico") return { min: 1.2, max: 1.35 };
  if (modalidade === "caminhada") return { min: 1.6, max: 2.0 };
  if (modalidade === "trilha") return { min: 1.4, max: 1.7 };
  if (modalidade === "aqua_run") return { min: 1.2, max: 1.4 };
  if (modalidade === "esqui") return { min: 1.3, max: 1.5 };
  return { min: 1.0, max: 1.0 };
}

function formatDistanciaEstimativa(modalidade, distKm) {
  if (modalidade === "bike") {
    return `${round2(distKm * 3.5)} km (estimado)`;
  }
  if (modalidade === "remo") {
    return `${Math.round(distKm * 0.9 * 1000)} m (estimado)`;
  }
  if (modalidade === "natacao") {
    return `${Math.round(distKm * 0.9 * 1000)} m (estimado)`;
  }
  if (modalidade === "natacao_aberta") {
    return `${round2(distKm * 0.8)} km (estimado)`;
  }
  if (modalidade === "eliptico") {
    return `${round2(distKm * 1.6)} km (estimado)`;
  }
  if (modalidade === "caminhada") {
    return `${round2(distKm * 0.85)} km (estimado)`;
  }
  if (modalidade === "trilha") {
    return `${round2(distKm * 0.9)} km (estimado)`;
  }
  if (modalidade === "aqua_run") {
    return `${formatRange(distKm * 0.8, distKm)} km (estimado)`;
  }
  if (modalidade === "esqui") {
    return `${round2(distKm * 2.8)} km (estimado)`;
  }
  return `${round2(distKm)} km`;
}

/* ======= Tabelas de Fases (sequencial 1→10) ======= */
const fasesVelocidadePura = [
  {nome:"Sprint Curto + Rec. Completa", distKm:2.0, desc:"15' aquece + 12×100m (95–100%) 2–3' pausa + 10' leve", tipo:"intensidade"},
  {nome:"Pirâmide Sprint 60–120", distKm:1.9, desc:"10' aquece + 60–80–100–120–100–80–60 (95%) + 10' leve", tipo:"intensidade"},
  {nome:"Saída Controlada + 200m", distKm:1.5, desc:"15' aquece + 8×60m saída parada + 3×200m (85%) + 10' leve", tipo:"intensidade"},
  {nome:"Sprint + Pliometria", distKm:2.0, desc:"10' aquece + 6×40m (95%) + 3 circuitos pliométricos + 10' leve", tipo:"intensidade"},
  {nome:"Ladeira (Força-Velocidade)", distKm:2.3, desc:"15' aquece + 10×80m subida + 4×100m plano + 10' leve", tipo:"potencia"},
  {nome:"Sprint Resistido", distKm:1.6, desc:"15' aquece + 6×30m resistido + 6×50m livres (90%) + 10' leve", tipo:"potencia"},
  {nome:"Sprint Assistido", distKm:1.8, desc:"10' aquece + 8×80m descida suave + 10' leve", tipo:"intensidade"},
  {nome:"Técnica de Passada", distKm:2.4, desc:"15' drills + 6×60m progressivos + 3×100m (90%) + 10' leve", tipo:"intensidade"},
  {nome:"Intervalado Curto 40/20", distKm:3.0, desc:"10' aquece + 3 blocos de 6×40m (forte)/20m (leve) + 10' leve", tipo:"intensidade"},
  {nome:"Reação (auditivo/visual)", distKm:1.5, desc:"15' aquece + 10×20m reação + 6×60m livres + 10' leve", tipo:"intensidade"},
  {nome:"Sprint com Ritmo Técnico", distKm:2.1, desc:"12' aquece + 8×80m com foco em mecânica + 8' leve", tipo:"intensidade"},
  {nome:"Sprint 150m com pausa longa", distKm:2.2, desc:"10' aquece + 6×150m (90–95%) 3' pausa + 10' leve", tipo:"intensidade"},
  {nome:"Pliometria + sprint curto", distKm:2.0, desc:"10' aquece + 3×(6 saltos + 60m forte) + 10' leve", tipo:"potencia"},
  {nome:"Sprint em blocos 30/30", distKm:2.4, desc:"12' aquece + 2×(6×30\" forte/30\" leve) + 8' leve", tipo:"intensidade"},
  {nome:"Sprints 60m com técnica", distKm:1.8, desc:"10' aquece + 10×60m (90–95%) foco em postura + 8' leve", tipo:"intensidade"},
  {nome:"Progressivo 80–120m", distKm:2.3, desc:"12' aquece + 4×(80m/100m/120m) 2' pausa + 8' leve", tipo:"intensidade"},
  {nome:"Sprint com ritmo controlado", distKm:2.0, desc:"10' aquece + 6×120m (85–90%) + 8' leve", tipo:"intensidade"},
  {nome:"Velocidade com técnica de braço", distKm:2.1, desc:"12' aquece + 8×100m foco em braço + 8' leve", tipo:"intensidade"},
];

const fasesResVelocidade = [
  {nome:"300/300", distKm:3.0, desc:"15' aquece + 5×300m forte /300m leve +10' leve", tipo:"res_vel"},
  {nome:"400F/200S blocos", distKm:3.6, desc:"12' aquece + 6 blocos + 10' leve", tipo:"res_vel"},
  {nome:"Billat 30/30", distKm:5.2, desc:"10' aquece + 3×(10×30\" forte/30\" leve) + 10' leve", tipo:"res_vel"},
  {nome:"Progressivo 600–400–200", distKm:3.6, desc:"15' aquece + 3 séries (600/400/200) + 10' leve", tipo:"res_vel"},
  {nome:"Pirâmide inversa", distKm:3.2, desc:"12' aquece + 800–600–400–200 + 3' pausa + 10' leve", tipo:"res_vel"},
  {nome:"12×200m /45s", distKm:3.0, desc:"10' aquece + 12×200m (90%) 45\" trote + 10' leve", tipo:"res_vel"},
  {nome:"6×500m (90%)", distKm:3.5, desc:"15' aquece + 6×500m 90% com 90\" leve + 10' leve", tipo:"res_vel"},
  {nome:"8×(300F+100L)", distKm:3.2, desc:"10' aquece + 8×(300m 95% + 100m leve) + 10' leve", tipo:"res_vel"},
  {nome:"Blocos 200–300–400", distKm:3.2, desc:"12' aquece + (4×200)+(3×300)+(2×400)+10' leve", tipo:"res_vel"},
  {nome:"1' forte / 1' leve", distKm:5.0, desc:"10' aquece + 4×(6×1' forte/1' leve) + 10' leve", tipo:"res_vel"},
  {nome:"Séries 600m controladas", distKm:3.6, desc:"12' aquece + 4×600m (85–90%) 2' leve + 8' leve", tipo:"res_vel"},
  {nome:"Intervalos 2' forte/1' leve", distKm:4.8, desc:"10' aquece + 5×(2' forte/1' leve) + 8' leve", tipo:"res_vel"},
  {nome:"Progressivo 800–600–400", distKm:3.8, desc:"15' aquece + 800/600/400 forte + 10' leve", tipo:"res_vel"},
  {nome:"Blocos 3' forte/2' leve", distKm:5.4, desc:"12' aquece + 4×(3' forte/2' leve) + 8' leve", tipo:"res_vel"},
  {nome:"Intervalado 5×700m", distKm:4.2, desc:"15' aquece + 5×700m (88–92%) 2' leve + 8' leve", tipo:"res_vel"},
  {nome:"Progressivo 1000–800–600", distKm:4.6, desc:"15' aquece + 1000/800/600 forte + 10' leve", tipo:"res_vel"},
  {nome:"Tempo run fracionado", distKm:5.0, desc:"12' aquece + 3×6' ritmo forte/2' leve + 8' leve", tipo:"res_vel"},
  {nome:"Intervalado 90\" forte/60\" leve", distKm:4.5, desc:"10' aquece + 8×(90\" forte/60\" leve) + 8' leve", tipo:"res_vel"},
];

const fasesPotencia = [
  {nome:"Subida + Pliometria", distKm:1.8, desc:"8×60m subida (6%) + 3c pliométricos + 10' leve", tipo:"potencia"},
  {nome:"Resistido (trenó/elástico)", distKm:1.6, desc:"6×30m resistido + 6×50m livres (90%)", tipo:"potencia"},
  {nome:"Plio horizontal + sprint", distKm:2.0, desc:"3×(10 saltos + 60m sprint)", tipo:"potencia"},
  {nome:"Acelera/Para/Retoma", distKm:2.0, desc:"3×6×(40m acelera/10m para/retoma)", tipo:"potencia"},
  {nome:"Carga parcial 5%", distKm:1.8, desc:"10×60m com leve sobrecarga", tipo:"potencia"},
  {nome:"Circuito força explosiva", distKm:1.6, desc:"3c: swing 10 + salto 10 + corrida 40m", tipo:"potencia"},
  {nome:"Mudança de direção", distKm:1.9, desc:"4×6 sprints (20m ida/20m volta)", tipo:"potencia"},
  {nome:"Fartlek explosivo", distKm:2.4, desc:"4×4' (20\" forte / 40\" moderado)", tipo:"potencia"},
  {nome:"Treino contrastado", distKm:1.6, desc:"(agach 6rep 60%1RM → sprint 40m) ×6", tipo:"potencia"},
  {nome:"Passadas longas (overspeed)", distKm:2.0, desc:"6×100m foco amplitude (90%)", tipo:"potencia"},
  {nome:"Explosão curta em subida", distKm:1.7, desc:"10' aquece + 8×40m subida + 8' leve", tipo:"potencia"},
  {nome:"Saltos reativos + aceleração", distKm:1.8, desc:"10' aquece + 4×(8 saltos reativos + 40m forte) + 10' leve", tipo:"potencia"},
  {nome:"Sprint com resistência elástica", distKm:1.6, desc:"6×20m resistido + 6×40m livres (90%)", tipo:"potencia"},
  {nome:"Sprints curtos em escada", distKm:1.5, desc:"10' aquece + 6×(escada 20\" + sprint 30m) + 8' leve", tipo:"potencia"},
  {nome:"Saltos unilaterais + aceleração", distKm:1.8, desc:"10' aquece + 3×(8 saltos unilaterais + 50m forte) + 10' leve", tipo:"potencia"},
  {nome:"Sprints 10/20/30m", distKm:1.7, desc:"12' aquece + 4 blocos 10m/20m/30m + 8' leve", tipo:"potencia"},
  {nome:"Circuito potência com corrida", distKm:1.9, desc:"10' aquece + 3×(agacho 6rep + 40m forte) + 10' leve", tipo:"potencia"},
  {nome:"Arranque com tração", distKm:1.6, desc:"12' aquece + 6×20m tração + 6×30m livres + 8' leve", tipo:"potencia"},
];

const seq = { vel:0, res:0, pot:0 };
const regrasNivel = {
  iniciante: { velSemana:1, resSemana:1, potCadaNDias:14 },
  intermediario: { velSemana:1, resSemana:2, potCadaNDias:14 },
  avancado: { velSemana:2, resSemana:2, potCadaNDias:14, potPre:1 },
};

const ajusteFaseCiclo = {
  folicular: { volume: 1.0, intensidade: 1.0 },
  ovulatoria: { volume: 0.95, intensidade: 1.05 },
  lutea: { volume: 0.85, intensidade: 0.9 },
  menstrual: { volume: 0.7, intensidade: 0.8 },
};

/* ======= Funções Principais ======= */
function pickSequencial(cat){
  if (cat==='vel') { const i = seq.vel % fasesVelocidadePura.length; seq.vel++; return fasesVelocidadePura[i]; }
  if (cat==='res') { const i = seq.res % fasesResVelocidade.length; seq.res++; return fasesResVelocidade[i]; }
  if (cat==='pot'){ const i = seq.pot % fasesPotencia.length; seq.pot++; return fasesPotencia[i]; }
}

function countTipo(arr, t){ return arr.filter(a=>a.tipo===t).length; }

/* ======= GERAÇÃO DE PLANO (compatível com HTML atual) ======= */
function gerarPlano() {
  console.log("⚙️ Iniciando geração do plano...");

  // === 1. Captura de campos ===
  const provaKmEl = byId('distProva');
  const nivelEl = byId('nivel');
  const nTreinosEl = byId('semanal');
  const cooperDistEl = byId('cooperDist');
  const diasEl = byId('dias');
  const cooperPseEl = byId('cooperPse');
  const faseEl = byId('faseCiclo');
  const modalidadeEl = byId('modalidade');
  const zonaEl = byId('zona');

  if (!provaKmEl || !nivelEl || !nTreinosEl || !cooperDistEl || !cooperPseEl || !diasEl || !faseEl || !modalidadeEl || !zonaEl) {
    console.error("❌ Um ou mais campos de entrada não foram encontrados no HTML!");
    toast("Erro: campo não encontrado no formulário.");
    playFeedback("error");
    return;
  }

  const provaKm = parseFloat(provaKmEl.value || 10);
  const nivel = nivelEl.value;
  const nTreinos = parseInt(nTreinosEl.value || 4, 10);
  const cooperDist = parseFloat(cooperDistEl.value || 3000);
  const cooperPse = parseInt(cooperPseEl.value || 8, 10);
  const dias = diasEl.value
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);
  const faseCiclo = faseEl.value;
  const modalidade = modalidadeEl.value;
  const zona = zonaEl.value || "Z2 / PSE 5-6";
  const ajuste = ajusteFaseCiclo[faseCiclo] || ajusteFaseCiclo.folicular;

  if (!cooperDist || cooperDist <= 0) {
    toast("Informe a distância do teste Cooper (12 min).");
    playFeedback("error");
    return;
  }

  const cooperKm = cooperDist / 1000;
  const ritmoBaseSec = (12 * 60) / cooperKm;

  console.log(`📊 Dados recebidos → prova=${provaKm}km | nível=${nivel} | treinos=${nTreinos} | Cooper=${cooperDist}m | PSE=${cooperPse}`);

  // === 2. Ajuste do volume conforme nível ===
  let fator = 2.0;
  if (nivel === "iniciante") fator = 1.5;
  else if (nivel === "intermediario") fator = 2.0;
  else if (nivel === "avancado") fator = 2.5;

  const volMaxKm = provaKm * fator * ajuste.volume;
  const regra = regrasNivel[nivel] || regrasNivel.intermediario;

  // === 3. Cálculo do ritmo e variação pelo esforço ===
  const varMin = 0.05, varMax = 0.10;
  const escala = 1 - clamp(cooperPse, 0, 10) / 10;
  const varPct = varMin + (varMax - varMin) * escala;
  const fatorIntensidade = 1 / ajuste.intensidade;
  const ritmoForte = ritmoBaseSec * (1 - varPct) * fatorIntensidade;
  const ritmoLeve = ritmoBaseSec * (1 + varPct * 0.6) * fatorIntensidade;

  // === 4. Montagem dos treinos ===
  const semana = [];
  let distAcum = 0;

  for (let i = 0; i < nTreinos; i++) {
    let treino;

    if (countTipo(semana, 'intensidade') < regra.velSemana) treino = pickSequencial('vel');
    else if (countTipo(semana, 'res_vel') < regra.resSemana) treino = pickSequencial('res');
    else treino = pickSequencial('pot');

    let alvo = treino.distKm;
    if (distAcum + alvo > volMaxKm) alvo = Math.max(2, volMaxKm - distAcum);

    const ritmoSessao = paceStr(
      ["intensidade", "res_vel", "potencia"].includes(treino.tipo)
        ? ritmoForte
        : ritmoLeve
    );
    const tempoCorridaMin = alvo * (toSecPace(ritmoSessao) / 60);
    const fatorModalidade = getModalidadeConfig(modalidade);
    const tempoMin = tempoCorridaMin * fatorModalidade.min;
    const tempoMax = tempoCorridaMin * fatorModalidade.max;
    const estrutura = buildEstrutura(tempoMin, tempoMax);
    const distanciaEstimada = formatDistanciaEstimativa(modalidade, alvo);

    semana.push({
      dia: dias[i] ? dias[i][0].toUpperCase() + dias[i].slice(1) : `Dia ${i + 1}`,
      nome: treino.nome,
      tipo: treino.tipo,
      distKm: round2(alvo),
      ritmo: ritmoSessao,
      modalidade,
      zona,
      tempo: formatRange(tempoMin, tempoMax),
      distanciaEstimada,
      estrutura,
      desc: treino.desc
    });

    distAcum += alvo;
  }

  // === 5. Renderização ===
  renderSemana(semana);
  plotSemana(semana);
  toast("Plano gerado com sucesso!");
  playFeedback("success");

  console.log("✅ Plano semanal gerado:");
  console.table(semana);
}


/* ======= Render ======= */
function renderSemana(semana){
  const grid = byId('card-grid');
  if (!grid) {
    console.warn("Elemento 'card-grid' não encontrado");
    return;
  }
  grid.innerHTML = "";
  semana.forEach((t, idx)=>{
    const el = document.createElement('article');
    el.className = "card";
    el.innerHTML = `
      <div class="thumb"></div>
      <div class="body">
        <span class="badge">${t.dia}</span>
        <div class="title">${idx+1}. ${t.nome}</div>
        <div class="kv">Tipo: ${t.tipo} • Modalidade: <b>${t.modalidade}</b></div>
        <div class="kv">Tempo total: <b>${t.tempo}</b> • Zona/PSE: <b>${t.zona}</b></div>
        <div class="kv">Distância estimada: <b>${t.distanciaEstimada}</b></div>
        <div class="kv">${t.estrutura.aquecimento}</div>
        <div class="kv">${t.estrutura.principal}</div>
        <div class="kv">${t.estrutura.desaquecimento}</div>
        <div class="kv">Ritmo base (corrida): <b>${t.ritmo} min/km</b></div>
        <p class="kv">${t.desc || ""}</p>
      </div>`;
    grid.appendChild(el);
  });
}

/* ======= Gráfico ======= */
let chart;
function plotSemana(semana){
  const ctx = byId('chart');
  if (!ctx) {
    console.warn("Elemento 'chart' não encontrado");
    return;
  }
  const labels = semana.map(s=>s.dia);
  const data = semana.map(s=>s.distKm);
  if (chart) chart.destroy();
  if (typeof Chart !== 'undefined') {
    chart = new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets: [{ label:'km', data, borderWidth:1 }] },
      options: { responsive:true, maintainAspectRatio:false, scales:{ y:{ beginAtZero:true } } }
    });
  }
}

/* ======= Testes ======= */
function runTests(){
  console.log("🧪 Executando testes...");
  const tests = [
    ["toSecPace 5:30 = 330", () => toSecPace("5:30") === 330],
    ["paceStr 330 = 5:30", () => paceStr(330) === "5:30"],
    ["Seq vel avança", () => { const n=seq.vel; pickSequencial('vel'); return seq.vel===n+1; }],
    ["Sem var pace NaN", () => !isNaN(toSecPace("4:05"))],
    ["Elementos existem", () => !!byId('distProva') && !!byId('nivel') && !!byId('semanal') && !!byId('cooperDist') && !!byId('cooperPse') && !!byId('dias') && !!byId('faseCiclo') && !!byId('modalidade') && !!byId('zona')]
  ];
  const fails = tests.filter(t => {
    try {
      return !t[1]();
    } catch(e) {
      console.error("Erro no teste:", t[0], e);
      return true;
    }
  });
  
  if (fails.length) {
    toast("❌ Testes falharam: " + fails.map(f => f[0]).join(", "));
    playFeedback("error");
  } else {
    toast("✅ Testes OK (" + tests.length + ")");
    playFeedback("success");
  }
  console.log("🧪 Testes executados. Falhas:", fails.length);
}

/* ======= Exportações ======= */
async function exportPDF(){
  toast("📄 PDF exportado (simulado)");
  playFeedback("success");
}

async function screenshotCard(){
  toast("📸 Card gerado (simulado)");
  playFeedback("success");
}

/* ======= Toast ======= */
function toast(msg){
  const t = byId('toast');
  if (!t) {
    console.log(msg);
    return alert(msg);
  }
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(()=> t.classList.remove('show'), 3000);
}

/* ======= Eventos ======= */
window.addEventListener('DOMContentLoaded', ()=>{
  console.log("⚡️ Gerador de Corrida V24 conectado");

  // Conectar event listeners aos botões com IDs corretos
  const btnGerarPlano = byId('btnGerarPlano');
  const btnRodarTestes = byId('btnRodarTestes');
  const btnExportarPDF = byId('btnExportarPDF');
  const btnGerarCards = byId('btnGerarCards');
  const btnResetar = byId('btnResetar');

  if (btnGerarPlano) {
    btnGerarPlano.addEventListener('click', gerarPlano);
    console.log("✅ Evento conectado: btnGerarPlano");
  } else {
    console.warn("⚠️ Botão 'btnGerarPlano' não encontrado");
  }

  if (btnRodarTestes) {
    btnRodarTestes.addEventListener('click', runTests);
    console.log("✅ Evento conectado: btnRodarTestes");
  } else {
    console.warn("⚠️ Botão 'btnRodarTestes' não encontrado");
  }

  if (btnExportarPDF) {
    btnExportarPDF.addEventListener('click', exportPDF);
    console.log("✅ Evento conectado: btnExportarPDF");
  }

  if (btnGerarCards) {
    btnGerarCards.addEventListener('click', screenshotCard);
    console.log("✅ Evento conectado: btnGerarCards");
  }

  if (btnResetar) {
    btnResetar.addEventListener('click', ()=> {
      const grid = byId('card-grid');
      if (grid) grid.innerHTML=""; 
      if (chart) {
        chart.destroy();
        chart = null;
      }
      toast("🗑️ Tudo limpo"); 
    });
    console.log("✅ Evento conectado: btnResetar");
  }

  // Splash desaparece automaticamente
  setTimeout(()=> {
    const splash = byId('splash');
    if (splash) splash.classList.add('hidden');
  }, 1000);
});

/* ======= PWA ======= */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', ()=> {
    navigator.serviceWorker.register('./sw.js')
      .then(()=>console.log("✅ Service Worker ativo"))
      .catch(err => console.warn("⚠️ SW falhou:", err));
  });
}
