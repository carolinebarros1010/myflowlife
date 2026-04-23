import type { CasoDesaparecimento } from '../types/case.js';
import { Prioridade, ClassificacaoRisco } from '../types/enums.js';
import { calcularRisco } from './risk.js';

export const calcularPrioridade = (caso: CasoDesaparecimento): Prioridade => {
  const risco = calcularRisco(caso);
  if (risco === ClassificacaoRisco.ALTO) return caso.suspeitaCrime ? Prioridade.CRITICA : Prioridade.ALTA;
  if (risco === ClassificacaoRisco.MODERADO) return Prioridade.MEDIA;
  return Prioridade.BAIXA;
};

export const calcularAcaoSugerida = (caso: CasoDesaparecimento): string => {
  const prioridade = calcularPrioridade(caso);
  if (prioridade === Prioridade.CRITICA) return 'Acionar equipe de campo imediata, polícia judiciária e rede de câmeras.';
  if (prioridade === Prioridade.ALTA) return 'Disparar protocolo de busca prioritária com divulgação e validação de pontos críticos.';
  if (prioridade === Prioridade.MEDIA) return 'Conduzir busca qualificada e monitorar evolução a cada 2 horas.';
  return 'Registrar, orientar solicitante e seguir monitoramento de rotina.';
};
