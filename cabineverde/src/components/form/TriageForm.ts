import { StatusCaso } from '../../types/enums.js';

const input = (name: string, label: string, type = 'text') => `
  <label>${label}<input name="${name}" type="${type}" /></label>`;

const checkbox = (name: string, label: string) => `
  <label class="cv-check"><input name="${name}" type="checkbox" /> ${label}</label>`;

export const renderTriageForm = (): string => `
<section class="cv-card">
  <h2>Triagem dinâmica</h2>
  <form id="triage-form" class="cv-form">
    <div class="cv-grid">
      ${input('dataHoraRegistro', 'Data/hora registro', 'datetime-local')}
      ${input('municipio', 'Município')}
      ${input('talaoBopm', 'Talão BOPM')}
      ${input('nomeCompletoDesaparecido', 'Nome completo desaparecido')}
      ${input('sexoGenero', 'Sexo/Gênero')}
      ${input('idade', 'Idade', 'number')}
      ${input('cpf', 'CPF')}
      ${input('rg', 'RG')}
      ${input('nomeMae', 'Nome da mãe')}
      ${input('dataNascimento', 'Data de nascimento', 'date')}
      ${input('telefoneDesaparecido', 'Telefone desaparecido')}
      ${input('dataHoraUltimaVisualizacao', 'Última visualização', 'datetime-local')}
      ${input('localUltimaVisualizacao', 'Local última visualização')}
      ${input('roupaUltimaVisualizacao', 'Roupa última visualização')}
      ${input('meioTransporte', 'Meio de transporte')}
      ${input('dadosVeiculo', 'Dados veículo')}
      ${input('nomeSolicitante', 'Nome solicitante')}
      ${input('vinculoSolicitante', 'Vínculo solicitante')}
      ${input('telefoneSolicitante', 'Telefone solicitante')}
      ${input('condicaoMentalCognitivaComportamental', 'Condição mental/cognitiva/comportamental')}
      ${input('limitacaoFisica', 'Limitação física')}
      ${input('locaisHabituais', 'Locais habituais')}
      ${input('buscasPreliminares', 'Buscas preliminares')}
      ${input('observacoesOperacionais', 'Observações operacionais')}
      ${input('statusCaso', 'Status caso (Em triagem/Em busca/Localizado/Encerrado)')}
      ${input('linkFoto', 'Link da foto')}
    </div>
    <div class="cv-grid">
      ${checkbox('fotoDisponivel', 'Foto disponível')}
      ${checkbox('dispositivoLigado', 'Dispositivo ligado')}
      ${checkbox('vulnerabilidade', 'Vulnerabilidade')}
      ${checkbox('usoMedicacaoEssencial', 'Uso de medicação essencial')}
      ${checkbox('usoAlcoolOutrasDrogas', 'Uso de álcool/outras drogas')}
      ${checkbox('historicoDesaparecimentoAnterior', 'Histórico de desaparecimento anterior')}
      ${checkbox('conflitoPrevio', 'Conflito prévio')}
      ${checkbox('suspeitaCrime', 'Suspeita de crime')}
      ${checkbox('camerasResidencia', 'Câmeras na residência')}
      ${checkbox('camerasUltimoLocal', 'Câmeras no último local')}
    </div>
    <div class="cv-actions">
      <button type="submit">Salvar caso</button>
      <button type="button" id="generate-report">Gerar relatório diário</button>
    </div>
  </form>
</section>`;

export const statusFallback = StatusCaso.EM_TRIAGEM;
