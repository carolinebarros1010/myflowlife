export const normalizarTexto = (valor: string): string => valor.trim().replace(/\s+/g, ' ');

export const normalizarTelefone = (valor: string): string => valor.replace(/\D/g, '').slice(0, 11);

export const toBoolean = (valor: FormDataEntryValue | null): boolean => valor === 'true' || valor === 'on';
