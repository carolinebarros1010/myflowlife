import test from 'node:test';
import assert from 'node:assert/strict';
import { StatusCaso } from '../src/types/enums.js';
import type { CasoDesaparecimento } from '../src/types/case.js';
import {
  anexarBlocoIndicadoresObservacoes,
  calcularCriticidadeIndicadores,
  mapearIndicadoresOperacionais
} from '../src/modules/triagem/indicadoresOperacionais.js';

const baseCaso: CasoDesaparecimento = {
  id: 'CV-TESTE',
  dataHoraRegistro: '',
  municipio: '',
  talaoBopm: '',
  nomeCompletoDesaparecido: '',
  sexoGenero: '',
  idade: 0,
  cpf: '',
  rg: '',
  nomeMae: '',
  dataNascimento: '',
  fotoDisponivel: false,
  linkFoto: '',
  telefoneDesaparecido: '',
  dispositivoLigado: false,
  dataHoraUltimaVisualizacao: '',
  localUltimaVisualizacao: '',
  roupaUltimaVisualizacao: '',
  meioTransporte: '',
  dadosVeiculo: '',
  nomeSolicitante: '',
  vinculoSolicitante: '',
  telefoneSolicitante: '',
  vulnerabilidade: false,
  condicaoMentalCognitivaComportamental: '',
  limitacaoFisica: '',
  usoMedicacaoEssencial: false,
  usoAlcoolOutrasDrogas: false,
  historicoDesaparecimentoAnterior: false,
  conflitoPrevio: false,
  suspeitaCrime: false,
  locaisHabituais: '',
  buscasPreliminares: '',
  camerasResidencia: false,
  camerasUltimoLocal: false,
  observacoesOperacionais: '',
  statusCaso: StatusCaso.EM_TRIAGEM,
  subfluxoPerguntas: {}
};

test('mapeia indicadores a partir do subfluxo e observações estruturadas', () => {
  const caso = {
    ...baseCaso,
    observacoesOperacionais: 'preadolescente_aliciamento_virtual: Sim\nidoso_alzheimer_demencia: Não',
    subfluxoPerguntas: {
      crianca_supervisao_direta: 'Não',
      adulto_indicios_violencia: 'Sim'
    }
  };

  const indicadores = mapearIndicadoresOperacionais(caso);
  assert.equal(indicadores.criancaSemSupervisao, true);
  assert.equal(indicadores.preadolescenteAliciamentoVirtual, true);
  assert.equal(indicadores.adultoSuspeitaCrime, true);
  assert.equal(indicadores.idosoDesorientado, false);
});

test('anexa bloco de indicadores em observações operacionais', () => {
  const texto = anexarBlocoIndicadoresObservacoes('Observação livre', {
    criancaSemSupervisao: true,
    criancaVeiculoSuspeito: false,
    preadolescenteAliciamentoVirtual: true,
    adolescenteSofrimentoPsiquico: false,
    adultoSuspeitaCrime: true,
    idosoDesorientado: false
  });

  assert.match(texto, /\[INDICADORES OPERACIONAIS\]/);
  assert.match(texto, /criancaSemSupervisao: SIM/);
  assert.match(texto, /idosoDesorientado: NÃO/);
});

test('calcula criticidade com base nos indicadores ativos', () => {
  const criticidade = calcularCriticidadeIndicadores({
    criancaSemSupervisao: true,
    criancaVeiculoSuspeito: false,
    preadolescenteAliciamentoVirtual: false,
    adolescenteSofrimentoPsiquico: true,
    adultoSuspeitaCrime: false,
    idosoDesorientado: false
  });

  assert.equal(criticidade, 'Alta');
});
