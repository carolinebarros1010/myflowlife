export type FinalizacaoAdministrativa = {
  statusVitima?: string | null;
  condicaoVitima?: string | null;
  desfechoCaso?: string | null;
  recursoPrincipal?: string | null;
  recursoLocalizacao?: string | null;
  atuacaoExclusivaCabine?: string | boolean | null;
  atuacaoExclusivaCabineVerde?: string | boolean | null;
};

function normalizar(valor: unknown): string {
  return String(valor ?? '').trim().toLocaleLowerCase('pt-BR');
}

function ehSim(valor: unknown): boolean {
  return ['sim', 'true', '1', 'yes'].includes(normalizar(valor));
}

function ehNao(valor: unknown): boolean {
  return ['não', 'nao', 'false', '0', 'no'].includes(normalizar(valor));
}

/** Deriva somente classificações administrativas seguras e explicitamente informadas. */
export function derivarCategoriaAdministrativa(finalizacao: FinalizacaoAdministrativa): string | null {
  const status = normalizar(finalizacao.statusVitima);
  const condicao = normalizar(finalizacao.condicaoVitima);
  const desfecho = normalizar(finalizacao.desfechoCaso);
  const recurso = normalizar(finalizacao.recursoPrincipal ?? finalizacao.recursoLocalizacao);
  const atuacao = finalizacao.atuacaoExclusivaCabine ?? finalizacao.atuacaoExclusivaCabineVerde;

  if (status === 'localizada morta' || condicao === 'em óbito' || desfecho === 'encerrado - óbito') return 'MORTA';
  if (status === 'localizada presa' || condicao === 'custodiada' || desfecho === 'encerrado - presa') return 'PRESA_CUSTODIA';
  if (ehSim(atuacao)) return 'CABINE_MURALHA';
  if (ehNao(atuacao) && recurso === 'viatura') return 'VTR_PM';
  return null;
}
