// scripts/treino.js — HÍBRIDO + Timers + Firebase + Contador de Programa

document.addEventListener('DOMContentLoaded', async () => {

  // -------- Verificações de login e ciclo --------
  const id = localStorage.getItem('femflow_id');
  if (!id) { FEMFLOW.toast('⚠️ Faça login.'); location.href='index.html?ret=treino.html'; return; }

  const ok = localStorage.getItem('femflow_cycle_configured')==='yes' &&
             localStorage.getItem('femflow_startDate') &&
             localStorage.getItem('femflow_cycleLength');
  if (!ok) { FEMFLOW.toast('⚠️ Configure seu ciclo.'); location.href='ciclo.html'; return; }

  // -------- Inicializações --------
  const track = document.getElementById("carouselTrack");
  const bar   = document.getElementById("progressBar");
  let current = 0;
  let boxes   = [];

  // -------- Dia do Programa --------
  const diaTreino = Number(localStorage.getItem("femflow_dia_treino") || 1);
  if (document.getElementById("tituloDiaTreino")) {
    document.getElementById("tituloDiaTreino").textContent = `Dia ${diaTreino} do Programa`;
  } else {
    console.warn("⚠️ Elemento #tituloDiaTreino não encontrado no HTML");
  }

  // -------- Navegação entre boxes --------
  const moveTo = (dir) => {
    if (dir==='next' && current < boxes.length-1) { current++; navigator.vibrate?.([40]); }
    else if (dir==='prev' && current>0)           { current--; navigator.vibrate?.([20]); }
    track.style.transform = `translateX(-${current * 100}%)`;
    bar.style.width = `${((current + 1) / Math.max(1,boxes.length)) * 100}%`;
  };
  document.getElementById("nextBtn")?.addEventListener("click", () => moveTo("next"));
  document.getElementById("prevBtn")?.addEventListener("click", () => moveTo("prev"));

  // -------- Swipe para mobile --------
  let startX=0,endX=0; const sens=50;
  track.addEventListener("touchstart", e => startX = e.touches[0].clientX);
  track.addEventListener("touchmove",  e => endX   = e.touches[0].clientX);
  track.addEventListener("touchend",   () => {
    const diff = startX - endX;
    if (Math.abs(diff)>sens) moveTo(diff>0?'next':'prev');
  });

  // -------- Timers --------
  const fmt = (s)=>`00:${String(Math.max(0,Math.floor(s))).padStart(2,'0')}`;
  const intervals = new WeakMap();
  const startTimer = (el) => {
    clearTimer(el);
    let remain = Number(el.dataset.remain ?? el.dataset.total ?? 45);
    el.dataset.remain = remain;
    el.classList.add('running');
    el.textContent = fmt(remain);
    const id = setInterval(()=>{
      remain -= 1;
      el.dataset.remain = remain;
      el.textContent = fmt(remain);
      if(remain<=0){
        clearInterval(id);
        el.classList.remove('running');
        el.classList.add('done');
        navigator.vibrate?.([60,40,60]);
      }
    },1000);
    intervals.set(el,id);
  };
  const pauseTimer = (el)=>{ const id = intervals.get(el); if(id){ clearInterval(id); intervals.delete(el); } el.classList.remove('running'); };
  const clearTimer = (el)=>{ const id = intervals.get(el); if(id){ clearInterval(id); intervals.delete(el); } };
  const resetTimer = (el)=>{ clearTimer(el); el.dataset.remain = el.dataset.total; el.classList.remove('running','done'); el.textContent = fmt(Number(el.dataset.total||45)); };
  const bindTimers = (root)=>{
    root.querySelectorAll('.subtimer').forEach(el=>{
      if(!el.dataset.total) el.dataset.total = el.textContent.replace(/\D/g,'')||'45';
      el.textContent = fmt(Number(el.dataset.total));
      let pressT=null;
      el.addEventListener('touchstart', ()=>{ pressT = Date.now(); }, {passive:true});
      el.addEventListener('touchend', ()=>{
        const held = Date.now()-pressT;
        if(held>550){ resetTimer(el); navigator.vibrate?.([15,40]); return; }
        if(el.classList.contains('running')) pauseTimer(el); else startTimer(el);
      });
      el.addEventListener('click', ()=>{
        if(el.classList.contains('running')) pauseTimer(el); else startTimer(el);
      });
      let mouseHold; 
      el.addEventListener('mousedown', ()=>{ mouseHold=setTimeout(()=>{ resetTimer(el); navigator.vibrate?.([15,40]); },600); });
      el.addEventListener('mouseup',   ()=> clearTimeout(mouseHold));
      el.addEventListener('mouseleave',()=> clearTimeout(mouseHold));
    });
  };

  // -------- Normalização de links --------
  const normLink = (u)=>{
    if(!u) return '';
    let s=String(u).trim();
    if(/^youtu\.be\//i.test(s)) s = 'https://' + s;
    if(/^www\.youtube\.com\/watch/i.test(s)) s = 'https://' + s;
    if(/^http/i.test(s)) return s;
    if(/^(youtu\.be|youtube\.com)\b/i.test(s)) return 'https://' + s;
    return /^[-\w]+(\.[-\w]+)+/.test(s) ? 'https://' + s : s;
  };

  // -------- Renderização dos boxes --------
  const criarBoxHTML = (box) => {
    if (box.tipo === "texto") {
      return `<div class="box texto"><h3>${box.titulo}</h3><p>${box.mensagem}</p></div>`;
    }
    if (box.tipo === "exercicios") {
      return `<div class="box treino">
        <h3>${box.titulo}</h3>
        ${box.itens.map(e => {
          const link = normLink(e.link || e.url);
          return `
          <div class="ex">
            <div class="ex-head">
              <b>${e.exercicio}</b>
              ${link ? `<a href="${link}" target="_blank" rel="noopener noreferrer" class="vid">🎥</a>` : ''}
            </div>
            <div class="ex-grid">
              <label>Séries</label><input value="${e.series ?? ''}" inputmode="numeric">
              <label>Reps</label><input value="${e.reps ?? ''}" inputmode="numeric">
              <label>Timer</label>
              <div class="subtimer" data-total="${e.tempo ?? 45}">${fmt(e.tempo ?? 45)}</div>
            </div>
          </div>`;
        }).join("")}
      </div>`;
    }
    if (box.tipo === "hiit") return `<div class="hiit"><b>${box.titulo}</b><br>${box.descricao||box.protocolo||''}<br><small><i>🔥 Potência Feminina</i></small></div>`;
    if (box.tipo === "cardio") return `<div class="cardio"><b>${box.titulo}</b><br>${box.descricao||''}</div>`;
    if (box.tipo === "resfriamento") return `<div class="box resfriamento"><h3>${box.titulo}</h3><p>${box.mensagem}</p></div>`;
    return "";
  };

  const render = (lista) => {
    boxes = lista;
    track.innerHTML = boxes.map(b => `<div class="carousel-item">${criarBoxHTML(b)}</div>`).join("");
    current = 0;
    moveTo('stay');
    bindTimers(track);
  };
   const enfase = localStorage.getItem('femflow_enfase') || 'geral';
// ===== Fallback de segurança =====
if(!localStorage.getItem("fase_sugerida")) localStorage.setItem("fase_sugerida","folicular");
if(!localStorage.getItem("nivel_atual")) localStorage.setItem("nivel_atual","iniciante");
if(!localStorage.getItem("femflow_enfase")) localStorage.setItem("femflow_enfase","geral");
if(!localStorage.getItem("dia_ciclo")) localStorage.setItem("dia_ciclo","1");
  // -------- Backend: Apps Script --------
 
  const url = `${FEMFLOW.SCRIPT_URL}?action=treino&id=${encodeURIComponent(id)}&enfase=${encodeURIComponent(enfase)}`;
let j = null;
try {
  const resp = await fetch(url);
  const txt = await resp.text();
  console.log("📡 Resposta bruta Apps Script:", txt.slice(0,200));

  try {
    j = JSON.parse(txt);
  } catch {
    FEMFLOW.toast("❌ Resposta inválida do servidor.");
    console.warn("Resposta não era JSON:", txt.slice(0,150));
  }
} catch(e) {
  FEMFLOW.toast("⚠️ Falha de rede ao carregar treino.");
  console.error("Erro detalhado:", e);
}

  
  if (!j || j.status==='id_not_found') {
    render([{ tipo:'texto', titulo:'Sem treino', mensagem:'Não localizei seu perfil. Faça login novamente.' }]);
    return;
  }

  // -------- Fallback local se Firebase não vier configurado --------
  if (!j.exSource && localStorage.getItem('femflow_id')) {
    const faseLocal = localStorage.getItem("fase_sugerida") || "folicular";
    const nivelLocal = localStorage.getItem("nivel_atual") || "iniciante";
    const enfaseLocal = localStorage.getItem("femflow_enfase") || "geral";
    const diaCiclo = localStorage.getItem("dia_ciclo") || "1";

    j.exSource = "firebase";
    j.firebaseQuery = { nivel: nivelLocal, fase: faseLocal.toLowerCase(), diaKey: `dia_${diaCiclo}`, enfase: enfaseLocal.toLowerCase() };
    console.log("⚙️ Forçando leitura direta do Firebase:", j.firebaseQuery);
  }

  // -------- Carrega exercícios (Firebase) --------
  const lista = [];
  if (Array.isArray(j.boxes)) {
    const box0 = j.boxes.find(b=>b.tipo==='texto');
    if (box0) lista.push(box0);
  }

  if (j.exSource === 'firebase' && j.firebaseQuery) {
    const { nivel, fase, diaKey, enfase } = j.firebaseQuery;
    let raw = [];
    try { raw = await FEMFLOW.buscarExerciciosFirebase(nivel, fase, diaKey, enfase); } 
    catch(e) { console.warn('Firebase falhou, fallback', e); }

    const sugSeries = j?.faixasExtras?.[0]?.sugestaoSeries ?? 3;
    const sugTempo = j?.faixasExtras?.[0]?.sugestaoIntervalo ?? 45;
    const sugRepsMax = j?.faixasExtras?.[0]?.sugestaoRepsMax ?? 15;

    if (raw.length) {
      const byBox = new Map();
      raw.forEach(doc => {
        const boxName = (doc.box || 'Box 1').toString();
        if (!byBox.has(boxName)) byBox.set(boxName, []);
        byBox.get(boxName).push(doc);
      });

      const extractNum = (s)=> Number((String(s).match(/(\d+)/)||[0,999])[1]);
      const ordered = [...byBox.entries()].sort((a,b)=> extractNum(a[0]) - extractNum(b[0]));

      ordered.forEach(([boxName, arr])=>{
        const itens = arr.map(ex=>({
          exercicio: ex.titulo || ex.nome || 'Exercício',
          link: normLink(ex.link || ex.url || ex.video || ''),
          series: ex.series ?? sugSeries,
          reps: ex.reps ?? sugRepsMax,
          tempo: ex.tempo ?? sugTempo
        }));
        lista.push({ tipo:'exercicios', titulo: boxName, itens });
      });
    }
  }

  lista.push({ tipo:'resfriamento', titulo:'🌿 Box Final — Respiração e Alongamento', mensagem:'Respire 4–4 e alongamento leve dos quadris/ombros.' });
  render(lista);
// -------- SALVAR TREINO --------
document.getElementById('salvarTreinoBtn')?.addEventListener('click', async () => {
  FEMFLOW.abrirPSE(async (pse) => {
    await FEMFLOW.salvarTreino({
      id,
      fase: j.fase || localStorage.getItem('fase_sugerida') || 'desconhecida',
      treino: 'dia',
      tipo_dia: 'treino',
      pse
    });

    // 🌿 Avança o dia do programa
    let prog = Number(localStorage.getItem("femflow_dia_treino") || 1);
    if (prog < 30) {
      localStorage.setItem("femflow_dia_treino", String(prog + 1));
      FEMFLOW.toast(`✅ Treino salvo! Próximo: Dia ${prog + 1}`);
    } else {
      FEMFLOW.toast("🎉 Programa de 30 dias concluído!");
    }
  });
});

// -------- SALVAR DESCANSO --------
document.getElementById('descansoBtn')?.addEventListener('click', async () => {
  const fase = j.fase || localStorage.getItem('fase_sugerida') || 'desconhecida';
  await FEMFLOW.salvarDescanso(fase);

  // 🧩 Incrementa o dia do programa mesmo em descanso
  let prog = Number(localStorage.getItem("femflow_dia_treino") || 1);
  if (prog < 30) {
    localStorage.setItem("femflow_dia_treino", String(prog + 1));
    FEMFLOW.toast(`🌿 Descanso registrado. Próximo: Dia ${prog + 1}`);
  } else {
      } else {
    FEMFLOW.toast("🎉 Programa de 30 dias concluído!");
  }
});

// ✅ fecha o bloco principal do DOMContentLoaded
});
