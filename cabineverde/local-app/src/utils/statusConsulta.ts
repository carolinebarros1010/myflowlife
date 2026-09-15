interface CasoConsulta {
  status?: string;
  statusCaso?: string;
  status_caso?: string;
  statusAtendimento?: string;
  dadosJson?: string;
}

export function statusConsulta(item: CasoConsulta): { classe: string; rotulo: string } {
  let dados: CasoConsulta = {};
  try { dados = JSON.parse(item.dadosJson || '{}'); } catch { /* Usa os campos do registro. */ }
  const status = String(item.statusAtendimento || dados.statusAtendimento || item.statusCaso || item.status_caso || item.status || '').trim();
  const normalizado = status.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[ _]+/g, ' ');
  if (['LOCALIZADO', 'LOCALIZADA', 'LOCALIZADO CUSTODIA', 'LOCALIZADO PRESO', 'LOCALIZADO SEM VIDA', 'LOCALIZADO VIVO', 'LOCALIZADO MORTO', 'ENCERRADO'].includes(normalizado)) return { classe: 'localizado', rotulo: status };
  if (/TRIAGEM|QUALIFICA/.test(normalizado)) return { classe: 'triagem', rotulo: 'Em triagem' };
  return { classe: 'andamento', rotulo: status && normalizado !== 'SEM STATUS' ? status : 'Em andamento' };
}
