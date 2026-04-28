import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calcularFaixaEtaria,
  calcularRisco,
  calcularPrioridade,
  gerarPayloadSheets,
  salvarCasoSheets,
  healthcheckSheets,
  ENDPOINT_OFICIAL_APPS_SCRIPT,
  gerarObservacoesArvore,
  avaliarAlertasArvore
} from '../public/js/core.js';

test('faixa etaria seleciona subaba correta', () => {
  assert.equal(calcularFaixaEtaria(7), 'Criança');
  assert.equal(calcularFaixaEtaria(9), 'Pré-adolescente');
  assert.equal(calcularFaixaEtaria(15), 'Adolescente');
  assert.equal(calcularFaixaEtaria(44), 'Adulto');
  assert.equal(calcularFaixaEtaria(61), 'Idoso');
});

test('risco/prioridade', () => {
  const caso = { idade: 20, suspeitaCrime: true, vulnerabilidade: false, usoMedicacaoEssencial: false };
  assert.equal(calcularRisco(caso), 'Alto risco');
  assert.equal(calcularPrioridade(caso), 'Crítica');
});

test('observacoesOperacionais consolida texto estruturado da árvore e preserva observação do operador', () => {
  const resultado = gerarObservacoesArvore({
    faixaEtaria: 'Criança',
    respostas: {
      passo1_emergencia: 'Pessoa desaparecida',
      crianca_supervisao_direta: 'Não',
      crianca_adulto_veiculo_suspeito: 'Sim'
    },
    complementos: {
      crianca_supervisao_direta: 'Sem adulto responsável no local'
    },
    observacoesOperador: 'Equipe em deslocamento.'
  });

  assert.match(resultado.texto, /\[ÁRVORE DE DECISÃO – 190\/193\]/);
  assert.match(resultado.texto, /PASSO 1 – Identificação mínima/);
  assert.match(resultado.texto, /SUBABA – Criança 0–7/);
  assert.match(resultado.texto, /\[ALERTAS AUTOMÁTICOS\]/);
  assert.match(resultado.texto, /\[OBSERVAÇÕES DO OPERADOR\]\nEquipe em deslocamento\./);
});

test('alertas automáticos seguem regras por faixa etária', () => {
  const alertasCrianca = avaliarAlertasArvore(
    { crianca_supervisao_direta: 'Não', crianca_adulto_veiculo_suspeito: 'Sim' },
    'Criança'
  );
  assert.equal(alertasCrianca.length, 2);

  const alertasIdoso = avaliarAlertasArvore({ idoso_alzheimer_demencia: 'Sim' }, 'Idoso');
  assert.equal(alertasIdoso[0], 'Idoso com Alzheimer/demência/desorientação: prioridade máxima.');
});

test('payload completo com 51 colunas para Desaparecidos', () => {
  const payload = gerarPayloadSheets({ nomeCompletoDesaparecido: 'x', idade: 30 });
  assert.equal(payload.aba, 'Desaparecidos');
  assert.equal(payload.colunas.length, 51);
  assert.equal(payload.valores.length, 51);
  assert.equal(payload.colunas[0], 'idCaso');
  assert.equal(payload.colunas[50], 'observacoesOperacionais');
});

test('salvarCasoSheets usa POST no-cors + endpoint oficial', async () => {
  const originalFetch = globalThis.fetch;
  let fetchArgs;
  globalThis.fetch = async (...args) => {
    fetchArgs = args;
    return new Response(null, { status: 204 });
  };

  const retorno = await salvarCasoSheets({ nomeCompletoDesaparecido: 'Teste', idade: 18 });
  assert.equal(retorno.ok, true);
  assert.equal(retorno.mode, 'no-cors');
  assert.equal(retorno.message, 'Caso enviado para processamento (modo silencioso)');
  assert.equal(fetchArgs[0], ENDPOINT_OFICIAL_APPS_SCRIPT);
  assert.equal(fetchArgs[1].method, 'POST');
  assert.equal(fetchArgs[1].mode, 'no-cors');
  assert.equal(fetchArgs[1].headers['Content-Type'], 'text/plain;charset=utf-8');

  globalThis.fetch = originalFetch;
});

test('healthcheckSheets retorna erro claro quando doGet não está publicado', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response('<html><body>Script function not found: doGet</body></html>', {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });

  const retorno = await healthcheckSheets();
  assert.equal(retorno.ok, false);
  assert.equal(retorno.message, 'Backend GAS não publicado ou doGet ausente');

  globalThis.fetch = originalFetch;
});
