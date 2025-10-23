async function validarID(id) {
  try {
    const response = await fetch(
      'https://script.google.com/macros/s/AKfycbyrSiF2ev6gNmmSB2BtsWgFNV24-0nZWjl5MqBd7RwceMfs0ClQGOqG_AQ1McfvWcQ/exec?id=' +
        encodeURIComponent(id)
    );

    if (!response.ok) throw new Error('Erro HTTP: ' + response.status);

    const data = await response.json();
    console.log('Resposta validação:', data);

    return data.valido === true || data.status === 'ok';
  } catch (err) {
    console.error('Erro de validação:', err);
    return false;
  }
}
async function processarLogin() {
  const id = document.getElementById('inputID').value.trim();
  const status = document.getElementById('statusID');

  if (!id) {
    status.innerText = "Por favor, insira seu ID.";
    status.style.color = "#CC6A5A";
    return;
  }

  status.innerText = "🔄 Verificando ID...";
  status.style.color = "#335953";

  const valido = await validarID(id);

  if (valido) {
    localStorage.setItem('femflow_id', id);
    const fase = localStorage.getItem("fase_sugerida");
    status.innerText = "✅ ID confirmado! Redirecionando...";
    setTimeout(() => {
      window.location.href = fase
        ? `treino.html?fase=${encodeURIComponent(fase)}`
        : 'treino.html';
    }, 1000);
  } else {
    status.innerText = "❌ ID não encontrado. Verifique e tente novamente.";
    status.style.color = "#CC6A5A";
  }
}
function mostrarRecuperar() {
  document.getElementById('recuperarBox').style.display = 'block';
}
function recuperarID() {
  const nome = document.getElementById('nomeRec').value.trim();
  const email = document.getElementById('emailRec').value.trim();
  const status = document.getElementById('statusRec');

  if (!nome || !email) {
    status.innerText = 'Por favor, preencha nome e e-mail.';
    status.style.color = '#CC6A5A';
    return;
  }

  status.innerText = '🔄 Verificando...';
  status.style.color = '#335953';

  fetch('https://script.google.com/macros/s/AKfycbwBut7gbyeXaZVFvBxIZOxd7mBcc9g1n2d2YGP1n0XGAdaFoVwtSmTkciE1u2XKg6m0/exec', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ action: 'recuperarID', nome, email })
  })
  .then(async (res) => {
    if (!res.ok && res.type !== 'opaque') throw new Error('Falha na resposta');
    status.innerText = '📩 Se o e-mail estiver cadastrado, o ID foi reenviado!';
    status.style.color = '#335953';
  })
  .catch((err) => {
    console.error('Erro ao recuperar ID:', err);
    status.innerText = '⚠️ Erro ao tentar recuperar. Tente novamente.';
    status.style.color = '#CC6A5A';
  });
}

