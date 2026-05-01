import { enriquecerCaso } from './triageEngine.js';
import type { CasoCompleto, CasoDesaparecimento } from '../../types/case.js';

export interface ValidacoesTriagem {
  etapaValida: boolean;
  pendencias: string[];
}

export interface TriagemState {
  etapa: number;
  dados: CasoDesaparecimento;
  casoCompleto: CasoCompleto;
  validacoes: ValidacoesTriagem;
  status: string;
}

export const camposObrigatoriosPorEtapa: Record<number, Array<keyof CasoDesaparecimento>> = {
  0: ['talaoPMESP', 'dataHoraRegistro', 'municipio'],
  1: ['nomeCompletoDesaparecido', 'idade'],
  2: ['dataHoraUltimaVisualizacao', 'localUltimaVisualizacao'],
  3: ['nomeSolicitante', 'vinculoSolicitante', 'telefoneSolicitante'],
  4: [],
  5: [],
  6: []
};

const vazio = (valor: unknown): boolean => {
  if (typeof valor === 'number') return valor <= 0;
  return String(valor || '').trim().length === 0;
};

export const validarEtapa = (dados: CasoDesaparecimento, etapa: number): ValidacoesTriagem => {
  const obrigatorios = camposObrigatoriosPorEtapa[etapa] || [];
  const pendencias = obrigatorios.filter((campo) => vazio(dados[campo])).map((campo) => String(campo));
  return {
    etapaValida: pendencias.length === 0,
    pendencias
  };
};

export const calcularEstadoTriagem = (dados: CasoDesaparecimento, etapa: number, status = ''): TriagemState => {
  const casoCompleto = enriquecerCaso(dados);
  return {
    etapa,
    dados,
    casoCompleto,
    validacoes: validarEtapa(dados, etapa),
    status
  };
};
