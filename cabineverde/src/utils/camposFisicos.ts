const COR_PELE_PERMITIDA = ['BRANCA', 'PARDA', 'PRETA', 'AMARELA', 'INDIGENA', 'NAO INFORMADO'] as const;
const COR_CABELO_PERMITIDA = ['PRETO', 'CASTANHO', 'LOIRO', 'RUIVO', 'GRISALHO', 'NAO INFORMADO'] as const;
const COR_OLHOS_PERMITIDA = ['CASTANHO', 'PRETO', 'AZUL', 'VERDE', 'MEL', 'NAO INFORMADO'] as const;

const ALTURA_MIN_CM = 30;
const ALTURA_MAX_CM = 250;
const PESO_MIN_KG = 1;
const PESO_MAX_KG = 400;

const paraUpperSemEspacoExtra = (valor: string): string =>
  String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();

const normalizarCampoLista = (valor: string, permitidos: readonly string[]): string => {
  const normalizado = paraUpperSemEspacoExtra(valor);
  return permitidos.includes(normalizado) ? normalizado : 'NAO INFORMADO';
};

const normalizarNumero = (valor: unknown, min: number, max: number): number => {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return 0;
  const inteiro = Math.round(numero);
  if (inteiro < min || inteiro > max) return 0;
  return inteiro;
};

export interface CamposFisicos {
  corPele?: string;
  corCabelo?: string;
  corOlhos?: string;
  alturaAproximada?: number;
  pesoAproximado?: number;
}

export const normalizarCamposFisicos = <T extends CamposFisicos>(dados: T): T => ({
  ...dados,
  corPele: normalizarCampoLista(String(dados.corPele || ''), COR_PELE_PERMITIDA),
  corCabelo: normalizarCampoLista(String(dados.corCabelo || ''), COR_CABELO_PERMITIDA),
  corOlhos: normalizarCampoLista(String(dados.corOlhos || ''), COR_OLHOS_PERMITIDA),
  alturaAproximada: normalizarNumero(dados.alturaAproximada, ALTURA_MIN_CM, ALTURA_MAX_CM),
  pesoAproximado: normalizarNumero(dados.pesoAproximado, PESO_MIN_KG, PESO_MAX_KG)
});
