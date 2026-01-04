window.TREINOS_POR_MODALIDADE = {
  corrida: {
    resistencia: [
      { nome: "Contínuo progressivo", distKm: 5.0, desc: "10' leve + 20' ritmo estável + 5' leve", tipo: "res_vel" },
      { nome: "Fartlek leve", distKm: 4.5, desc: "6×(2' moderado/2' leve) + 10' leve", tipo: "res_vel" },
      { nome: "Tempo run fracionado", distKm: 5.2, desc: "3×6' forte/2' leve + 8' leve", tipo: "res_vel" },
      { nome: "Intervalado 800m", distKm: 4.8, desc: "5×800m (85–90%) 2' leve + 10' leve", tipo: "res_vel" },
      { nome: "Rodagem com técnica", distKm: 4.0, desc: "20' leve + 6×60m técnica + 8' leve", tipo: "res_vel" }
    ],
    velocidade: [
      { nome: "Ladeira curta", distKm: 2.4, desc: "10×80m subida + 10' leve", tipo: "potencia" },
      { nome: "Pliometria + sprint", distKm: 2.0, desc: "3×(6 saltos + 60m forte)", tipo: "potencia" },
      { nome: "Aceleração 30–60", distKm: 2.2, desc: "8×(30m + 60m) 90% + 8' leve", tipo: "potencia" },
      { nome: "Circuito força corrida", distKm: 2.1, desc: "3×(agacho 6rep + 40m forte)", tipo: "potencia" },
      { nome: "Sprint em escada", distKm: 2.0, desc: "6×(escada 20\" + 30m forte)", tipo: "potencia" }
    ],
    velocidade_pura: [
      { nome: "Sprints 100m", distKm: 2.0, desc: "12×100m (95%) 2' pausa + 10' leve", tipo: "intensidade" },
      { nome: "Pirâmide 60–120", distKm: 1.9, desc: "60–80–100–120–100–80–60 (95%)", tipo: "intensidade" },
      { nome: "Sprint técnico", distKm: 1.8, desc: "8×80m foco mecânica + 10' leve", tipo: "intensidade" },
      { nome: "Intervalado 40/20", distKm: 2.6, desc: "3×(6×40\" forte/20\" leve)", tipo: "intensidade" },
      { nome: "Saídas rápidas", distKm: 1.6, desc: "10×20m reação + 6×60m", tipo: "intensidade" }
    ]
  },
  bike: {
    resistencia: [
      { nome: "Contínuo Z2", distKm: 18.0, desc: "40' Z2 + 10' leve", tipo: "res_vel" },
      { nome: "Tempo progressivo", distKm: 20.0, desc: "10' leve + 3×8' Z3/2' leve", tipo: "res_vel" },
      { nome: "Pirâmide Z3", distKm: 16.0, desc: "5-8-10-8-5' Z3 c/ 2' leve", tipo: "res_vel" },
      { nome: "Subida moderada", distKm: 14.0, desc: "6×3' subida Z3/3' leve", tipo: "res_vel" },
      { nome: "Endurance técnica", distKm: 15.0, desc: "30' Z2 + 6×30\" cadência alta", tipo: "res_vel" }
    ],
    velocidade: [
      { nome: "Arrancadas curtas", distKm: 10.0, desc: "8×20\" forte/2' leve", tipo: "potencia" },
      { nome: "Sprint em subida", distKm: 9.0, desc: "10×15\" subida forte/2' leve", tipo: "potencia" },
      { nome: "Pliometria na bike", distKm: 11.0, desc: "6×30\" sprint/3' leve", tipo: "potencia" },
      { nome: "Força específica", distKm: 12.0, desc: "6×2' cadência baixa/2' leve", tipo: "potencia" },
      { nome: "Sprints 10-20", distKm: 10.5, desc: "10×(10\"+20\") forte/2' leve", tipo: "potencia" }
    ],
    velocidade_pura: [
      { nome: "Sprint 10×10", distKm: 9.0, desc: "10×10\" máxima/2' leve", tipo: "intensidade" },
      { nome: "VO2 curto", distKm: 12.0, desc: "8×30\" forte/1' leve", tipo: "intensidade" },
      { nome: "Explosão 15s", distKm: 9.5, desc: "12×15\" forte/90\" leve", tipo: "intensidade" },
      { nome: "Sprint em bloco", distKm: 11.0, desc: "3×(5×20\" forte/40\" leve)", tipo: "intensidade" },
      { nome: "Arranque técnico", distKm: 10.0, desc: "6×30\" forte + 10' leve", tipo: "intensidade" }
    ]
  },
  remo: {
    resistencia: [
      { nome: "Contínuo 30'", distKm: 6.0, desc: "30' ritmo leve + 5' desaquec", tipo: "res_vel" },
      { nome: "Intervalos 4'", distKm: 5.5, desc: "5×4' moderado/2' leve", tipo: "res_vel" },
      { nome: "Tempo 3×6'", distKm: 5.8, desc: "3×6' forte/2' leve", tipo: "res_vel" },
      { nome: "Progressivo 20'", distKm: 5.0, desc: "20' progressivo Z2–Z3", tipo: "res_vel" },
      { nome: "Técnica + base", distKm: 4.8, desc: "15' base + 8×20\" técnica", tipo: "res_vel" }
    ],
    velocidade: [
      { nome: "Sprints 10×20\"", distKm: 4.0, desc: "10×20\" forte/1'40\" leve", tipo: "potencia" },
      { nome: "Potência 6×30\"", distKm: 4.2, desc: "6×30\" forte/2' leve", tipo: "potencia" },
      { nome: "Arranques curtos", distKm: 3.8, desc: "8×15\" explosivo/90\" leve", tipo: "potencia" },
      { nome: "Força específica", distKm: 4.5, desc: "6×1' cadência baixa/2' leve", tipo: "potencia" },
      { nome: "Bloco potência", distKm: 4.1, desc: "3×(4×20\" forte/40\" leve)", tipo: "potencia" }
    ],
    velocidade_pura: [
      { nome: "Sprint 8×100m", distKm: 3.5, desc: "8×100m máximo/1' leve", tipo: "intensidade" },
      { nome: "Explosão 12×15\"", distKm: 3.6, desc: "12×15\" forte/1'15\" leve", tipo: "intensidade" },
      { nome: "Intervalado curto", distKm: 4.0, desc: "10×30\" forte/30\" leve", tipo: "intensidade" },
      { nome: "Arranque técnico", distKm: 3.8, desc: "6×20\" forte + 10' leve", tipo: "intensidade" },
      { nome: "Reação rápida", distKm: 3.4, desc: "10×10\" forte/50\" leve", tipo: "intensidade" }
    ]
  },
  natacao: {
    resistencia: [
      { nome: "Contínuo 1200m", distKm: 1.2, desc: "1200m ritmo constante", tipo: "res_vel" },
      { nome: "Série 6×200m", distKm: 1.2, desc: "6×200m moderado/30\" pausa", tipo: "res_vel" },
      { nome: "Tempo 3×300m", distKm: 0.9, desc: "3×300m forte/45\" pausa", tipo: "res_vel" },
      { nome: "Progressivo 800m", distKm: 0.8, desc: "800m progressivo + 200m leve", tipo: "res_vel" },
      { nome: "Técnica + base", distKm: 0.9, desc: "6×50m técnica + 600m leve", tipo: "res_vel" }
    ],
    velocidade: [
      { nome: "Sprint 12×25m", distKm: 0.6, desc: "12×25m forte/30\" pausa", tipo: "potencia" },
      { nome: "Explosão 8×50m", distKm: 0.4, desc: "8×50m forte/40\" pausa", tipo: "potencia" },
      { nome: "Potência 6×75m", distKm: 0.45, desc: "6×75m forte/45\" pausa", tipo: "potencia" },
      { nome: "Saídas rápidas", distKm: 0.5, desc: "10×25m saída/25m leve", tipo: "potencia" },
      { nome: "Pliometria água", distKm: 0.55, desc: "5×100m forte/1' pausa", tipo: "potencia" }
    ],
    velocidade_pura: [
      { nome: "Sprint 16×25m", distKm: 0.4, desc: "16×25m máximo/20\" pausa", tipo: "intensidade" },
      { nome: "Explosão 10×50m", distKm: 0.5, desc: "10×50m máximo/30\" pausa", tipo: "intensidade" },
      { nome: "Intervalo 20×25m", distKm: 0.5, desc: "20×25m forte/15\" pausa", tipo: "intensidade" },
      { nome: "Técnica rápida", distKm: 0.45, desc: "8×50m ritmo alto/30\" pausa", tipo: "intensidade" },
      { nome: "Sprint 6×100m", distKm: 0.6, desc: "6×100m máximo/45\" pausa", tipo: "intensidade" }
    ]
  },
  natacao_aberta: {
    resistencia: [
      { nome: "Contínuo 1500m", distKm: 1.5, desc: "1500m ritmo constante", tipo: "res_vel" },
      { nome: "Intervalo 3×500m", distKm: 1.5, desc: "3×500m moderado/1' pausa", tipo: "res_vel" },
      { nome: "Tempo 2×800m", distKm: 1.6, desc: "2×800m forte/2' pausa", tipo: "res_vel" },
      { nome: "Progressivo 1200m", distKm: 1.2, desc: "1200m progressivo + 200m leve", tipo: "res_vel" },
      { nome: "Técnica + base", distKm: 1.1, desc: "6×100m técnica + 500m leve", tipo: "res_vel" }
    ],
    velocidade: [
      { nome: "Sprint 10×50m", distKm: 0.5, desc: "10×50m forte/40\" pausa", tipo: "potencia" },
      { nome: "Explosão 8×75m", distKm: 0.6, desc: "8×75m forte/45\" pausa", tipo: "potencia" },
      { nome: "Potência 6×100m", distKm: 0.6, desc: "6×100m forte/1' pausa", tipo: "potencia" },
      { nome: "Saídas rápidas", distKm: 0.7, desc: "10×25m saída/25m leve", tipo: "potencia" },
      { nome: "Pliometria água", distKm: 0.8, desc: "5×150m forte/1' pausa", tipo: "potencia" }
    ],
    velocidade_pura: [
      { nome: "Sprint 12×50m", distKm: 0.6, desc: "12×50m máximo/30\" pausa", tipo: "intensidade" },
      { nome: "Explosão 8×100m", distKm: 0.8, desc: "8×100m máximo/45\" pausa", tipo: "intensidade" },
      { nome: "Intervalo 16×25m", distKm: 0.4, desc: "16×25m forte/20\" pausa", tipo: "intensidade" },
      { nome: "Técnica rápida", distKm: 0.6, desc: "6×100m ritmo alto/30\" pausa", tipo: "intensidade" },
      { nome: "Sprint 4×200m", distKm: 0.8, desc: "4×200m máximo/1' pausa", tipo: "intensidade" }
    ]
  },
  eliptico: {
    resistencia: [
      { nome: "Contínuo 35'", distKm: 5.0, desc: "35' Z2 + 5' leve", tipo: "res_vel" },
      { nome: "Intervalo 6×3'", distKm: 4.5, desc: "6×3' moderado/2' leve", tipo: "res_vel" },
      { nome: "Progressivo 25'", distKm: 4.0, desc: "25' progressivo + 5' leve", tipo: "res_vel" },
      { nome: "Tempo 3×6'", distKm: 4.8, desc: "3×6' forte/2' leve", tipo: "res_vel" },
      { nome: "Base técnica", distKm: 4.2, desc: "20' leve + 6×20\" cadência alta", tipo: "res_vel" }
    ],
    velocidade: [
      { nome: "Sprints 10×30\"", distKm: 3.5, desc: "10×30\" forte/90\" leve", tipo: "potencia" },
      { nome: "Explosão 8×20\"", distKm: 3.0, desc: "8×20\" forte/1'40\" leve", tipo: "potencia" },
      { nome: "Potência 6×40\"", distKm: 3.8, desc: "6×40\" forte/2' leve", tipo: "potencia" },
      { nome: "Arranques curtos", distKm: 3.2, desc: "12×15\" forte/75\" leve", tipo: "potencia" },
      { nome: "Bloco potência", distKm: 3.6, desc: "3×(4×20\" forte/40\" leve)", tipo: "potencia" }
    ],
    velocidade_pura: [
      { nome: "Sprint 12×20\"", distKm: 3.0, desc: "12×20\" máximo/60\" leve", tipo: "intensidade" },
      { nome: "Intervalo curto", distKm: 3.4, desc: "10×30\" forte/30\" leve", tipo: "intensidade" },
      { nome: "Explosão 8×45\"", distKm: 3.6, desc: "8×45\" máximo/1' leve", tipo: "intensidade" },
      { nome: "Arranque técnico", distKm: 3.2, desc: "6×30\" forte + 10' leve", tipo: "intensidade" },
      { nome: "Sprint em bloco", distKm: 3.4, desc: "3×(6×15\" forte/45\" leve)", tipo: "intensidade" }
    ]
  },
  caminhada: {
    resistencia: [
      { nome: "Contínuo 40'", distKm: 4.0, desc: "40' ritmo constante", tipo: "res_vel" },
      { nome: "Intervalo 5×4'", distKm: 3.8, desc: "5×4' moderado/2' leve", tipo: "res_vel" },
      { nome: "Progressivo 30'", distKm: 3.5, desc: "30' progressivo + 5' leve", tipo: "res_vel" },
      { nome: "Tempo 3×6'", distKm: 3.6, desc: "3×6' forte/2' leve", tipo: "res_vel" },
      { nome: "Base técnica", distKm: 3.2, desc: "25' leve + 6×20\" passos longos", tipo: "res_vel" }
    ],
    velocidade: [
      { nome: "Subida curta", distKm: 2.8, desc: "8×60m subida/60m leve", tipo: "potencia" },
      { nome: "Acelera/recupera", distKm: 3.0, desc: "10×1' rápido/1' leve", tipo: "potencia" },
      { nome: "Sprints curtos", distKm: 2.6, desc: "12×20\" rápido/40\" leve", tipo: "potencia" },
      { nome: "Cadência alta", distKm: 2.9, desc: "6×2' rápido/2' leve", tipo: "potencia" },
      { nome: "Bloco potência", distKm: 3.1, desc: "3×(4×30\" rápido/30\" leve)", tipo: "potencia" }
    ],
    velocidade_pura: [
      { nome: "Sprint 10×30\"", distKm: 2.5, desc: "10×30\" máximo/60\" leve", tipo: "intensidade" },
      { nome: "Intervalo curto", distKm: 2.7, desc: "12×20\" rápido/40\" leve", tipo: "intensidade" },
      { nome: "Explosão 8×45\"", distKm: 2.8, desc: "8×45\" rápido/75\" leve", tipo: "intensidade" },
      { nome: "Arranque técnico", distKm: 2.6, desc: "6×30\" rápido + 10' leve", tipo: "intensidade" },
      { nome: "Sprint em bloco", distKm: 2.7, desc: "3×(6×15\" rápido/45\" leve)", tipo: "intensidade" }
    ]
  },
  trilha: {
    resistencia: [
      { nome: "Contínuo trilha", distKm: 6.0, desc: "40' ritmo constante em trilha", tipo: "res_vel" },
      { nome: "Intervalo subida", distKm: 5.5, desc: "6×2' subida/2' descida leve", tipo: "res_vel" },
      { nome: "Progressivo 30'", distKm: 5.2, desc: "30' progressivo + 5' leve", tipo: "res_vel" },
      { nome: "Tempo 3×6'", distKm: 5.8, desc: "3×6' forte/2' leve", tipo: "res_vel" },
      { nome: "Base técnica", distKm: 5.0, desc: "25' leve + 6×20\" técnica", tipo: "res_vel" }
    ],
    velocidade: [
      { nome: "Subida curta", distKm: 4.0, desc: "8×60m subida/60m leve", tipo: "potencia" },
      { nome: "Acelera/recupera", distKm: 4.5, desc: "10×1' rápido/1' leve", tipo: "potencia" },
      { nome: "Sprints curtos", distKm: 3.8, desc: "12×20\" rápido/40\" leve", tipo: "potencia" },
      { nome: "Cadência alta", distKm: 4.2, desc: "6×2' rápido/2' leve", tipo: "potencia" },
      { nome: "Bloco potência", distKm: 4.1, desc: "3×(4×30\" rápido/30\" leve)", tipo: "potencia" }
    ],
    velocidade_pura: [
      { nome: "Sprint 10×30\"", distKm: 3.6, desc: "10×30\" máximo/60\" leve", tipo: "intensidade" },
      { nome: "Intervalo curto", distKm: 3.8, desc: "12×20\" rápido/40\" leve", tipo: "intensidade" },
      { nome: "Explosão 8×45\"", distKm: 4.0, desc: "8×45\" rápido/75\" leve", tipo: "intensidade" },
      { nome: "Arranque técnico", distKm: 3.7, desc: "6×30\" rápido + 10' leve", tipo: "intensidade" },
      { nome: "Sprint em bloco", distKm: 3.8, desc: "3×(6×15\" rápido/45\" leve)", tipo: "intensidade" }
    ]
  },
  aqua_run: {
    resistencia: [
      { nome: "Contínuo 25'", distKm: 3.0, desc: "25' ritmo constante", tipo: "res_vel" },
      { nome: "Intervalo 6×3'", distKm: 2.8, desc: "6×3' moderado/2' leve", tipo: "res_vel" },
      { nome: "Progressivo 20'", distKm: 2.5, desc: "20' progressivo + 5' leve", tipo: "res_vel" },
      { nome: "Tempo 3×5'", distKm: 2.7, desc: "3×5' forte/2' leve", tipo: "res_vel" },
      { nome: "Base técnica", distKm: 2.4, desc: "15' leve + 6×20\" técnica", tipo: "res_vel" }
    ],
    velocidade: [
      { nome: "Sprints 10×30\"", distKm: 2.0, desc: "10×30\" forte/60\" leve", tipo: "potencia" },
      { nome: "Explosão 8×20\"", distKm: 1.8, desc: "8×20\" forte/1'40\" leve", tipo: "potencia" },
      { nome: "Potência 6×40\"", distKm: 2.2, desc: "6×40\" forte/2' leve", tipo: "potencia" },
      { nome: "Arranques curtos", distKm: 1.9, desc: "12×15\" forte/75\" leve", tipo: "potencia" },
      { nome: "Bloco potência", distKm: 2.1, desc: "3×(4×20\" forte/40\" leve)", tipo: "potencia" }
    ],
    velocidade_pura: [
      { nome: "Sprint 12×20\"", distKm: 1.8, desc: "12×20\" máximo/60\" leve", tipo: "intensidade" },
      { nome: "Intervalo curto", distKm: 2.0, desc: "10×30\" forte/30\" leve", tipo: "intensidade" },
      { nome: "Explosão 8×45\"", distKm: 2.2, desc: "8×45\" máximo/1' leve", tipo: "intensidade" },
      { nome: "Arranque técnico", distKm: 1.9, desc: "6×30\" forte + 10' leve", tipo: "intensidade" },
      { nome: "Sprint em bloco", distKm: 2.0, desc: "3×(6×15\" forte/45\" leve)", tipo: "intensidade" }
    ]
  },
  esqui: {
    resistencia: [
      { nome: "Contínuo 35'", distKm: 7.0, desc: "35' ritmo constante + 5' leve", tipo: "res_vel" },
      { nome: "Intervalo 5×4'", distKm: 6.5, desc: "5×4' moderado/2' leve", tipo: "res_vel" },
      { nome: "Progressivo 30'", distKm: 6.0, desc: "30' progressivo + 5' leve", tipo: "res_vel" },
      { nome: "Tempo 3×6'", distKm: 6.8, desc: "3×6' forte/2' leve", tipo: "res_vel" },
      { nome: "Base técnica", distKm: 6.2, desc: "25' leve + 6×20\" cadência alta", tipo: "res_vel" }
    ],
    velocidade: [
      { nome: "Sprints 10×30\"", distKm: 5.0, desc: "10×30\" forte/90\" leve", tipo: "potencia" },
      { nome: "Explosão 8×20\"", distKm: 4.6, desc: "8×20\" forte/1'40\" leve", tipo: "potencia" },
      { nome: "Potência 6×40\"", distKm: 5.2, desc: "6×40\" forte/2' leve", tipo: "potencia" },
      { nome: "Arranques curtos", distKm: 4.8, desc: "12×15\" forte/75\" leve", tipo: "potencia" },
      { nome: "Bloco potência", distKm: 5.1, desc: "3×(4×20\" forte/40\" leve)", tipo: "potencia" }
    ],
    velocidade_pura: [
      { nome: "Sprint 12×20\"", distKm: 4.6, desc: "12×20\" máximo/60\" leve", tipo: "intensidade" },
      { nome: "Intervalo curto", distKm: 4.8, desc: "10×30\" forte/30\" leve", tipo: "intensidade" },
      { nome: "Explosão 8×45\"", distKm: 5.0, desc: "8×45\" máximo/1' leve", tipo: "intensidade" },
      { nome: "Arranque técnico", distKm: 4.7, desc: "6×30\" forte + 10' leve", tipo: "intensidade" },
      { nome: "Sprint em bloco", distKm: 4.8, desc: "3×(6×15\" forte/45\" leve)", tipo: "intensidade" }
    ]
  }
};
