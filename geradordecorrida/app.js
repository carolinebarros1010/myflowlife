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
];

const seq = { vel:0, res:0, pot:0 };
const regrasNivel = {
  iniciante: { velSemana:1, resSemana:1, potCadaNDias:14 },
  intermediario: { velSemana:1, resSemana:2, potCadaNDias:14 },
  avancado: { velSemana:2, resSemana:2, potCadaNDias:14, potPre:1 },
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
  const nivelEl = byId('perfil');
  const nTreinosEl = byId('treinosSemana');
  const ritmoEl = byId('ritmoMedio');
  const esforcoEl = byId('esforco');

  if (!provaKmEl || !nivelEl || !nTreinosEl || !ritmoEl || !esforcoEl) {
    console.error("❌ Um ou mais campos de entrada não foram encontrados no HTML!");
    toast("Erro: campo não encontrado no formulário.");
    playFeedback("error");
    return;
  }

  const provaKm = parseFloat(provaKmEl.value || 10);
  const nivel = nivelEl.value;
  const nTreinos = parseInt(nTreinosEl.value || 4, 10);
  const ritmoBaseSec = toSecPace(ritmoEl.value || "5:30");
  const esforco = parseInt(esforcoEl.value || 7, 10);

  console.log(`📊 Dados recebidos → prova=${provaKm}km | nível=${nivel} | treinos=${nTreinos} | ritmo=${ritmoEl.value} | esforço=${esforco}`);

  // === 2. Ajuste do volume conforme nível ===
  let fator = 2.0;
  if (nivel === "iniciante") fator = 1.5;
  else if (nivel === "intermediario") fator = 2.0;
  else if (nivel === "avancado") fator = 2.5;

  const volMaxKm = provaKm * fator;
  const regra = regrasNivel[nivel] || regrasNivel.intermediario;

  // === 3. Cálculo do ritmo e variação pelo esforço ===
  const varMin = 0.05, varMax = 0.10;
  const escala = 1 - (clamp(esforco, 1, 10) - 1) / 9;
  const varPct = varMin + (varMax - varMin) * escala;
  const ritmoForte = ritmoBaseSec * (1 - varPct);
  const ritmoLeve = ritmoBaseSec * (1 + varPct * 0.6);

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

    semana.push({
      dia: `Dia ${i + 1}`,
      nome: treino.nome,
      tipo: treino.tipo,
      distKm: round2(alvo),
      ritmo: paceStr(treino.leve ? ritmoLeve : ritmoForte),
      desc: treino.desc
    });

    distAcum += alvo;
  }

  // === 5. Renderização ===
  renderSemana(semana);
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
      <div class="body">
        <span class="badge">${t.dia}</span>
        <div class="title">${idx+1}. ${t.nome}</div>
        <div class="kv">Tipo: ${t.tipo}</div>
        <div class="kv">Distância: <b>${t.distKm} km</b> • Ritmo: <b>${t.ritmo} min/km</b></div>
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
    ["Elementos existem", () => !!byId('distProva') && !!byId('nivel') && !!byId('semanal')]
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
      if(window.chart) chart.destroy(); 
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

