import type { CasoDesaparecimento, SubfluxoPerguntas } from '../../types/case.js';

export interface IndicadoresOperacionais {
  criancaSemSupervisao: boolean;
  criancaVeiculoSuspeito: boolean;
  preadolescenteAliciamentoVirtual: boolean;
  adolescenteSofrimentoPsiquico: boolean;
  adultoSuspeitaCrime: boolean;
  idosoDesorientado: boolean;
}

const RESPOSTAS_POSITIVAS = ['sim', 'true', '1', 'positivo'];
const RESPOSTAS_NEGATIVAS = ['nao', 'não', 'false', '0', 'negativo'];

const normalizar = (valor: unknown): string =>
  String(valor || '')
    .trim()
    .toLowerCase();

const lerRespostaSubfluxo = (subfluxo: SubfluxoPerguntas, chave: string): boolean | null => {
  const valor = subfluxo[chave];
  const texto = normalizar(valor);
  if (!texto) return null;
  if (typeof valor === 'boolean') return valor;
  if (RESPOSTAS_POSITIVAS.includes(texto)) return true;
  if (RESPOSTAS_NEGATIVAS.includes(texto)) return false;
  return null;
};

const lerRespostaObservacoes = (observacoes: string, aliases: string[]): boolean | null => {
  const texto = normalizar(observacoes);
  if (!texto) return null;

  for (const alias of aliases) {
    const idRegex = new RegExp(`${alias}\\s*[:=-]\\s*(sim|não|nao|true|false|1|0)`, 'i');
    const matchId = observacoes.match(idRegex);
    if (matchId?.[1]) {
      const resposta = normalizar(matchId[1]);
      if (RESPOSTAS_POSITIVAS.includes(resposta)) return true;
      if (RESPOSTAS_NEGATIVAS.includes(resposta)) return false;
    }
  }

  for (const alias of aliases) {
    if (texto.includes(alias) && texto.includes('sim')) return true;
    if (texto.includes(alias) && (texto.includes('não') || texto.includes('nao'))) return false;
  }

  return null;
};

const resolverIndicador = (subfluxo: SubfluxoPerguntas, observacoes: string, chaves: string[]): boolean => {
  for (const chave of chaves) {
    const subfluxoValor = lerRespostaSubfluxo(subfluxo, chave);
    if (subfluxoValor !== null) return subfluxoValor;

    const observacaoValor = lerRespostaObservacoes(observacoes, [chave]);
    if (observacaoValor !== null) return observacaoValor;
  }

  return false;
};

export const mapearIndicadoresOperacionais = (caso: CasoDesaparecimento): IndicadoresOperacionais => {
  const subfluxo = caso.subfluxoPerguntas || {};
  const observacoes = caso.observacoesOperacionais || '';

  const criancaSobSupervisao = lerRespostaSubfluxo(subfluxo, 'crianca_supervisao_direta') ?? lerRespostaObservacoes(observacoes, ['crianca_supervisao_direta']);

  return {
    criancaSemSupervisao: criancaSobSupervisao === false,
    criancaVeiculoSuspeito: resolverIndicador(subfluxo, observacoes, ['crianca_adulto_veiculo_suspeito']),
    preadolescenteAliciamentoVirtual: resolverIndicador(subfluxo, observacoes, ['preadolescente_aliciamento_virtual']),
    adolescenteSofrimentoPsiquico: resolverIndicador(subfluxo, observacoes, ['adolescente_sofrimento_psiquico']),
    adultoSuspeitaCrime:
      resolverIndicador(subfluxo, observacoes, ['adulto_indicios_violencia']) ||
      resolverIndicador(subfluxo, observacoes, ['passo4_suspeita_crime']) ||
      Boolean(caso.suspeitaCrime),
    idosoDesorientado: resolverIndicador(subfluxo, observacoes, ['idoso_alzheimer_demencia', 'idoso_historico_desorientacao'])
  };
};

const ROTULOS_INDICADORES: Record<keyof IndicadoresOperacionais, string> = {
  criancaSemSupervisao: 'Criança sem supervisão',
  criancaVeiculoSuspeito: 'Criança com veículo/adulto suspeito',
  preadolescenteAliciamentoVirtual: 'Pré-adolescente com suspeita de aliciamento virtual',
  adolescenteSofrimentoPsiquico: 'Adolescente com sofrimento psíquico',
  adultoSuspeitaCrime: 'Adulto com suspeita de crime/violência',
  idosoDesorientado: 'Idoso desorientado (cognitivo)'
};

export const listarIndicadoresAtivos = (indicadores: IndicadoresOperacionais): string[] => {
  return (Object.entries(indicadores) as Array<[keyof IndicadoresOperacionais, boolean]>)
    .filter(([, ativo]) => ativo)
    .map(([chave]) => ROTULOS_INDICADORES[chave]);
};

export type NivelCriticidadeIndicadores = 'Crítica' | 'Alta' | 'Moderada' | 'Baixa';

export const calcularCriticidadeIndicadores = (indicadores: IndicadoresOperacionais): NivelCriticidadeIndicadores => {
  const pontos =
    (indicadores.criancaVeiculoSuspeito ? 4 : 0) +
    (indicadores.preadolescenteAliciamentoVirtual ? 3 : 0) +
    (indicadores.adolescenteSofrimentoPsiquico ? 3 : 0) +
    (indicadores.adultoSuspeitaCrime ? 4 : 0) +
    (indicadores.idosoDesorientado ? 3 : 0) +
    (indicadores.criancaSemSupervisao ? 2 : 0);

  if (pontos >= 7) return 'Crítica';
  if (pontos >= 4) return 'Alta';
  if (pontos >= 2) return 'Moderada';
  return 'Baixa';
};

export const sugerirAcaoIndicadores = (indicadores: IndicadoresOperacionais): string => {
  if (indicadores.criancaVeiculoSuspeito || indicadores.adultoSuspeitaCrime) {
    return 'Registrar encaminhamento imediato com reforço investigativo e varredura de câmeras.';
  }
  if (indicadores.preadolescenteAliciamentoVirtual || indicadores.adolescenteSofrimentoPsiquico) {
    return 'Priorizar busca orientada por rede social, contatos digitais e apoio psicossocial.';
  }
  if (indicadores.idosoDesorientado || indicadores.criancaSemSupervisao) {
    return 'Mobilizar busca territorial de proximidade e rede comunitária imediata.';
  }
  return 'Manter monitoramento operacional e reavaliar respostas da árvore periodicamente.';
};

export const anexarBlocoIndicadoresObservacoes = (observacoesBase: string, indicadores: IndicadoresOperacionais): string => {
  const bloco = [
    '[INDICADORES OPERACIONAIS]',
    ...Object.entries(indicadores).map(([chave, ativo]) => `${chave}: ${ativo ? 'SIM' : 'NÃO'}`)
  ].join('\n');

  const texto = String(observacoesBase || '').trim();
  const semBlocoAnterior = texto.replace(/\[INDICADORES OPERACIONAIS\][\s\S]*$/i, '').trim();
  if (!semBlocoAnterior) return bloco;
  return `${semBlocoAnterior}\n\n${bloco}`;
};
