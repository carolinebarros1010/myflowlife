function validarID(id) {
  return fetch(
    'https://script.google.com/macros/s/AKfycbyCmJdo7UL3YcizKDA41PRz4_dyVFnAkdZuR-d3QXUsPbA5GA3hq13d0U8v0ldav9i3Fw/exec?id=' +
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
