import { FaixaEtaria } from '../types/enums.js';

export const calcularFaixaEtaria = (idade: number): FaixaEtaria => {
  if (idade <= 7) return FaixaEtaria.CRIANCA;
  if (idade <= 11) return FaixaEtaria.PRE_ADOLESCENTE;
  if (idade <= 17) return FaixaEtaria.ADOLESCENTE;
  if (idade <= 59) return FaixaEtaria.ADULTO;
  return FaixaEtaria.IDOSO;
};
