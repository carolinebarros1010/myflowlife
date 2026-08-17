const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('cabineVerdeLocal', {
  listarOperadores: () => ipcRenderer.invoke('cv:operadores'),
  registrarOperador: (dados) => ipcRenderer.invoke('cv:registrar-operador', dados),
  entrarOperador: (email) => ipcRenderer.invoke('cv:entrar-operador', email),
  dashboard: () => ipcRenderer.invoke('cv:dashboard'),
  listarCasos: (termo) => ipcRenderer.invoke('cv:casos', termo),
  carregarCaso: (idCaso) => ipcRenderer.invoke('cv:caso', idCaso),
  listarFotos: (idCaso) => ipcRenderer.invoke('cv:fotos', idCaso),
  adicionarFoto: (idCaso) => ipcRenderer.invoke('cv:adicionar-foto', idCaso),
  registrarConsentimentoFoto: (dados) => ipcRenderer.invoke('cv:registrar-consentimento-foto', dados),
  auditoria: () => ipcRenderer.invoke('cv:auditoria')
  ,listarAuditoriaCasos: (termo) => ipcRenderer.invoke('cv:auditoria-casos', termo),
  historicoCaso: (idCaso) => ipcRenderer.invoke('cv:historico-caso', idCaso),
  corrigirCaso: (dados) => ipcRenderer.invoke('cv:corrigir-caso', dados)
  ,salvarDesfechoOperacional: (dados) => ipcRenderer.invoke('cv:salvar-desfecho-operacional', dados)
});
