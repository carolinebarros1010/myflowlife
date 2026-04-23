export interface RegistroAuditoria {
  timestamp: string;
  acao: string;
  usuario: string;
  alteracao: string;
}

const chaveLogs = 'cabine-verde-auditoria';

export const listarLogs = (): RegistroAuditoria[] => {
  const bruto = localStorage.getItem(chaveLogs);
  return bruto ? (JSON.parse(bruto) as RegistroAuditoria[]) : [];
};

export const registrarLog = (registro: RegistroAuditoria): void => {
  const logs = listarLogs();
  localStorage.setItem(chaveLogs, JSON.stringify([registro, ...logs].slice(0, 100)));
};
