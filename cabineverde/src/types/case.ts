import { ClassificacaoRisco, FaixaEtaria, Prioridade, StatusCaso } from './enums.js';

export interface SubfluxoPerguntas {
  [pergunta: string]: boolean | string;
}

export interface CasoDesaparecimento {
  id: string;
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
  fotoDisponivel: boolean;
  linkFoto: string;
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
  statusCaso: StatusCaso;
  subfluxoPerguntas: SubfluxoPerguntas;
}

export interface CamposCalculados {
  faixaEtaria: FaixaEtaria;
  classificacaoRisco: ClassificacaoRisco;
  prioridade: Prioridade;
  acaoSugerida: string;
  aptoCabineVerde: boolean;
}

export interface CasoCompleto extends CasoDesaparecimento, CamposCalculados {}

export type SheetCellValue = string | number | boolean;

export interface SheetPayload {
  aba: 'Desaparecidos' | 'Listas' | 'Relatorio_Diario' | 'Painel' | 'Ocorrencias_Relevancia' | 'Config';
  colunas: string[];
  dados: Record<string, SheetCellValue>;
  valores: SheetCellValue[];
}
