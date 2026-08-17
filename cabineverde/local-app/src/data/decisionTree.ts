export type TipoResposta = 'simNao' | 'texto';
export interface PerguntaMestre { numero: number; bloco: number; blocoTitulo: string; id: string; pergunta: string; tipo: TipoResposta; complemento?: boolean; }

export const perguntasMestre: PerguntaMestre[] = [
  {
    "numero": 1,
    "bloco": 1,
    "blocoTitulo": "Identificação",
    "id": "p1",
    "pergunta": "Trata-se de uma emergência em andamento?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 2,
    "bloco": 1,
    "blocoTitulo": "Identificação",
    "id": "p2",
    "pergunta": "Em qual município ocorreu o desaparecimento?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 3,
    "bloco": 1,
    "blocoTitulo": "Identificação",
    "id": "p3",
    "pergunta": "Qual é o nome completo da pessoa desaparecida?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 4,
    "bloco": 1,
    "blocoTitulo": "Identificação",
    "id": "p4",
    "pergunta": "Qual é o nome social?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 5,
    "bloco": 1,
    "blocoTitulo": "Identificação",
    "id": "p5",
    "pergunta": "Possui apelido ou vulgo? Qual?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 6,
    "bloco": 1,
    "blocoTitulo": "Identificação",
    "id": "p6",
    "pergunta": "Qual é o sexo?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 7,
    "bloco": 1,
    "blocoTitulo": "Identificação",
    "id": "p7",
    "pergunta": "Qual é a idade?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 8,
    "bloco": 1,
    "blocoTitulo": "Identificação",
    "id": "p8",
    "pergunta": "Qual é a faixa etária?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 9,
    "bloco": 1,
    "blocoTitulo": "Identificação",
    "id": "p9",
    "pergunta": "Qual é o CPF?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 10,
    "bloco": 1,
    "blocoTitulo": "Identificação",
    "id": "p10",
    "pergunta": "Qual é o RG?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 11,
    "bloco": 1,
    "blocoTitulo": "Identificação",
    "id": "p11",
    "pergunta": "Qual é a data de nascimento?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 12,
    "bloco": 1,
    "blocoTitulo": "Identificação",
    "id": "p12",
    "pergunta": "Qual é o nome da mãe?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 13,
    "bloco": 1,
    "blocoTitulo": "Identificação",
    "id": "p13",
    "pergunta": "Qual é o nome do pai?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 14,
    "bloco": 1,
    "blocoTitulo": "Identificação",
    "id": "p14",
    "pergunta": "Qual é a profissão ou ocupação?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 15,
    "bloco": 1,
    "blocoTitulo": "Identificação",
    "id": "p15",
    "pergunta": "Qual é o endereço residencial?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 16,
    "bloco": 1,
    "blocoTitulo": "Identificação",
    "id": "p16",
    "pergunta": "Qual é o telefone da pessoa desaparecida?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 17,
    "bloco": 1,
    "blocoTitulo": "Identificação",
    "id": "p17",
    "pergunta": "Existe fotografia recente disponível?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 18,
    "bloco": 1,
    "blocoTitulo": "Identificação",
    "id": "p18",
    "pergunta": "Existem outras fotografias que possam auxiliar na identificação?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 19,
    "bloco": 1,
    "blocoTitulo": "Identificação",
    "id": "p19",
    "pergunta": "Possui algum dispositivo eletrônico vinculado?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 20,
    "bloco": 1,
    "blocoTitulo": "Identificação",
    "id": "p20",
    "pergunta": "Possui telefone celular?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 21,
    "bloco": 1,
    "blocoTitulo": "Identificação",
    "id": "p21",
    "pergunta": "Qual é o número do celular?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 22,
    "bloco": 1,
    "blocoTitulo": "Identificação",
    "id": "p22",
    "pergunta": "Possui smartwatch ou relógio com localização?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 23,
    "bloco": 1,
    "blocoTitulo": "Identificação",
    "id": "p23",
    "pergunta": "Possui rastreador ou outro dispositivo de localização?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 24,
    "bloco": 1,
    "blocoTitulo": "Identificação",
    "id": "p24",
    "pergunta": "Possui redes sociais?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 25,
    "bloco": 1,
    "blocoTitulo": "Identificação",
    "id": "p25",
    "pergunta": "Quais redes sociais utiliza?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 26,
    "bloco": 2,
    "blocoTitulo": "Última visualização e deslocamento",
    "id": "p26",
    "pergunta": "Em que data foi visto pela última vez?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 27,
    "bloco": 2,
    "blocoTitulo": "Última visualização e deslocamento",
    "id": "p27",
    "pergunta": "Em que horário foi visto pela última vez?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 28,
    "bloco": 2,
    "blocoTitulo": "Última visualização e deslocamento",
    "id": "p28",
    "pergunta": "Qual foi o último local onde foi visto?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 29,
    "bloco": 2,
    "blocoTitulo": "Última visualização e deslocamento",
    "id": "p29",
    "pergunta": "Quem foi a última pessoa conhecida a vê-lo?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 30,
    "bloco": 2,
    "blocoTitulo": "Última visualização e deslocamento",
    "id": "p30",
    "pergunta": "Qual era o destino informado ou provável?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 31,
    "bloco": 2,
    "blocoTitulo": "Última visualização e deslocamento",
    "id": "p31",
    "pergunta": "Estava indo para o trabalho?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 32,
    "bloco": 2,
    "blocoTitulo": "Última visualização e deslocamento",
    "id": "p32",
    "pergunta": "Estava indo para escola, curso ou faculdade?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 33,
    "bloco": 2,
    "blocoTitulo": "Última visualização e deslocamento",
    "id": "p33",
    "pergunta": "Estava indo para academia ou atividade esportiva?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 34,
    "bloco": 2,
    "blocoTitulo": "Última visualização e deslocamento",
    "id": "p34",
    "pergunta": "Estava indo para igreja, templo ou atividade religiosa?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 35,
    "bloco": 2,
    "blocoTitulo": "Última visualização e deslocamento",
    "id": "p35",
    "pergunta": "Estava indo para atividade de lazer?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 36,
    "bloco": 2,
    "blocoTitulo": "Última visualização e deslocamento",
    "id": "p36",
    "pergunta": "Estava indo para a residência de algum amigo?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 37,
    "bloco": 2,
    "blocoTitulo": "Última visualização e deslocamento",
    "id": "p37",
    "pergunta": "Estava indo para a residência de algum familiar?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 38,
    "bloco": 2,
    "blocoTitulo": "Última visualização e deslocamento",
    "id": "p38",
    "pergunta": "Qual vestuário utilizava quando foi visto pela última vez?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 39,
    "bloco": 2,
    "blocoTitulo": "Última visualização e deslocamento",
    "id": "p39",
    "pergunta": "Qual calçado utilizava?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 40,
    "bloco": 2,
    "blocoTitulo": "Última visualização e deslocamento",
    "id": "p40",
    "pergunta": "Qual meio de transporte utilizava?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 41,
    "bloco": 2,
    "blocoTitulo": "Última visualização e deslocamento",
    "id": "p41",
    "pergunta": "Estava a pé?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 42,
    "bloco": 2,
    "blocoTitulo": "Última visualização e deslocamento",
    "id": "p42",
    "pergunta": "Utilizava transporte público?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 43,
    "bloco": 2,
    "blocoTitulo": "Última visualização e deslocamento",
    "id": "p43",
    "pergunta": "Utilizava táxi ou aplicativo de transporte?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 44,
    "bloco": 2,
    "blocoTitulo": "Última visualização e deslocamento",
    "id": "p44",
    "pergunta": "Utilizava veículo próprio ou de terceiro?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 45,
    "bloco": 2,
    "blocoTitulo": "Última visualização e deslocamento",
    "id": "p45",
    "pergunta": "Quais são os dados e características do veículo?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 46,
    "bloco": 3,
    "blocoTitulo": "Características físicas",
    "id": "p46",
    "pergunta": "Qual é a altura aproximada?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 47,
    "bloco": 3,
    "blocoTitulo": "Características físicas",
    "id": "p47",
    "pergunta": "Qual é o peso aproximado?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 48,
    "bloco": 3,
    "blocoTitulo": "Características físicas",
    "id": "p48",
    "pergunta": "Qual é a compleição física?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 49,
    "bloco": 3,
    "blocoTitulo": "Características físicas",
    "id": "p49",
    "pergunta": "Qual é a cor da pele/cútis?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 50,
    "bloco": 3,
    "blocoTitulo": "Características físicas",
    "id": "p50",
    "pergunta": "Qual é a cor dos olhos?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 51,
    "bloco": 3,
    "blocoTitulo": "Características físicas",
    "id": "p51",
    "pergunta": "Qual é a cor dos cabelos?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 52,
    "bloco": 3,
    "blocoTitulo": "Características físicas",
    "id": "p52",
    "pergunta": "Qual é o tipo e o comprimento dos cabelos?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 53,
    "bloco": 3,
    "blocoTitulo": "Características físicas",
    "id": "p53",
    "pergunta": "Possui barba?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 54,
    "bloco": 3,
    "blocoTitulo": "Características físicas",
    "id": "p54",
    "pergunta": "Possui bigode?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 55,
    "bloco": 3,
    "blocoTitulo": "Características físicas",
    "id": "p55",
    "pergunta": "Possui tatuagens?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 56,
    "bloco": 3,
    "blocoTitulo": "Características físicas",
    "id": "p56",
    "pergunta": "Onde estão e como são as tatuagens?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 57,
    "bloco": 3,
    "blocoTitulo": "Características físicas",
    "id": "p57",
    "pergunta": "Possui cicatrizes?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 58,
    "bloco": 3,
    "blocoTitulo": "Características físicas",
    "id": "p58",
    "pergunta": "Onde estão e como são as cicatrizes?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 59,
    "bloco": 3,
    "blocoTitulo": "Características físicas",
    "id": "p59",
    "pergunta": "Possui manchas corporais relevantes?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 60,
    "bloco": 3,
    "blocoTitulo": "Características físicas",
    "id": "p60",
    "pergunta": "Possui sinais particulares?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 61,
    "bloco": 3,
    "blocoTitulo": "Características físicas",
    "id": "p61",
    "pergunta": "Utiliza óculos?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 62,
    "bloco": 3,
    "blocoTitulo": "Características físicas",
    "id": "p62",
    "pergunta": "Utiliza lentes de contato?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 63,
    "bloco": 3,
    "blocoTitulo": "Características físicas",
    "id": "p63",
    "pergunta": "Utiliza aparelho auditivo?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 64,
    "bloco": 3,
    "blocoTitulo": "Características físicas",
    "id": "p64",
    "pergunta": "Utiliza alguma prótese externa?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 65,
    "bloco": 3,
    "blocoTitulo": "Características físicas",
    "id": "p65",
    "pergunta": "Utiliza cadeira de rodas?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 66,
    "bloco": 3,
    "blocoTitulo": "Características físicas",
    "id": "p66",
    "pergunta": "Utiliza bengala?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 67,
    "bloco": 3,
    "blocoTitulo": "Características físicas",
    "id": "p67",
    "pergunta": "Utiliza andador?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 68,
    "bloco": 3,
    "blocoTitulo": "Características físicas",
    "id": "p68",
    "pergunta": "Utiliza muletas?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 69,
    "bloco": 3,
    "blocoTitulo": "Características físicas",
    "id": "p69",
    "pergunta": "Possui marca de nascimento relevante?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 70,
    "bloco": 3,
    "blocoTitulo": "Características físicas",
    "id": "p70",
    "pergunta": "Existe outra característica física capaz de auxiliar na identificação?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 71,
    "bloco": 4,
    "blocoTitulo": "Objetos e pertences",
    "id": "p71",
    "pergunta": "Levou o telefone celular?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 72,
    "bloco": 4,
    "blocoTitulo": "Objetos e pertences",
    "id": "p72",
    "pergunta": "Levou dinheiro?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 73,
    "bloco": 4,
    "blocoTitulo": "Objetos e pertences",
    "id": "p73",
    "pergunta": "Levou cartão bancário ou de crédito?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 74,
    "bloco": 4,
    "blocoTitulo": "Objetos e pertences",
    "id": "p74",
    "pergunta": "Levou documentos pessoais?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 75,
    "bloco": 4,
    "blocoTitulo": "Objetos e pertences",
    "id": "p75",
    "pergunta": "Levou mochila?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 76,
    "bloco": 4,
    "blocoTitulo": "Objetos e pertences",
    "id": "p76",
    "pergunta": "Levou bolsa?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 77,
    "bloco": 4,
    "blocoTitulo": "Objetos e pertences",
    "id": "p77",
    "pergunta": "Levou mala?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 78,
    "bloco": 4,
    "blocoTitulo": "Objetos e pertences",
    "id": "p78",
    "pergunta": "Levou computador, tablet ou notebook?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 79,
    "bloco": 4,
    "blocoTitulo": "Objetos e pertences",
    "id": "p79",
    "pergunta": "Utilizava corrente ou colar?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 80,
    "bloco": 4,
    "blocoTitulo": "Objetos e pertences",
    "id": "p80",
    "pergunta": "Utilizava pulseira?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 81,
    "bloco": 4,
    "blocoTitulo": "Objetos e pertences",
    "id": "p81",
    "pergunta": "Utilizava anel ou aliança?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 82,
    "bloco": 4,
    "blocoTitulo": "Objetos e pertences",
    "id": "p82",
    "pergunta": "Utilizava brincos?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 83,
    "bloco": 4,
    "blocoTitulo": "Objetos e pertences",
    "id": "p83",
    "pergunta": "Possui piercing?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 84,
    "bloco": 4,
    "blocoTitulo": "Objetos e pertences",
    "id": "p84",
    "pergunta": "Utilizava relógio?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 85,
    "bloco": 4,
    "blocoTitulo": "Objetos e pertences",
    "id": "p85",
    "pergunta": "Levou algum outro objeto facilmente identificável?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 86,
    "bloco": 4,
    "blocoTitulo": "Objetos e pertences",
    "id": "p86",
    "pergunta": "Deixou bilhete antes de desaparecer?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 87,
    "bloco": 4,
    "blocoTitulo": "Objetos e pertences",
    "id": "p87",
    "pergunta": "Deixou mensagem escrita, eletrônica ou de áudio?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 88,
    "bloco": 4,
    "blocoTitulo": "Objetos e pertences",
    "id": "p88",
    "pergunta": "Qual era o conteúdo ou sentido da mensagem?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 89,
    "bloco": 4,
    "blocoTitulo": "Objetos e pertences",
    "id": "p89",
    "pergunta": "Levou algum objeto incomum para sua rotina?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 90,
    "bloco": 4,
    "blocoTitulo": "Objetos e pertences",
    "id": "p90",
    "pergunta": "Deixou em casa algum objeto que normalmente levaria consigo?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 91,
    "bloco": 5,
    "blocoTitulo": "Saúde e vulnerabilidade",
    "id": "p91",
    "pergunta": "Possui deficiência física?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 92,
    "bloco": 5,
    "blocoTitulo": "Saúde e vulnerabilidade",
    "id": "p92",
    "pergunta": "Qual deficiência física?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 93,
    "bloco": 5,
    "blocoTitulo": "Saúde e vulnerabilidade",
    "id": "p93",
    "pergunta": "Possui deficiência visual?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 94,
    "bloco": 5,
    "blocoTitulo": "Saúde e vulnerabilidade",
    "id": "p94",
    "pergunta": "Possui deficiência auditiva?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 95,
    "bloco": 5,
    "blocoTitulo": "Saúde e vulnerabilidade",
    "id": "p95",
    "pergunta": "Possui deficiência intelectual?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 96,
    "bloco": 5,
    "blocoTitulo": "Saúde e vulnerabilidade",
    "id": "p96",
    "pergunta": "Possui diagnóstico ou características conhecidas de TEA?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 97,
    "bloco": 5,
    "blocoTitulo": "Saúde e vulnerabilidade",
    "id": "p97",
    "pergunta": "Possui diagnóstico conhecido de TDAH?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 98,
    "bloco": 5,
    "blocoTitulo": "Saúde e vulnerabilidade",
    "id": "p98",
    "pergunta": "Possui Alzheimer?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 99,
    "bloco": 5,
    "blocoTitulo": "Saúde e vulnerabilidade",
    "id": "p99",
    "pergunta": "Possui outra forma de demência?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 100,
    "bloco": 5,
    "blocoTitulo": "Saúde e vulnerabilidade",
    "id": "p100",
    "pergunta": "Possui Parkinson?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 101,
    "bloco": 5,
    "blocoTitulo": "Saúde e vulnerabilidade",
    "id": "p101",
    "pergunta": "Possui epilepsia?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 102,
    "bloco": 5,
    "blocoTitulo": "Saúde e vulnerabilidade",
    "id": "p102",
    "pergunta": "Possui esquizofrenia ou outro transtorno psicótico conhecido?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 103,
    "bloco": 5,
    "blocoTitulo": "Saúde e vulnerabilidade",
    "id": "p103",
    "pergunta": "Possui transtorno bipolar?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 104,
    "bloco": 5,
    "blocoTitulo": "Saúde e vulnerabilidade",
    "id": "p104",
    "pergunta": "Possui depressão?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 105,
    "bloco": 5,
    "blocoTitulo": "Saúde e vulnerabilidade",
    "id": "p105",
    "pergunta": "Possui transtorno de ansiedade relevante?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 106,
    "bloco": 5,
    "blocoTitulo": "Saúde e vulnerabilidade",
    "id": "p106",
    "pergunta": "Possui outra condição mental, cognitiva ou comportamental relevante?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 107,
    "bloco": 5,
    "blocoTitulo": "Saúde e vulnerabilidade",
    "id": "p107",
    "pergunta": "Faz uso de medicamento controlado?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 108,
    "bloco": 5,
    "blocoTitulo": "Saúde e vulnerabilidade",
    "id": "p108",
    "pergunta": "Quais medicamentos utiliza?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 109,
    "bloco": 5,
    "blocoTitulo": "Saúde e vulnerabilidade",
    "id": "p109",
    "pergunta": "A interrupção da medicação representa risco?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 110,
    "bloco": 5,
    "blocoTitulo": "Saúde e vulnerabilidade",
    "id": "p110",
    "pergunta": "Depende de cuidador?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 111,
    "bloco": 5,
    "blocoTitulo": "Saúde e vulnerabilidade",
    "id": "p111",
    "pergunta": "Possui limitação de locomoção?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 112,
    "bloco": 5,
    "blocoTitulo": "Saúde e vulnerabilidade",
    "id": "p112",
    "pergunta": "Possui limitação de comunicação?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 113,
    "bloco": 5,
    "blocoTitulo": "Saúde e vulnerabilidade",
    "id": "p113",
    "pergunta": "Possui risco ou histórico de desorientação?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 114,
    "bloco": 5,
    "blocoTitulo": "Saúde e vulnerabilidade",
    "id": "p114",
    "pergunta": "Já se perdeu ou ficou desorientado anteriormente?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 115,
    "bloco": 5,
    "blocoTitulo": "Saúde e vulnerabilidade",
    "id": "p115",
    "pergunta": "Possui histórico de fuga ou afastamento voluntário?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 116,
    "bloco": 5,
    "blocoTitulo": "Saúde e vulnerabilidade",
    "id": "p116",
    "pergunta": "Já desapareceu anteriormente?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 117,
    "bloco": 5,
    "blocoTitulo": "Saúde e vulnerabilidade",
    "id": "p117",
    "pergunta": "Apresentou recentemente ideação suicida?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 118,
    "bloco": 5,
    "blocoTitulo": "Saúde e vulnerabilidade",
    "id": "p118",
    "pergunta": "Já tentou suicídio?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 119,
    "bloco": 5,
    "blocoTitulo": "Saúde e vulnerabilidade",
    "id": "p119",
    "pergunta": "Já mencionou que pretendia se matar ou causar dano a si mesmo?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 120,
    "bloco": 5,
    "blocoTitulo": "Saúde e vulnerabilidade",
    "id": "p120",
    "pergunta": "Possui doença grave?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 121,
    "bloco": 5,
    "blocoTitulo": "Saúde e vulnerabilidade",
    "id": "p121",
    "pergunta": "Depende de tratamento contínuo?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 122,
    "bloco": 5,
    "blocoTitulo": "Saúde e vulnerabilidade",
    "id": "p122",
    "pergunta": "Necessita de atendimento médico frequente?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 123,
    "bloco": 5,
    "blocoTitulo": "Saúde e vulnerabilidade",
    "id": "p123",
    "pergunta": "Encontra-se em situação de vulnerabilidade social?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 124,
    "bloco": 5,
    "blocoTitulo": "Saúde e vulnerabilidade",
    "id": "p124",
    "pergunta": "Encontra-se ou já esteve recentemente em situação de rua?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 125,
    "bloco": 5,
    "blocoTitulo": "Saúde e vulnerabilidade",
    "id": "p125",
    "pergunta": "Existe outro fator de saúde ou vulnerabilidade relevante?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 126,
    "bloco": 6,
    "blocoTitulo": "Dispositivos médicos e identificação odontológica",
    "id": "p126",
    "pergunta": "Possui marca-passo?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 127,
    "bloco": 6,
    "blocoTitulo": "Dispositivos médicos e identificação odontológica",
    "id": "p127",
    "pergunta": "Possui pinos implantados?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 128,
    "bloco": 6,
    "blocoTitulo": "Dispositivos médicos e identificação odontológica",
    "id": "p128",
    "pergunta": "Possui fios ou outros materiais metálicos implantados?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 129,
    "bloco": 6,
    "blocoTitulo": "Dispositivos médicos e identificação odontológica",
    "id": "p129",
    "pergunta": "Possui parafusos implantados?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 130,
    "bloco": 6,
    "blocoTitulo": "Dispositivos médicos e identificação odontológica",
    "id": "p130",
    "pergunta": "Possui prótese ortopédica ou outro implante?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 131,
    "bloco": 6,
    "blocoTitulo": "Dispositivos médicos e identificação odontológica",
    "id": "p131",
    "pergunta": "Possui prótese dentária?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 132,
    "bloco": 6,
    "blocoTitulo": "Dispositivos médicos e identificação odontológica",
    "id": "p132",
    "pergunta": "Utiliza aparelho ortodôntico?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 133,
    "bloco": 6,
    "blocoTitulo": "Dispositivos médicos e identificação odontológica",
    "id": "p133",
    "pergunta": "Possui implantes dentários?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 134,
    "bloco": 6,
    "blocoTitulo": "Dispositivos médicos e identificação odontológica",
    "id": "p134",
    "pergunta": "Existe radiografia panorâmica odontológica disponível?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 135,
    "bloco": 6,
    "blocoTitulo": "Dispositivos médicos e identificação odontológica",
    "id": "p135",
    "pergunta": "Existe ficha ou prontuário odontológico disponível?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 136,
    "bloco": 6,
    "blocoTitulo": "Dispositivos médicos e identificação odontológica",
    "id": "p136",
    "pergunta": "Existe prontuário médico que possa auxiliar na identificação ou localização?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 137,
    "bloco": 6,
    "blocoTitulo": "Dispositivos médicos e identificação odontológica",
    "id": "p137",
    "pergunta": "Existe laudo médico recente?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 138,
    "bloco": 6,
    "blocoTitulo": "Dispositivos médicos e identificação odontológica",
    "id": "p138",
    "pergunta": "Existe documento médico ou assistencial relevante?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 139,
    "bloco": 6,
    "blocoTitulo": "Dispositivos médicos e identificação odontológica",
    "id": "p139",
    "pergunta": "Possui cartão, documento ou identificação médica?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 140,
    "bloco": 6,
    "blocoTitulo": "Dispositivos médicos e identificação odontológica",
    "id": "p140",
    "pergunta": "Utiliza pulseira, colar ou outro identificador médico?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 141,
    "bloco": 7,
    "blocoTitulo": "Álcool e outras drogas",
    "id": "p141",
    "pergunta": "Faz uso frequente de bebida alcoólica?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 142,
    "bloco": 7,
    "blocoTitulo": "Álcool e outras drogas",
    "id": "p142",
    "pergunta": "Costuma consumir álcool até ficar embriagado?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 143,
    "bloco": 7,
    "blocoTitulo": "Álcool e outras drogas",
    "id": "p143",
    "pergunta": "Já perdeu a consciência em decorrência do consumo de álcool?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 144,
    "bloco": 7,
    "blocoTitulo": "Álcool e outras drogas",
    "id": "p144",
    "pergunta": "Faz uso de drogas ilícitas ou outras substâncias psicoativas?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 145,
    "bloco": 7,
    "blocoTitulo": "Álcool e outras drogas",
    "id": "p145",
    "pergunta": "Quais substâncias utiliza?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 146,
    "bloco": 7,
    "blocoTitulo": "Álcool e outras drogas",
    "id": "p146",
    "pergunta": "Existe dependência química conhecida?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 147,
    "bloco": 7,
    "blocoTitulo": "Álcool e outras drogas",
    "id": "p147",
    "pergunta": "Realiza ou realizava tratamento para dependência?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 148,
    "bloco": 7,
    "blocoTitulo": "Álcool e outras drogas",
    "id": "p148",
    "pergunta": "Houve recaída recente?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 149,
    "bloco": 7,
    "blocoTitulo": "Álcool e outras drogas",
    "id": "p149",
    "pergunta": "Existem locais conhecidos onde costuma consumir ou adquirir essas substâncias?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 150,
    "bloco": 7,
    "blocoTitulo": "Álcool e outras drogas",
    "id": "p150",
    "pergunta": "Há suspeita de consumo de álcool ou drogas imediatamente antes do desaparecimento?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 151,
    "bloco": 8,
    "blocoTitulo": "Contexto, comportamento e possível motivação",
    "id": "p151",
    "pergunta": "Houve discussão imediatamente antes ou recentemente?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 152,
    "bloco": 8,
    "blocoTitulo": "Contexto, comportamento e possível motivação",
    "id": "p152",
    "pergunta": "Houve desavença relevante?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 153,
    "bloco": 8,
    "blocoTitulo": "Contexto, comportamento e possível motivação",
    "id": "p153",
    "pergunta": "Houve agressão física?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 154,
    "bloco": 8,
    "blocoTitulo": "Contexto, comportamento e possível motivação",
    "id": "p154",
    "pergunta": "Houve ameaça?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 155,
    "bloco": 8,
    "blocoTitulo": "Contexto, comportamento e possível motivação",
    "id": "p155",
    "pergunta": "Existe contexto de violência doméstica ou familiar?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 156,
    "bloco": 8,
    "blocoTitulo": "Contexto, comportamento e possível motivação",
    "id": "p156",
    "pergunta": "Houve separação ou rompimento afetivo recente?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 157,
    "bloco": 8,
    "blocoTitulo": "Contexto, comportamento e possível motivação",
    "id": "p157",
    "pergunta": "Houve perda financeira ou problema econômico relevante?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 158,
    "bloco": 8,
    "blocoTitulo": "Contexto, comportamento e possível motivação",
    "id": "p158",
    "pergunta": "Houve mudança recente e significativa de comportamento?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 159,
    "bloco": 8,
    "blocoTitulo": "Contexto, comportamento e possível motivação",
    "id": "p159",
    "pergunta": "A pessoa mencionou intenção de se ausentar?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 160,
    "bloco": 8,
    "blocoTitulo": "Contexto, comportamento e possível motivação",
    "id": "p160",
    "pergunta": "A pessoa mencionou intenção de fugir ou não retornar?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 161,
    "bloco": 8,
    "blocoTitulo": "Contexto, comportamento e possível motivação",
    "id": "p161",
    "pergunta": "Existe suspeita de crime relacionado ao desaparecimento?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 162,
    "bloco": 8,
    "blocoTitulo": "Contexto, comportamento e possível motivação",
    "id": "p162",
    "pergunta": "Possui dívida ou problema financeiro que possa ter relação com o caso?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 163,
    "bloco": 8,
    "blocoTitulo": "Contexto, comportamento e possível motivação",
    "id": "p163",
    "pergunta": "Existe perseguição, assédio ou pessoa que cause temor?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 164,
    "bloco": 8,
    "blocoTitulo": "Contexto, comportamento e possível motivação",
    "id": "p164",
    "pergunta": "Existe conflito familiar relevante?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 165,
    "bloco": 8,
    "blocoTitulo": "Contexto, comportamento e possível motivação",
    "id": "p165",
    "pergunta": "Houve outro acontecimento atípico que possa estar relacionado ao desaparecimento?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 166,
    "bloco": 9,
    "blocoTitulo": "Buscas preliminares",
    "id": "p166",
    "pergunta": "Os locais que costuma frequentar já foram verificados?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 167,
    "bloco": 9,
    "blocoTitulo": "Buscas preliminares",
    "id": "p167",
    "pergunta": "Familiares próximos já foram contatados?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 168,
    "bloco": 9,
    "blocoTitulo": "Buscas preliminares",
    "id": "p168",
    "pergunta": "Amigos e pessoas próximas já foram contatados?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 169,
    "bloco": 9,
    "blocoTitulo": "Buscas preliminares",
    "id": "p169",
    "pergunta": "A residência e seus cômodos foram completamente verificados?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 170,
    "bloco": 9,
    "blocoTitulo": "Buscas preliminares",
    "id": "p170",
    "pergunta": "Foram realizadas tentativas de contato telefônico?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 171,
    "bloco": 9,
    "blocoTitulo": "Buscas preliminares",
    "id": "p171",
    "pergunta": "O celular está ligado, chama ou apresenta algum sinal de atividade?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 172,
    "bloco": 9,
    "blocoTitulo": "Buscas preliminares",
    "id": "p172",
    "pergunta": "Existem câmeras na residência ou nas proximidades?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 173,
    "bloco": 9,
    "blocoTitulo": "Buscas preliminares",
    "id": "p173",
    "pergunta": "Existem câmeras no último local onde foi visto ou em seu provável trajeto?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 174,
    "bloco": 9,
    "blocoTitulo": "Buscas preliminares",
    "id": "p174",
    "pergunta": "Já existe boletim de ocorrência de desaparecimento?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 175,
    "bloco": 9,
    "blocoTitulo": "Buscas preliminares",
    "id": "p175",
    "pergunta": "Existe alguma informação adicional que possa orientar imediatamente as buscas?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 176,
    "bloco": 10,
    "blocoTitulo": "Padrões de deslocamento e locais prováveis",
    "id": "p176",
    "pergunta": "Costuma permanecer ou pernoitar em albergues?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 177,
    "bloco": 10,
    "blocoTitulo": "Padrões de deslocamento e locais prováveis",
    "id": "p177",
    "pergunta": "Qual albergue costuma frequentar?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 178,
    "bloco": 10,
    "blocoTitulo": "Padrões de deslocamento e locais prováveis",
    "id": "p178",
    "pergunta": "Costuma utilizar centros de acolhimento?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 179,
    "bloco": 10,
    "blocoTitulo": "Padrões de deslocamento e locais prováveis",
    "id": "p179",
    "pergunta": "Costuma utilizar casas de passagem?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 180,
    "bloco": 10,
    "blocoTitulo": "Padrões de deslocamento e locais prováveis",
    "id": "p180",
    "pergunta": "Costuma frequentar CAPS ou outro serviço de saúde mental?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 181,
    "bloco": 10,
    "blocoTitulo": "Padrões de deslocamento e locais prováveis",
    "id": "p181",
    "pergunta": "Qual CAPS ou serviço costuma frequentar?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 182,
    "bloco": 10,
    "blocoTitulo": "Padrões de deslocamento e locais prováveis",
    "id": "p182",
    "pergunta": "Costuma procurar hospitais?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 183,
    "bloco": 10,
    "blocoTitulo": "Padrões de deslocamento e locais prováveis",
    "id": "p183",
    "pergunta": "Qual hospital costuma procurar?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 184,
    "bloco": 10,
    "blocoTitulo": "Padrões de deslocamento e locais prováveis",
    "id": "p184",
    "pergunta": "Costuma procurar UPA ou pronto-socorro?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 185,
    "bloco": 10,
    "blocoTitulo": "Padrões de deslocamento e locais prováveis",
    "id": "p185",
    "pergunta": "Qual UPA ou pronto-socorro costuma utilizar?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 186,
    "bloco": 10,
    "blocoTitulo": "Padrões de deslocamento e locais prováveis",
    "id": "p186",
    "pergunta": "Costuma permanecer em rodoviárias?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 187,
    "bloco": 10,
    "blocoTitulo": "Padrões de deslocamento e locais prováveis",
    "id": "p187",
    "pergunta": "Costuma permanecer em terminais de ônibus?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 188,
    "bloco": 10,
    "blocoTitulo": "Padrões de deslocamento e locais prováveis",
    "id": "p188",
    "pergunta": "Costuma permanecer em estações de trem ou metrô?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 189,
    "bloco": 10,
    "blocoTitulo": "Padrões de deslocamento e locais prováveis",
    "id": "p189",
    "pergunta": "Costuma permanecer em praças ou parques?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 190,
    "bloco": 10,
    "blocoTitulo": "Padrões de deslocamento e locais prováveis",
    "id": "p190",
    "pergunta": "Costuma dormir ou permanecer em via pública?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 191,
    "bloco": 10,
    "blocoTitulo": "Padrões de deslocamento e locais prováveis",
    "id": "p191",
    "pergunta": "Costuma frequentar igreja, templo ou instituição religiosa?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 192,
    "bloco": 10,
    "blocoTitulo": "Padrões de deslocamento e locais prováveis",
    "id": "p192",
    "pergunta": "Qual instituição religiosa costuma frequentar?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 193,
    "bloco": 10,
    "blocoTitulo": "Padrões de deslocamento e locais prováveis",
    "id": "p193",
    "pergunta": "Possui algum local favorito ou de forte vínculo afetivo?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 194,
    "bloco": 10,
    "blocoTitulo": "Padrões de deslocamento e locais prováveis",
    "id": "p194",
    "pergunta": "Possui algum local conhecido que procura quando está em crise ou quer ficar sozinho?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 195,
    "bloco": 10,
    "blocoTitulo": "Padrões de deslocamento e locais prováveis",
    "id": "p195",
    "pergunta": "Costuma deslocar-se para outro município?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 196,
    "bloco": 10,
    "blocoTitulo": "Padrões de deslocamento e locais prováveis",
    "id": "p196",
    "pergunta": "Qual município costuma procurar?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 197,
    "bloco": 10,
    "blocoTitulo": "Padrões de deslocamento e locais prováveis",
    "id": "p197",
    "pergunta": "Possui familiares ou amigos em outro município ou estado?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 198,
    "bloco": 10,
    "blocoTitulo": "Padrões de deslocamento e locais prováveis",
    "id": "p198",
    "pergunta": "Possui histórico de procurar áreas de mata ou locais isolados?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 199,
    "bloco": 10,
    "blocoTitulo": "Padrões de deslocamento e locais prováveis",
    "id": "p199",
    "pergunta": "Existe rota habitual de deslocamento?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 200,
    "bloco": 10,
    "blocoTitulo": "Padrões de deslocamento e locais prováveis",
    "id": "p200",
    "pergunta": "Existe outro padrão conhecido de deslocamento, permanência ou localização?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 201,
    "bloco": 11,
    "blocoTitulo": "Inteligência operacional e rastros digitais",
    "id": "p201",
    "pergunta": "Houve postagem recente em rede social?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 202,
    "bloco": 11,
    "blocoTitulo": "Inteligência operacional e rastros digitais",
    "id": "p202",
    "pergunta": "Qual foi a última postagem conhecida?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 203,
    "bloco": 11,
    "blocoTitulo": "Inteligência operacional e rastros digitais",
    "id": "p203",
    "pergunta": "Houve alteração incomum em perfil de rede social?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 204,
    "bloco": 11,
    "blocoTitulo": "Inteligência operacional e rastros digitais",
    "id": "p204",
    "pergunta": "Houve exclusão recente de conteúdo ou conta?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 205,
    "bloco": 11,
    "blocoTitulo": "Inteligência operacional e rastros digitais",
    "id": "p205",
    "pergunta": "Enviou mensagens pouco antes do desaparecimento?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 206,
    "bloco": 11,
    "blocoTitulo": "Inteligência operacional e rastros digitais",
    "id": "p206",
    "pergunta": "Para quem enviou as últimas mensagens conhecidas?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 207,
    "bloco": 11,
    "blocoTitulo": "Inteligência operacional e rastros digitais",
    "id": "p207",
    "pergunta": "Existe geolocalização recente conhecida ou compartilhada?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 208,
    "bloco": 11,
    "blocoTitulo": "Inteligência operacional e rastros digitais",
    "id": "p208",
    "pergunta": "Possui aplicativo de transporte?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 209,
    "bloco": 11,
    "blocoTitulo": "Inteligência operacional e rastros digitais",
    "id": "p209",
    "pergunta": "Houve utilização conhecida de aplicativo de transporte após a última visualização?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 210,
    "bloco": 11,
    "blocoTitulo": "Inteligência operacional e rastros digitais",
    "id": "p210",
    "pergunta": "Possui cartão de transporte público?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 211,
    "bloco": 11,
    "blocoTitulo": "Inteligência operacional e rastros digitais",
    "id": "p211",
    "pergunta": "Existe informação disponível sobre utilização recente do cartão de transporte?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 212,
    "bloco": 11,
    "blocoTitulo": "Inteligência operacional e rastros digitais",
    "id": "p212",
    "pergunta": "Existe estabelecimento que frequenta regularmente?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 213,
    "bloco": 11,
    "blocoTitulo": "Inteligência operacional e rastros digitais",
    "id": "p213",
    "pergunta": "Qual estabelecimento?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 214,
    "bloco": 11,
    "blocoTitulo": "Inteligência operacional e rastros digitais",
    "id": "p214",
    "pergunta": "Existe relacionamento afetivo atual relevante?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 215,
    "bloco": 11,
    "blocoTitulo": "Inteligência operacional e rastros digitais",
    "id": "p215",
    "pergunta": "Existe pessoa de confiança que normalmente procura?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 216,
    "bloco": 11,
    "blocoTitulo": "Inteligência operacional e rastros digitais",
    "id": "p216",
    "pergunta": "Existe desafeto conhecido?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 217,
    "bloco": 11,
    "blocoTitulo": "Inteligência operacional e rastros digitais",
    "id": "p217",
    "pergunta": "Existe medida protetiva relacionada à pessoa desaparecida ou a terceiros?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 218,
    "bloco": 11,
    "blocoTitulo": "Inteligência operacional e rastros digitais",
    "id": "p218",
    "pergunta": "Existem ocorrências policiais anteriores relacionadas ao contexto atual?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 219,
    "bloco": 11,
    "blocoTitulo": "Inteligência operacional e rastros digitais",
    "id": "p219",
    "pergunta": "Existem desaparecimentos anteriores que possam revelar padrão de localização?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 220,
    "bloco": 11,
    "blocoTitulo": "Inteligência operacional e rastros digitais",
    "id": "p220",
    "pergunta": "Existe outra informação disponível para correlação operacional?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 221,
    "bloco": 12,
    "blocoTitulo": "Rede de relacionamento e instituições",
    "id": "p221",
    "pergunta": "Trabalha atualmente?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 222,
    "bloco": 12,
    "blocoTitulo": "Rede de relacionamento e instituições",
    "id": "p222",
    "pergunta": "Qual é o nome da empresa ou local de trabalho?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 223,
    "bloco": 12,
    "blocoTitulo": "Rede de relacionamento e instituições",
    "id": "p223",
    "pergunta": "Qual é o endereço do trabalho?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 224,
    "bloco": 12,
    "blocoTitulo": "Rede de relacionamento e instituições",
    "id": "p224",
    "pergunta": "Qual é o telefone do trabalho?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 225,
    "bloco": 12,
    "blocoTitulo": "Rede de relacionamento e instituições",
    "id": "p225",
    "pergunta": "Qual é o e-mail institucional ou contato eletrônico disponível?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 226,
    "bloco": 12,
    "blocoTitulo": "Rede de relacionamento e instituições",
    "id": "p226",
    "pergunta": "Existe supervisor, gestor ou colega de referência?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 227,
    "bloco": 12,
    "blocoTitulo": "Rede de relacionamento e instituições",
    "id": "p227",
    "pergunta": "Qual é o nome e contato dessa pessoa?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 228,
    "bloco": 12,
    "blocoTitulo": "Rede de relacionamento e instituições",
    "id": "p228",
    "pergunta": "Compareceu ao trabalho no dia ou período do desaparecimento?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 229,
    "bloco": 12,
    "blocoTitulo": "Rede de relacionamento e instituições",
    "id": "p229",
    "pergunta": "Houve contato recente entre a pessoa desaparecida e o trabalho?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 230,
    "bloco": 12,
    "blocoTitulo": "Rede de relacionamento e instituições",
    "id": "p230",
    "pergunta": "Estuda atualmente?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 231,
    "bloco": 12,
    "blocoTitulo": "Rede de relacionamento e instituições",
    "id": "p231",
    "pergunta": "Qual é o nome da escola, faculdade, universidade ou curso?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 232,
    "bloco": 12,
    "blocoTitulo": "Rede de relacionamento e instituições",
    "id": "p232",
    "pergunta": "Qual é o endereço da instituição de ensino?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 233,
    "bloco": 12,
    "blocoTitulo": "Rede de relacionamento e instituições",
    "id": "p233",
    "pergunta": "Qual é o telefone da instituição?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 234,
    "bloco": 12,
    "blocoTitulo": "Rede de relacionamento e instituições",
    "id": "p234",
    "pergunta": "Qual é o e-mail institucional disponível?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 235,
    "bloco": 12,
    "blocoTitulo": "Rede de relacionamento e instituições",
    "id": "p235",
    "pergunta": "Existe coordenador, diretor ou responsável de referência?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 236,
    "bloco": 12,
    "blocoTitulo": "Rede de relacionamento e instituições",
    "id": "p236",
    "pergunta": "Qual é o nome e contato desse responsável?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 237,
    "bloco": 12,
    "blocoTitulo": "Rede de relacionamento e instituições",
    "id": "p237",
    "pergunta": "Compareceu à instituição no dia ou período do desaparecimento?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 238,
    "bloco": 12,
    "blocoTitulo": "Rede de relacionamento e instituições",
    "id": "p238",
    "pergunta": "Existe familiar de referência?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 239,
    "bloco": 12,
    "blocoTitulo": "Rede de relacionamento e instituições",
    "id": "p239",
    "pergunta": "Qual é o nome do familiar?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 240,
    "bloco": 12,
    "blocoTitulo": "Rede de relacionamento e instituições",
    "id": "p240",
    "pergunta": "Qual é o telefone do familiar?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 241,
    "bloco": 12,
    "blocoTitulo": "Rede de relacionamento e instituições",
    "id": "p241",
    "pergunta": "Qual é o e-mail ou outro meio de contato do familiar?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 242,
    "bloco": 12,
    "blocoTitulo": "Rede de relacionamento e instituições",
    "id": "p242",
    "pergunta": "Qual é o endereço ou município desse familiar?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 243,
    "bloco": 12,
    "blocoTitulo": "Rede de relacionamento e instituições",
    "id": "p243",
    "pergunta": "Costuma procurar esse familiar quando precisa de ajuda ou está em crise?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 244,
    "bloco": 12,
    "blocoTitulo": "Rede de relacionamento e instituições",
    "id": "p244",
    "pergunta": "Existe amigo ou pessoa de confiança de referência?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 245,
    "bloco": 12,
    "blocoTitulo": "Rede de relacionamento e instituições",
    "id": "p245",
    "pergunta": "Qual é o nome dessa pessoa?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 246,
    "bloco": 12,
    "blocoTitulo": "Rede de relacionamento e instituições",
    "id": "p246",
    "pergunta": "Qual é o telefone?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 247,
    "bloco": 12,
    "blocoTitulo": "Rede de relacionamento e instituições",
    "id": "p247",
    "pergunta": "Qual é o e-mail ou outro meio de contato?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 248,
    "bloco": 12,
    "blocoTitulo": "Rede de relacionamento e instituições",
    "id": "p248",
    "pergunta": "Qual é o endereço ou município dessa pessoa?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 249,
    "bloco": 12,
    "blocoTitulo": "Rede de relacionamento e instituições",
    "id": "p249",
    "pergunta": "Costuma permanecer ou se hospedar com essa pessoa?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 250,
    "bloco": 12,
    "blocoTitulo": "Rede de relacionamento e instituições",
    "id": "p250",
    "pergunta": "Essa pessoa já foi contatada sobre o desaparecimento?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 251,
    "bloco": 13,
    "blocoTitulo": "Contatos estratégicos",
    "id": "p251",
    "pergunta": "Existe médico ou serviço médico de referência?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 252,
    "bloco": 13,
    "blocoTitulo": "Contatos estratégicos",
    "id": "p252",
    "pergunta": "Qual é o nome e contato?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 253,
    "bloco": 13,
    "blocoTitulo": "Contatos estratégicos",
    "id": "p253",
    "pergunta": "Existe CAPS ou serviço de saúde mental de referência?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 254,
    "bloco": 13,
    "blocoTitulo": "Contatos estratégicos",
    "id": "p254",
    "pergunta": "Qual é o nome e contato do serviço?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 255,
    "bloco": 13,
    "blocoTitulo": "Contatos estratégicos",
    "id": "p255",
    "pergunta": "Existe psicólogo, terapeuta ou profissional de saúde mental de referência?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 256,
    "bloco": 13,
    "blocoTitulo": "Contatos estratégicos",
    "id": "p256",
    "pergunta": "Qual é o nome e contato?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 257,
    "bloco": 13,
    "blocoTitulo": "Contatos estratégicos",
    "id": "p257",
    "pergunta": "Existe assistente social de referência?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 258,
    "bloco": 13,
    "blocoTitulo": "Contatos estratégicos",
    "id": "p258",
    "pergunta": "Qual é o nome e contato?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 259,
    "bloco": 13,
    "blocoTitulo": "Contatos estratégicos",
    "id": "p259",
    "pergunta": "Existe cuidador?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 260,
    "bloco": 13,
    "blocoTitulo": "Contatos estratégicos",
    "id": "p260",
    "pergunta": "Qual é o nome e contato do cuidador?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 261,
    "bloco": 13,
    "blocoTitulo": "Contatos estratégicos",
    "id": "p261",
    "pergunta": "Existe líder ou instituição religiosa de referência?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 262,
    "bloco": 13,
    "blocoTitulo": "Contatos estratégicos",
    "id": "p262",
    "pergunta": "Qual é o nome e contato?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 263,
    "bloco": 13,
    "blocoTitulo": "Contatos estratégicos",
    "id": "p263",
    "pergunta": "Existe instituição de acolhimento de referência?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 264,
    "bloco": 13,
    "blocoTitulo": "Contatos estratégicos",
    "id": "p264",
    "pergunta": "Qual é o nome, telefone ou e-mail?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 265,
    "bloco": 13,
    "blocoTitulo": "Contatos estratégicos",
    "id": "p265",
    "pergunta": "Existe albergue que costuma utilizar?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 266,
    "bloco": 13,
    "blocoTitulo": "Contatos estratégicos",
    "id": "p266",
    "pergunta": "Qual é o nome, endereço e contato do albergue?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 267,
    "bloco": 13,
    "blocoTitulo": "Contatos estratégicos",
    "id": "p267",
    "pergunta": "Existe comunidade terapêutica vinculada?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 268,
    "bloco": 13,
    "blocoTitulo": "Contatos estratégicos",
    "id": "p268",
    "pergunta": "Qual é o nome e contato?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 269,
    "bloco": 13,
    "blocoTitulo": "Contatos estratégicos",
    "id": "p269",
    "pergunta": "Existe outro profissional, serviço ou instituição que possa ajudar a localizar a pessoa?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 270,
    "bloco": 13,
    "blocoTitulo": "Contatos estratégicos",
    "id": "p270",
    "pergunta": "Qual é o nome, vínculo e meio de contato?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 271,
    "bloco": 14,
    "blocoTitulo": "Contato e acionamento operacional",
    "id": "p271",
    "pergunta": "Há necessidade de a Cabine Verde contatar o local de trabalho?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 272,
    "bloco": 14,
    "blocoTitulo": "Contato e acionamento operacional",
    "id": "p272",
    "pergunta": "Há necessidade de contatar escola, faculdade ou instituição de ensino?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 273,
    "bloco": 14,
    "blocoTitulo": "Contato e acionamento operacional",
    "id": "p273",
    "pergunta": "Há necessidade de contatar CAPS ou serviço de saúde mental?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 274,
    "bloco": 14,
    "blocoTitulo": "Contato e acionamento operacional",
    "id": "p274",
    "pergunta": "Há necessidade de contatar hospital, UPA ou pronto-socorro?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 275,
    "bloco": 14,
    "blocoTitulo": "Contato e acionamento operacional",
    "id": "p275",
    "pergunta": "Há necessidade de contatar albergue ou instituição de acolhimento?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 276,
    "bloco": 14,
    "blocoTitulo": "Contato e acionamento operacional",
    "id": "p276",
    "pergunta": "Há necessidade de contatar familiar?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 277,
    "bloco": 14,
    "blocoTitulo": "Contato e acionamento operacional",
    "id": "p277",
    "pergunta": "Há necessidade de contatar amigo ou pessoa de confiança?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 278,
    "bloco": 14,
    "blocoTitulo": "Contato e acionamento operacional",
    "id": "p278",
    "pergunta": "Qual pessoa ou instituição deve ser priorizada no contato?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 279,
    "bloco": 14,
    "blocoTitulo": "Contato e acionamento operacional",
    "id": "p279",
    "pergunta": "Qual é o telefone principal para esse contato?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 280,
    "bloco": 14,
    "blocoTitulo": "Contato e acionamento operacional",
    "id": "p280",
    "pergunta": "Existe telefone alternativo?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 281,
    "bloco": 14,
    "blocoTitulo": "Contato e acionamento operacional",
    "id": "p281",
    "pergunta": "Existe e-mail ou outro canal eletrônico disponível?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 282,
    "bloco": 14,
    "blocoTitulo": "Contato e acionamento operacional",
    "id": "p282",
    "pergunta": "Qual é o horário de funcionamento ou melhor horário para contato?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 283,
    "bloco": 14,
    "blocoTitulo": "Contato e acionamento operacional",
    "id": "p283",
    "pergunta": "Existe pessoa específica de referência na instituição?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 284,
    "bloco": 14,
    "blocoTitulo": "Contato e acionamento operacional",
    "id": "p284",
    "pergunta": "Qual informação precisa ser confirmada ou solicitada nesse contato?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 285,
    "bloco": 14,
    "blocoTitulo": "Contato e acionamento operacional",
    "id": "p285",
    "pergunta": "Qual foi o resultado do contato realizado?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 286,
    "bloco": 15,
    "blocoTitulo": "Classificação, ação, localização e encerramento",
    "id": "p286",
    "pergunta": "Qual é a vulnerabilidade predominante?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 287,
    "bloco": 15,
    "blocoTitulo": "Classificação, ação, localização e encerramento",
    "id": "p287",
    "pergunta": "Qual é a classificação de risco do caso?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 288,
    "bloco": 15,
    "blocoTitulo": "Classificação, ação, localização e encerramento",
    "id": "p288",
    "pergunta": "Existe risco atual ou iminente à vida?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 289,
    "bloco": 15,
    "blocoTitulo": "Classificação, ação, localização e encerramento",
    "id": "p289",
    "pergunta": "Existe risco de suicídio ou autoagressão?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 290,
    "bloco": 15,
    "blocoTitulo": "Classificação, ação, localização e encerramento",
    "id": "p290",
    "pergunta": "Existe risco médico decorrente de doença, deficiência ou falta de medicação?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 291,
    "bloco": 15,
    "blocoTitulo": "Classificação, ação, localização e encerramento",
    "id": "p291",
    "pergunta": "Existe suspeita ou risco de crime, violência, exploração ou ação de terceiros?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 292,
    "bloco": 15,
    "blocoTitulo": "Classificação, ação, localização e encerramento",
    "id": "p292",
    "pergunta": "Qual é a prioridade operacional do caso?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 293,
    "bloco": 15,
    "blocoTitulo": "Classificação, ação, localização e encerramento",
    "id": "p293",
    "pergunta": "Há necessidade de despacho imediato de equipe?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 294,
    "bloco": 15,
    "blocoTitulo": "Classificação, ação, localização e encerramento",
    "id": "p294",
    "pergunta": "Há necessidade de difusão operacional da pessoa desaparecida?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 295,
    "bloco": 15,
    "blocoTitulo": "Classificação, ação, localização e encerramento",
    "id": "p295",
    "pergunta": "Há necessidade de consulta ou utilização de câmeras e sistemas de inteligência?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 296,
    "bloco": 15,
    "blocoTitulo": "Classificação, ação, localização e encerramento",
    "id": "p296",
    "pergunta": "Há necessidade de acionamento de outro órgão, serviço ou instituição?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 297,
    "bloco": 15,
    "blocoTitulo": "Classificação, ação, localização e encerramento",
    "id": "p297",
    "pergunta": "A pessoa foi localizada?",
    "tipo": "simNao",
    "complemento": true
  },
  {
    "numero": 298,
    "bloco": 15,
    "blocoTitulo": "Classificação, ação, localização e encerramento",
    "id": "p298",
    "pergunta": "Onde, quando, por quem e em quais condições foi localizada?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 299,
    "bloco": 15,
    "blocoTitulo": "Classificação, ação, localização e encerramento",
    "id": "p299",
    "pergunta": "Qual foi o encaminhamento realizado após a localização?",
    "tipo": "texto",
    "complemento": false
  },
  {
    "numero": 300,
    "bloco": 15,
    "blocoTitulo": "Classificação, ação, localização e encerramento",
    "id": "p300",
    "pergunta": "O caso pode ser encerrado ou necessita de acompanhamento, nova análise ou manutenção como desaparecimento ativo?",
    "tipo": "simNao",
    "complemento": true
  }
];

export const blocosMestre = [
  {
    "numero": 1,
    "titulo": "Identificação",
    "inicio": 1,
    "fim": 25
  },
  {
    "numero": 2,
    "titulo": "Última visualização e deslocamento",
    "inicio": 26,
    "fim": 45
  },
  {
    "numero": 3,
    "titulo": "Características físicas",
    "inicio": 46,
    "fim": 70
  },
  {
    "numero": 4,
    "titulo": "Objetos e pertences",
    "inicio": 71,
    "fim": 90
  },
  {
    "numero": 5,
    "titulo": "Saúde e vulnerabilidade",
    "inicio": 91,
    "fim": 125
  },
  {
    "numero": 6,
    "titulo": "Dispositivos médicos e identificação odontológica",
    "inicio": 126,
    "fim": 140
  },
  {
    "numero": 7,
    "titulo": "Álcool e outras drogas",
    "inicio": 141,
    "fim": 150
  },
  {
    "numero": 8,
    "titulo": "Contexto, comportamento e possível motivação",
    "inicio": 151,
    "fim": 165
  },
  {
    "numero": 9,
    "titulo": "Buscas preliminares",
    "inicio": 166,
    "fim": 175
  },
  {
    "numero": 10,
    "titulo": "Padrões de deslocamento e locais prováveis",
    "inicio": 176,
    "fim": 200
  },
  {
    "numero": 11,
    "titulo": "Inteligência operacional e rastros digitais",
    "inicio": 201,
    "fim": 220
  },
  {
    "numero": 12,
    "titulo": "Rede de relacionamento e instituições",
    "inicio": 221,
    "fim": 250
  },
  {
    "numero": 13,
    "titulo": "Contatos estratégicos",
    "inicio": 251,
    "fim": 270
  },
  {
    "numero": 14,
    "titulo": "Contato e acionamento operacional",
    "inicio": 271,
    "fim": 285
  },
  {
    "numero": 15,
    "titulo": "Classificação, ação, localização e encerramento",
    "inicio": 286,
    "fim": 300
  }
];

