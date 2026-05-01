import type { TriagemState } from '../modules/triagem/triagemState.js';

const chaveDraft = 'cabine-verde-draft';
const chaveAutoDraft = 'cabine-verde-autodraft';
const chaveAutoDraftUltimo = 'cabine-verde-autodraft:last';

export const gerarSessionId = (): string => `SESS-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

export const salvarRascunhoLocal = (sessionId: string, state: TriagemState): void => {
  localStorage.setItem(`${chaveDraft}:${sessionId}`, JSON.stringify(state));
};

export const carregarRascunhoLocal = (sessionId: string): TriagemState | null => {
  const bruto = localStorage.getItem(`${chaveDraft}:${sessionId}`);
  return bruto ? (JSON.parse(bruto) as TriagemState) : null;
};

export const exportarRascunhoSessao = (state: TriagemState): string => {
  const json = JSON.stringify(state);
  return btoa(unescape(encodeURIComponent(json)));
};

export const importarRascunhoSessao = (token: string): TriagemState | null => {
  try {
    const json = decodeURIComponent(escape(atob(token)));
    return JSON.parse(json) as TriagemState;
  } catch {
    return null;
  }
};

const normalizarChave = (valor: string): string => valor.trim().replace(/\s+/g, '-').toUpperCase();

export const obterChaveAutoRascunho = (idCaso?: string, talaoPMESP?: string): string | null => {
  if (idCaso && idCaso.trim()) return `ID-${normalizarChave(idCaso)}`;
  if (talaoPMESP && talaoPMESP.trim()) return `TALAO-${normalizarChave(talaoPMESP)}`;
  return null;
};

export const salvarAutoRascunhoLocal = (chave: string, state: TriagemState): void => {
  localStorage.setItem(`${chaveAutoDraft}:${chave}`, JSON.stringify(state));
  localStorage.setItem(chaveAutoDraftUltimo, chave);
};

export const carregarAutoRascunhoLocal = (chave: string): TriagemState | null => {
  const bruto = localStorage.getItem(`${chaveAutoDraft}:${chave}`);
  return bruto ? (JSON.parse(bruto) as TriagemState) : null;
};

export const limparAutoRascunhoLocal = (chave: string): void => {
  localStorage.removeItem(`${chaveAutoDraft}:${chave}`);
  if (localStorage.getItem(chaveAutoDraftUltimo) === chave) localStorage.removeItem(chaveAutoDraftUltimo);
};

export const carregarUltimoAutoRascunho = (): { chave: string; draft: TriagemState } | null => {
  const chave = localStorage.getItem(chaveAutoDraftUltimo);
  if (!chave) return null;
  const draft = carregarAutoRascunhoLocal(chave);
  return draft ? { chave, draft } : null;
};
