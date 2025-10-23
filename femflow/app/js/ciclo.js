// Lógica da página de identificação de ciclo e validação de ID

document.addEventListener('DOMContentLoaded', () => {
  const btnIniciar = document.getElementById('btnIniciar');
  const btnValidar = document.getElementById('btnValidar');
  const cicloSection = document.getElementById('cicloSection');
  const idSection = document.getElementById('idSection');

  // Por padrão, se já houver memória para o ID salvo, esconder a configuração de ciclo
  const storedId = localStorage.getItem('femflow_id');
  if (storedId) {
    const mem = carregarMemoria(storedId);
    if (mem) {
      // Usuária já possui ciclo configurado; mostrar apenas campo de ID para continuar
      cicloSection.style.display = 'none';
    }
  }

  // Ação para iniciar programa novo
  btnIniciar.addEventListener('click', () => {
    const dataUltima = document.getElementById('dataUltima').value;
    const dur = document.getElementById('duracao').value;
    if (!dataUltima || !dur) {
      alert('Preencha a data da última menstruação e duração do ciclo.');
      return;
    }
    // Se usuário não tem ID ainda, gera ID temporário (para demonstração)
    let id = localStorage.getItem('femflow_id');
    if (!id) {
      id = 'FF-' + Date.now().toString(36).toUpperCase();
    }
    iniciarPrograma(id, dataUltima, dur);
    // Redireciona para treino
    window.location.href = 'treino.html';
  });

  // Ação para validar ID existente
  btnValidar.addEventListener('click', () => {
    const id = document.getElementById('inputID').value.trim();
    if (!id) {
      alert('Digite seu ID');
      return;
    }
    validarID(id).then(valid => {
      if (valid) {
        localStorage.setItem('femflow_id', id);
        const mem = carregarMemoria(id);
        if (!mem) {
          // primeira vez usando o ID, precisa configurar ciclo
          alert('ID validado! Configure seu ciclo para iniciar seu programa.');
          cicloSection.style.display = 'block';
        } else {
          // Se já tem memória, segue para o treino atual
          window.location.href = 'treino.html';
        }
      } else {
        alert('ID inválido ou licença expirou.');
      }
    });
  });
});