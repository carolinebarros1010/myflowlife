export const FaixaEtaria = {
  CRIANCA: 'Criança',
  PRE_ADOLESCENTE: 'Pré-adolescente',
  ADOLESCENTE: 'Adolescente',
  ADULTO: 'Adulto',
  IDOSO: 'Idoso'
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

export const gerarPayloadSheets = (caso) => ({
  aba: 'Desaparecidos',
  valores: Object.values(caso)
});

export const gerarRelatorioOperacional = (casos, extra = '') => {
  const data = new Date().toLocaleDateString('pt-BR');
  const criticos = casos.filter((c) => c.classificacaoRisco === 'Alto risco');
  return `RELATÓRIO OPERACIONAL DIÁRIO\nData: ${data}\n\nProdutividade: ${casos.length} casos registrados.\nOcorrências de relevância: ${criticos.length}.\nComplemento: ${extra || 'Sem complemento.'}`;
};
