// scripts/treino.js — HÍBRIDO + Timers + Links
document.addEventListener('DOMContentLoaded', async () => {
  const id = localStorage.getItem('femflow_id');
  if (!id) { FEMFLOW.toast('⚠️ Faça login novamente.'); location.href='ciclo.html'; return; }

  const ok = localStorage.getItem('femflow_cycle_configured')==='yes' &&
             localStorage.getItem('femflow_startDate') &&
             localStorage.getItem('femflow_cycleLength');
  if (!ok) { FEMFLOW.toast('⚠️ Configure seu ciclo.'); location.href='ciclo.html'; return; }

  const track = document.getElementById("carouselTrack");
  const bar   = document.getElementById("progressBar");
  let current = 0;
  let boxes   = [];

  const moveTo = (dir) => {
    if (dir==='next' && current < boxes.length-1) { current++; navigator.vibrate?.([40]); }
    else if (dir==='prev' && current>0)           { current--; navigator.vibrate?.([20]); }
    track.style.transform = `translateX(-${current * 100}%)`;
    bar.style.width = `${((current + 1) / Math.max(1,boxes.length)) * 100}%`;
  };

  document.getElementById("nextBtn").addEventListener("click", () => moveTo("next"));
  document.getElementById("prevBtn").addEventListener("click", () => moveTo("prev"));

  // swipe
  let startX=0,endX=0; const sens=50;
  track.addEventListener("touchstart", e => startX = e.touches[0].clientX);
  track.addEventListener("touchmove",  e => endX   = e.touches[0].clientX);
  track.addEventListener("touchend",   () => {
    const diff = startX - endX;
    if (Math.abs(diff)>sens) moveTo(diff>0?'next':'prev');
  });

  // ---------- Timers util ----------
  const fmt = (s)=>`00:${String(Math.max(0,Math.floor(s))).padStart(2,'0')}`;
  const intervals = new WeakMap(); // div -> intervalId
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
  const pauseTimer = (el)=>{
    const id = intervals.get(el);
    if(id){ clearInterval(id); intervals.delete(el); }
    el.classList.remove('running');
  };
  const clearTimer = (el)=>{
    const id = intervals.get(el);
    if(id){ clearInterval(id); intervals.delete(el); }
  };
  const resetTimer = (el)=>{
    clearTimer(el);
    el.dataset.remain = el.dataset.total;
    el.classList.remove('running','done');
    el.textContent = fmt(Number(el.dataset.total||45));
  };
  const bindTimers = (root)=>{
    root.querySelectorAll('.subtimer').forEach(el=>{
      // init
      if(!el.dataset.total) el.dataset.total = el.textContent.replace(/\D/g,'')||'45';
      el.textContent = fmt(Number(el.dataset.total));
      // click = play/pause
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
      // long-press no mouse também
      let mouseHold; 
      el.addEventListener('mousedown', ()=>{ mouseHold=setTimeout(()=>{ resetTimer(el); navigator.vibrate?.([15,40]); },600); });
      el.addEventListener('mouseup',   ()=> clearTimeout(mouseHold));
      el.addEventListener('mouseleave',()=> clearTimeout(mouseHold));
    });
  };

  // --------- Links util (normaliza YouTube / URLs simples) ----------
  const normLink = (u)=>{
    if(!u) return '';
    let s=String(u).trim();
    if(/^youtu\.be\//i.test(s)) s = 'https://' + s;
    if(/^www\.youtube\.com\/watch/i.test(s)) s = 'https://' + s;
    if(/^http/i.test(s)) return s;
    if(/^(youtu\.be|youtube\.com)\b/i.test(s)) return 'https://' + s;
    return /^[-\w]+(\.[-\w]+)+/.test(s) ? 'https://' + s : s;
  };

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
    if (box.tipo === "hiit") {
      return `<div class="hiit">
        <b>${box.titulo}</b><br>${box.descricao||box.protocolo||''}<br>
        <small><i>🔥 Potência Feminina</i></small>
      </div>`;
    }
    if (box.tipo === "cardio") {
      return `<div class="cardio"><b>${box.titulo}</b><br>${box.descricao||''}</div>`;
    }
    if (box.tipo === "resfriamento") {
      return `<div class="box resfriamento"><h3>${box.titulo}</h3><p>${box.mensagem}</p></div>`;
    }
    return "";
  };

  const render = (lista) => {
    boxes = lista;
    track.innerHTML = boxes.map(b => `<div class="carousel-item">${criarBoxHTML(b)}</div>`).join("");
    current = 0;
    moveTo('stay');
    bindTimers(track); // <- ativa timers nos itens renderizados
  };

  // ---- Backend: Apps Script (fase/dia/regras e origem) ----
  const url = `${FEMFLOW.SCRIPT_URL}?action=treino&id=${encodeURIComponent(id)}`;
  let j = null;
  try { j = await fetch(url).then(r=>r.json()); } catch(e){ FEMFLOW.toast('Falha ao carregar treino.'); console.warn(e); }

  if (!j || j.status==='id_not_found') {
    render([{ tipo:'texto', titulo:'Sem treino', mensagem:'Não localizei seu perfil. Faça login novamente.' }]);
    return;
  }

  // Base (Box 0)
  const lista = [];
  if (Array.isArray(j.boxes)) {
    const box0 = j.boxes.find(b=>b.tipo==='texto');
    if (box0) lista.push(box0);
  } else {
    lista.push({ tipo:'texto', titulo:'Box 0 — Conexão Inicial 🌸', mensagem:`Respire e alinhe intenção: ${j?.regras?.foco||'força'}. Hidratação + técnica.` });
  }

  // Origem dos exercícios
 if (j.exSource === 'firebase' && j.firebaseQuery) {
  const { nivel, fase, diaKey } = j.firebaseQuery;

  // 1) Buscar no Firebase: pode vir "caixas prontas" OU "lista plana"
  let raw = [];
  try {
    raw = await FEMFLOW.buscarExerciciosFirebase(nivel, fase, diaKey);
  } catch(e) {
    console.warn('Firebase falhou, usando fallback vazio', e);
    raw = [];
  }

  // 2) Sugestões do backend (fallback quando faltar dado)
  const sugSeries  = j?.faixasExtras?.find(f=>f.kind==='boxHeader')?.sugestaoSeries ?? 3;
  const sugTempo   = j?.faixasExtras?.find(f=>f.kind==='boxHeader')?.sugestaoIntervalo ?? 45;
  const sugRepsMax = j?.faixasExtras?.find(f=>f.kind==='boxHeader')?.sugestaoRepsMax ?? 15;

  // 3) Normalizadores
  const normLink = (u)=>{
    if(!u) return '';
    let s=String(u).trim();
    if(/^youtu\.be\//i.test(s)) s = 'https://' + s;
    if(/^www\.youtube\.com\/watch/i.test(s)) s = 'https://' + s;
    if(/^http/i.test(s)) return s;
    if(/^(youtu\.be|youtube\.com)\b/i.test(s)) return 'https://' + s;
    return /^[-\w]+(\.[-\w]+)+/.test(s) ? 'https://' + s : s;
  };
  const toInt = (v)=> {
    if (v==null) return null;
    const s = String(v).trim();
    const m = s.match(/^\d+/); // pega inicio numérico
    return m ? Number(m[0]) : null;
  };
  const toReps = (v)=> {
    if (v==null) return null;
    const s = String(v).trim();
    // aceita "8-12", "10", "10–12"
    return s.replace(/[–—]/g,'-'); // traço longo → '-'
  };

  // 4) Detecta formato:
  //    a) Caixas prontas: [{ titulo, itens:[...] }]
  const isBoxes = Array.isArray(raw) && raw.length && Array.isArray(raw[0]?.itens);

  //    b) Lista plana de exercícios: [{ box, titulo, series, reps, link, ... }]
  if (isBoxes) {
    // já vem pronto — só normaliza links/valores faltantes
    raw.forEach((box, idx) => {
      const itens = (box.itens||[]).map(ex => ({
        exercicio: ex.exercicio || ex.titulo || ex.nome || 'Exercício',
        link: normLink(ex.link || ex.url || ex.video || ''),
        series: ex.series ?? sugSeries,
        reps: ex.reps ?? sugRepsMax,
        tempo: ex.tempo ?? sugTempo
      }));
      lista.push({ tipo:'exercicios', titulo: box.titulo || `Box ${idx+1}`, itens });

      // HIIT/Cardio planejados
      const fx = (j.faixasExtras||[]).filter(f=>f.kind==='hiit' || f.kind==='cardio');
      if (fx.length && idx < fx.length) {
        const f = fx[idx];
        if (f.kind==='hiit')   lista.push({ tipo:'hiit',   titulo:f.titulo,  descricao:f.protocolo, tempo_total:f.tempo_total||360 });
        if (f.kind==='cardio') lista.push({ tipo:'cardio', titulo:f.titulo,  descricao:f.descricao, tempo_total:f.tempo_total||600 });
      }
    });

  } else {
    // LISTA PLANA → agrupar por 'box'
    const byBox = new Map();
    raw.forEach(doc => {
      const boxName = (doc.box || 'Box 1').toString();
      if (!byBox.has(boxName)) byBox.set(boxName, []);
      byBox.get(boxName).push(doc);
    });

    // Ordena boxes por número (Box 1, Box 2, ...)
    const extractNum = (s)=> {
      const m = String(s).match(/(\d+)/);
      return m ? Number(m[1]) : 9999;
    };
    const ordered = [...byBox.entries()].sort((a,b)=> extractNum(a[0]) - extractNum(b[0]));

    ordered.forEach(([boxName, arr], idx) => {
      const itens = arr.map(ex => ({
        exercicio: ex.titulo || ex.nome || 'Exercício',
        link: normLink(ex.link || ex.url || ex.video || ''),
        series: toInt(ex.series) ?? sugSeries,
        reps: toReps(ex.reps) ?? sugRepsMax,   // mantém "8-12" se vier string
        tempo: toInt(ex.tempo) ?? sugTempo
      }));

      lista.push({ tipo:'exercicios', titulo: boxName || `Box ${idx+1}`, itens });

      // HIIT/Cardio planejados (alinha por índice do box)
      const fx = (j.faixasExtras||[]).filter(f=>f.kind==='hiit' || f.kind==='cardio');
      if (fx.length && idx < fx.length) {
        const f = fx[idx];
        if (f.kind==='hiit')   lista.push({ tipo:'hiit',   titulo:f.titulo,  descricao:f.protocolo, tempo_total:f.tempo_total||360 });
        if (f.kind==='cardio') lista.push({ tipo:'cardio', titulo:f.titulo,  descricao:f.descricao, tempo_total:f.tempo_total||600 });
      }
    });
  }
}


    const sugSeries  = j?.faixasExtras?.find(f=>f.kind==='boxHeader')?.sugestaoSeries ?? 3;
    const sugTempo   = j?.faixasExtras?.find(f=>f.kind==='boxHeader')?.sugestaoIntervalo ?? 45;
    const sugRepsMax = j?.faixasExtras?.find(f=>f.kind==='boxHeader')?.sugestaoRepsMax ?? 15;

    caixas.forEach((box, idx) => {
      lista.push({
        tipo:'exercicios',
        titulo: box.titulo || `Box ${idx+1} — ${j.regras?.foco ? j.regras.foco.toUpperCase() : 'FemFlow'}`,
        itens: (box.itens||[]).map(ex => ({
          exercicio: ex.exercicio || ex.nome || 'Exercício',
          link: normLink(ex.link || ex.url || ''),
          series: ex.series ?? sugSeries,
          reps: ex.reps ?? sugRepsMax,
          tempo: ex.tempo ?? sugTempo
        }))
      });
      const fx = (j.faixasExtras||[]).filter(f=>f.kind==='hiit' || f.kind==='cardio');
      if (fx.length && idx < fx.length) {
        const f = fx[idx];
        if (f.kind==='hiit')   lista.push({ tipo:'hiit',   titulo:f.titulo,  descricao:f.protocolo, tempo_total:f.tempo_total||360 });
        if (f.kind==='cardio') lista.push({ tipo:'cardio', titulo:f.titulo,  descricao:f.descricao, tempo_total:f.tempo_total||600 });
      }
    });

  } else {
    (j.boxes||[]).forEach(b => {
      if (b.tipo==='exercicios' || b.tipo==='hiit' || b.tipo==='cardio') {
        // normaliza links do legado
        if (Array.isArray(b.itens)) b.itens = b.itens.map(ex => ({ ...ex, link: normLink(ex.link||'') }));
        lista.push(b);
      }
    });
  }

  // Box final
  lista.push({ tipo:'resfriamento', titulo:'🌿 Box Final — Respiração e Alongamento', mensagem:'Respire 4–4 e alongamento leve dos quadris/ombros.' });

  render(lista);

  // ===== Ações: Salvar / Descanso (PSE) =====
  document.getElementById('salvarTreinoBtn')?.addEventListener('click', async () => {
    FEMFLOW.abrirPSE(async (pse) => {
      await FEMFLOW.salvarTreino({
        id,
        fase: j.fase || localStorage.getItem('fase_sugerida') || 'desconhecida',
        treino: 'dia',
        tipo_dia: 'treino',
        pse
      });
      FEMFLOW.toast('✅ Treino salvo!');
    });
  });

  document.getElementById('descansoBtn')?.addEventListener('click', async () => {
    const fase = j.fase || localStorage.getItem('fase_sugerida') || 'desconhecida';
    await FEMFLOW.salvarDescanso(fase);
    FEMFLOW.toast('🌿 Descanso registrado!');
  });
});
