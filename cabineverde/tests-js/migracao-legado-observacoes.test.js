import test from 'node:test';
import assert from 'node:assert/strict';

function limparTexto(valor) {
  if (valor === null || valor === undefined) return '';
  return String(valor).trim();
}

function extrairResumoOperacionalDaArvore_(texto) {
  const textoBruto = String(texto || '');
  if (!limparTexto(textoBruto)) return 'Árvore de decisão legada arquivada.';

  const marcadorInicio = '[OBSERVAÇÕES DO OPERADOR]';
  const marcadorFim = '[INDICADORES OPERACIONAIS]';
  const marcadorAlerta = '[ALERTAS AUTOMÁTICOS]';
  const inicio = textoBruto.indexOf(marcadorInicio);
  if (inicio === -1) return 'Árvore de decisão legada arquivada.';

  let fim = textoBruto.indexOf(marcadorFim, inicio + marcadorInicio.length);
  if (fim === -1) fim = textoBruto.length;

  let trecho = limparTexto(textoBruto.substring(inicio + marcadorInicio.length, fim)).replace(/\s+/g, ' ');
  if (!trecho || trecho === '-') trecho = 'Árvore de decisão legada arquivada.';
  if (textoBruto.indexOf(marcadorAlerta) !== -1) trecho = 'Alerta operacional identificado. ' + trecho;
  if (trecho.length > 300) trecho = trecho.substring(0, 297) + '...';
  return trecho;
}

import { createHash } from 'node:crypto';

function gerarHashTexto_(texto) {
  return createHash('md5').update(String(texto || ''), 'utf8').digest('hex');
}

function textoEhSim_(valor) {
  if (typeof valor === 'boolean') return valor;
  const texto = limparTexto(valor).toUpperCase();
  return texto === 'SIM' || texto === 'TRUE';
}

function classificarCasoOperacional_(caso) {
  const registro = caso || {};
  const PESO_RISCO = {
    POSSIVEL_CRIME: 100,
    CRIANCA_DESAPARECIDA: 90,
    RISCO_COGNITIVO: 85,
    IDOSO_DESAPARECIDO: 80,
    VULNERAVEL: 70
  };
  const idade = Number(registro.idade);
  const vulnerabilidade = textoEhSim_(registro.vulnerabilidade);
  const suspeitaCrime = textoEhSim_(registro.suspeitaCrime);
  const riscoCognitivo = textoEhSim_(registro.condicaoMentalCognitivaComportamental);

  const classificacoesOperacionais = [];
  if (!Number.isNaN(idade) && idade < 18) classificacoesOperacionais.push('CRIANCA_DESAPARECIDA');
  if (!Number.isNaN(idade) && idade >= 60) classificacoesOperacionais.push('IDOSO_DESAPARECIDO');
  if (vulnerabilidade) classificacoesOperacionais.push('VULNERAVEL');
  if (riscoCognitivo) classificacoesOperacionais.push('RISCO_COGNITIVO');
  if (suspeitaCrime) classificacoesOperacionais.push('POSSIVEL_CRIME');

  let classificacaoDominante = '';
  let maiorPeso = 0;
  classificacoesOperacionais.forEach((item) => {
    const peso = PESO_RISCO[item] || 0;
    if (peso > maiorPeso) {
      maiorPeso = peso;
      classificacaoDominante = item;
    }
  });
  let prioridadeAutomatica = 'BAIXA';
  if (maiorPeso >= 90) prioridadeAutomatica = 'CRITICA';
  else if (maiorPeso >= 80) prioridadeAutomatica = 'ALTA';
  else if (maiorPeso >= 70) prioridadeAutomatica = 'MEDIA';
  const flagAlerta = classificacoesOperacionais.includes('POSSIVEL_CRIME') || classificacoesOperacionais.includes('CRIANCA_DESAPARECIDA') || classificacoesOperacionais.includes('RISCO_COGNITIVO');
  const tipoCaso = classificacaoDominante || 'CASO_GERAL';
  return { classificacoesOperacionais, classificacaoDominante, prioridadeAutomatica, tipoCaso, flagAlerta };
}

test('extrai entre observações e indicadores', () => {
  const texto = '[OBSERVAÇÕES DO OPERADOR] Contato com familiar realizado. [INDICADORES OPERACIONAIS] x';
  assert.equal(extrairResumoOperacionalDaArvore_(texto), 'Contato com familiar realizado.');
});

test('extrai até o fim quando não há indicadores', () => {
  const texto = '[OBSERVAÇÕES DO OPERADOR] Texto truncado sem marcador final';
  assert.equal(extrairResumoOperacionalDaArvore_(texto), 'Texto truncado sem marcador final');
});

test('retorna fallback sem marcador de observações', () => {
  assert.equal(extrairResumoOperacionalDaArvore_('sem marcador'), 'Árvore de decisão legada arquivada.');
});

test('prefixa alerta automático', () => {
  const texto = '[ALERTAS AUTOMÁTICOS] A\n[OBSERVAÇÕES DO OPERADOR] Encaminhado para patrulha';
  assert.equal(extrairResumoOperacionalDaArvore_(texto), 'Alerta operacional identificado. Encaminhado para patrulha');
});

test('retorna fallback para vazio e traço', () => {
  assert.equal(extrairResumoOperacionalDaArvore_(''), 'Árvore de decisão legada arquivada.');
  assert.equal(extrairResumoOperacionalDaArvore_('[OBSERVAÇÕES DO OPERADOR] -'), 'Árvore de decisão legada arquivada.');
});

test('hash md5 evita duplicidade por mesmo conteúdo', () => {
  const a = gerarHashTexto_('conteudo igual');
  const b = gerarHashTexto_('conteudo igual');
  const c = gerarHashTexto_('conteudo diferente');
  assert.equal(a, b);
  assert.notEqual(a, c);
});

test('classificação operacional multi-etiqueta marca possível crime como crítica', () => {
  const c = classificarCasoOperacional_({ suspeitaCrime: 'SIM', idade: 35 });
  assert.deepEqual(c.classificacoesOperacionais, ['POSSIVEL_CRIME']);
  assert.equal(c.prioridadeAutomatica, 'CRITICA');
  assert.equal(c.flagAlerta, true);
});

test('classificação operacional marca criança como crítica', () => {
  const c = classificarCasoOperacional_({ idade: 10 });
  assert.deepEqual(c.classificacoesOperacionais, ['CRIANCA_DESAPARECIDA']);
  assert.equal(c.prioridadeAutomatica, 'CRITICA');
});

test('classificação operacional marca idoso como alta e alerta', () => {
  const c = classificarCasoOperacional_({ idade: 72 });
  assert.deepEqual(c.classificacoesOperacionais, ['IDOSO_DESAPARECIDO']);
  assert.equal(c.prioridadeAutomatica, 'ALTA');
  assert.equal(c.flagAlerta, false);
});

test('classificação operacional mantém múltiplos fatores e usa maior peso', () => {
  const c = classificarCasoOperacional_({ idade: 16, vulnerabilidade: 'SIM', condicaoMentalCognitivaComportamental: 'SIM' });
  assert.deepEqual(c.classificacoesOperacionais, ['CRIANCA_DESAPARECIDA', 'VULNERAVEL', 'RISCO_COGNITIVO']);
  assert.equal(c.classificacaoDominante, 'CRIANCA_DESAPARECIDA');
  assert.equal(c.prioridadeAutomatica, 'CRITICA');
  assert.equal(c.flagAlerta, true);
});
