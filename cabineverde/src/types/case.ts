import { ClassificacaoRisco, FaixaEtaria, Prioridade, StatusCaso } from './enums.js';
import type { IndicadoresOperacionais, NivelCriticidadeIndicadores } from '../modules/triagem/indicadoresOperacionais.js';

export interface SubfluxoPerguntas {
  [pergunta: string]: boolean | string;
}

export interface CasoDesaparecimento {
  id: string;
  talaoPMESP: string;
  dataHoraRegistro: string;
  municipio: string;
  talaoBopm: string;
  nomeCompletoDesaparecido: string;
  sexoGenero: string;
  idade: number;
  cpf: string;
  rg: string;
  nomeMae: string;
  dataNascimento: string;
  corPele?: string;
  alturaAproximada?: number;
  pesoAproximado?: number;
  corCabelo?: string;
  corOlhos?: string;
  caracteristicasMarcantes?: string;
  statusFoto?: 'pendente' | 'enviada' | 'validada';
  fotoDisponivel: boolean;
  linkFoto: string;
  urlFoto?: string;
  telefoneDesaparecido: string;
  dispositivoLigado: boolean;
  dataHoraUltimaVisualizacao: string;
  localUltimaVisualizacao: string;
  roupaUltimaVisualizacao: string;
  meioTransporte: string;
  dadosVeiculo: string;
  nomeSolicitante: string;
  vinculoSolicitante: string;
  telefoneSolicitante: string;
  vulnerabilidade: boolean;
  condicaoMentalCognitivaComportamental: string;
  limitacaoFisica: string;
  usoMedicacaoEssencial: boolean;
  usoAlcoolOutrasDrogas: boolean;
  historicoDesaparecimentoAnterior: boolean;
  conflitoPrevio: boolean;
  suspeitaCrime: boolean;
  locaisHabituais: string;
  buscasPreliminares: string;
  camerasResidencia: boolean;
  camerasUltimoLocal: boolean;
  observacoesOperacionais: string;
  operadorCriador?: string;
  operadorUltimaAcao?: string;
  statusCaso: StatusCaso;
  subfluxoPerguntas: SubfluxoPerguntas;
}

export interface CamposCalculados {
  faixaEtaria: FaixaEtaria;
  classificacaoRisco: ClassificacaoRisco;
  prioridade: Prioridade;
  acaoSugerida: string;
  aptoCabineVerde: boolean;
  indicadoresOperacionais: IndicadoresOperacionais;
  criticidadeIndicadores: NivelCriticidadeIndicadores;
}

export interface CasoCompleto extends CasoDesaparecimento, CamposCalculados {}

export type SheetCellValue = string | number | boolean;

export interface AbaPayload {
  aba: string;
  colunas: string[];
  valores: SheetCellValue[];
}

export interface SheetPayload {
  aba: 'CASOS';
  colunas: string[];
  dados: Record<string, SheetCellValue>;
  valores: SheetCellValue[];
  abas: AbaPayload[];
  foto?: {
    base64: string;
    nomeArquivo: string;
    mimeType: string;
  };
}
