import test from 'node:test';
import assert from 'node:assert/strict';

function calcularStatusAtualPessoa(analisesOrdenadas) {
  const analises = [...analisesOrdenadas].sort((a, b) => String(a.dataHoraAnalise).localeCompare(String(b.dataHoraAnalise)));
  for (let indice = analises.length - 1; indice >= 0; indice -= 1) {
    if (analises[indice].situacaoInformada) return analises[indice].situacaoInformada;
  }
  return null;
}

test('reconstrói o status ignorando marcadores sem situação explícita', () => {
  const analises = [
    { dataHoraAnalise: '2026-08-17T08:00:00', situacaoInformada: 'DESAPARECIDO' },
    { dataHoraAnalise: '2026-08-17T12:00:00', situacaoInformada: null, marcadoresAndamento: { fotoRecebida: true } },
    { dataHoraAnalise: '2026-08-18T10:00:00', situacaoInformada: null, marcadoresAndamento: { semNovaInformacao: true } },
    { dataHoraAnalise: '2026-08-19T14:00:00', situacaoInformada: 'LOCALIZADO' }
  ];
  assert.equal(calcularStatusAtualPessoa(analises), 'LOCALIZADO');
});

test('mantém o último status explícito quando a análise posterior não informa situação', () => {
  assert.equal(calcularStatusAtualPessoa([
    { dataHoraAnalise: '2026-08-17T08:00:00', situacaoInformada: 'DESAPARECIDO' },
    { dataHoraAnalise: '2026-08-18T10:00:00', situacaoInformada: null }
  ]), 'DESAPARECIDO');
});

test('permite novo desaparecimento depois de uma localização', () => {
  assert.equal(calcularStatusAtualPessoa([
    { dataHoraAnalise: '2026-08-01T08:00:00', situacaoInformada: 'DESAPARECIDO' },
    { dataHoraAnalise: '2026-08-05T08:00:00', situacaoInformada: 'LOCALIZADO' },
    { dataHoraAnalise: '2026-08-20T08:00:00', situacaoInformada: 'DESAPARECIDO' }
  ]), 'DESAPARECIDO');
});
