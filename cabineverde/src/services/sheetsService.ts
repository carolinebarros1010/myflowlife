import { sheetsConfig } from '../config/env.js';
import type { SheetPayload } from '../types/case.js';

export interface SheetsServiceResponse {
  ok: boolean;
  message: string;
  status?: number;
  action?: 'created' | 'updated';
  idCaso?: string;
  linha?: number;
  aba?: string;
  timestamp?: string;
}

export interface SheetsService {
  salvar(payload: SheetPayload): Promise<SheetsServiceResponse>;
  healthcheck(): Promise<SheetsServiceResponse>;
  uploadFotoCaso(payload: { base64: string; mimeType: string; nomeArquivo: string; idCaso: string; talaoPMESP: string; nomeDesaparecido?: string; operadorResponsavel?: string; origemFoto?: string; tipoFoto?: string; autorizacaoUsoImagem?: boolean; nivelAcesso?: string; observacoesFoto?: string; }): Promise<SheetsServiceResponse & { urlFoto?: string }>;
  atualizarFotoCaso(payload: { idCaso?: string; talaoPMESP?: string; urlFoto?: string; linkFoto?: string; fotoDisponivel?: string; statusFotos?: string; }): Promise<SheetsServiceResponse & { urlFoto?: string }>;
  visualizarFoto(
    idFoto: string,
    operador: string,
    justificativa?: string,
    motivoAcessoFoto?: string
  ): Promise<SheetsServiceResponse & { conteudoBase64?: string; mimeType?: string }>;
}

interface EndpointResponse {
  ok?: boolean;
  message?: string;
  error?: string;
  erro?: string;
  action?: 'created' | 'updated';
  idCaso?: string;
  linha?: number;
  aba?: string;
  timestamp?: string;
  data?: EndpointResponse;
}

const parseResponseBody = async (resposta: Response): Promise<EndpointResponse> => {
  try {
    const body = (await resposta.json()) as EndpointResponse;
    if (body.data && typeof body.data === 'object') {
      return { ...body, ...body.data };
    }
    return body;
  } catch {
    return {};
  }
};

export class GoogleSheetsService implements SheetsService {
  async atualizarFotoCaso(payload: { idCaso?: string; talaoPMESP?: string; urlFoto?: string; linkFoto?: string; fotoDisponivel?: string; statusFotos?: string; }): Promise<SheetsServiceResponse & { urlFoto?: string }> {
    try {
      const resposta = await fetch(sheetsConfig.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'atualizarFotoCaso', payload })
      });
      const body = (await parseResponseBody(resposta)) as EndpointResponse & { urlFoto?: string };
      if (!resposta.ok || body.ok === false) {
        return { ok: false, status: resposta.status, message: body.message || 'Falha ao atualizar foto do caso' };
      }
      return { ok: true, status: resposta.status, message: body.message || 'Foto do caso atualizada', urlFoto: body.urlFoto };
    } catch {
      return { ok: false, message: 'Erro de integração com Google Sheets' };
    }
  }

  async uploadFotoCaso(payload: { base64: string; mimeType: string; nomeArquivo: string; idCaso: string; talaoPMESP: string; nomeDesaparecido?: string; operadorResponsavel?: string; origemFoto?: string; tipoFoto?: string; autorizacaoUsoImagem?: boolean; nivelAcesso?: string; observacoesFoto?: string; }): Promise<SheetsServiceResponse & { urlFoto?: string }> {
    try {
      const resposta = await fetch(sheetsConfig.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'uploadFotoCaso', payload })
      });
      const body = (await parseResponseBody(resposta)) as EndpointResponse & { urlFoto?: string; linkArquivo?: string };
      if (!resposta.ok || body.ok === false) {
        return { ok: false, status: resposta.status, message: body.message || 'Falha no upload da foto' };
      }
      return { ok: true, status: resposta.status, message: body.message || 'Foto enviada com sucesso', urlFoto: body.urlFoto || body.linkArquivo };
    } catch {
      return { ok: false, message: 'Erro de integração com Google Sheets' };
    }
  }

  async visualizarFoto(
    idFoto: string,
    operador: string,
    justificativa = '',
    motivoAcessoFoto = ''
  ): Promise<SheetsServiceResponse & { conteudoBase64?: string; mimeType?: string }> {
    try {
      const resposta = await fetch(sheetsConfig.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'visualizarFotoDesaparecido', idFoto, operador, justificativa, motivoAcessoFoto })
      });
      const body = (await parseResponseBody(resposta)) as EndpointResponse & {
        conteudoBase64?: string;
        mimeType?: string;
      };
      if (!resposta.ok || body.ok === false) {
        return { ok: false, status: resposta.status, message: body.message || 'Acesso à foto bloqueado' };
      }
      return {
        ok: true,
        status: resposta.status,
        message: body.message || 'Foto liberada',
        conteudoBase64: body.conteudoBase64,
        mimeType: body.mimeType
      };
    } catch {
      return { ok: false, message: 'Erro de integração com Google Sheets' };
    }
  }

  async healthcheck(): Promise<SheetsServiceResponse> {
    try {
      const resposta = await fetch(sheetsConfig.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'healthcheck' })
      });
      const body = await parseResponseBody(resposta);
      if (!resposta.ok || body.ok === false) {
        return {
          ok: false,
          status: resposta.status,
          message: 'Endpoint indisponível'
        };
      }

      return {
        ok: true,
        status: resposta.status,
        message: body.message || 'Healthcheck concluído com sucesso'
      };
    } catch {
      return {
        ok: false,
        message: 'Endpoint indisponível'
      };
    }
  }

  async salvar(payload: SheetPayload): Promise<SheetsServiceResponse> {
    try {
      const resposta = await fetch(sheetsConfig.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify({
          service: 'cabineverde',
          aba: payload.aba,
          spreadsheetId: sheetsConfig.spreadsheetId,
          colunas: payload.colunas,
          payload: payload.dados,
          abas: payload.abas,
          foto: payload.foto
        })
      });

      const body = await parseResponseBody(resposta);
      const detail = body.message || body.error || body.erro || '';
      if (!resposta.ok || body.ok === false) {
        return {
          ok: false,
          status: resposta.status,
          message: detail || 'Falha ao salvar caso',
          action: body.action,
          idCaso: body.idCaso,
          linha: body.linha,
          aba: body.aba,
          timestamp: body.timestamp
        };
      }

      const action = body.action || 'created';
      const mensagemSucesso = action === 'updated' ? 'Caso atualizado com sucesso' : 'Caso criado com sucesso';

      return {
        ok: true,
        status: resposta.status,
        action,
        message: detail || mensagemSucesso,
        idCaso: body.idCaso,
        linha: body.linha,
        aba: body.aba,
        timestamp: body.timestamp
      };
    } catch {
      return {
        ok: false,
        message: 'Erro de integração com Google Sheets'
      };
    }
  }
}
