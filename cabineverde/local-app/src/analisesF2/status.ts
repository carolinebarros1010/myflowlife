export const SITUACOES_PESSOA = [
  'DESAPARECIDO',
  'LOCALIZADO',
  'LOCALIZADO_PRESO',
  'LOCALIZADO_SEM_VIDA',
  'NAO_CONFIRMADO'
] as const;

export type SituacaoPessoa = typeof SITUACOES_PESSOA[number];

export interface AnaliseF2ParaStatus {
  dataHoraAnalise: string;
  situacaoInformada: SituacaoPessoa | null;
}

/** Reconstrói o status somente a partir de situações explícitas do histórico. */
export const calcularStatusAtualPessoa = (
  analisesOrdenadas: readonly AnaliseF2ParaStatus[]
): SituacaoPessoa | null => {
  const analises = [...analisesOrdenadas].sort((a, b) =>
    String(a.dataHoraAnalise).localeCompare(String(b.dataHoraAnalise))
  );
  for (let indice = analises.length - 1; indice >= 0; indice -= 1) {
    if (analises[indice].situacaoInformada) return analises[indice].situacaoInformada;
  }
  return null;
};
