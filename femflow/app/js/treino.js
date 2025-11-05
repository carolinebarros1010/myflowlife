document.addEventListener("DOMContentLoaded", async () => {
  const id = localStorage.getItem("femflow_id");
  if (!id) { FEMFLOW.toast("⚠️ Faça login novamente."); location.href="ciclo.html"; return; }

  const ok = localStorage.getItem('femflow_cycle_configured')==='yes' &&
             localStorage.getItem('femflow_startDate') &&
             localStorage.getItem('femflow_cycleLength');
  if (!ok) { FEMFLOW.toast("⚠️ Configure seu ciclo."); location.href="ciclo.html"; return; }

  try{
    // contexto do dia
    const fase   = (localStorage.getItem("fase_atual")   || "folicular").toLowerCase();
    const nivel  = (localStorage.getItem("nivel_atual")  || "iniciante").toLowerCase();
    const enfase = (localStorage.getItem("enfase_atual") || "gluteo").toLowerCase();
    const diaNum = Number(localStorage.getItem("dia_ciclo") || 1);
    const diaKey = `dia_${diaNum}`;

    console.log(`📡 Firestore: ${nivel}_${enfase} / ${fase} / ${diaKey}`);

    // busca no Firestore já agrupado por Box
    const boxes = await FEMFLOW.buscarExerciciosFirebase(nivel, fase, diaKey, enfase);

    // se vazio → feedback elegante
    const container = document.getElementById("containerTreino");
    container.innerHTML = "";
    if(!boxes || boxes.length===0){
      const msg = document.createElement("div");
      msg.className = "box";
      msg.innerHTML = `<h2>Sem treino cadastrado</h2>
        <p class="motivacional">Não encontramos exercícios para ${nivel}_${enfase} • ${fase} • ${diaKey}.
        Tente mudar a ênfase ou verifique a importação.</p>`;
      container.appendChild(msg);
      return;
    }

    // cabeçalho do dia
    const head = document.createElement("div");
    head.className="box";
    head.innerHTML = `
      <h2>🌸 ${fase.toUpperCase()} • ${capitalizar(nivel)} • Ênfase: ${enfase}</h2>
      <p class="motivacional">Dia ${diaNum} — foque em técnica, respiração e intenção nas concêntricas.</p>
      <div class="mini">Caminho: exercicios/${nivel}_${enfase}/fases/${fase}/dias/${diaKey}/exercicios</div>
    `;
    container.appendChild(head);

    // aquecimento rápido (timer global opcional)
    const warm = document.createElement("div");
    warm.className="box";
    warm.innerHTML = `<h2>Box 0 — Aquecimento e Mobilidade (5 min)</h2>
      <p class="mini">Prepare articulações e padrão respiratório 4x4.</p>`;
    warm.appendChild(criarTimerGlobal(300,"⏱️ Timer iniciado","✨ Aquecimento concluído"));
    container.appendChild(warm);

    // render dos boxes vindos do Firestore
    boxes.forEach(box=>{
      const div = document.createElement("div");
      div.className = "box";
      div.innerHTML = `<h2>${box.titulo}</h2>`;

      if(Array.isArray(box.itens)){
        box.itens.forEach((ex,i)=>{
          const linkHtml = ex.link ? ` <a class="video" href="${ex.link}" target="_blank" rel="noopener">🎥</a>` : "";
          const item = document.createElement("div");
          item.className = "exercicio";
          item.innerHTML = `
            <h4>${i+1}. ${escapeHtml(ex.titulo || ex.exercicio || "Exercício")}${linkHtml}</h4>
            <p>🔁 ${ex.series || "-"} séries × ${ex.reps || "-"} reps  •  ${ex.grupo ? `<span class="mini">${ex.grupo}</span>`:""}</p>
          `;
          item.appendChild(criarTimerDescanso(Number(ex.tempo)||60));
          div.appendChild(item);
        });
      }

      container.appendChild(div);
    });

    // resfriamento + PSE + salvar
    const endBox = document.createElement("div");
    endBox.className="box";
    endBox.innerHTML = `<h2>🌿 Box Final — Respiração e Alongamento</h2>
      <div class="mini">2–3 minutos respirando 4–4 + alongamentos leves.</div>`;

    // PSE
    const pseWrap=document.createElement("div");
    pseWrap.innerHTML = `
      <h3 style="margin-top:.6rem;color:var(--teal);font-family:'Playfair Display',serif;">Esforço Percebido (0–10)</h3>
      <input type="range" id="pseInput" min="0" max="10" value="5" style="width:100%;accent-color:var(--terracota)">
      <p id="pseLabel" class="mini" style="font-weight:700;color:var(--pessego)">PSE: 5 — Moderado</p>
    `;
    endBox.appendChild(pseWrap);

    const range=pseWrap.querySelector("#pseInput");
    const label=pseWrap.querySelector("#pseLabel");
    range.addEventListener("input",()=>{
      const v=parseInt(range.value,10);
      const cor = v<=3 ? "var(--teal)" : v<=7 ? "var(--pessego)" : "var(--terracota)";
      const txt = v<=3 ? "Leve e confortável" : v<=7 ? "Moderado e consistente" : "Alto esforço — recupere bem";
      label.style.color=cor; label.textContent=`PSE: ${v} — ${txt}`;
    });

    // botão salvar
    const salvar=document.createElement("button");
    salvar.className="btn";
    salvar.textContent="💾 Encerrar Treino";
    salvar.addEventListener("click", async ()=>{
      const pseVal=parseInt(range.value,10);
      await FEMFLOW.salvarTreino({
        id,
        fase,
        treino:`Dia ${diaNum} - ${fase} (${nivel}_${enfase})`,
        tipo_dia:"treino",
        pse:pseVal,
        observacao:`PSE ${pseVal} (${label.textContent.split("—")[1]?.trim()||""})`
      });
      FEMFLOW.toast("✅ Treino salvo!");
      vibrarFim();
      setTimeout(()=>location.href="flowcenter.html",1400);
    });
    endBox.appendChild(salvar);

    container.appendChild(endBox);

  }catch(err){
    console.error("Erro ao carregar treino:", err);
    FEMFLOW.toast("❌ Erro ao carregar dados.");
  }

  /* ------- helpers ------- */
  function criarTimerGlobal(tempoInicial, msgStart, msgEnd){
    const wrap=document.createElement("div"); wrap.className="timer-global";
    let t=tempoInicial, ativo=false, int=null; wrap.textContent=formatar(t);
    wrap.addEventListener("click",()=>{
      if(!ativo){
        ativo=true; FEMFLOW.toast(msgStart);
        int=setInterval(()=>{ t--; wrap.textContent=formatar(t);
          if(t<=0){ clearInterval(int); ativo=false; vibrarFim(); FEMFLOW.toast(msgEnd); }
        },1000);
      }else{ clearInterval(int); ativo=false; t=tempoInicial; wrap.textContent=formatar(t); FEMFLOW.toast("🔁 Timer reiniciado"); }
    });
    return wrap;
  }
  function criarTimerDescanso(seg=60){
    const btn=document.createElement("div"); btn.className="timer-descanso"; let t=seg, ativo=false, int=null; btn.textContent=t;
    btn.addEventListener("click",()=>{
      if(!ativo){
        ativo=true; btn.classList.add("ativo");
        int=setInterval(()=>{ t--; btn.textContent=t;
          if(t<=0){ clearInterval(int); ativo=false; btn.classList.remove("ativo"); t=seg; btn.textContent=t; vibrarFim(); FEMFLOW.toast("💨 Intervalo concluído"); }
        },1000);
      }else{ clearInterval(int); ativo=false; btn.classList.remove("ativo"); t=seg; btn.textContent=t; FEMFLOW.toast("🔁 Timer reiniciado"); }
    });
    return btn;
  }
  function formatar(s){ const m=Math.floor(s/60), ss=s%60; return `${m}:${String(ss).padStart(2,"0")}`; }
  function vibrarFim(){ if(navigator.vibrate){ navigator.vibrate([200,150,200]); } }
  function capitalizar(s){ return s.charAt(0).toUpperCase()+s.slice(1); }
  function escapeHtml(str){ return String(str).replace(/[&<>"']/g, m=>({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[m])); }
});
