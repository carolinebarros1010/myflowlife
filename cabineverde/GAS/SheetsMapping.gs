/**
 * Mapeamento da aba Desaparecidos.
 *
 * Importante: manter coerência com src/utils/sheetsPayload.ts no frontend.
 */

var ABA_DESAPARECIDOS = 'Desaparecidos';

var COLUNAS_DESAPARECIDOS = [
  'dataHoraRegistro',
  'municipio',
  'talaoBopm',
  'nomeCompletoDesaparecido',
  'sexoGenero',
  'idade',
  'faixaEtaria',
  'cpf',
  'rg',
  'nomeMae',
  'dataNascimento',
  'fotoDisponivel',
  'linkFoto',
  'telefoneDesaparecido',
  'dispositivoLigado',
  'dataHoraUltimaVisualizacao',
  'localUltimaVisualizacao',
  'roupaUltimaVisualizacao',
  'meioTransporte',
  'dadosVeiculo',
  'nomeSolicitante',
  'vinculoSolicitante',
  'telefoneSolicitante',
  'vulnerabilidade',
  'condicaoMentalCognitivaComportamental',
  'limitacaoFisica',
  'usoMedicacaoEssencial',
  'usoAlcoolOutrasDrogas',
  'historicoDesaparecimentoAnterior',
  'conflitoPrevio',
  'suspeitaCrime',
  'locaisHabituais',
  'buscasPreliminares',
  'camerasResidencia',
  'camerasUltimoLocal',
  'classificacaoRisco',
  'prioridade',
  'acaoSugerida',
  'aptoCabineVerde',
  'observacoesOperacionais',
  'statusCaso'
];

function mapearPayloadParaLinhaDesaparecidos(payload) {
  var dados = payload && typeof payload === 'object' ? payload : {};

  return COLUNAS_DESAPARECIDOS.map(function (coluna) {
    return normalizarValorPlanilha(dados[coluna]);
  });
}

function obterColunasDesaparecidos() {
  return COLUNAS_DESAPARECIDOS.slice();
}
