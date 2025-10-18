console.log("🚀 app.js carregado com sucesso!");

/* ===== V24 – Gerador de Corrida (microciclo) =====
   - progressão sequencial por fase
   - volumes por nível (1.5× / 2× / 2–3×)
   - esforço (1–10) ajusta variação de ritmo (±5–10%)
   - intervalos mínimos entre treinos (h)
     • intensidade/VO2: 24h
     • resistência de velocidade: 24h
     • potência: 24h
     • resistência contínua/leve: 12h
*/

const $ = (sel) => document.querySelector(sel);
const byId = (id) => document.getElementById(id);

/* ======= Som (WebAudio) para feedback ======= */
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function beep(freq = 880, dur = 120, type = "sine", vol = 0.08) {
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.value = vol; o.connect(g); g.connect(audioCtx.destination);
  o.start(); setTimeout(()=>{ o.stop(); }, dur);
}

/* ======= Helpers ======= */
function toSecPace(p) {
  // "m:ss" -> seconds per km
  const [m,s] = p.split(":").map(x=>parseInt(x,10));
  return (m*60 + (isNaN(s)?0:s));
}
function playFeedback(type = "click") {
  // toca um som leve de feedback
  if (type === "success") beep(1100, 120, "triangle", 0.08);
  else if (type === "error") beep(300, 200, "square", 0.1);
  else beep(800, 80, "sine", 0.07);
}
function paceStr(sec) {
  const s = Math.round(sec);
  const m = Math.floor(s/60);
  const r = s%60;
  return `${m}:${String(r).padStart(2,"0")}`;
}
function clamp(n, a, b){ return Math.min(b, Math.max(a, n)); }
function rng(min,max){ return Math.random()*(max-min)+min; }

/* ======= Tabelas de Fases (sequencial 1→10) ======= */
const fasesVelocidadePura = [
  {nome:"Sprint Curto + Rec. Completa", distKm:2.0,  desc:"15' aquece + 12×100m (95–100%) 2–3' pausa + 10' leve", tipo:"intensidade"},
  {nome:"Pirâmide Sprint 60–120",      distKm:1.9,  desc:"10' aquece + 60–80–100–120–100–80–60 (95%) + 10' leve", tipo:"intensidade"},
  {nome:"Saída Controlada + 200m",     distKm:1.5,  desc:"15' aquece + 8×60m saída parada + 3×200m (85%) + 10' leve", tipo:"intensidade"},
  {nome:"Sprint + Pliometria",         distKm:2.0,  desc:"10' aquece + 6×40m (95%) + 3 circuitos pliométricos + 10' leve", tipo:"intensidade"},
  {nome:"Ladeira (Força-Velocidade)",  distKm:2.3,  desc:"15' aquece + 10×80m subida + 4×100m plano + 10' leve", tipo:"potencia"},
  {nome:"Sprint Resistido",            distKm:1.6,  desc:"15' aquece + 6×30m resistido + 6×50m livres (90%) + 10' leve", tipo:"potencia"},
  {nome:"Sprint Assistido",            distKm:1.8,  desc:"10' aquece + 8×80m descida suave + 10' leve", tipo:"intensidade"},
  {nome:"Técnica de Passada",          distKm:2.4,  desc:"15' drills + 6×60m progressivos + 3×100m (90%) + 10' leve", tipo:"intensidade"},
  {nome:"Intervalado Curto 40/20",     distKm:3.0,  desc:"10' aquece + 3 blocos de 6×40m (forte)/20m (leve) + 10' leve", tipo:"intensidade"},
  {nome:"Reação (auditivo/visual)",    distKm:1.5,  desc:"15' aquece + 10×20m reação + 6×60m livres + 10' leve", tipo:"intensidade"},
];

const fasesResVelocidade = [
  {nome:"300/300",                  distKm:3.0, desc:"15' aquece + 5×300m forte /300m leve +10' leve", tipo:"res_vel"},
  {nome:"400F/200S blocos",         distKm:3.6, desc:"12' aquece + 6 blocos + 10' leve", tipo:"res_vel"},
  {nome:"Billat 30/30",             distKm:5.2, desc:"10' aquece + 3×(10×30\" forte/30\" leve) + 10' leve", tipo:"res_vel"},
  {nome:"Progressivo 600–400–200",  distKm:3.6, desc:"15' aquece + 3 séries (600/400/200) + 10' leve", tipo:"res_vel"},
  {nome:"Pirâmide inversa",         distKm:3.2, desc:"12' aquece + 800–600–400–200 + 3' pausa + 10' leve", tipo:"res_vel"},
  {nome:"12×200m /45s",             distKm:3.0, desc:"10' aquece + 12×200m (90%) 45\" trote + 10' leve", tipo:"res_vel"},
  {nome:"6×500m (90%)",             distKm:3.5, desc:"15' aquece + 6×500m 90% com 90\" leve + 10' leve", tipo:"res_vel"},
  {nome:"8×(300F+100L)",            distKm:3.2, desc:"10' aquece + 8×(300m 95% + 100m leve) + 10' leve", tipo:"res_vel"},
  {nome:"Blocos 200–300–400",       distKm:3.2, desc:"12' aquece + (4×200)+(3×300)+(2×400)+10' leve", tipo:"res_vel"},
  {nome:"1' forte / 1' leve",       distKm:5.0, desc:"10' aquece + 4×(6×1' forte/1' leve) + 10' leve", tipo:"res_vel"},
];

const fasesPotencia = [
  {nome:"Subida + Pliometria",      distKm:1.8, desc:"8×60m subida (6%) + 3c pliométricos + 10' leve", tipo:"potencia"},
  {nome:"Resistido (trenó/elástico)",distKm:1.6, desc:"6×30m resistido + 6×50m livres (90%)", tipo:"potencia"},
  {nome:"Plio horizontal + sprint", distKm:2.0, desc:"3×(10 saltos + 60m sprint)", tipo:"potencia"},
  {nome:"Acelera/Para/Retoma",      distKm:2.0, desc:"3×6×(40m acelera/10m para/retoma)", tipo:"potencia"},
  {nome:"Carga parcial 5%",         distKm:1.8, desc:"10×60m com leve sobrecarga", tipo:"potencia"},
  {nome:"Circuito força explosiva", distKm:1.6, desc:"3c: swing 10 + salto 10 + corrida 40m", tipo:"potencia"},
  {nome:"Mudança de direção",       distKm:1.9, desc:"4×6 sprints (20m ida/20m volta)", tipo:"potencia"},
  {nome:"Fartlek explosivo",        distKm:2.4, desc:"4×4' (20\" forte / 40\" moderado)", tipo:"potencia"},
  {nome:"Treino contrastado",       distKm:1.6, desc:"(agach 6rep 60%1RM → sprint 40m) ×6", tipo:"potencia"},
  {nome:"Passadas longas (overspeed)",distKm:2.0, desc:"6×100m foco amplitude (90%)", tipo:"potencia"},
];

/* ======= Estado sequencial por categoria ======= */
const seq = { vel:0, res:0, pot:0 };

/* ======= Regras de distribuição por nível ======= */
const regrasNivel = {
  iniciante: { velSemana:1, resSemana:1, potCadaNDias:14 },
  intermediario: { velSemana:1, resSemana:2, potCadaNDias:14 },
  avancado: { velSemana:2, resSemana:2, potCadaNDias:14, potPre:1 }, // 1 estímulo pré por semana
};

/* ======= Geração ======= */
function gerarPlano() {
  const provaKm = parseFloat(byId('distProva').value);
  const nivel = byId('perfil').value;
  const nTreinos = parseInt(byId('treinosSemana').value,10);
  const ritmoBaseSec = toSecPace(byId('ritmoMedio').value || "5:30");
  const esforco = parseInt(byId('esforco').value,10) || 7;
  const dias = (byId('dias').value || "ter,qui,sab,dom").split(",").map(s=>s.trim());
  const inicio = byId('inicio').value ? dayjs(byId('inicio').value) : dayjs();

  // Volume máximo da fase atual conforme nível
  let fator = 2.0;
  if (nivel==="iniciante") fator = 1.5;
  else if (nivel==="intermediario") fator = 2.0;
  else if (nivel==="avancado") fator = 2.5; // meio de 2–3×

  const volMaxKm = provaKm * fator; // <<< declarar apenas aqui (evita duplicação)

  // distribuição semanal pelas regras do nível
  const regra = regrasNivel[nivel];

  // ritmo alvo: varia 5–10% conforme esforço (mais esforço => ajuste menor)
  const varMin = 0.05, varMax = 0.10;
  const escala = 1 - (clamp(esforco,1,10)-1)/9; // 1..10 -> 1..0
  const varPct = varMin + (varMax-varMin)*escala; // entre 5% e 10%
  const ritmoForte = ritmoBaseSec*(1 - varPct);
  const ritmoLeve  = ritmoBaseSec*(1 + varPct*0.6);

  // Montagem dos treinos
  const semana = [];
  let distAcum = 0;
  let ultimoTipo = null;
  let ultimoHorario = null;

  for (let i=0; i<nTreinos; i++) {
    // decide categoria do dia respeitando frequência e espaçamento
    const diaNome = dias[i % dias.length] || `dia ${i+1}`;
    let treino = null;

    // prioridades por nível
    const precisaVel = countTipo(semana,'intensidade') < regra.velSemana;
    const precisaRes = countTipo(semana,'res_vel') < regra.resSemana;
    const precisaPot = (i===0) ? true : (dayDiff(ultimoHorario, inicio.add(i,'day')) >= (regra.potCadaNDias/7));

    // Seleção com regras simples e intervalo mínimo entre categorias
    if (precisaVel && gapOK(ultimoTipo,'intensidade',24)) {
      treino = pickSequencial('vel');
    } else if (precisaRes && gapOK(ultimoTipo,'res_vel',24)) {
      treino = pickSequencial('res');
    } else if (precisaPot && gapOK(ultimoTipo,'potencia',24)) {
      treino = pickSequencial('pot');
    } else {
      // rodagem leve (12h)
      treino = {nome:"Rodagem leve", tipo:"leve", distKm:rng(0.6,0.9)* (volMaxKm/nTreinos), desc:"Respiração controlada + técnica", leve:true};
    }

    // Ajuste de distância para respeitar volume
    let alvo = treino.distKm || (volMaxKm/nTreinos);
    if (distAcum + alvo > volMaxKm) alvo = Math.max(2, volMaxKm - distAcum); // evitar zero

    const pace = treino.leve ? ritmoLeve : ritmoForte;
    semana.push({
      dia: diaNome,
      nome: treino.nome,
      tipo: treino.tipo,
      distKm: round2(alvo),
      ritmo: paceStr(pace),
      desc: treino.desc
    });

    distAcum += alvo;
    ultimoTipo = treino.tipo;
    ultimoHorario = inicio.add(i,'day');
  }

  renderSemana(semana);
  plotSemana(semana);
  toast("Plano da semana gerado");
  beep(1100,110,"triangle",.08);
}

function pickSequencial(cat){
  if (cat==='vel') { const i = seq.vel % fasesVelocidadePura.length; seq.vel++; return fasesVelocidadePura[i]; }
  if (cat==='res') { const i = seq.res % fasesResVelocidade.length; seq.res++; return fasesResVelocidade[i]; }
  if (cat==='pot'){ const i = seq.pot % fasesPotencia.length; seq.pot++; return fasesPotencia[i]; }
}

function countTipo(arr,t){ return arr.filter(a=>a.tipo===t).length; }
function dayDiff(a,b){ if(!a||!b) return 99; return Math.abs(b.diff(a,'hour'))/24; }
function gapOK(ultimoTipo,tipo,horasMin){
  if (!ultimoTipo) return true;
  if (ultimoTipo===tipo) return false; // não repetir back-to-back
  return true; // intervalo temporal já garantido pelo espaçamento diário simples
}

function round2(n){ return Math.round(n*100)/100; }

/* ======= Render de cards (grid Netflix) ======= */
function renderSemana(semana){
  const grid = byId('card-grid'); grid.innerHTML = "";
  semana.forEach((t,idx)=>{
    const el = document.createElement('article');
    el.className = "card";
    el.innerHTML = `
      <div class="thumb"></div>
      <div class="body">
        <span class="badge">${t.dia}</span>
        <div class="title">${idx+1}. ${t.nome}</div>
        <div class="kv">Tipo: ${t.tipo.replace("_"," ")}</div>
        <div class="kv">Distância: <b>${t.distKm} km</b> • Ritmo: <b>${t.ritmo} min/km</b></div>
        <p class="kv">${t.desc || ""}</p>
      </div>
      <div class="body" style="border-top:1px solid var(--border); display:flex; gap:.5rem;">
        <button class="btn" onclick="copyCard(this)">Copiar</button>
        <button class="btn" onclick="screenshotCard(this)">Card</button>
      </div>
    `;
    grid.appendChild(el);
  });
}

/* ======= Gráfico ======= */
let chart;
function plotSemana(semana){
  const ctx = byId('chart');
  const labels = semana.map(s=>s.dia);
  const data = semana.map(s=>s.distKm);
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ label:'km', data, borderWidth:1 }]},
    options: { responsive:true, maintainAspectRatio:false, scales:{ y:{ beginAtZero:true } } }
  });
}

/* ======= PDF & Cards ======= */
async function screenshotCard(btn){
  const card = btn.closest('.card');
  const canvas = await html2canvas(card, {backgroundColor:null, scale:2});
  const a = document.createElement('a');
  a.download = `treino-${Date.now()}.png`;
  a.href = canvas.toDataURL("image/png");
  a.click();
  toast("Card gerado (PNG)");
  beep(900,90,"sawtooth",.06);
}

async function exportPDF(){
  const grid = byId('card-grid');
  if(!grid.children.length){ toast("Gere o plano primeiro"); return; }
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({unit:"pt", format:"a4"});
  let y = 40;
  pdf.setFontSize(14); pdf.text("MyFlowLife - Plano semanal", 40, y); y+=20;
  for (const card of grid.children) {
    const c = await html2canvas(card, {backgroundColor:"#ffffff", scale:2});
    const img = c.toDataURL("image/png");
    const w = 515, h = c.height*(w/c.width);
    if (y+h>800){ pdf.addPage(); y=40; }
    pdf.addImage(img,"PNG",40,y,w,h,"FAST");
    y += h+18;
  }
  pdf.save("plano-semanal.pdf");
  toast("PDF exportado");
  beep(1000,120,"triangle",.08);
}

/* ======= Testes automatizados mínimos ======= */
function runTests(){
  const as = [
    ["toSecPace 5:30", ()=>toSecPace("5:30")===330],
    ["paceStr 330",    ()=>paceStr(330)==="5:30"],
    ["Seq vel avança", ()=>{ const n=seq.vel; pickSequencial('vel'); return seq.vel===n+1; }],
    ["Sem var pace NaN", ()=>!isNaN(toSecPace("4:05"))]
  ];
  const fails = as.filter(a=>!a[1]());
  if (fails.length) toast("Testes falharam: "+fails.map(f=>f[0]).join(", "));
  else toast("Testes OK ("+as.length+")");
  beep(700,120,"square",.08);
}

/* ======= Toast ======= */
function toast(msg){
  const t = byId('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(()=> t.classList.remove('show'), 1800);
}

/* ======= Eventos V24 Revisados (IDs atualizados) ======= */
window.addEventListener('DOMContentLoaded', () => {
  console.log("🚀 app.js carregado com sucesso!");

  // Splash
  setTimeout(() => byId('splash')?.classList.add('hidden'), 900);

  // Define data de início
  if (byId('inicio') && !byId('inicio').value)
    byId('inicio').value = dayjs().format('YYYY-MM-DD');

  // Botões com novos IDs
  const map = {
    btnGerarPlano: gerarPlano,
    btnRodarTestes: runTests,
    btnExportarPDF: exportPDF,
    btnGerarCards: () =>
      screenshotCard(document.querySelector('#card-grid .card') || byId('card-grid')),
    btnResetar: () => {
      const grid = byId('card-grid');
      if (grid) grid.innerHTML = "";
      if (window.chart) chart.destroy();
      toast("Limpo");
    },
    btnPremium: () => {
      toast("Premium em breve ✨");
      beep(1200, 160, "triangle", 0.1);
    }
  };

  Object.entries(map).forEach(([id, fn]) => {
    const el = byId(id);
    if (el) el.addEventListener('click', fn);
    else console.warn(`⚠️ Botão ${id} não encontrado no DOM`);
  });

  console.log("⚡️ Gerador de Corrida V24 conectado com IDs atualizados");
});

