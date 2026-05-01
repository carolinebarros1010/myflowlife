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
  avaliarAlertasArvore,
  mapearIndicadoresOperacionais,
  calcularCriticidadeIndicadores,
  listarIndicadoresAtivos
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

test('alertas automáticos seguem regras por faixa etária', () => {
  const alertasCrianca = avaliarAlertasArvore(
    { crianca_supervisao_direta: 'Não', crianca_adulto_veiculo_suspeito: 'Sim' },
    'Criança'
  );
  assert.equal(alertasCrianca.length, 2);

  const alertasIdoso = avaliarAlertasArvore({ idoso_alzheimer_demencia: 'Sim' }, 'Idoso');
  assert.equal(alertasIdoso[0], 'Idoso com Alzheimer/demência/desorientação: prioridade máxima.');
});


test('indicadores operacionais derivam da árvore e elevam criticidade', () => {
  const respostas = {
    crianca_supervisao_direta: 'Não',
    crianca_adulto_veiculo_suspeito: 'Sim',
    adulto_indicios_violencia: 'Sim'
  };
  const indicadores = mapearIndicadoresOperacionais(respostas);

  assert.equal(indicadores.criancaSemSupervisao, true);
  assert.equal(indicadores.criancaVeiculoSuspeito, true);
  assert.equal(indicadores.adultoSuspeitaCrime, true);
  assert.equal(calcularCriticidadeIndicadores(indicadores), 'Crítica');
  assert.deepEqual(listarIndicadoresAtivos(indicadores).includes('adultoSuspeitaCrime'), true);
});

test('observacoes operacionais mantem somente texto livre', () => {
  const observacao = 'Resumo objetivo do operador.';
  assert.equal(observacao.includes('[ÁRVORE DE DECISÃO'), false);
  assert.equal(observacao.includes('[INDICADORES OPERACIONAIS]'), false);
});

test('payload completo com colunas base + arvore para Desaparecidos', () => {
  const payload = gerarPayloadSheets({ nomeCompletoDesaparecido: 'x', idade: 30 });
  assert.equal(payload.aba, 'Desaparecidos');
  assert.equal(payload.colunas.length, payload.valores.length);
  assert.equal(payload.colunas.length > 51, true);
  assert.equal(payload.colunas[0], 'idCaso');
  assert.equal(payload.colunas[50], 'observacoesOperacionais');
  assert.equal(payload.colunas.includes('arv_p1_emergencia_resp'), true);
  assert.equal(payload.colunas.includes('arv_p4_suspeita_crime_resp'), true);
  assert.equal(payload.colunas.includes('arv_adulto_violencia_divida_ameaca_resp'), true);
  assert.equal(payload.payload.arv_p1_emergencia_resp, 'Não informado');
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
