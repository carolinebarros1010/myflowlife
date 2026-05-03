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

const inputOcultoArvore = (name: string) => `<input type="hidden" name="${name}" id="${name}" />`;

export const renderTriageForm = (): string => `
<section class="cv-card">
  <h2>Triagem dinâmica operacional</h2>
  <form id="triage-form" class="cv-form" novalidate>
    ${[
      'arv_p1_emergencia_resp',
      'arv_p1_municipio_resp',
      'arv_p1_nome_resp',
      'arv_p1_sexo_resp',
      'arv_p1_idade_resp',
      'arv_p1_foto_recente_resp',
      'arv_p1_dispositivo_vinculado_resp',
      'arv_p2_data_hora_ultima_resp',
      'arv_p2_local_ultima_resp',
      'arv_p2_roupa_resp',
      'arv_p2_meio_transporte_resp',
      'arv_p2_dados_veiculo_resp',
      'arv_p3_vinculo_resp',
      'arv_p3_vinculo_comp',
      'arv_p3_telefone_comp',
      'urlFoto',
      'linkFoto'
    ].map(inputOcultoArvore).join('')}
    ${etapa(
      0,
      '1) Identificação complementar',
      [
        input('idCaso', 'ID do caso (preencha para atualização)'),
        input('talaoPMESP', 'Talão PMESP', 'text', true, 'placeholder="Ex.: 2026-000123" pattern="[A-Za-z0-9\\-\\/]{6,20}" title="Use letras, números, hífen ou barra (6 a 20 caracteres)."'),
        input('dataHoraRegistro', 'Data/hora registro', 'datetime-local', true),
        input('talaoBopm', 'Talão BOPM'),
        select('statusCaso', 'Status caso', ['EM_TRIAGEM', 'EM_BUSCA', 'LOCALIZADO_VIVO', 'LOCALIZADO_OBITO', 'ENCERRADO'], true)
      ].join('')
    )}

    ${etapa(
      1,
      '2) Dados complementares do desaparecido',
      [
        input('cpf', 'CPF'),
        input('rg', 'RG'),
        input('nomeMae', 'Nome da mãe'),
        input('dataNascimento', 'Data de nascimento', 'date'),
        input('telefoneDesaparecido', 'Telefone desaparecido', 'tel', false, 'placeholder="(11) 99999-0000" pattern="^\\(?\\d{2}\\)?\\s?\\d{4,5}-?\\d{4}$"'),
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
      '3) Contexto adicional',
      [
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
      '4) Solicitante complementar',
      [
        input('vinculoSolicitante', 'Vínculo solicitante', 'text', true),
        input('telefoneSolicitante', 'Telefone solicitante', 'tel', true, 'placeholder="(11) 99999-0000" pattern="^\\(?\\d{2}\\)?\\s?\\d{4,5}-?\\d{4}$"')
      ].join('')
    )}

    ${etapa(
      4,
      '5) Vulnerabilidade e risco',
      [
        checkbox('vulnerabilidade', 'Vulnerabilidade'),
        `<div id="vulnerability-details" class="cv-grid cv-grid--nested">
          ${input('condicaoMentalCognitivaComportamental', 'Condição mental/cognitiva/comportamental')}
          ${input('limitacaoFisica', 'Limitação física')}
          ${checkbox('usoMedicacaoEssencial', 'Uso de medicação essencial')}
          ${checkbox('usoAlcoolOutrasDrogas', 'Uso de álcool/outras drogas')}
          ${checkbox('historicoDesaparecimentoAnterior', 'Histórico de desaparecimento anterior')}
        </div>`,
        checkbox('conflitoPrevio', 'Conflito prévio'),
        checkbox('suspeitaCrime', 'Suspeita de crime')
      ].join('')
    )}

    ${etapa(
      5,
      '6) Apoio tecnológico',
      [
        select('fotoDisponivel', 'Foto digital disponível?', ['Sim', 'Não']),
        `<div id="blocoUploadFotoDesaparecido" class="cv-photo-upload" hidden>
          <label for="fotoDesaparecido">Inserir foto do desaparecido</label>
          <input type="file" id="fotoDesaparecido" name="fotoDesaparecido" accept="image/*" capture="environment" />
          <input type="hidden" id="urlFoto" name="urlFoto" />
          <input type="hidden" id="linkFoto" name="linkFoto" />
          <div id="statusUploadFoto" class="cv-photo-status">Nenhuma imagem enviada.</div>
          <img id="previewFotoDesaparecido" class="cv-photo-preview" alt="Prévia da foto do desaparecido" hidden />
        </div>`,
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

export const renderRegistroForm = (): string => `
<section class="cv-card">
  <h2>Registro inicial</h2>
  <form id="registro-form" class="cv-form" novalidate>
    <fieldset class="cv-step-section">
      <legend>Registro rápido</legend>
      <div class="cv-grid">
        ${input('talaoPMESP', 'Número do Talão PMESP', 'text', true, 'placeholder="Ex.: 2026-000123" pattern="[A-Za-z0-9\\-\\/]{6,20}" title="Use letras, números, hífen ou barra (6 a 20 caracteres)." autofocus')}
        ${input('nomeCompletoDesaparecido', 'Nome', 'text', true)}
        ${input('idade', 'Idade', 'number', true, 'min="0" max="120" step="1"')}
        ${input('sexoGenero', 'Sexo', 'text', true)}
        ${input('municipio', 'Município', 'text', true)}
        ${input('dataHoraUltimaVisualizacao', 'Última visualização', 'datetime-local', true)}
        ${input('nomeSolicitante', 'Solicitante', 'text', true)}
        ${input('telefoneSolicitante', 'Telefone solicitante', 'tel', true, 'placeholder="(11) 99999-0000" pattern="^\\(?\\d{2}\\)?\\s?\\d{4,5}-?\\d{4}$"')}
      </div>
      <div class="cv-inline-actions">
        <button id="save-registro" type="submit" class="cv-button cv-button--primary">Salvar</button>
      </div>
    </fieldset>
  </form>
</section>`;

export const statusFallback = StatusCaso.EM_TRIAGEM;
