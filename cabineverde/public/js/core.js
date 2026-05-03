export const ENDPOINT_OFICIAL_APPS_SCRIPT =
  'https://script.google.com/macros/s/AKfycbyWmW1-MNFprc83mtns2FrQCL2x-k5rckwUDI2p6d0L4dzVYxLLQRg4cyB28JLG_501zw/exec';

const CHAVES_OPERADOR = {
  email: 'cabineVerdeOperadorEmail',
  nome: 'cabineVerdeOperadorNome',
  perfil: 'cabineVerdeOperadorPerfil',
  validadoEm: 'cabineVerdeOperadorValidadoEm'
};

export const obterOperadorLocal = () => ({
  operadorEmail: String(localStorage.getItem(CHAVES_OPERADOR.email) || '').trim().toLowerCase(),
  operadorNome: String(localStorage.getItem(CHAVES_OPERADOR.nome) || '').trim(),
  operadorPerfil: String(localStorage.getItem(CHAVES_OPERADOR.perfil) || '').trim().toUpperCase(),
  operadorValidadoEm: String(localStorage.getItem(CHAVES_OPERADOR.validadoEm) || '').trim()
});

const SESSAO_MAXIMA_MS = 12 * 60 * 60 * 1000;
export const sessaoOperadorExpirada = () => {
  const validadoEmRaw = obterOperadorLocal().operadorValidadoEm;
  if (!validadoEmRaw) return true;
  const validadoEmMs = Date.parse(validadoEmRaw);
  if (!Number.isFinite(validadoEmMs)) return true;
  return Date.now() - validadoEmMs > SESSAO_MAXIMA_MS;
};

export const operadorEstaValidadoLocalmente = () => {
  const operador = obterOperadorLocal();
  if (!operador.operadorEmail) return false;
  if (sessaoOperadorExpirada()) {
    limparOperadorLocal();
    return false;
  }
  return true;
};
export const limparOperadorLocal = () => Object.values(CHAVES_OPERADOR).forEach((chave) => localStorage.removeItem(chave));
export const salvarOperadorLocal = (operador) => {
  localStorage.setItem(CHAVES_OPERADOR.email, String(operador.email || '').trim().toLowerCase());
  localStorage.setItem(CHAVES_OPERADOR.nome, String(operador.nome || '').trim());
  localStorage.setItem(CHAVES_OPERADOR.perfil, String(operador.perfil || 'OPERADOR').trim().toUpperCase());
  localStorage.setItem(CHAVES_OPERADOR.validadoEm, new Date().toISOString());
};

export const validarOperador_ = async (operadorEmail) => chamarAcaoGAS('validarOperador', { operadorEmail });

export const FaixaEtaria = {
  CRIANCA: 'Criança',
  PRE_ADOLESCENTE: 'Pré-adolescente',
  ADOLESCENTE: 'Adolescente',
  ADULTO: 'Adulto',
  IDOSO: 'Idoso'
};

export const OPCOES_SIM_NAO_NI = ['', 'Sim', 'Não', 'Não informado'];

export const ARVORE_DECISAO_CONFIG = {
  passos: [
    {
      id: 'passo1',
      titulo: 'PASSO 1 – Identificação mínima',
      perguntas: [
        { id: 'passo1_emergencia', pergunta: 'Qual é a sua emergência?', tipo: 'texto' },
        { id: 'passo1_municipio', pergunta: 'Qual o município?', tipo: 'texto' },
        { id: 'passo1_nome', pergunta: 'Qual o nome da pessoa desaparecida?', tipo: 'texto' },
        { id: 'passo1_sexo_genero', pergunta: 'Qual o sexo ou gênero?', tipo: 'texto' },
        { id: 'passo1_idade', pergunta: 'Qual a idade?', tipo: 'texto' },
        { id: 'passo1_dados_identificacao', pergunta: 'Você possui dados de identificação da pessoa desaparecida?', tipo: 'simNao' },
        { id: 'passo1_foto_digital', pergunta: 'Você possui foto digital recente da pessoa desaparecida?', tipo: 'simNao', complementoLabel: 'Informar link/forma de acesso da foto' },
        { id: 'passo1_dispositivo', pergunta: 'Há telefone celular, tablet ou outro dispositivo vinculado à pessoa desaparecida?', tipo: 'simNao', complementoLabel: 'Registrar dispositivo e número/identificação' }
      ]
    },
    {
      id: 'passo2',
      titulo: 'PASSO 2 – Última visualização',
      perguntas: [
        { id: 'passo2_data_hora', pergunta: 'Você sabe informar o dia e o horário em que a pessoa foi vista pela última vez?', tipo: 'texto' },
        { id: 'passo2_local', pergunta: 'Você sabe onde a pessoa foi vista pela última vez?', tipo: 'texto' },
        { id: 'passo2_roupa', pergunta: 'Você sabe qual roupa a pessoa usava quando foi vista pela última vez?', tipo: 'texto' },
        { id: 'passo2_transporte', pergunta: 'A pessoa desaparecida estava a pé ou utilizava algum meio de transporte?', tipo: 'texto' },
        { id: 'passo2_caracteristicas_transporte', pergunta: 'Você possui características do veículo ou meio de transporte utilizado?', tipo: 'texto' }
      ]
    },
    {
      id: 'passo3',
      titulo: 'PASSO 3 – Vínculo e contexto',
      perguntas: [
        { id: 'passo3_vinculo', pergunta: 'Você é familiar, responsável, cuidador ou pessoa próxima da desaparecida?', tipo: 'texto' },
        { id: 'passo3_acompanhada', pergunta: 'A pessoa desaparecida estava acompanhada antes do desaparecimento?', tipo: 'simNao', complementoLabel: 'Registrar com quem estava' },
        { id: 'passo3_estudo_trabalho', pergunta: 'Você sabe informar onde essa pessoa estuda, trabalha ou realiza atividade habitual?', tipo: 'texto' },
        { id: 'passo3_rotina_fixa', pergunta: 'Essa pessoa possui rotina fixa conhecida?', tipo: 'simNao', complementoLabel: 'Descrever rotina fixa conhecida' },
        { id: 'passo3_locais_frequentes', pergunta: 'Você conhece locais que essa pessoa costuma frequentar?', tipo: 'simNao', complementoLabel: 'Registrar locais habituais' },
        { id: 'passo3_vinculo_emocional', pergunta: 'Há locais com vínculo emocional relevante para essa pessoa?', tipo: 'simNao', complementoLabel: 'Descrever locais de vínculo emocional' }
      ]
    },
    {
      id: 'passo4',
      titulo: 'PASSO 4 – Vulnerabilidade e risco',
      perguntas: [
        { id: 'passo4_condicao_mental', pergunta: 'Essa pessoa possui alguma condição de saúde mental, cognitiva ou comportamental que aumente sua vulnerabilidade?', tipo: 'simNao', complementoLabel: 'Descrever condição informada' },
        { id: 'passo4_limitacao_fisica', pergunta: 'Essa pessoa possui alguma limitação física relevante?', tipo: 'simNao', complementoLabel: 'Descrever limitação física' },
        { id: 'passo4_depende_supervisao', pergunta: 'Essa pessoa depende de cuidador, responsável ou supervisão frequente?', tipo: 'simNao', complementoLabel: 'Registrar responsável/cuidador' },
        { id: 'passo4_medicacao', pergunta: 'Essa pessoa faz uso contínuo de medicação essencial?', tipo: 'simNao', complementoLabel: 'Registrar medicação essencial' },
        { id: 'passo4_alcool_drogas', pergunta: 'Essa pessoa faz uso de álcool ou outras drogas?', tipo: 'simNao' },
        { id: 'passo4_desapareceu_antes', pergunta: 'Essa pessoa já desapareceu anteriormente?', tipo: 'simNao' },
        { id: 'passo4_intencao_fuga', pergunta: 'Essa pessoa já comentou que pretendia fugir, desaparecer ou ir para outro local?', tipo: 'simNao' },
        { id: 'passo4_conflito', pergunta: 'Houve alguma desavença, ameaça, conflito familiar, afetivo ou social antes do desaparecimento?', tipo: 'simNao', complementoLabel: 'Descrever conflito/desavença' },
        { id: 'passo4_suspeita_crime', pergunta: 'Você acredita que exista possibilidade de sequestro, violência ou outro crime?', tipo: 'simNao', complementoLabel: 'Descrever suspeita de crime' }
      ]
    },
    {
      id: 'passo5',
      titulo: 'PASSO 5 – Buscas preliminares e meios disponíveis',
      perguntas: [
        { id: 'passo5_procuraram_locais', pergunta: 'Já procuraram essa pessoa nos locais habituais?', tipo: 'simNao' },
        { id: 'passo5_procuraram_comodos', pergunta: 'Já procuraram em todos os cômodos da residência ou do local de origem?', tipo: 'simNao' },
        { id: 'passo5_tentativa_contato', pergunta: 'Alguém tentou contato telefônico ou por aplicativo?', tipo: 'simNao' },
        { id: 'passo5_aparelho_ligado', pergunta: 'O aparelho celular da pessoa está ligado ou recebendo chamadas?', tipo: 'simNao' },
        { id: 'passo5_cameras_residencia', pergunta: 'Há câmeras na residência da pessoa desaparecida?', tipo: 'simNao' },
        { id: 'passo5_cameras_ultimo_local', pergunta: 'Há câmeras no último local em que ela foi vista?', tipo: 'simNao' },
        { id: 'passo5_contatos_apoio', pergunta: 'Existe algum contato de pessoas que já fizeram buscas ou que possam apoiar na localização?', tipo: 'texto' },
        { id: 'passo5_registro_delegacia', pergunta: 'Foi realizado registro do desaparecimento em Delegacia física ou Delegacia Eletrônica?', tipo: 'simNao', complementoLabel: 'Registrar nº BO / Delegacia / status' }
      ]
    }
  ],
  subabas: {
    Criança: {
      titulo: 'SUBABA – Criança 0–7',
      perguntas: [
        { id: 'crianca_supervisao_direta', pergunta: 'A criança desaparecida estava sob supervisão direta de um adulto no momento anterior ao desaparecimento?', tipo: 'simNao', complementoLabel: 'Registrar quem' },
        { id: 'crianca_informa_dados', pergunta: 'A criança tem condição de informar nome, endereço ou telefone?', tipo: 'simNao' },
        { id: 'crianca_condicao_comunicacao', pergunta: 'A criança possui transtorno do neurodesenvolvimento, deficiência ou condição que dificulte comunicação/orientação?', tipo: 'simNao', complementoLabel: 'Descrever condição' },
        { id: 'crianca_guarda_disputa', pergunta: 'Há guarda compartilhada, disputa familiar ou possibilidade de retirada por familiar sem aviso?', tipo: 'simNao', complementoLabel: 'Descrever contexto de guarda/disputa' },
        { id: 'crianca_local_desaparecimento', pergunta: 'A criança desapareceu de casa, escola, via pública, transporte ou outro local?', tipo: 'texto' },
        { id: 'crianca_adulto_veiculo_suspeito', pergunta: 'Houve algum adulto desconhecido, veículo suspeito ou situação incomum antes do desaparecimento?', tipo: 'simNao', complementoLabel: 'Descrever situação incomum' }
      ]
    },
    'Pré-adolescente': {
      titulo: 'SUBABA – Pré-adolescente 8–11',
      perguntas: [
        { id: 'preadolescente_contexto_saida', pergunta: 'O desaparecimento ocorreu após saída da escola, atividade esportiva, casa de terceiros ou deslocamento habitual?', tipo: 'simNao', complementoLabel: 'Descrever contexto da saída' },
        { id: 'preadolescente_historico_sair', pergunta: 'Há histórico de sair sozinho sem autorização?', tipo: 'simNao' },
        { id: 'preadolescente_aliciamento_virtual', pergunta: 'Há suspeita de aliciamento virtual, contato com desconhecidos ou convite para encontro?', tipo: 'simNao', complementoLabel: 'Descrever indícios de aliciamento' },
        { id: 'preadolescente_conflito_recente', pergunta: 'Há conflito familiar, escolar ou social recente?', tipo: 'simNao', complementoLabel: 'Descrever conflito recente' },
        { id: 'preadolescente_guarda_disputa', pergunta: 'Há guarda compartilhada, disputa entre responsáveis ou possibilidade de retirada por conhecido?', tipo: 'simNao', complementoLabel: 'Descrever disputa entre responsáveis' }
      ]
    },
    Adolescente: {
      titulo: 'SUBABA – Adolescente 12–17',
      perguntas: [
        { id: 'adolescente_historico_saida', pergunta: 'O adolescente já saiu de casa anteriormente sem autorização?', tipo: 'simNao' },
        { id: 'adolescente_discussao_previa', pergunta: 'Houve discussão familiar, afetiva ou escolar antes do desaparecimento?', tipo: 'simNao', complementoLabel: 'Descrever discussão prévia' },
        { id: 'adolescente_indicios_fuga', pergunta: 'Há indícios de fuga voluntária?', tipo: 'simNao', complementoLabel: 'Descrever indícios de fuga' },
        { id: 'adolescente_envolvimento_terceiros', pergunta: 'Há suspeita de envolvimento com terceiros, redes sociais, relacionamento afetivo, aliciamento ou ameaça?', tipo: 'simNao', complementoLabel: 'Descrever suspeita com terceiros/redes' },
        { id: 'adolescente_sofrimento_psiquico', pergunta: 'O adolescente tem histórico de automutilação, ideação suicida, surto, uso abusivo de substâncias ou sofrimento psíquico intenso?', tipo: 'simNao', complementoLabel: 'Descrever histórico de sofrimento psíquico' },
        { id: 'adolescente_guarda_litigio', pergunta: 'Há guarda compartilhada, litígio familiar ou possibilidade de retenção por responsável?', tipo: 'simNao', complementoLabel: 'Descrever litígio familiar' }
      ]
    },
    Adulto: {
      titulo: 'SUBABA – Adulto 18–59',
      perguntas: [
        { id: 'adulto_mudanca_comportamento', pergunta: 'O adulto apresentou mudança abrupta de comportamento antes do desaparecimento?', tipo: 'simNao', complementoLabel: 'Descrever mudança de comportamento' },
        { id: 'adulto_transtorno_mental', pergunta: 'Há diagnóstico ou suspeita de transtorno mental, uso de medicação controlada ou crise emocional recente?', tipo: 'simNao', complementoLabel: 'Descrever diagnóstico/suspeita' },
        { id: 'adulto_historico_fuga', pergunta: 'Há histórico de tentativa de fuga, desaparecimento voluntário ou rompimento de vínculos?', tipo: 'simNao', complementoLabel: 'Descrever histórico de fuga/rompimento' },
        { id: 'adulto_indicios_violencia', pergunta: 'Há indícios de violência doméstica, ameaça, dívida, perseguição, conflito criminal ou outra situação de risco?', tipo: 'simNao', complementoLabel: 'Descrever indícios de risco' },
        { id: 'adulto_deslocamento_rotina', pergunta: 'O desaparecimento ocorreu em deslocamento para trabalho, retorno para casa ou local de rotina?', tipo: 'simNao', complementoLabel: 'Descrever deslocamento de rotina' },
        { id: 'adulto_dependencia_tratamento', pergunta: 'O adulto depende de medicação, tratamento, acompanhamento ou possui limitação funcional relevante?', tipo: 'simNao', complementoLabel: 'Descrever dependência de tratamento' }
      ]
    },
    Idoso: {
      titulo: 'SUBABA – Idoso 60+',
      perguntas: [
        { id: 'idoso_alzheimer_demencia', pergunta: 'O idoso possui diagnóstico de Alzheimer, demência, desorientação, confusão mental ou perda de memória?', tipo: 'simNao', complementoLabel: 'Descrever diagnóstico/suspeita cognitiva' },
        { id: 'idoso_dificuldade_comunicacao', pergunta: 'O idoso tem dificuldade de locomoção, visão, audição ou comunicação?', tipo: 'simNao', complementoLabel: 'Descrever limitações' },
        { id: 'idoso_medicacao_continua', pergunta: 'O idoso faz uso de medicação contínua essencial?', tipo: 'simNao', complementoLabel: 'Registrar medicação contínua' },
        { id: 'idoso_sai_sozinho', pergunta: 'O idoso costuma sair sozinho?', tipo: 'simNao' },
        { id: 'idoso_desapareceu_deslocamento', pergunta: 'O idoso desapareceu durante caminhada, ida a comércio, consulta, visita ou deslocamento habitual?', tipo: 'simNao', complementoLabel: 'Descrever deslocamento habitual' },
        { id: 'idoso_historico_desorientacao', pergunta: 'O idoso já apresentou episódio anterior de desorientação ou desaparecimento?', tipo: 'simNao', complementoLabel: 'Registrar episódios anteriores' }
      ]
    }
  }
};

const COLUNAS_DESAPARECIDOS_BASE = [
  'idCaso',
  'dataHoraRegistro',
  'dataServico',
  'turno',
  'equipe',
  'operadorResponsavel',
  'municipio',
  'talaoBopm',
  'statusCaso',
  'nomeCompletoDesaparecido',
  'sexoGenero',
  'idade',
  'faixaEtaria',
  'cpf',
  'rg',
  'nomeMae',
  'dataNascimento',
  'dataHoraUltimaVisualizacao',
  'localUltimaVisualizacao',
  'roupaUltimaVisualizacao',
  'meioTransporte',
  'dadosVeiculo',
  'fotoDisponivel',
  'linkFoto',
  'telefoneDesaparecido',
  'dispositivoLigado',
  'camerasResidencia',
  'camerasUltimoLocal',
  'aptoCabineVerde',
  'nomeSolicitante',
  'vinculoSolicitante',
  'telefoneSolicitante',
  'vulnerabilidade',
  'condicaoMentalCognitivaComportamental',
  'limitacaoFisica',
  'usoMedicacaoEssencial',
  'usoAlcoolOutrasDrogas',
  'historicoDesaparecimentoAnterior',
  'conflitoPrevio',
  'suspeitaCrime',
  'locaisHabituais',
  'buscasPreliminares',
  'classificacaoRisco',
  'prioridade',
  'acaoSugerida',
  'localizado',
  'dataHoraLocalizacao',
  'formaLocalizacao',
  'encerrado190',
  'numeroBo',
  'observacoesOperacionais'
];

const COLUNAS_ARVORE_DESAPARECIDOS = [
  'arv_p1_emergencia_resp',
  'arv_p1_emergencia_comp',
  'arv_p1_municipio_resp',
  'arv_p1_municipio_comp',
  'arv_p1_nome_resp',
  'arv_p1_nome_comp',
  'arv_p1_sexo_resp',
  'arv_p1_sexo_comp',
  'arv_p1_idade_resp',
  'arv_p1_idade_comp',
  'arv_p1_dados_identificacao_resp',
  'arv_p1_dados_identificacao_comp',
  'arv_p1_foto_recente_resp',
  'arv_p1_foto_recente_comp',
  'arv_p1_dispositivo_vinculado_resp',
  'arv_p1_dispositivo_vinculado_comp',
  'arv_p2_data_hora_ultima_resp',
  'arv_p2_data_hora_ultima_comp',
  'arv_p2_local_ultima_resp',
  'arv_p2_local_ultima_comp',
  'arv_p2_roupa_resp',
  'arv_p2_roupa_comp',
  'arv_p2_meio_transporte_resp',
  'arv_p2_meio_transporte_comp',
  'arv_p2_dados_veiculo_resp',
  'arv_p2_dados_veiculo_comp',
  'arv_p3_vinculo_resp',
  'arv_p3_vinculo_comp',
  'arv_p3_acompanhada_resp',
  'arv_p3_acompanhada_comp',
  'arv_p3_estuda_trabalha_atividade_resp',
  'arv_p3_estuda_trabalha_atividade_comp',
  'arv_p3_rotina_fixa_resp',
  'arv_p3_rotina_fixa_comp',
  'arv_p3_locais_frequenta_resp',
  'arv_p3_locais_frequenta_comp',
  'arv_p3_vinculo_emocional_resp',
  'arv_p3_vinculo_emocional_comp',
  'arv_p4_condicao_saude_mental_resp',
  'arv_p4_condicao_saude_mental_comp',
  'arv_p4_limitacao_fisica_resp',
  'arv_p4_limitacao_fisica_comp',
  'arv_p4_depende_cuidador_resp',
  'arv_p4_depende_cuidador_comp',
  'arv_p4_medicacao_essencial_resp',
  'arv_p4_medicacao_essencial_comp',
  'arv_p4_uso_alcool_drogas_resp',
  'arv_p4_uso_alcool_drogas_comp',
  'arv_p4_desaparecimento_anterior_resp',
  'arv_p4_desaparecimento_anterior_comp',
  'arv_p4_intencao_fugir_resp',
  'arv_p4_intencao_fugir_comp',
  'arv_p4_conflito_previo_resp',
  'arv_p4_conflito_previo_comp',
  'arv_p4_suspeita_crime_resp',
  'arv_p4_suspeita_crime_comp',
  'arv_p5_procurou_locais_habituais_resp',
  'arv_p5_procurou_locais_habituais_comp',
  'arv_p5_conferiu_comodos_resp',
  'arv_p5_conferiu_comodos_comp',
  'arv_p5_tentou_contato_resp',
  'arv_p5_tentou_contato_comp',
  'arv_p5_celular_ligado_resp',
  'arv_p5_celular_ligado_comp',
  'arv_p5_cameras_residencia_resp',
  'arv_p5_cameras_residencia_comp',
  'arv_p5_cameras_ultimo_local_resp',
  'arv_p5_cameras_ultimo_local_comp',
  'arv_p5_contatos_busca_resp',
  'arv_p5_contatos_busca_comp',
  'arv_p5_bo_delegacia_resp',
  'arv_p5_bo_delegacia_comp',
  'arv_crianca_supervisao_resp',
  'arv_crianca_supervisao_comp',
  'arv_crianca_informa_dados_resp',
  'arv_crianca_informa_dados_comp',
  'arv_crianca_neurodesenvolvimento_resp',
  'arv_crianca_neurodesenvolvimento_comp',
  'arv_crianca_disputa_familiar_resp',
  'arv_crianca_disputa_familiar_comp',
  'arv_crianca_local_desaparecimento_resp',
  'arv_crianca_local_desaparecimento_comp',
  'arv_crianca_adulto_veiculo_suspeito_resp',
  'arv_crianca_adulto_veiculo_suspeito_comp',
  'arv_preadolescente_contexto_saida_resp',
  'arv_preadolescente_contexto_saida_comp',
  'arv_preadolescente_historico_sair_sozinho_resp',
  'arv_preadolescente_historico_sair_sozinho_comp',
  'arv_preadolescente_aliciamento_virtual_resp',
  'arv_preadolescente_aliciamento_virtual_comp',
  'arv_preadolescente_conflito_recente_resp',
  'arv_preadolescente_conflito_recente_comp',
  'arv_preadolescente_disputa_responsaveis_resp',
  'arv_preadolescente_disputa_responsaveis_comp',
  'arv_adolescente_saiu_sem_autorizacao_resp',
  'arv_adolescente_saiu_sem_autorizacao_comp',
  'arv_adolescente_discussao_previa_resp',
  'arv_adolescente_discussao_previa_comp',
  'arv_adolescente_fuga_voluntaria_resp',
  'arv_adolescente_fuga_voluntaria_comp',
  'arv_adolescente_terceiros_redes_ameaca_resp',
  'arv_adolescente_terceiros_redes_ameaca_comp',
  'arv_adolescente_sofrimento_psiquico_resp',
  'arv_adolescente_sofrimento_psiquico_comp',
  'arv_adolescente_litigio_familiar_resp',
  'arv_adolescente_litigio_familiar_comp',
  'arv_adulto_mudanca_comportamento_resp',
  'arv_adulto_mudanca_comportamento_comp',
  'arv_adulto_crise_emocional_medicacao_resp',
  'arv_adulto_crise_emocional_medicacao_comp',
  'arv_adulto_historico_fuga_rompimento_resp',
  'arv_adulto_historico_fuga_rompimento_comp',
  'arv_adulto_violencia_divida_ameaca_resp',
  'arv_adulto_violencia_divida_ameaca_comp',
  'arv_adulto_trajeto_rotina_resp',
  'arv_adulto_trajeto_rotina_comp',
  'arv_adulto_dependencia_tratamento_resp',
  'arv_adulto_dependencia_tratamento_comp',
  'arv_idoso_alzheimer_demencia_resp',
  'arv_idoso_alzheimer_demencia_comp',
  'arv_idoso_limitacao_locomocao_comunicacao_resp',
  'arv_idoso_limitacao_locomocao_comunicacao_comp',
  'arv_idoso_medicacao_essencial_resp',
  'arv_idoso_medicacao_essencial_comp',
  'arv_idoso_costuma_sair_sozinho_resp',
  'arv_idoso_costuma_sair_sozinho_comp',
  'arv_idoso_desapareceu_rotina_resp',
  'arv_idoso_desapareceu_rotina_comp',
  'arv_idoso_historico_desorientacao_resp',
  'arv_idoso_historico_desorientacao_comp'
];

const COLUNAS_DESAPARECIDOS = [...COLUNAS_DESAPARECIDOS_BASE, ...COLUNAS_ARVORE_DESAPARECIDOS];

const hojeIso = (dataHoraRegistro) => {
  const data = new Date(dataHoraRegistro || Date.now());
  if (Number.isNaN(data.getTime())) return new Date().toISOString().slice(0, 10);
  return data.toISOString().slice(0, 10);
};

const normalizarRespostaArvore = (valor) => {
  if (typeof valor === 'boolean') return valor ? 'Sim' : 'Não';
  const texto = String(valor ?? '').trim();
  return texto || 'Não informado';
};

const normalizarComplementoArvore = (valor) => String(valor ?? '').trim();

const mapearCamposArvore = (caso = {}) => {
  const subfluxo = caso.subfluxoPerguntas || caso.arvoreDecisao || {};
  return COLUNAS_ARVORE_DESAPARECIDOS.reduce((acc, coluna) => {
    const valor = subfluxo[coluna];
    acc[coluna] = coluna.endsWith('_resp') ? normalizarRespostaArvore(valor) : normalizarComplementoArvore(valor);
    return acc;
  }, {});
};

export const calcularFaixaEtaria = (idade) => {
  if (idade <= 7) return FaixaEtaria.CRIANCA;
  if (idade <= 11) return FaixaEtaria.PRE_ADOLESCENTE;
  if (idade <= 17) return FaixaEtaria.ADOLESCENTE;
  if (idade <= 59) return FaixaEtaria.ADULTO;
  return FaixaEtaria.IDOSO;
};

export const avaliarAlertasArvore = (respostas = {}, faixaEtaria = '') => {
  const alertas = [];
  if (faixaEtaria === FaixaEtaria.CRIANCA && respostas.crianca_supervisao_direta === 'Não') {
    alertas.push('Criança sem supervisão direta: vulnerabilidade elevada.');
  }
  if (faixaEtaria === FaixaEtaria.CRIANCA && respostas.crianca_adulto_veiculo_suspeito === 'Sim') {
    alertas.push('Criança com adulto desconhecido/veículo suspeito: alerta crítico.');
  }
  if (faixaEtaria === FaixaEtaria.PRE_ADOLESCENTE && respostas.preadolescente_aliciamento_virtual === 'Sim') {
    alertas.push('Pré-adolescente com suspeita de aliciamento virtual: alerta crítico.');
  }
  if (faixaEtaria === FaixaEtaria.ADOLESCENTE && respostas.adolescente_sofrimento_psiquico === 'Sim') {
    alertas.push('Adolescente com sofrimento psíquico intenso: alta prioridade.');
  }
  if (faixaEtaria === FaixaEtaria.ADULTO && respostas.adulto_indicios_violencia === 'Sim') {
    alertas.push('Adulto com indícios de violência/dívida/ameaça: suspeita de crime.');
  }
  if (faixaEtaria === FaixaEtaria.IDOSO && respostas.idoso_alzheimer_demencia === 'Sim') {
    alertas.push('Idoso com Alzheimer/demência/desorientação: prioridade máxima.');
  }
  return alertas;
};


export const mapearIndicadoresOperacionais = (respostas = {}) => ({
  criancaSemSupervisao: respostas.crianca_supervisao_direta === 'Não',
  criancaVeiculoSuspeito: respostas.crianca_adulto_veiculo_suspeito === 'Sim',
  preadolescenteAliciamentoVirtual: respostas.preadolescente_aliciamento_virtual === 'Sim',
  adolescenteSofrimentoPsiquico: respostas.adolescente_sofrimento_psiquico === 'Sim',
  adultoSuspeitaCrime: respostas.adulto_indicios_violencia === 'Sim' || respostas.passo4_suspeita_crime === 'Sim',
  idosoDesorientado: respostas.idoso_alzheimer_demencia === 'Sim' || respostas.idoso_historico_desorientacao === 'Sim'
});

export const listarIndicadoresAtivos = (indicadores = {}) =>
  Object.entries(indicadores)
    .filter(([, ativo]) => Boolean(ativo))
    .map(([chave]) => chave);

export const calcularCriticidadeIndicadores = (indicadores = {}) => {
  const pontos =
    (indicadores.criancaVeiculoSuspeito ? 4 : 0) +
    (indicadores.preadolescenteAliciamentoVirtual ? 3 : 0) +
    (indicadores.adolescenteSofrimentoPsiquico ? 3 : 0) +
    (indicadores.adultoSuspeitaCrime ? 4 : 0) +
    (indicadores.idosoDesorientado ? 3 : 0) +
    (indicadores.criancaSemSupervisao ? 2 : 0);

  if (pontos >= 7) return 'Crítica';
  if (pontos >= 4) return 'Alta';
  if (pontos >= 2) return 'Moderada';
  return 'Baixa';
};

export const sugerirAcaoIndicadores = (indicadores = {}) => {
  if (indicadores.criancaVeiculoSuspeito || indicadores.adultoSuspeitaCrime) {
    return 'Registrar encaminhamento imediato com reforço investigativo e varredura de câmeras.';
  }
  if (indicadores.preadolescenteAliciamentoVirtual || indicadores.adolescenteSofrimentoPsiquico) {
    return 'Priorizar busca orientada por rede social, contatos digitais e apoio psicossocial.';
  }
  if (indicadores.idosoDesorientado || indicadores.criancaSemSupervisao) {
    return 'Mobilizar busca territorial de proximidade e rede comunitária imediata.';
  }
  return 'Manter monitoramento operacional e reavaliar respostas da árvore periodicamente.';
};

export const contarPerguntasRespondidas = (respostas = {}, complemento = {}) => {
  const respondidas = Object.values(respostas).filter((valor) => String(valor || '').trim()).length;
  const complementos = Object.values(complemento).filter((valor) => String(valor || '').trim()).length;
  return { respondidas, complementos };
};

export const gerarObservacoesArvore = ({ respostas = {}, complementos = {}, faixaEtaria = '', observacoesOperador = '' }) => {
  const secoes = ['[ÁRVORE DE DECISÃO – 190/193]'];

  ARVORE_DECISAO_CONFIG.passos.forEach((passo) => {
    secoes.push('', passo.titulo);
    passo.perguntas.forEach(({ id, pergunta }) => {
      secoes.push(`Pergunta: ${pergunta}`);
      secoes.push(`Resposta: ${String(respostas[id] || 'Não informado').trim() || 'Não informado'}`);
      secoes.push(`Complemento: ${String(complementos[id] || '-').trim() || '-'}`);
      secoes.push('');
    });
  });

  const subaba = ARVORE_DECISAO_CONFIG.subabas[faixaEtaria];
  if (subaba) {
    secoes.push(subaba.titulo);
    subaba.perguntas.forEach(({ id, pergunta }) => {
      secoes.push(`Pergunta: ${pergunta}`);
      secoes.push(`Resposta: ${String(respostas[id] || 'Não informado').trim() || 'Não informado'}`);
      secoes.push(`Complemento: ${String(complementos[id] || '-').trim() || '-'}`);
      secoes.push('');
    });
  }

  const alertas = avaliarAlertasArvore(respostas, faixaEtaria);
  if (alertas.length) {
    secoes.push('[ALERTAS AUTOMÁTICOS]');
    alertas.forEach((alerta) => secoes.push(`- ${alerta}`));
    secoes.push('');
  }

  secoes.push('[OBSERVAÇÕES DO OPERADOR]');
  secoes.push(String(observacoesOperador || '').trim() || '-');

  return { texto: secoes.join('\n').replace(/\n{3,}/g, '\n\n').trim(), alertas };
};

export const calcularRisco = (caso, indicadores = caso.indicadoresOperacionais || {}) => {
  const faixa = calcularFaixaEtaria(Number(caso.idade || 0));
  const alertaEstruturado = Object.values(indicadores).some(Boolean);
  if (faixa === FaixaEtaria.CRIANCA || caso.suspeitaCrime || caso.vulnerabilidade || caso.usoMedicacaoEssencial || alertaEstruturado) return 'Alto risco';
  if (faixa === FaixaEtaria.ADOLESCENTE || caso.usoAlcoolOutrasDrogas || caso.conflitoPrevio) return 'Risco moderado';
  return 'Baixo risco';
};

export const calcularPrioridade = (caso, indicadores = caso.indicadoresOperacionais || {}) => {
  const risco = calcularRisco(caso, indicadores);
  if (indicadores.criancaVeiculoSuspeito || indicadores.adultoSuspeitaCrime) return 'Crítica';
  if (indicadores.preadolescenteAliciamentoVirtual || indicadores.adolescenteSofrimentoPsiquico || indicadores.idosoDesorientado) return 'Alta';
  if (risco === 'Alto risco') return caso.suspeitaCrime ? 'Crítica' : 'Alta';
  if (risco === 'Risco moderado') return 'Média';
  return 'Baixa';
};

export const calcularAptoCabineVerde = (caso, indicadores = caso.indicadoresOperacionais || {}) => {
  const pontos = [caso.fotoDisponivel, caso.dispositivoLigado, Boolean(caso.localUltimaVisualizacao), caso.camerasResidencia || caso.camerasUltimoLocal];
  const baseApta = pontos.filter(Boolean).length >= 3;
  const criticidadeSemSuporte = (indicadores.criancaVeiculoSuspeito || indicadores.adultoSuspeitaCrime || indicadores.preadolescenteAliciamentoVirtual) && !(caso.dispositivoLigado || caso.camerasResidencia || caso.camerasUltimoLocal);
  return baseApta && !criticidadeSemSuporte;
};

export const gerarPayloadSheets = (caso) => {
  const dados = {
    idCaso: caso.id || `CV-${Date.now()}`,
    dataHoraRegistro: caso.dataHoraRegistro || new Date().toISOString(),
    dataServico: hojeIso(caso.dataHoraRegistro),
    turno: caso.turno || '',
    equipe: caso.equipe || 'Cabine Verde',
    operadorResponsavel: caso.operadorResponsavel || '',
    municipio: caso.municipio || '',
    talaoBopm: caso.talaoBopm || '',
    statusCaso: caso.statusCaso || 'Em triagem',
    nomeCompletoDesaparecido: caso.nomeCompletoDesaparecido || '',
    sexoGenero: caso.sexoGenero || '',
    idade: Number(caso.idade || 0),
    faixaEtaria: caso.faixaEtaria || calcularFaixaEtaria(Number(caso.idade || 0)),
    cpf: caso.cpf || '',
    rg: caso.rg || '',
    nomeMae: caso.nomeMae || '',
    dataNascimento: caso.dataNascimento || '',
    dataHoraUltimaVisualizacao: caso.dataHoraUltimaVisualizacao || '',
    localUltimaVisualizacao: caso.localUltimaVisualizacao || '',
    roupaUltimaVisualizacao: caso.roupaUltimaVisualizacao || '',
    meioTransporte: caso.meioTransporte || '',
    dadosVeiculo: caso.dadosVeiculo || '',
    fotoDisponivel: Boolean(caso.fotoDisponivel),
    linkFoto: caso.linkFoto || '',
    telefoneDesaparecido: caso.telefoneDesaparecido || '',
    dispositivoLigado: Boolean(caso.dispositivoLigado),
    camerasResidencia: Boolean(caso.camerasResidencia),
    camerasUltimoLocal: Boolean(caso.camerasUltimoLocal),
    aptoCabineVerde: Boolean(caso.aptoCabineVerde),
    nomeSolicitante: caso.nomeSolicitante || '',
    vinculoSolicitante: caso.vinculoSolicitante || '',
    telefoneSolicitante: caso.telefoneSolicitante || '',
    vulnerabilidade: Boolean(caso.vulnerabilidade),
    condicaoMentalCognitivaComportamental: caso.condicaoMentalCognitivaComportamental || '',
    limitacaoFisica: caso.limitacaoFisica || '',
    usoMedicacaoEssencial: Boolean(caso.usoMedicacaoEssencial),
    usoAlcoolOutrasDrogas: Boolean(caso.usoAlcoolOutrasDrogas),
    historicoDesaparecimentoAnterior: Boolean(caso.historicoDesaparecimentoAnterior),
    conflitoPrevio: Boolean(caso.conflitoPrevio),
    suspeitaCrime: Boolean(caso.suspeitaCrime),
    locaisHabituais: caso.locaisHabituais || '',
    buscasPreliminares: caso.buscasPreliminares || '',
    classificacaoRisco: caso.classificacaoRisco || calcularRisco(caso),
    prioridade: caso.prioridade || calcularPrioridade(caso),
    acaoSugerida: caso.acaoSugerida || '',
    localizado: Boolean(caso.localizado || caso.statusCaso === 'Localizado' || caso.statusCaso === 'Encerrado'),
    dataHoraLocalizacao: caso.dataHoraLocalizacao || '',
    formaLocalizacao: caso.formaLocalizacao || '',
    encerrado190: Boolean(caso.encerrado190 || caso.statusCaso === 'Encerrado'),
    numeroBo: caso.numeroBo || '',
    observacoesOperacionais: caso.observacoesOperacionais || '',
    ...mapearCamposArvore(caso)
  };

  return {
    aba: 'CASOS',
    colunas: [...COLUNAS_DESAPARECIDOS],
    payload: dados,
    valores: COLUNAS_DESAPARECIDOS.map((coluna) => dados[coluna])
  };
};

const contemErroDoGet = (texto = '') => {
  const conteudo = String(texto || '').toLowerCase();
  return conteudo.includes('doget') || conteudo.includes('function doget') || conteudo.includes('script function not found');
};

export const salvarCasoSheets = async (caso) => {
  try {
    const payload = gerarPayloadSheets(caso);
    console.log("PAYLOAD ENVIADO:", payload);
    const resposta = await chamarAcaoGAS('salvarCaso', payload);
    return { ok: true, message: resposta?.message || 'Caso enviado para processamento', data: resposta };
  } catch {
    return { ok: false, message: 'Falha ao salvar caso' };
  }
};

export const healthcheckSheets = async () => {
  try {
    const resposta = await fetch(ENDPOINT_OFICIAL_APPS_SCRIPT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'healthcheck' })
    });
    const texto = await resposta.text();
    let body = {};
    try {
      body = JSON.parse(texto);
    } catch {
      body = {};
    }

    if (!resposta.ok) {
      return {
        ok: false,
        message: contemErroDoGet(texto) ? 'Backend GAS não publicado ou doGet ausente' : 'Falha ao salvar caso'
      };
    }

    if (contemErroDoGet(texto)) {
      return { ok: false, message: 'Backend GAS não publicado ou doGet ausente' };
    }

    if (body.ok === false) {
      return { ok: false, message: 'Falha ao salvar caso' };
    }

    return { ok: true, message: body.message || 'Endpoint ativo' };
  } catch {
    return { ok: false, message: 'Falha ao salvar caso' };
  }
};


const classificarErroRespostaGAS = (texto, statusHttp = 0) => {
  const bruto = String(texto || '');
  const normalizado = bruto.toLowerCase();

  if (!bruto.trim()) return { categoria: 7, rotulo: 'erro interno do GAS' };
  if (normalizado.includes('failed to fetch') || normalizado.includes('networkerror')) return { categoria: 1, rotulo: 'CORS/preflight' };
  if (normalizado.includes('script function not found: doget')) return { categoria: 2, rotulo: 'URL/implantação incorreta' };
  if (normalizado.includes('<!doctype html') || normalizado.includes('<html')) return { categoria: 4, rotulo: 'resposta HTML em vez de JSON' };
  if (normalizado.includes('operador não autorizado') || normalizado.includes('operador_nao_autorizado')) return { categoria: 5, rotulo: 'operador não cadastrado' };
  if (normalizado.includes('operador inativo') || normalizado.includes('operador_inativo')) return { categoria: 6, rotulo: 'operador inativo' };
  if (statusHttp === 401 || statusHttp === 403 || normalizado.includes('permission') || normalizado.includes('permiss')) return { categoria: 3, rotulo: 'permissão do Apps Script' };
  return { categoria: 7, rotulo: 'erro interno do GAS' };
};

const chamarAcaoGAS = async (action, payload = {}) => {
  const operador = obterOperadorLocal();
  const payloadComOperador = {
    action,
    ...payload,
    operadorEmail: operador.operadorEmail || payload.operadorEmail || '',
    operadorNome: operador.operadorNome || payload.operadorNome || '',
    operadorPerfil: operador.operadorPerfil || payload.operadorPerfil || ''
  };

  console.info('[GAS] Enviando payload:', payloadComOperador);

  const resposta = await fetch(ENDPOINT_OFICIAL_APPS_SCRIPT, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payloadComOperador)
  });

  const texto = await resposta.text();
  console.log("RESPOSTA BRUTA GAS:", texto);
  console.info('[GAS] Resposta bruta:', texto);

  let body = {};
  try {
    body = JSON.parse(texto);
  } catch {
    const diagnostico = classificarErroRespostaGAS(texto, resposta.status);
    throw new Error(`Falha na validação operacional [categoria ${diagnostico.categoria}: ${diagnostico.rotulo}].`);
  }

  if (!resposta.ok || body.ok === false) {
    const mensagemBackend = body.message || body.mensagem || body.erro || body.detalhe || '';
    const diagnostico = classificarErroRespostaGAS(mensagemBackend || texto, resposta.status);
    throw new Error((mensagemBackend || 'Falha na integração GAS.') + ` [categoria ${diagnostico.categoria}: ${diagnostico.rotulo}]`);
  }

  return body;
};

export const buscarCaso_ = async (filtro) => chamarAcaoGAS('buscarCaso_', { filtro });
export const gerarTimelineCaso_ = async (idCaso) => chamarAcaoGAS('gerarTimelineCaso_', { idCaso });
export const editarCasoControlado_ = async (idCaso, operador, alteracoes, justificativaEdicao, emailConfirmacaoOperador) =>
  chamarAcaoGAS('editarCasoControlado_', { idCaso, operador, alteracoes, justificativa: justificativaEdicao, emailConfirmacaoOperador });
export const resumoQualidadeDados_ = async () => chamarAcaoGAS('resumoQualidadeDados_');
export const marcarProblemaQualidadeResolvido_ = async (idCaso, campo, problema, responsavelTratamento) =>
  chamarAcaoGAS('marcarProblemaQualidadeResolvido_', { idCaso, campo, problema, responsavelTratamento });

export const registrarConsultaCaso_ = async (dadosConsulta) =>
  chamarAcaoGAS('enviarFeedback', { feedback: { tipo: 'CONSULTA_CASO_REALIZADA', ...dadosConsulta } });

export const gerarRelatorioOperacional = (casos, extra = '') => {
  const data = new Date().toLocaleDateString('pt-BR');
  const criticos = casos.filter((c) => c.classificacaoRisco === 'Alto risco');
  return `RELATÓRIO OPERACIONAL DIÁRIO\nData: ${data}\n\nProdutividade: ${casos.length} casos registrados.\nOcorrências de relevância: ${criticos.length}.\nComplemento: ${extra || 'Sem complemento.'}`;
};
