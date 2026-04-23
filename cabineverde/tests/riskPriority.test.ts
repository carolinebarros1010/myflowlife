import test from 'node:test';
import assert from 'node:assert/strict';
import { calcularRisco } from '../src/utils/risk.js';
import { calcularPrioridade } from '../src/utils/priority.js';
import { ClassificacaoRisco, Prioridade, StatusCaso } from '../src/types/enums.js';
import type { CasoDesaparecimento } from '../src/types/case.js';

const base: CasoDesaparecimento = {
  id: '1', dataHoraRegistro: '', municipio: '', talaoBopm: '', nomeCompletoDesaparecido: '', sexoGenero: '', idade: 30, cpf: '', rg: '', nomeMae: '', dataNascimento: '', fotoDisponivel: false, linkFoto: '', telefoneDesaparecido: '', dispositivoLigado: false, dataHoraUltimaVisualizacao: '', localUltimaVisualizacao: '', roupaUltimaVisualizacao: '', meioTransporte: '', dadosVeiculo: '', nomeSolicitante: '', vinculoSolicitante: '', telefoneSolicitante: '', vulnerabilidade: false, condicaoMentalCognitivaComportamental: '', limitacaoFisica: '', usoMedicacaoEssencial: false, usoAlcoolOutrasDrogas: false, historicoDesaparecimentoAnterior: false, conflitoPrevio: false, suspeitaCrime: false, locaisHabituais: '', buscasPreliminares: '', camerasResidencia: false, camerasUltimoLocal: false, observacoesOperacionais: '', statusCaso: StatusCaso.EM_TRIAGEM, subfluxoPerguntas: {}
};

test('eleva risco e prioridade para suspeita de crime', () => {
  const caso = { ...base, suspeitaCrime: true };
  assert.equal(calcularRisco(caso), ClassificacaoRisco.ALTO);
  assert.equal(calcularPrioridade(caso), Prioridade.CRITICA);
});
