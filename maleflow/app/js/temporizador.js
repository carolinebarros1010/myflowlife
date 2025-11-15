// temporizador.js — script global para timers

export function iniciarTemporizadores() {
  document.querySelectorAll(".timer-start").forEach(botao => {
    botao.addEventListener("click", () => {
      const display = botao.previousElementSibling;
      const duracao = parseFloat(botao.dataset.minutos) * 60;
      iniciarContagem(duracao, display);
    });
  });
}

function iniciarContagem(segundosTotais, display) {
  let timer = segundosTotais;
  const intervalo = setInterval(() => {
    const minutos = String(Math.floor(timer / 60)).padStart(2, '0');
    const segundos = String(timer % 60).padStart(2, '0');
    display.textContent = `${minutos}:${segundos}`;
    if (--timer < 0) clearInterval(intervalo);
  }, 1000);
}

document.addEventListener("DOMContentLoaded", iniciarTemporizadores);
