/**
 * Mapeamento da aba Desaparecidos.
 *
 * Importante: manter coerência com src/utils/sheetsPayload.ts no frontend.
 */

var ABA_DESAPARECIDOS = 'Desaparecidos';

var COLUNAS_DESAPARECIDOS = [
  'idCaso',
  'dataHoraRegistro',
  'dataServico',
  'turno',
  'equipe',
  'operadorResponsavel',
  'municipio',
  'talaoBopm',
  'statusCaso',
  'nomeCompletoDesaparecido',
  'sexoGenero',
  'idade',
  'faixaEtaria',
  'cpf',
  'rg',
  'nomeMae',
  'dataNascimento',
  'dataHoraUltimaVisualizacao',
  'localUltimaVisualizacao',
  'roupaUltimaVisualizacao',
  'meioTransporte',
  'dadosVeiculo',
  'fotoDisponivel',
  'linkFoto',
  'telefoneDesaparecido',
  'dispositivoLigado',
  'camerasResidencia',
  'camerasUltimoLocal',
  'aptoCabineVerde',
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
  'classificacaoRisco',
  'prioridade',
  'acaoSugerida',
  'localizado',
  'dataHoraLocalizacao',
  'formaLocalizacao',
  'encerrado190',
  'numeroBo',
  'observacoesOperacionais'
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
