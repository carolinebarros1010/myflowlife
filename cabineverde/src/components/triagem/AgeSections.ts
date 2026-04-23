export const renderAgeSections = (): string => `
<section class="cv-card">
  <h3>Subfluxo por perfil</h3>
  <div id="age-questions"></div>
</section>`;

export const perguntasPorFaixa = {
  'Criança': [
    'Estava sob supervisão direta?',
    'Consegue informar nome/endereço/telefone?',
    'Há disputa familiar?',
    'Houve adulto desconhecido ou veículo suspeito?'
  ],
  'Pré-adolescente': [
    'Desaparecimento após escola/esporte/deslocamento habitual?',
    'Histórico de sair sem autorização?',
    'Suspeita de aliciamento virtual?',
    'Conflito familiar, escolar ou social?'
  ],
  'Adolescente': [
    'Já saiu anteriormente sem autorização?',
    'Houve discussão familiar, afetiva ou escolar?',
    'Há indícios de fuga voluntária?',
    'Há ameaça, aliciamento, rede social ou sofrimento psíquico intenso?'
  ],
  'Adulto': [
    'Houve mudança abrupta de comportamento?',
    'Há transtorno mental, crise emocional ou uso de medicação controlada?',
    'Há histórico de rompimento de vínculos ou desaparecimento voluntário?',
    'Há indícios de violência, dívida, ameaça ou conflito criminal?'
  ],
  'Idoso': [
    'Há Alzheimer, demência, desorientação ou perda de memória?',
    'Há limitação de locomoção, visão, audição ou comunicação?',
    'Faz uso de medicação essencial?',
    'Costuma sair sozinho?',
    'Já apresentou episódio anterior de desorientação?'
  ]
} as const;
