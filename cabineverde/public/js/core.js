export const ENDPOINT_OFICIAL_APPS_SCRIPT =
  'https://script.google.com/macros/s/AKfycbyWmW1-MNFprc83mtns2FrQCL2x-k5rckwUDI2p6d0L4dzVYxLLQRg4cyB28JLG_501zw/exec';

export const FaixaEtaria = {
  CRIANCA: 'Criança',
  PRE_ADOLESCENTE: 'Pré-adolescente',
  ADOLESCENTE: 'Adolescente',
  ADULTO: 'Adulto',
  IDOSO: 'Idoso'
};

const COLUNAS_DESAPARECIDOS = [
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

const hojeIso = (dataHoraRegistro) => {
  const data = new Date(dataHoraRegistro || Date.now());
  if (Number.isNaN(data.getTime())) return new Date().toISOString().slice(0, 10);
  return data.toISOString().slice(0, 10);
};

export const calcularFaixaEtaria = (idade) => {
  if (idade <= 7) return FaixaEtaria.CRIANCA;
  if (idade <= 11) return FaixaEtaria.PRE_ADOLESCENTE;
  if (idade <= 17) return FaixaEtaria.ADOLESCENTE;
  if (idade <= 59) return FaixaEtaria.ADULTO;
  return FaixaEtaria.IDOSO;
};

export const calcularRisco = (caso) => {
  const faixa = calcularFaixaEtaria(Number(caso.idade || 0));
  if (faixa === FaixaEtaria.CRIANCA || caso.suspeitaCrime || caso.vulnerabilidade || caso.usoMedicacaoEssencial) return 'Alto risco';
  if (faixa === FaixaEtaria.ADOLESCENTE || caso.usoAlcoolOutrasDrogas || caso.conflitoPrevio) return 'Risco moderado';
  return 'Baixo risco';
};

export const calcularPrioridade = (caso) => {
  const risco = calcularRisco(caso);
  if (risco === 'Alto risco') return caso.suspeitaCrime ? 'Crítica' : 'Alta';
  if (risco === 'Risco moderado') return 'Média';
  return 'Baixa';
};

export const calcularAptoCabineVerde = (caso) => {
  const pontos = [caso.fotoDisponivel, caso.dispositivoLigado, Boolean(caso.localUltimaVisualizacao), caso.camerasResidencia || caso.camerasUltimoLocal];
  return pontos.filter(Boolean).length >= 3;
};

export const gerarPayloadSheets = (caso) => {
  const dados = {
    idCaso: caso.id || `CV-${Date.now()}`,
    dataHoraRegistro: caso.dataHoraRegistro || new Date().toISOString(),
    dataServico: hojeIso(caso.dataHoraRegistro),
    turno: caso.turno || '',
    equipe: caso.equipe || 'Cabine Verde',
    operadorResponsavel: caso.operadorResponsavel || '',
    municipio: caso.municipio || '',
    talaoBopm: caso.talaoBopm || '',
    statusCaso: caso.statusCaso || 'Em triagem',
    nomeCompletoDesaparecido: caso.nomeCompletoDesaparecido || '',
    sexoGenero: caso.sexoGenero || '',
    idade: Number(caso.idade || 0),
    faixaEtaria: caso.faixaEtaria || calcularFaixaEtaria(Number(caso.idade || 0)),
    cpf: caso.cpf || '',
    rg: caso.rg || '',
    nomeMae: caso.nomeMae || '',
    dataNascimento: caso.dataNascimento || '',
    dataHoraUltimaVisualizacao: caso.dataHoraUltimaVisualizacao || '',
    localUltimaVisualizacao: caso.localUltimaVisualizacao || '',
    roupaUltimaVisualizacao: caso.roupaUltimaVisualizacao || '',
    meioTransporte: caso.meioTransporte || '',
    dadosVeiculo: caso.dadosVeiculo || '',
    fotoDisponivel: Boolean(caso.fotoDisponivel),
    linkFoto: caso.linkFoto || '',
    telefoneDesaparecido: caso.telefoneDesaparecido || '',
    dispositivoLigado: Boolean(caso.dispositivoLigado),
    camerasResidencia: Boolean(caso.camerasResidencia),
    camerasUltimoLocal: Boolean(caso.camerasUltimoLocal),
    aptoCabineVerde: Boolean(caso.aptoCabineVerde),
    nomeSolicitante: caso.nomeSolicitante || '',
    vinculoSolicitante: caso.vinculoSolicitante || '',
    telefoneSolicitante: caso.telefoneSolicitante || '',
    vulnerabilidade: Boolean(caso.vulnerabilidade),
    condicaoMentalCognitivaComportamental: caso.condicaoMentalCognitivaComportamental || '',
    limitacaoFisica: caso.limitacaoFisica || '',
    usoMedicacaoEssencial: Boolean(caso.usoMedicacaoEssencial),
    usoAlcoolOutrasDrogas: Boolean(caso.usoAlcoolOutrasDrogas),
    historicoDesaparecimentoAnterior: Boolean(caso.historicoDesaparecimentoAnterior),
    conflitoPrevio: Boolean(caso.conflitoPrevio),
    suspeitaCrime: Boolean(caso.suspeitaCrime),
    locaisHabituais: caso.locaisHabituais || '',
    buscasPreliminares: caso.buscasPreliminares || '',
    classificacaoRisco: caso.classificacaoRisco || calcularRisco(caso),
    prioridade: caso.prioridade || calcularPrioridade(caso),
    acaoSugerida: caso.acaoSugerida || '',
    localizado: Boolean(caso.localizado || caso.statusCaso === 'Localizado' || caso.statusCaso === 'Encerrado'),
    dataHoraLocalizacao: caso.dataHoraLocalizacao || '',
    formaLocalizacao: caso.formaLocalizacao || '',
    encerrado190: Boolean(caso.encerrado190 || caso.statusCaso === 'Encerrado'),
    numeroBo: caso.numeroBo || '',
    observacoesOperacionais: caso.observacoesOperacionais || ''
  };

  return {
    aba: 'Desaparecidos',
    colunas: [...COLUNAS_DESAPARECIDOS],
    payload: dados,
    valores: COLUNAS_DESAPARECIDOS.map((coluna) => dados[coluna])
  };
};

const parseJsonSeguro = async (resposta) => {
  try {
    return await resposta.json();
  } catch {
    return {};
  }
};

export const salvarCasoSheets = async (caso) => {
  try {
    const payload = gerarPayloadSheets(caso);
    const resposta = await fetch(ENDPOINT_OFICIAL_APPS_SCRIPT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const body = await parseJsonSeguro(resposta);
    if (!resposta.ok || body.ok === false) {
      return { ok: false, message: body.error || body.message || 'Falha ao salvar caso', ...body };
    }

    return { ok: true, message: body.action === 'updated' ? 'Caso atualizado com sucesso' : 'Caso criado com sucesso', ...body };
  } catch {
    return { ok: false, message: 'Erro de integração com Google Sheets' };
  }
};

export const healthcheckSheets = async () => {
  try {
    const resposta = await fetch(ENDPOINT_OFICIAL_APPS_SCRIPT, { method: 'GET' });
    if (!resposta.ok) return { ok: false, message: 'Endpoint indisponível' };
    const body = await parseJsonSeguro(resposta);
    return body.ok === false ? { ok: false, message: 'Endpoint indisponível' } : { ok: true, message: body.message || 'Endpoint ativo' };
  } catch {
    return { ok: false, message: 'Endpoint indisponível' };
  }
};

export const gerarRelatorioOperacional = (casos, extra = '') => {
  const data = new Date().toLocaleDateString('pt-BR');
  const criticos = casos.filter((c) => c.classificacaoRisco === 'Alto risco');
  return `RELATÓRIO OPERACIONAL DIÁRIO\nData: ${data}\n\nProdutividade: ${casos.length} casos registrados.\nOcorrências de relevância: ${criticos.length}.\nComplemento: ${extra || 'Sem complemento.'}`;
};
