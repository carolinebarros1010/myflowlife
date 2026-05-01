# Auditoria funcional e processo operacional de utilização — Cabine Verde

**Data:** 01/05/2026  
**Escopo auditado:** módulos `Registro de Ocorrência`, `Consulta e Auditoria`, `Qualidade dos Dados`, `Relatórios`, `Mídias/Fotos` e `Administração`, com foco em operação real de central.

---

## PARTE 1 — Auditoria Funcional

### 1) Mapa geral dos módulos

1. **Registro de Ocorrência**: abertura de caso, triagem, classificação de risco, foto, salvamento e ações pós-salvamento.
2. **Consulta e Auditoria**: busca por `idCaso`, `talaoPMESP` e nome, timeline, histórico e edição controlada.
3. **Qualidade dos Dados**: inconsistências, severidade, priorização e tratamento com rastreabilidade.
4. **Relatórios**: operacional, estatístico, diário, PDF e texto SIOPM.
5. **Mídias/Fotos**: upload, metadados, validação/rejeição e visualização controlada.
6. **Administração**: perfis, cadastro sem autocadastro, logs, backup/migração/rollback e auditoria de Drive.

### 2) Tabela função x perfil

| Função | OPERADOR | SUPERVISOR | ADMIN | AUDITOR |
|---|---:|---:|---:|---:|
| Registro de novo caso | ✅ | ✅ | ✅ | ❌ |
| Preencher talão/triagem | ✅ | ✅ | ✅ | ❌ |
| Upload de foto | ✅ | ✅ | ✅ | ❌ |
| Consulta de casos | ❌ (somente via fluxo de registro) | ✅ | ✅ | ✅ |
| Edição controlada de caso | ❌ | ✅ | ✅ | ❌ |
| Justificativa de edição | ❌ | ✅ (obrigatória) | ✅ (obrigatória) | ❌ |
| Painel qualidade (visualizar) | parcial | ✅ | ✅ | ✅ |
| Marcar pendência resolvida | ❌ | ✅ | ✅ | ❌ |
| Validar/rejeitar foto | ❌ | ✅ | ✅ | ❌ |
| Relatórios/exportações | via registro | ✅ | ✅ | ✅ |
| Administração (perfil/log/backup/migração/rollback) | ❌ | ❌ | ✅ | ❌ |

### 3) Tabela função x momento operacional

| Momento | Função principal | Obrigatória? |
|---|---|---|
| Recepção da demanda | Iniciar caso + talão PMESP | ✅ |
| Coleta de dados essenciais | Identificação + última visualização + vulnerabilidade | ✅ |
| Análise inicial | Triagem qualificada + classificação de risco/prioridade | ✅ |
| Evidência visual | Upload de foto (quando disponível) | ⚠️ Condicional |
| Consolidação | Salvar caso + evento de criação | ✅ |
| Comunicação | Gerar relatório + exportar texto SIOPM | ✅ para despacho |
| Acompanhamento | Consulta/timeline/histórico | ✅ (durante ciclo do caso) |
| Correção | Edição controlada com justificativa | ⚠️ Sob necessidade |
| Governança | Auditoria de qualidade e tratamento | ✅ (rotina de gestão) |
| Encerramento | Relatório final + rastros auditáveis | ✅ |

### 4) Funções obrigatórias x opcionais

**Obrigatórias por caso:**
- `talaoPMESP` no início.
- identificação mínima da pessoa desaparecida.
- última visualização (tempo + local).
- classificação de risco/prioridade.
- salvamento com geração de eventos.
- relatório operacional/SIOPM para casos em despacho.

**Opcionais condicionais:**
- upload de foto (quando indisponível no momento).
- edição controlada (somente em correção/saneamento).
- marcação de qualidade como `IGNORADO` (apenas com critério auditável).

### 5) Funções críticas (alto impacto)

1. Atribuição de **classificação de risco** (erro aqui impacta tempo-resposta).
2. **Conflito de talão PMESP** e duplicidade operacional.
3. **Edição controlada** (integridade jurídica do caso).
4. **Validação/rejeição de foto** e controle de visualização.
5. **Exportação SIOPM** (mensagem oficial de acionamento).

### 6) Ações que exigem justificativa

- Edição controlada de caso (`SUPERVISOR/ADMIN`).
- Visualização de foto sensível (justificativa mínima qualificada).
- Rejeição de foto (motivo padronizado + campo livre).
- Tratamento manual de pendência com status `IGNORADO`.

### 7) Ações que geram evento/log

- criação de caso (`CASO_CRIADO`);
- decisão operacional (`DECISAO_OPERACIONAL`);
- upload/validação/rejeição de foto (`FOTO_ANEXADA`, `FOTO_VALIDADA`, `FOTO_REJEITADA`);
- visualização de foto (`FOTO_VISUALIZADA`) e logs de acesso;
- tentativa de uso excessivo de imagem (`USO_EXCESSIVO_FOTO`);
- edição controlada (`CASO_EDITADO`) + histórico detalhado;
- auditoria de qualidade (`AUDITORIA_QUALIDADE_DADOS`);
- resolução de pendência (`PROBLEMA_QUALIDADE_RESOLVIDO`);
- login/bloqueio de operador (`OPERADOR_LOGADO`, `OPERADOR_BLOQUEADO`).

### 8) Dependências de SUPERVISOR/ADMIN

**SUPERVISOR/ADMIN necessários para:**
- editar casos oficialmente;
- validar/rejeitar fotos;
- tratar pendências de qualidade como resolvidas;
- supervisionar casos críticos e priorização operacional.

**ADMIN exclusivo para:**
- cadastro e gestão de perfis de operadores;
- backup, migração e rollback;
- auditoria de Drive e controles avançados de logs.

### 9) Erros operacionais prováveis

1. Salvar sem dados mínimos (talão, local/tempo de última visualização, risco).
2. Duplicar caso por confusão entre `idCaso` e `talaoPMESP`.
3. Subclassificar risco crítico como moderado.
4. Anexar foto sem metadado/consentimento adequado.
5. Editar sem justificativa operacional robusta.
6. Ignorar pendências críticas de qualidade.
7. Exportar relatório inadequado ao cenário (ex.: estatístico no lugar do SIOPM para despacho).
8. Visualizar foto sem necessidade operacional clara.

### 10) Conduta esperada por situação

- **Dado essencial ausente:** não encerrar registro; marcar pendência e escalar supervisor.
- **Conflito de talão/duplicidade:** interromper atualização, auditar timeline e abrir saneamento com supervisor.
- **Risco alto com dúvida:** classificar pelo pior cenário plausível e reavaliar após coleta adicional.
- **Foto rejeitada:** registrar motivo padronizado + justificativa livre; solicitar nova mídia.
- **Erro de preenchimento após salvar:** solicitar edição controlada com justificativa explícita (quem, quando, por quê).
- **Uso excessivo de imagem:** bloquear fluxo local, notificar supervisor e registrar evento.

### Recomendações críticas

1. Tornar “gates” de obrigatoriedade visuais (não avançar etapa sem campo-chave).
2. Exibir checklist pré-salvamento obrigatório no rodapé da triagem.
3. Exigir justificativa estruturada (modelo curto com causa-impacto-ação).
4. Implantar monitor de SLA (tempo de triagem, tempo para despacho, tempo para validação de foto).
5. Auditar semanalmente top 10 inconsistências por severidade.

---

## PARTE 2 — Processo Operacional de Utilização (fluxo em 10 etapas)

1. **Acesso do operador**  
   Validar perfil e disponibilidade do módulo permitido.
2. **Registro do caso**  
   Abrir `idCaso`, preencher `talaoPMESP` e dados essenciais.
3. **Triagem**  
   Completar última visualização, vulnerabilidades, suspeita de crime e classificar risco/prioridade.
4. **Anexo de foto**  
   Upload quando disponível; registrar metadados e condição de uso.
5. **Salvamento**  
   Persistir caso e confirmar evento de criação.
6. **Geração de relatório**  
   Emitir relatório operacional e texto SIOPM para despacho/cópia no SIOPM WEB.
7. **Consulta posterior**  
   Buscar por `idCaso`/talão/nome; revisar timeline e status.
8. **Edição controlada**  
   Somente `SUPERVISOR/ADMIN`, com justificativa e trilha de alteração.
9. **Auditoria de qualidade**  
   Tratar pendências `PENDENTE` → `EM_TRATAMENTO` → `RESOLVIDO`/`IGNORADO`.
10. **Encerramento/relatório final**  
   Consolidar desfecho, evidências, eventos e registro final auditável.

---

## PARTE 3 — Cartilha do Operador (uso prático)

### O que é a Cabine Verde
Plataforma operacional para registrar, triar, acompanhar e reportar casos de desaparecimento com rastreabilidade.

### Quem pode usar
- OPERADOR: registro e triagem.
- SUPERVISOR: supervisão, edição controlada, validação de foto, qualidade.
- ADMIN: governança total.
- AUDITOR: consulta, relatórios e qualidade sem edição.

### Como acessar
1. Entrar com credencial institucional.
2. Confirmar e-mail/identidade quando solicitado.
3. Verificar módulos liberados pelo perfil.

### Como cadastrar ocorrência
1. Abrir novo caso.
2. Informar talão PMESP.
3. Preencher dados essenciais.
4. Registrar última visualização.
5. Preencher triagem e risco.
6. Salvar.

### Como preencher o talão
- Preencher exatamente como documento oficial PMESP.
- Não usar placeholders ou atalhos.
- Em conflito, não sobrescrever: escalar supervisor.

### Como anexar foto
- Anexar somente quando houver legitimidade operacional.
- Conferir se a foto é atual e identificável.
- Completar motivo/justificativa quando o fluxo pedir.

### Como gerar relatório
- Operacional: acompanhamento de turno.
- Estatístico: visão de tendência.
- Com imagem: quando necessário para contexto visual autorizado.
- SIOPM texto: para copiar/colar no sistema oficial.

### Como exportar para SIOPM
1. Abrir relatório texto SIOPM.
2. Copiar conteúdo completo.
3. Colar no SIOPM WEB.
4. Confirmar se `idCaso` + `talaoPMESP` estão corretos.

### Como consultar um caso
- Buscar por `idCaso`, talão ou nome.
- Confirmar status atual.
- Revisar timeline antes de qualquer ação.

### Como corrigir informações
- OPERADOR não corrige direto em registro fechado.
- Solicitar edição controlada ao supervisor.
- Registrar justificativa objetiva do erro.

### Como usar a timeline
- Ver sequência cronológica de decisões e alterações.
- Conferir coerência entre risco, ação e desfecho.

### Como tratar pendências
- Priorizar severidade `CRITICA/ALTA`.
- Atualizar status de tratamento com responsável.
- Encerrar somente quando evidência de correção existir.

### O que fazer em caso de erro
- Não apagar rastros.
- Registrar ocorrência do erro.
- Acionar supervisor.
- Corrigir via fluxo controlado.

### O que é proibido fazer
- editar sem perfil autorizado;
- justificar com texto genérico (“ok”, “teste”);
- compartilhar imagem fora de fluxo oficial;
- ignorar pendência crítica sem motivo auditável.

### Boas práticas
- preencher com objetividade e precisão temporal;
- sempre revisar checklist antes de salvar;
- registrar justificativas completas;
- privilegiar segurança da informação e sigilo.

---

## PARTE 4 — Checklist do Operador

### Antes de salvar
- [ ] talão preenchido;
- [ ] nome completo;
- [ ] idade/faixa etária;
- [ ] última visualização;
- [ ] local;
- [ ] vulnerabilidades;
- [ ] classificação de risco;
- [ ] foto anexada quando disponível;
- [ ] relatório conferido.

### Após salvar
- [ ] confirmar se o caso apareceu;
- [ ] gerar texto SIOPM;
- [ ] verificar se foto foi enviada;
- [ ] comunicar supervisor em caso crítico.

---

## PARTE 5 — Checklist do Supervisor

- [ ] revisar casos críticos;
- [ ] validar fotos;
- [ ] auditar edições;
- [ ] tratar pendências críticas;
- [ ] acompanhar relatórios;
- [ ] verificar uso indevido de imagem.

---

## PARTE 6 — Glossário

- **idCaso:** identificador técnico único interno do caso.
- **talaoPMESP:** referência institucional oficial PMESP.
- **classificação de risco:** nível de criticidade do caso para resposta operacional.
- **prioridade:** ordem de atendimento derivada do risco.
- **timeline:** linha cronológica de eventos, decisões e alterações.
- **qualidade dos dados:** integridade/completude/coerência dos registros.
- **foto validada:** imagem revisada por perfil autorizado e apta para uso operacional.
- **relatório SIOPM:** texto operacional padronizado para integração com SIOPM WEB.
- **evento:** registro funcional de ação relevante no ciclo do caso.
- **log:** trilha técnica/auditável de acesso, alteração e uso do sistema.
- **edição controlada:** alteração permitida apenas com perfil autorizado e justificativa obrigatória.
