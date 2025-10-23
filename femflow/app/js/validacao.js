// Validação de ID FemFlow
// Esta função verifica se o ID informado corresponde a uma licença ativa.
// No ambiente de produção, substitua a lógica por uma chamada ao Google Apps Script ou API que consulta a planilha.

function validarID(id) {
  // Exemplo de validação assíncrona com Google Apps Script
  /*
  return fetch('https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?id=' + encodeURIComponent(id))
    .then(res => res.json())
    .then(data => {
      return data && data.valido;
    })
    .catch(err => {
      console.error('Erro de validação', err);
      return false;
    });
  */
  // Simulação: aceita qualquer ID não vazio
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(id && id.length > 0);
    }, 300);
  });
}