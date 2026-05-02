import type { AbaPayload, CasoCompleto, SheetCellValue, SheetPayload } from '../types/case.js';

const COLUNAS_CASOS = [
  'idCaso','talaoPMESP','dataHoraRegistro','dataServico','turno','equipe','operadorResponsavel','operadorCriador','operadorUltimaAcao','municipio','talaoBopm','statusCaso','nomeCompletoDesaparecido','sexoGenero','idade','faixaEtaria','cpf','rg','nomeMae','dataNascimento','corPele','alturaAproximada','pesoAproximado','corCabelo','corOlhos','caracteristicasMarcantes','dataHoraUltimaVisualizacao','localUltimaVisualizacao','roupaUltimaVisualizacao','meioTransporte','dadosVeiculo','fotoDisponivel','linkFoto','telefoneDesaparecido','dispositivoLigado','camerasResidencia','camerasUltimoLocal','aptoCabineVerde','nomeSolicitante','vinculoSolicitante','telefoneSolicitante','vulnerabilidade','condicaoMentalCognitivaComportamental','limitacaoFisica','usoMedicacaoEssencial','usoAlcoolOutrasDrogas','historicoDesaparecimentoAnterior','conflitoPrevio','suspeitaCrime','locaisHabituais','buscasPreliminares','classificacaoRisco','prioridade','acaoSugerida','localizado','dataHoraLocalizacao','formaLocalizacao','encerrado190','numeroBo','observacoesOperacionais'
] as const;

const COLUNAS_TRIAGEM_RESPOSTAS = ['idCaso', 'perguntaChave', 'resposta', 'complemento'];
const COLUNAS_EVENTOS_OCORRENCIA = ['idCaso', 'timestampEvento', 'tipoEvento', 'descricaoEvento', 'statusCaso', 'prioridade', 'classificacaoRisco'];
const COLUNAS_INDICADORES = ['idCaso', 'criancaSemSupervisao', 'criancaVeiculoSuspeito', 'preadolescenteAliciamentoVirtual', 'adolescenteSofrimentoPsiquico', 'adultoSuspeitaCrime', 'idosoDesorientado'];

const hojeIso = (dataHoraRegistro: string): string => {
  const data = new Date(dataHoraRegistro || Date.now());
  return Number.isNaN(data.getTime()) ? new Date().toISOString().slice(0, 10) : data.toISOString().slice(0, 10);
};

const normalizarObservacaoCurta = (texto: string): string => {
  const limpo = String(texto || '').replace(/\s+/g, ' ').trim();
  if (!limpo) return 'Sem observação adicional.';
  return limpo.length > 220 ? `${limpo.slice(0, 217)}...` : limpo;
};

const normalizarResposta = (valor: unknown): string => {
  if (typeof valor === 'boolean') return valor ? 'Sim' : 'Não';
  const texto = String(valor ?? '').trim();
  return texto || 'Não informado';
};

const montarTriagemRespostas = (caso: CasoCompleto): SheetCellValue[][] => {
  const subfluxo = caso.subfluxoPerguntas || {};
  const chaves = Object.keys(subfluxo).sort();
  return chaves.map((perguntaChave) => {
    const valor = subfluxo[perguntaChave];
    const resposta = perguntaChave.endsWith('_comp') ? 'Não informado' : normalizarResposta(valor);
    const complemento = perguntaChave.endsWith('_comp') ? String(valor ?? '').trim() : '';
    return [caso.id, perguntaChave, resposta, complemento];
  });
};

const montarAbas = (caso: CasoCompleto, dadosCaso: Record<string, SheetCellValue>): AbaPayload[] => {
  const triagemRespostas = montarTriagemRespostas(caso);
  const eventoInicial: SheetCellValue[] = [
    caso.id,
    caso.dataHoraRegistro,
    'triagem_inicial',
    `Caso ${caso.id} registrado e classificado como ${caso.classificacaoRisco}.`,
    caso.statusCaso,
    caso.prioridade,
    caso.classificacaoRisco
  ];

  const indicadores = caso.indicadoresOperacionais;
  const linhaIndicadores: SheetCellValue[] = [
    caso.id,
    indicadores.criancaSemSupervisao,
    indicadores.criancaVeiculoSuspeito,
    indicadores.preadolescenteAliciamentoVirtual,
    indicadores.adolescenteSofrimentoPsiquico,
    indicadores.adultoSuspeitaCrime,
    indicadores.idosoDesorientado
  ];

  const abas: AbaPayload[] = [
    { aba: 'CASOS', colunas: [...COLUNAS_CASOS], valores: COLUNAS_CASOS.map((c) => dadosCaso[c]) },
    ...triagemRespostas.map((valores) => ({ aba: 'TRIAGEM_RESPOSTAS', colunas: [...COLUNAS_TRIAGEM_RESPOSTAS], valores })),
    { aba: 'EVENTOS_OCORRENCIA', colunas: [...COLUNAS_EVENTOS_OCORRENCIA], valores: eventoInicial },
    { aba: 'INDICADORES_OPERACIONAIS', colunas: [...COLUNAS_INDICADORES], valores: linhaIndicadores }
  ];

  return abas;
};

export const gerarPayloadSheets = (caso: CasoCompleto): SheetPayload => {
  const dadosBase: Record<string, SheetCellValue> = {
    idCaso: caso.id, talaoPMESP: caso.talaoPMESP, dataHoraRegistro: caso.dataHoraRegistro, dataServico: hojeIso(caso.dataHoraRegistro), turno: '', equipe: 'Cabine Verde', operadorResponsavel: caso.operadorUltimaAcao || caso.operadorCriador || '', operadorCriador: caso.operadorCriador || '', operadorUltimaAcao: caso.operadorUltimaAcao || caso.operadorCriador || '', municipio: caso.municipio, talaoBopm: caso.talaoBopm, statusCaso: caso.statusCaso, nomeCompletoDesaparecido: caso.nomeCompletoDesaparecido, sexoGenero: caso.sexoGenero, idade: caso.idade, faixaEtaria: caso.faixaEtaria, cpf: caso.cpf, rg: caso.rg, nomeMae: caso.nomeMae, dataNascimento: caso.dataNascimento, corPele: caso.corPele || '', alturaAproximada: caso.alturaAproximada || 0, pesoAproximado: caso.pesoAproximado || 0, corCabelo: caso.corCabelo || '', corOlhos: caso.corOlhos || '', caracteristicasMarcantes: caso.caracteristicasMarcantes || '', dataHoraUltimaVisualizacao: caso.dataHoraUltimaVisualizacao, localUltimaVisualizacao: caso.localUltimaVisualizacao, roupaUltimaVisualizacao: caso.roupaUltimaVisualizacao, meioTransporte: caso.meioTransporte, dadosVeiculo: caso.dadosVeiculo, fotoDisponivel: caso.fotoDisponivel, linkFoto: caso.linkFoto, telefoneDesaparecido: caso.telefoneDesaparecido, dispositivoLigado: caso.dispositivoLigado, camerasResidencia: caso.camerasResidencia, camerasUltimoLocal: caso.camerasUltimoLocal, aptoCabineVerde: caso.aptoCabineVerde, nomeSolicitante: caso.nomeSolicitante, vinculoSolicitante: caso.vinculoSolicitante, telefoneSolicitante: caso.telefoneSolicitante, vulnerabilidade: caso.vulnerabilidade, condicaoMentalCognitivaComportamental: caso.condicaoMentalCognitivaComportamental, limitacaoFisica: caso.limitacaoFisica, usoMedicacaoEssencial: caso.usoMedicacaoEssencial, usoAlcoolOutrasDrogas: caso.usoAlcoolOutrasDrogas, historicoDesaparecimentoAnterior: caso.historicoDesaparecimentoAnterior, conflitoPrevio: caso.conflitoPrevio, suspeitaCrime: caso.suspeitaCrime, locaisHabituais: caso.locaisHabituais, buscasPreliminares: caso.buscasPreliminares, classificacaoRisco: caso.classificacaoRisco, prioridade: caso.prioridade, acaoSugerida: caso.acaoSugerida, localizado: caso.statusCaso === 'Localizado' || caso.statusCaso === 'Encerrado', dataHoraLocalizacao: '', formaLocalizacao: '', encerrado190: caso.statusCaso === 'Encerrado', numeroBo: '', observacoesOperacionais: normalizarObservacaoCurta(caso.observacoesOperacionais)
  };

  return {
    aba: 'CASOS',
    colunas: [...COLUNAS_CASOS],
    dados: dadosBase,
    valores: COLUNAS_CASOS.map((coluna) => dadosBase[coluna]),
    abas: montarAbas(caso, dadosBase)
  };
};
