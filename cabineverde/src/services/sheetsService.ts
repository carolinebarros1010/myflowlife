import { sheetsConfig } from '../config/env.js';
import type { SheetPayload } from '../types/case.js';

export interface SheetsServiceResponse {
  ok: boolean;
  message: string;
  status?: number;
  action?: 'created' | 'updated';
}

export interface SheetsService {
  salvar(payload: SheetPayload): Promise<SheetsServiceResponse>;
}

interface EndpointResponse {
  ok?: boolean;
  message?: string;
  error?: string;
  erro?: string;
  action?: 'created' | 'updated';
}

const parseResponseBody = async (resposta: Response): Promise<EndpointResponse> => {
  try {
    return (await resposta.json()) as EndpointResponse;
  } catch {
    return {};
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

      const body = await parseResponseBody(resposta);
      const detail = body.message || body.error || body.erro || '';
      if (!resposta.ok) {
        return {
          ok: false,
          status: resposta.status,
          message: detail || `Falha ao salvar na planilha (${resposta.status}).`
        };
      }

      const action = body.action;
      const mensagemSucesso =
        action === 'updated' ? 'Caso atualizado com sucesso.' : 'Caso criado com sucesso.';

      return {
        ok: true,
        status: resposta.status,
        action,
        message: detail || mensagemSucesso
      };
    } catch (error) {
      return {
        ok: false,
        message: `Falha ao salvar: ${error instanceof Error ? error.message : 'erro desconhecido'}.`
      };
    }
  }
}
