import { sheetsConfig } from '../config/env.js';
import type { SheetPayload } from '../types/case.js';

export interface SheetsServiceResponse {
  ok: boolean;
  message: string;
  status?: number;
}

export interface SheetsService {
  salvar(payload: SheetPayload): Promise<SheetsServiceResponse>;
}

const parseResponseMessage = async (resposta: Response): Promise<string> => {
  try {
    const corpo = (await resposta.json()) as { message?: string; error?: string; erro?: string };
    return corpo.message || corpo.error || corpo.erro || '';
  } catch {
    return '';
  }
};

export class GoogleSheetsService implements SheetsService {
  async salvar(payload: SheetPayload): Promise<SheetsServiceResponse> {
    if (!sheetsConfig.endpoint) {
      return { ok: false, message: 'Integração não configurada. Defina CABINE_VERDE_SHEETS_ENDPOINT.' };
    }

    try {
      const resposta = await fetch(sheetsConfig.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          service: 'cabineverde',
          aba: payload.aba,
          spreadsheetId: sheetsConfig.spreadsheetId,
          colunas: payload.colunas,
          payload: payload.dados
        })
      });

      const detail = await parseResponseMessage(resposta);
      if (!resposta.ok) {
        return {
          ok: false,
          status: resposta.status,
          message: detail || `Falha ao salvar na planilha (${resposta.status}).`
        };
      }

      return {
        ok: true,
        status: resposta.status,
        message: detail || 'Caso salvo com sucesso.'
      };
    } catch (error) {
      return {
        ok: false,
        message: `Falha ao salvar: ${error instanceof Error ? error.message : 'erro desconhecido'}.`
      };
    }
  }
}
