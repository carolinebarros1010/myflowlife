function validarID(id) {
  return fetch(
    'https://script.google.com/macros/s/AKfycbyrSiF2ev6gNmmSB2BtsWgFNV24-0nZWjl5MqBd7RwceMfs0ClQGOqG_AQ1McfvWcQ/exec?id=' +
      encodeURIComponent(id)
  )
    .then((res) => res.json())
    .then((data) => {
      // Ajuste de acordo com a estrutura do JSON retornado pelo Apps Script
      return data.valido === true || data.status === 'ok';
    })
    .catch((err) => {
      console.error('Erro de validação:', err);
      return false;
    });
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

  fetch('https://script.google.com/macros/s/AKfycbyJA_kLQrDT-vLgqRhdGcgJ4IbsouXE8yM5jjDzxksWBuOmw7JbUZ47ExyiDhFjdKo9tg/exec', {
    method: 'POST',
    mode: 'no-cors',
    body: JSON.stringify({ action: 'recuperarID', nome: nome, email: email })
  })
  .then(() => {
    status.innerText = '📩 Se o e-mail estiver cadastrado, o ID foi reenviado!';
    status.style.color = '#335953';
  })
  .catch(() => {
    status.innerText = '⚠️ Erro ao tentar recuperar. Tente novamente.';
    status.style.color = '#CC6A5A';
  });
}

