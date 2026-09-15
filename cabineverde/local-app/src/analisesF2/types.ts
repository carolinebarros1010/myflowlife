import type { SituacaoPessoa } from './status';

export interface PessoaF2 {
  idPessoa: string;
  nome: string;
  cpf: string;
  rg: string;
  dataNascimento: string;
  telefone: string;
  statusAtual: SituacaoPessoa | null;
  criadoEm: string;
  atualizadoEm: string;
}

export interface AnaliseF2 {
  idAnalise: string;
  dataHoraAnalise: string;
  dataTalao: string;
  horaTalao: string;
  talao: string;
  chaveTalao: string;
  idPessoa: string;
  idCaso: string | null;
  nome: string;
  cpf: string;
  rg: string;
  telefone: string;
  nomeSolicitante: string;
  telefoneSolicitante: string;
  natureza: string;
  historicoF2: string;
  observacoes: string;
  situacaoInformada: SituacaoPessoa | null;
  marcadoresAndamento: Record<string, boolean>;
  origem: string;
  operador: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface EventoHistorico {
  idEvento: string;
  idPessoa: string;
  idAnalise: string | null;
  tipoEvento: string;
  campoAlterado: string | null;
  valorAnterior: unknown;
  valorNovo: unknown;
  operador: string;
  origem: string;
  observacao: string;
  dataHora: string;
}
