import { StatusCaso } from '../../types/enums.js';

const input = (name: string, label: string, type = 'text', required = false) => `
  <label>${label}<input name="${name}" type="${type}" ${required ? 'required' : ''} /></label>`;

const checkbox = (name: string, label: string) => `
  <label class="cv-check"><input name="${name}" type="checkbox" /> ${label}</label>`;

const etapa = (step: number, titulo: string, conteudo: string) => `
<fieldset class="cv-step-section" data-step="${step}" ${step === 0 ? '' : 'hidden'}>
  <legend>${titulo}</legend>
  <div class="cv-grid">${conteudo}</div>
</fieldset>`;

export const renderTriageForm = (): string => `
<section class="cv-card">
  <h2>Triagem dinâmica operacional</h2>
  <form id="triage-form" class="cv-form" novalidate>
    ${etapa(
      0,
      '1) Identificação do caso',
      [
        input('idCaso', 'ID do caso (preencha para atualização)'),
        input('dataHoraRegistro', 'Data/hora registro', 'datetime-local', true),
        input('municipio', 'Município', 'text', true),
        input('talaoBopm', 'Talão BOPM'),
        input('statusCaso', 'Status caso')
      ].join('')
    )}

    ${etapa(
      1,
      '2) Dados do desaparecido',
      [
        input('nomeCompletoDesaparecido', 'Nome completo desaparecido', 'text', true),
        input('sexoGenero', 'Sexo/Gênero'),
        input('idade', 'Idade', 'number', true),
        input('cpf', 'CPF'),
        input('rg', 'RG'),
        input('nomeMae', 'Nome da mãe'),
        input('dataNascimento', 'Data de nascimento', 'date'),
        input('telefoneDesaparecido', 'Telefone desaparecido')
      ].join('')
    )}

    ${etapa(
      2,
      '3) Última visualização',
      [
        input('dataHoraUltimaVisualizacao', 'Última visualização', 'datetime-local', true),
        input('localUltimaVisualizacao', 'Local última visualização', 'text', true),
        input('roupaUltimaVisualizacao', 'Roupa última visualização'),
        input('meioTransporte', 'Meio de transporte'),
        input('dadosVeiculo', 'Dados veículo'),
        input('locaisHabituais', 'Locais habituais'),
        input('buscasPreliminares', 'Buscas preliminares')
      ].join('')
    )}

    ${etapa(
      3,
      '4) Solicitante',
      [
        input('nomeSolicitante', 'Nome solicitante', 'text', true),
        input('vinculoSolicitante', 'Vínculo solicitante', 'text', true),
        input('telefoneSolicitante', 'Telefone solicitante', 'text', true)
      ].join('')
    )}

    ${etapa(
      4,
      '5) Vulnerabilidade e risco',
      [
        input('condicaoMentalCognitivaComportamental', 'Condição mental/cognitiva/comportamental'),
        input('limitacaoFisica', 'Limitação física'),
        checkbox('vulnerabilidade', 'Vulnerabilidade'),
        checkbox('usoMedicacaoEssencial', 'Uso de medicação essencial'),
        checkbox('usoAlcoolOutrasDrogas', 'Uso de álcool/outras drogas'),
        checkbox('historicoDesaparecimentoAnterior', 'Histórico de desaparecimento anterior'),
        checkbox('conflitoPrevio', 'Conflito prévio'),
        checkbox('suspeitaCrime', 'Suspeita de crime')
      ].join('')
    )}

    ${etapa(
      5,
      '6) Apoio tecnológico',
      [
        checkbox('fotoDisponivel', 'Foto disponível'),
        input('linkFoto', 'Link da foto'),
        checkbox('dispositivoLigado', 'Dispositivo ligado'),
        checkbox('camerasResidencia', 'Câmeras na residência'),
        checkbox('camerasUltimoLocal', 'Câmeras no último local')
      ].join('')
    )}

    ${etapa(
      6,
      '7) Resumo e ação final',
      [input('observacoesOperacionais', 'Observações operacionais')].join('')
    )}
  </form>
</section>`;

export const statusFallback = StatusCaso.EM_TRIAGEM;
