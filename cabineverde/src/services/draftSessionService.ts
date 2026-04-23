import type { TriagemState } from '../modules/triagem/triagemState.js';

const chaveDraft = 'cabine-verde-draft';

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
