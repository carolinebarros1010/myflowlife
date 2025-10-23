// Memória e lógica cíclica FemFlow
// Guarda os dados de progressão e ciclo no localStorage utilizando a chave femflow_<ID>

// Helper: Calcula diferença de dias entre duas datas no formato yyyy-mm-dd
function diasEntre(dat1, dat2) {
  const d1 = new Date(dat1);
  const d2 = new Date(dat2);
  const ms = d2.getTime() - d1.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

// Determina a fase hormonal dada a posição no ciclo e a duração média
function determinarFase(dia, duracao) {
  // Ajusta divisões proporcionalmente à duração
  const proporcao = duracao / 28;
  if (dia <= 5 * proporcao) return 'Menstrual';
  if (dia <= 14 * proporcao) return 'Folicular';
  if (dia <= 17 * proporcao) return 'Ovulatória';
  return 'Lútea';
}

// Inicia programa para um novo ID: salva dados iniciais e retorna fase inicial
function iniciarPrograma(id, dataUltimaMenstruacao, duracaoCiclo) {
  const hoje = new Date();
  const isoHoje = hoje.toISOString().slice(0, 10);
  const diasDesdeUltima = diasEntre(dataUltimaMenstruacao, isoHoje);
  const faseAtual = determinarFase(((diasDesdeUltima % duracaoCiclo) || duracaoCiclo), duracaoCiclo);
  const memoria = {
    id: id,
    inicioPrograma: isoHoje,
    diaCicloNoInicio: diasDesdeUltima,
    duracaoCiclo: parseInt(duracaoCiclo, 10),
    diaPrograma: 1,
    treinos: []
  };
  localStorage.setItem(`femflow_${id}`, JSON.stringify(memoria));
  localStorage.setItem('femflow_id', id);
  return faseAtual;
}

// Carrega memória para um ID ou retorna null
function carregarMemoria(id) {
  const data = localStorage.getItem(`femflow_${id}`);
  return data ? JSON.parse(data) : null;
}

// Atualiza e salva memória
function salvarMemoria(id, memoria) {
  localStorage.setItem(`femflow_${id}`, JSON.stringify(memoria));
}

// Calcula o dia do programa atual (1-based)
function calcularDiaPrograma(memoria) {
  // Retorna o dia do programa salvo em memória (1..30)
  return memoria.diaPrograma || 1;
}

// Calcula o dia do ciclo fisiológico atual
function calcularDiaCiclo(memoria) {
  const diaPrograma = calcularDiaPrograma(memoria);
  const diaCicloAtual = (memoria.diaCicloNoInicio + diaPrograma - 1) % memoria.duracaoCiclo;
  return diaCicloAtual === 0 ? memoria.duracaoCiclo : diaCicloAtual;
}

// Retorna objeto do treino atual com fase e nomes dos arquivos
function obterTreinoAtual(id) {
  const memoria = carregarMemoria(id);
  if (!memoria) return null;
  // atualiza diaPrograma em memória para garantir consistência
  const diaProg = calcularDiaPrograma(memoria);
  memoria.diaPrograma = diaProg;
  // calcula dia de ciclo real
  const diaCiclo = calcularDiaCiclo(memoria);
  const fase = determinarFase(diaCiclo, memoria.duracaoCiclo);
  // determina nome de arquivos (videos e pdfs)
  const faseKey = fase.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const video = `videos/video_${faseKey}_${diaProg}.mp4`;
  const pdf = `download/treino_${faseKey}_${diaProg}.pdf`;
  // salvar novamente diaPrograma e fase
  salvarMemoria(id, memoria);
  return { id: id, diaPrograma: diaProg, diaCiclo: diaCiclo, fase: fase, video: video, pdf: pdf };
}

// Registra PSE e salva no histórico; também envia para Google Sheets (stubbed)
function registrarTreino(id, pse) {
  const memoria = carregarMemoria(id);
  if (!memoria) return;
  const hoje = new Date().toISOString().slice(0, 10);
  const diaProg = calcularDiaPrograma(memoria);
  const diaCiclo = calcularDiaCiclo(memoria);
  const fase = determinarFase(diaCiclo, memoria.duracaoCiclo);
  // remove antigo registro se houver
  memoria.treinos = memoria.treinos.filter(t => t.diaPrograma !== diaProg);
  memoria.treinos.push({ diaPrograma: diaProg, fase: fase, pse: pse, data: hoje });
  salvarMemoria(id, memoria);
  // exemplo de envio para Google Sheets (ajustar endpoint):
  /*
  fetch('https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec', {
    method: 'POST',
    mode: 'no-cors',
    body: JSON.stringify({ id: id, data: hoje, fase: fase, diaPrograma: diaProg, pse: pse })
  });
  */
}

// Avança para o próximo treino: incrementa diaPrograma e recarrega a página
function avancarTreino(id) {
  const memoria = carregarMemoria(id);
  if (!memoria) return;
  const atual = memoria.diaPrograma || 1;
  memoria.diaPrograma = atual + 1;
  salvarMemoria(id, memoria);
}