import { StatusCaso } from '../../types/enums.js';

const input = (name: string, label: string, type = 'text', required = false, attrs = '') => `
  <label>${label}<input name="${name}" type="${type}" ${required ? 'required' : ''} ${attrs} /></label>`;

const checkbox = (name: string, label: string) => `
  <label class="cv-check"><input name="${name}" type="checkbox" /> ${label}</label>`;

const select = (name: string, label: string, opcoes: string[], required = false) => `
  <label>${label}
    <select name="${name}" ${required ? 'required' : ''}>
      <option value="">Selecione</option>
      ${opcoes.map((opcao) => `<option value="${opcao}">${opcao}</option>`).join('')}
    </select>
  </label>`;

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
        input('talaoPMESP', 'Talão PMESP', 'text', true),
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
        input('telefoneDesaparecido', 'Telefone desaparecido'),
        select('corPele', 'Cor da pele', ['BRANCA', 'PARDA', 'PRETA', 'AMARELA', 'INDIGENA', 'NAO INFORMADO']),
        input('alturaAproximada', 'Altura aproximada (cm)', 'number', false, 'min="30" max="250" step="1" inputmode="numeric"'),
        input('pesoAproximado', 'Peso aproximado (kg)', 'number', false, 'min="1" max="400" step="1" inputmode="numeric"'),
        select('corCabelo', 'Cor do cabelo', ['PRETO', 'CASTANHO', 'LOIRO', 'RUIVO', 'GRISALHO', 'NAO INFORMADO']),
        select('corOlhos', 'Cor dos olhos', ['CASTANHO', 'PRETO', 'AZUL', 'VERDE', 'MEL', 'NAO INFORMADO']),
        input('caracteristicasMarcantes', 'Características marcantes')
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
        '<label class="cv-upload">Upload da foto (obrigatório quando disponível)<input type="file" id="fotoDesaparecido" name="fotoDesaparecido" accept="image/*" /><small id="foto-status" class="cv-upload-status">Status da foto: pendente</small></label>',
        select('origemFoto', 'Origem da foto', ['Solicitante', 'Familiar', 'Câmera', 'Outro']),
        select('tipoFoto', 'Tipo da foto', ['Recente', 'Documento', 'Câmera', 'Outro']),
        checkbox('autorizacaoUsoImagem', 'Autorização de uso de imagem'),
        checkbox('dispositivoLigado', 'Dispositivo ligado'),
        checkbox('camerasResidencia', 'Câmeras na residência'),
        checkbox('camerasUltimoLocal', 'Câmeras no último local')
      ].join('')
    )}

    ${etapa(
      6,
      '7) Resumo e ação final',
      [
        input('observacoesOperacionais', 'Observações operacionais'),
        input('idFotoVisualizacao', 'ID da foto para visualização controlada'),
        input('justificativaVisualizacao', 'Justificativa de visualização (obrigatória para RESTRITO/SIGILOSO)'),
        input('feedbackOperacional', 'Feedback operacional (melhoria/erro percebido)')
      ].join('')
    )}
  </form>
</section>`;

export const statusFallback = StatusCaso.EM_TRIAGEM;
