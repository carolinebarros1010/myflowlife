// scripts/treino.js (HÍBRIDO Apps Script + Firebase)
document.addEventListener('DOMContentLoaded', async () => {
  const id = localStorage.getItem('femflow_id');
  if (!id) { FEMFLOW.toast('⚠️ Faça login novamente.'); location.href='ciclo.html'; return; }

  // Guard de ciclo (igual usamos no Flow Center)
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

  const criarBoxHTML = (box) => {
    if (box.tipo === "texto") {
      return `<div class="box texto"><h3>${box.titulo}</h3><p>${box.mensagem}</p></div>`;
    }
    if (box.tipo === "exercicios") {
      return `<div class="box treino">
        <h3>${box.titulo}</h3>
        ${box.itens.map(e => `
          <div class="ex">
            <div class="ex-head"><b>${e.exercicio}</b>${e.link ? `<a href="${e.link}" target="_blank">🎥</a>` : ''}</div>
            <div class="ex-grid">
              <label>Séries</label><input value="${e.series ?? ''}">
              <label>Reps</label><input value="${e.reps ?? ''}">
              <label>Timer</label>
              <div class="subtimer" data-total="${e.tempo ?? 45}">
                00:${String(e.tempo ?? 45).padStart(2,"0")}
              </div>
            </div>
          </div>`).join("")}
      </div>`;
    }
    if (box.tipo === "hiit") {
      return `<div class="hiit">
        <b>${box.titulo}</b><br>${box.descricao}<br>
        <small><i>🔥 Potência Feminina</i></small>
      </div>`;
    }
    if (box.tipo === "cardio") {
      return `<div class="cardio">
        <b>${box.titulo}</b><br>${box.descricao}
      </div>`;
    }
    if (box.tipo === "resfriamento") {
      return `<div class="box resfriamento">
        <h3>${box.titulo}</h3>
        <p>${box.mensagem}</p>
      </div>`;
    }
    return "";
  };

  const render = (lista) => {
    boxes = lista;
    track.innerHTML = boxes.map(b => `<div class="carousel-item">${criarBoxHTML(b)}</div>`).join("");
    current = 0;
    moveTo('stay');
  };

  // ---- Backend: Apps Script -> define fase/dia/regras e origem dos exercícios ----
  const url = `${FEMFLOW.SCRIPT_URL}?action=treino&id=${encodeURIComponent(id)}`;
  let j = null;
  try { j = await fetch(url).then(r=>r.json()); } catch(e){ FEMFLOW.toast('Falha ao carregar treino.'); console.warn(e); }

  // fallback seguro
  if (!j || j.status==='id_not_found') {
    render([{ tipo:'texto', titulo:'Sem treino', mensagem:'Não localizei seu perfil. Faça login novamente.' }]);
    return;
  }

  // Começo padrão (Box 0)
  const lista = [];
  if (Array.isArray(j.boxes)) {
    // inclui Box 0 do backend quando existir
    const box0 = j.boxes.find(b=>b.tipo==='texto');
    if (box0) lista.push(box0);
  } else {
    lista.push({ tipo:'texto', titulo:'Box 0 — Conexão Inicial 🌸', mensagem:`Respire e alinhe intenção: ${j?.regras?.foco||'força'}. Hidratação + técnica.` });
  }

  // ---- Origem dos exercícios ----
  if (j.exSource === 'firebase' && j.firebaseQuery) {
    const { nivel, fase, diaKey } = j.firebaseQuery;
    // 1) baixar exercícios do Firebase
    let caixas = [];
    try {
      caixas = await FEMFLOW.buscarExerciciosFirebase(nivel, fase, diaKey);
      // Esperado: [{titulo?, itens:[{exercicio, series?, reps?, tempo?, link?}]}...]
    } catch(e) {
      console.warn('Firebase falhou, usando fallback vazio', e);
      caixas = [];
    }

    // 2) Aplicar sugestões (séries/tempo) se vierem faltando
    const sugSeries  = j?.faixasExtras?.find(f=>f.kind==='boxHeader')?.sugestaoSeries ?? 3;
    const sugTempo   = j?.faixasExtras?.find(f=>f.kind==='boxHeader')?.sugestaoIntervalo ?? 45;
    const sugRepsMax = j?.faixasExtras?.find(f=>f.kind==='boxHeader')?.sugestaoRepsMax ?? 15;

    caixas.forEach((box, idx) => {
      lista.push({
        tipo:'exercicios',
        titulo: box.titulo || `Box ${idx+1} — ${j.regras?.foco ? j.regras.foco.toUpperCase() : 'FemFlow'}`,
        itens: (box.itens||[]).map(ex => ({
          exercicio: ex.exercicio || ex.nome || 'Exercício',
          link: ex.link || '',
          series: ex.series ?? sugSeries,
          reps: ex.reps ?? sugRepsMax,
          tempo: ex.tempo ?? sugTempo
        }))
      });
      // Inserção das faixas extras (HIIT/Cardio) planejadas
      const faixas = (j.faixasExtras||[]).filter(f => f.kind==='hiit' || f.kind==='cardio');
      if (faixas.length && idx < faixas.length) {
        const f = faixas[idx];
        if (f.kind==='hiit')   lista.push({ tipo:'hiit',   titulo:f.titulo,  descricao:f.protocolo, tempo_total:f.tempo_total||360 });
        if (f.kind==='cardio') lista.push({ tipo:'cardio', titulo:f.titulo,  descricao:f.descricao, tempo_total:f.tempo_total||600 });
      }
    });

  } else {
    // legado (planilha): já vem com itens prontos
    (j.boxes||[]).forEach(b => {
      if (b.tipo==='exercicios' || b.tipo==='hiit' || b.tipo==='cardio') lista.push(b);
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
