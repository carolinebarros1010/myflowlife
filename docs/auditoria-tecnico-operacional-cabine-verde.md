# Auditoria técnico-operacional — Projeto Cabine Verde

**Data da auditoria:** 01/05/2026  
**Escopo:** revisão crítica do modelo conceitual e operacional do Cabine Verde para triagem e resposta a casos de pessoas desaparecidas, incluindo governança, proteção de dados, integração interagências, banco de dados e uso de imagens/reconhecimento facial.  
**Base documental auditada:** `docs/deploy-cabineverde.md`, `docs/diagnostico-cabineverde-deploy.md` e definição institucional vigente do projeto.

---

## 1) Diagnóstico geral do projeto

O projeto **Cabine Verde** apresenta uma direção funcional promissora (triagem + ação coordenada), mas, no estado documental atual, encontra-se com **maturidade técnico-operacional parcial**: há robustez no recorte de deploy técnico, porém insuficiência de especificação operacional e jurídico-procedimental para um ambiente de segurança pública de alta criticidade.

### Diagnóstico sintético
- **Ponto forte atual:** organização técnica de publicação do módulo e integração básica com endpoint de registro.
- **Ponto crítico principal:** ausência de protocolo operacional formal completo ponta a ponta (entrada → triagem → classificação → decisão → despacho → pós-localização → encerramento auditável).
- **Risco estruturante:** operar com tecnologia de imagens/biometria sem normativo de governança, rastreabilidade e validação humana explícita.

---

## 2) Pontos fortes

1. **Delimitação de subprojeto e publicação controlada**
   - Separação operacional entre site principal e módulo Cabine Verde, reduzindo risco de indisponibilidade sistêmica por erro de deploy.

2. **Preocupação com fluxo de integração de dados**
   - Existência de integração com Apps Script e manutenção explícita de gravação em aba operacional (`Desaparecidos`).

3. **Visão de resposta célere e coordenada**
   - A definição do projeto já contempla elementos críticos (triagem, análise, decisão e ação), sinalizando vocação para centro de operações.

4. **Documentação técnica de publicação já iniciada**
   - Há documentação de deploy, healthcheck e validações pós-publicação.

---

## 3) Pontos críticos (análise por eixo)

### 3.1 Clareza conceitual
**Achados críticos**
- A definição atual é ampla, porém **não delimita finalidade jurídica, base legal de tratamento de dados, limites de atuação institucional e critérios de acionamento**.
- Termos como “resposta célere” e “coordenada” carecem de métricas (SLA) e responsabilidades por função.
- “Tecnologias de reconhecimento facial” aparece sem condicionantes explícitos de uso excepcional, proporcionalidade e revisão humana.

**Impacto**
- Risco de divergência operacional entre turnos/equipes.
- Vulnerabilidade jurídica em questionamentos de legalidade e necessidade.

---

### 3.2 Fluxo operacional
**Achados críticos**
- Não há, na documentação auditada, fluxo formal completo com gates decisórios e estados de ocorrência.
- Não foram identificados fluxos diferenciados por perfis vulneráveis e cenários de risco (criança, idoso, PCD, transtorno mental, suspeita de crime etc.).
- Ausência de critério claro para transição de “análise” para “despacho”.

**Impacto**
- Atraso decisório, inconsistência entre operadores e risco de despacho inadequado.

---

### 3.3 Triagem qualificada
**Achados críticos**
- Não há roteiro padronizado mínimo de perguntas com priorização objetiva.
- Falta escore de urgência com gatilhos automáticos para despacho imediato.

**Impacto**
- Erro de classificação e subestimação de risco à vida.

**Perguntas adicionais recomendadas (mínimo obrigatório)**
1. Último local e horário de visualização confirmada (com fonte da confirmação).
2. Idade, condição de saúde, medicação contínua e risco de desorientação.
3. Existência de ameaça prévia, violência doméstica, stalking, conflito familiar ou dívida.
4. Uso de transporte público no deslocamento provável.
5. Acesso a celular (ligado/desligado), aplicativos de localização e contatos recentes.
6. Histórico de desaparecimento prévio e padrão de retorno.
7. Indícios de autoagressão, ideação suicida ou vulnerabilidade aguda.
8. Vestimentas, sinais particulares, foto recente validada e autorização de uso.

---

### 3.4 Classificação de risco
**Achados críticos**
- Não há escala formal com critérios mensuráveis por prioridade.

**Matriz sugerida (resumo)**
- **P0 — Prioridade Máxima:** risco imediato à vida, criança pequena sozinha, indício criminal concreto, pessoa com transtorno mental em desorientação aguda, clima/terreno hostil. **Despacho imediato + supervisor em até 5 min.**
- **P1 — Alta:** vulnerabilidade relevante sem prova de violência atual. **Despacho em até 15 min + análise paralela.**
- **P2 — Moderada:** sem indício direto de dano iminente, dados suficientes para busca dirigida. **Análise inicial em até 30 min; despacho condicionado.**
- **P3 — Ordinária:** baixa criticidade imediata, sem vulnerabilidade relevante. **Acompanhamento estruturado + reavaliação periódica.**

**Critérios mensuráveis por pontuação (0–20)**
- Vulnerabilidade pessoal (0–5)
- Indício criminal (0–5)
- Tempo de desaparecimento e contexto (0–4)
- Confiabilidade da última informação (0–3)
- Exposição ambiental (0–3)

Faixas: 15–20 (P0), 10–14 (P1), 6–9 (P2), 0–5 (P3).

---

### 3.5 Decisão operacional
**Achados críticos**
- Papéis decisórios não formalmente separados por nível de autoridade.

**Modelo mínimo recomendado (RACI simplificado)**
- **Atendente:** coleta e validação inicial de dados; classificação preliminar.
- **Supervisor de triagem:** valida risco e define rota operacional inicial.
- **Chefe de operações:** autoriza medidas extraordinárias e integrações sensíveis.
- **Análise operacional:** consolida inteligência e oportunidades de busca.
- **Despacho:** aciona viaturas/equipes e monitora execução.
- **Campo/viatura:** diligência, retorno tático e atualização em tempo real.

---

### 3.6 Despacho de recursos
**Achados críticos**
- Ausência de critérios objetivos de despacho imediato vs. análise prévia.

**Regra prática sugerida**
- **Despacho imediato:** P0 sempre; P1 com gatilho específico (menor de idade, risco clínico, indício criminal).
- **Análise prévia curta (até 15 min):** P1 sem gatilho e P2.
- **Sem despacho inicial:** P3, salvo reclassificação.

**Riscos observados**
- Prematuro: deslocar recurso sem dados mínimos de área/descrição.
- Tardio: aguardar “dossiê perfeito” em cenário de risco alto.
- Desnecessário: acionar múltiplas equipes sem coordenação única.

---

### 3.7 Uso de banco de dados
**Achados críticos**
- Não há modelo de dados operacional consolidado com versionamento de eventos.
- Risco de duplicidade de ocorrência e inconsistência de atualização.

**Estrutura mínima recomendada**
Tabelas/coleções:
1. `ocorrencias` (id único, status, prioridade, timestamps, órgão líder).
2. `pessoas_desaparecidas` (dados pessoais mínimos, vulnerabilidades, foto hash).
3. `eventos_ocorrencia` (linha do tempo auditável de ações/decisões).
4. `acionamentos` (órgão, responsável, horário, retorno).
5. `evidencias_imagem` (origem, finalidade, autorização, cadeia de custódia lógica).
6. `resultado_localizacao` (com vida, risco, óbito, encaminhamentos).

Campos mandatórios: `created_at`, `updated_at`, `actor_id`, `origem_dado`, `nivel_sigilo`, `fundamento_legal`.

---

### 3.8 Uso de imagens e reconhecimento facial
**Achados críticos**
- Sem política formal de governança para biometria e imagens sensíveis.

**Riscos-chave**
- Falso positivo, viés de base, exposição indevida de imagem de menor, uso secundário não autorizado.

**Controles mandatórios**
1. Finalidade específica por caso + registro de base legal.
2. Controle de acesso por perfil e trilha de auditoria imutável.
3. Validação humana obrigatória de todo match algorítmico.
4. Proibição de decisão automatizada isolada para ação coercitiva.
5. Retenção mínima necessária e descarte seguro.
6. Revisão periódica de acurácia (FAR/FRR) e viés por grupos.

---

### 3.9 Integração interagências
**Achados críticos**
- Integração desejada, mas não protocolada com matriz de responsabilidade por órgão.

**Necessidade crítica**
- Acordo operacional (SOP/MOU) com fluxos de acionamento, prazos de resposta, canal oficial, escalonamento e registro de accountability por cada parceiro (COPOM, COBOM, Polícia Civil, DHPP, Conselho Tutelar, saúde, assistência, SAMU, GCM, transporte etc.).

---

### 3.10 Registro da ocorrência
**Achados críticos**
- Documentação disponível não descreve talão/registro orientado à auditoria jurídica completa.

**Campos obrigatórios sugeridos**
- Identificador único da ocorrência.
- Identificação do comunicante e vínculo.
- Linha do tempo de eventos (data/hora UTC e local).
- Classificação inicial e reclassificações com justificativa.
- Decisor responsável por cada ato relevante.
- Acionamentos, retornos e resultados.
- Uso de imagem/biometria (quando, por quem, por quê, com qual resultado).
- Encerramento com motivo, encaminhamentos e ciência da família.

---

### 3.11 Fluxogramas por tipo de caso
**Achados críticos**
- Não há evidência documental de fluxos especializados por tipologia.

**Recomendação**
- Criar 12 fluxogramas padrão com entrada única, decisões binárias, gatilhos de despacho, pontos de integração e condições de encerramento/reabertura.

---

### 3.12 Pós-localização
**Achados críticos**
- Não há protocolo detalhado de pós-localização por desfecho.

**Procedimentos mínimos**
- Com vida sem risco: confirmação de identidade, comunicação familiar, orientação e encerramento formal.
- Com vulnerabilidade: acionamento saúde/assistência/conselho e plano de proteção.
- Vítima de crime: preservação de vestígios, polícia judiciária, exame pericial.
- Óbito: isolamento de local, cadeia de custódia, comunicação institucional e familiar assistida.

---

### 3.13 Governança e responsabilidade
**Achados críticos**
- Ausência de desenho de governança formal (comitê, ritos de atualização, KPI, compliance).

**Recomendação**
- Instituir Grupo Gestor Cabine Verde com representantes operacional, jurídico, tecnologia, dados e controle interno; reuniões mensais com ata e plano de ação.

---

### 3.14 Proteção de dados e segurança jurídica
**Achados críticos**
- Lacunas de adequação explícita à LGPD para dados sensíveis e biométricos.

**Salvaguardas sugeridas**
1. Relatório de Impacto à Proteção de Dados (RIPD).
2. Mapa de bases legais por hipótese de tratamento.
3. Política de compartilhamento mínimo necessário.
4. Plano de resposta a incidentes (vazamento/exposição).
5. Termos e avisos de privacidade operacionais adequados ao contexto emergencial.

---

### 3.15 Treinamento e capacitação
**Achados críticos**
- Não foi identificado currículo mínimo por função.

**Trilha mínima obrigatória**
- Triagem e classificação de risco.
- Comunicação com familiares em crise.
- Uso correto de sistemas e registro auditável.
- Integração interagências e cadeia de comando.
- Ética e conformidade no uso de imagem/biometria.

---

### 3.16 Indicadores de desempenho
**KPIs recomendados (com meta inicial)**
1. TMA triagem inicial (meta: ≤ 8 min).
2. Tempo atendimento→classificação (meta: ≤ 10 min).
3. Tempo atendimento→despacho P0 (meta: ≤ 5 min).
4. Tempo atendimento→despacho P1 (meta: ≤ 15 min).
5. Taxa de localização em 24h/72h.
6. Taxa de reclassificação de risco (qualidade de triagem).
7. Percentual de registros completos (meta: ≥ 95%).
8. Falsos positivos em reconhecimento facial (meta: tendência de queda contínua).
9. Tempo de resposta interagências.
10. Reincidência por perfil de caso.

---

### 3.17 Riscos operacionais
Riscos mais relevantes identificados:
- Atraso na triagem inicial.
- Classificação inconsistente entre turnos.
- Falhas de comunicação com órgãos externos.
- Lacunas de registro de decisão crítica.
- Despacho sem critério ou tardio.
- Uso indevido de imagem/biometria.
- Duplicidade de ocorrência por ausência de chave única.
- Baixa adesão operacional por excesso de complexidade do fluxo.

---

## 4) Lacunas identificadas

1. Protocolo operacional formal completo (SOP) inexistente ou não evidenciado.
2. Matriz de risco padronizada com critérios objetivos ausente.
3. Fluxogramas especializados por tipo de desaparecimento ausentes.
4. Política de governança de imagem e reconhecimento facial não formalizada.
5. Modelo de dados auditável e trilha de eventos insuficientemente descritos.
6. Governança institucional (comitê, rotina de revisão e accountability) não formalizada.

---

## 5) Riscos jurídicos e operacionais

### Jurídicos
- Tratamento excessivo de dados sensíveis sem demonstração de necessidade/proporcionalidade.
- Fragilidade de base legal e transparência no uso de biometria.
- Exposição indevida de crianças/adolescentes em canais de divulgação.
- Responsabilização por decisão automatizada sem validação humana.

### Operacionais
- Erro de priorização levando a dano real por atraso de resposta.
- Dispersão de comando em cenário multiagência.
- Perda de rastreabilidade de decisões e diligências.
- Redução de confiança institucional por inconsistências de conduta.

---

## 6) Recomendações por prioridade

### 6.1 Ajustes imediatos (0–30 dias)
1. Publicar SOP mínimo com fluxo único ponta a ponta.
2. Implantar matriz P0–P3 com critérios e gatilhos de despacho.
3. Criar checklist de triagem obrigatória em tela.
4. Tornar obrigatório registro de decisão e decisor em cada reclassificação.

### 6.2 Ajustes estruturais (31–90 dias)
1. Construir fluxos específicos por tipologia de caso.
2. Implementar modelo de dados com trilha de eventos imutável.
3. Formalizar integração interagências com SLA e pontos focais.

### 6.3 Ajustes normativos (até 120 dias)
1. Instituir norma interna de uso de imagem e biometria.
2. Aprovar política de retenção e descarte de dados.
3. Instituir ato formal de governança (grupo gestor + competências).

### 6.4 Ajustes tecnológicos (até 120 dias)
1. Controle de acesso RBAC e logs invioláveis.
2. Mecanismo anti-duplicidade de ocorrências.
3. Painel de indicadores em tempo real por prioridade/tempo.

### 6.5 Ajustes de treinamento (contínuo)
1. Capacitação inicial obrigatória por função.
2. Simulados mensais de casos críticos (P0/P1).
3. Reciclagem trimestral em LGPD, evidências digitais e comunicação em crise.

### 6.6 Ajustes de governança (contínuo)
1. Reunião mensal de revisão de casos e indicadores.
2. Auditoria interna trimestral de conformidade.
3. Relatório semestral de prestação de contas institucional.

---

## 7) Matriz de risco (resumo executivo)

| Risco | Probabilidade | Impacto | Nível | Controles recomendados |
|---|---:|---:|---:|---|
| Atraso na triagem | Alta | Alto | Crítico | SLA, fila priorizada, alerta de tempo |
| Erro de classificação | Média/Alta | Alto | Crítico | Escore padronizado + dupla checagem P0/P1 |
| Despacho tardio | Média | Alto | Alto | Gatilhos automáticos e escalonamento |
| Despacho prematuro | Média | Médio | Médio | Checklist mínimo de dados antes de envio |
| Falha interagências | Média | Alto | Alto | SOP conjunto + canal único + SLA |
| Duplicidade de ocorrência | Alta | Médio | Alto | Chave única + deduplicação por CPF/nome/data |
| Exposição indevida de imagem | Média | Alto | Alto | Controle de acesso, mascaramento e trilha |
| Falso positivo facial | Média | Alto | Alto | Revisão humana obrigatória + métricas FAR/FRR |
| Ausência de registro auditável | Média | Alto | Alto | Log de eventos obrigatório e bloqueio de encerramento incompleto |
| Baixa adesão de operadores | Média | Médio | Médio | UX simplificada + treinamento + supervisão |

---

## 8) Versão revisada da definição da Cabine Verde

> **Cabine Verde** é o sistema institucional de gestão de ocorrências de pessoas desaparecidas, composto por protocolo operacional padronizado de entrada, triagem qualificada, classificação de risco, decisão, despacho, integração interagências, acompanhamento e encerramento auditável, apoiado por banco de dados e uso controlado de imagens e tecnologias biométricas sob base legal, necessidade, proporcionalidade, validação humana e rastreabilidade, com a finalidade de localizar pessoas com celeridade, segurança jurídica e efetividade operacional.

---

## 9) Checklist final de implantação

### Governança
- [ ] Ato normativo institui o Cabine Verde e define competências.
- [ ] Grupo gestor formal com calendário e atas.

### Operação
- [ ] SOP ponta a ponta aprovado e publicado.
- [ ] Matriz P0–P3 implantada no sistema.
- [ ] Fluxos por tipologia de caso aprovados.

### Dados e tecnologia
- [ ] Modelo de dados operacional com trilha de eventos.
- [ ] Controle de acesso por perfil e logs auditáveis.
- [ ] Mecanismo de deduplicação ativo.

### Imagens e biometria
- [ ] Política de uso e validação humana aprovada.
- [ ] Registro de finalidade/base legal por consulta.
- [ ] Rotina de avaliação de acurácia e viés implementada.

### Integração interagências
- [ ] Acordos de fluxo e SLA assinados.
- [ ] Canal único de acionamento e escalonamento ativo.

### Capacitação e qualidade
- [ ] Treinamento inicial por função concluído.
- [ ] Simulados críticos realizados.
- [ ] Painel de KPIs em produção e com metas ativas.

---

## 10) Parecer conclusivo sobre a maturidade do projeto

**Classificação de maturidade atual: Nível 2/5 (em estruturação).**

O Cabine Verde demonstra intenção operacional adequada e boa organização técnica de deploy, mas ainda não está plenamente apto, no plano institucional, para operar com máxima segurança jurídica e previsibilidade tática em cenários complexos de desaparecimento envolvendo alta vulnerabilidade e uso de biometria.

**Parecer:** recomenda-se continuidade do projeto com **implantação condicionada** à execução dos ajustes imediatos (SOP, matriz de risco, decisão/despacho, trilha de auditoria e controles de dados/imagem). Após implementação e validação por indicadores por pelo menos 90 dias, o projeto pode avançar para estágio de maturidade intermediária (3/5), com auditoria externa subsequente.
