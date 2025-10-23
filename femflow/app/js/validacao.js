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
