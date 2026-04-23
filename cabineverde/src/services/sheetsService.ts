import { sheetsConfig } from '../config/env.js';
import type { SheetPayload } from '../types/case.js';

export interface SheetsService {
  salvar(payload: SheetPayload): Promise<{ ok: boolean; message: string }>;
}

export class GoogleSheetsService implements SheetsService {
  async salvar(payload: SheetPayload): Promise<{ ok: boolean; message: string }> {
    if (!sheetsConfig.endpoint || !sheetsConfig.spreadsheetId) {
      return { ok: false, message: 'Integração não configurada. Defina endpoint e spreadsheetId.' };
    }

    const resposta = await fetch(sheetsConfig.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(sheetsConfig.apiKey ? { 'x-api-key': sheetsConfig.apiKey } : {})
      },
      body: JSON.stringify({ spreadsheetId: sheetsConfig.spreadsheetId, ...payload })
    });

    if (!resposta.ok) {
      return { ok: false, message: `Falha ao salvar na planilha (${resposta.status}).` };
    }

    return { ok: true, message: 'Registro enviado à planilha com sucesso.' };
  }
}
