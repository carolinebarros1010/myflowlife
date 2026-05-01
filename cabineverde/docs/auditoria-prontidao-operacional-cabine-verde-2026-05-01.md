# Auditoria final de prontidão operacional — Cabine Verde

Data de referência: **2026-05-01**
Escopo: frontend TypeScript (`src/`), backend Google Apps Script (`GAS/`), documentação e testes.

## 1) Parecer final

**APTO COM RESSALVAS**.

O sistema apresenta controles materiais para fluxo operacional, rastreabilidade e proteção de imagem (perfil, justificativa, motivo padronizado, trilha de eventos e logs), além de proteção de migração com dry run/backup/rollback e bloqueio de execução fora de contexto autorizado. Persistem, porém, riscos residuais importantes para go live institucional: ausência de criptografia/mascaramento de dados sensíveis em planilha, limitação do controle de uso excessivo (apenas sugestão de bloqueio), e dependência de disciplina operacional para alguns controles de governança.

## 2) Avaliação do fluxo completo (17 pontos)

1. **Cadastro do operador** — **Atendido com controle de whitelist** na aba `OPERADORES`, sem autocadastro no fluxo principal.
2. **Validação de acesso** — **Atendido** por validação de perfil e log de acesso/bloqueio.
3. **Criação da ocorrência** — **Atendido** com registro inicial em `CASOS` e evento `CASO_CRIADO`.
4. **Registro do talaoPMESP** — **Atendido** com obrigatoriedade no frontend e persistência dedicada.
5. **Gravação multiabas** — **Atendido** com payload contendo `CASOS`, `TRIAGEM_RESPOSTAS`, `INDICADORES_OPERACIONAIS`, `EVENTOS_OCORRENCIA`.
6. **Classificação de risco** — **Atendido** por engine de classificação e persistência de criticidade/prioridade.
7. **Registro da decisão operacional** — **Atendido** via rotina específica que gera evento `DECISAO_OPERACIONAL`.
8. **Upload de foto** — **Atendido** com validações de formato/tamanho e metadados de autorização.
9. **Validação/rejeição da foto** — **Atendido** com restrição a `SUPERVISOR/ADMIN`.
10. **Visualização controlada da foto** — **Atendido** via função intermediária, sem link direto.
11. **Justificativa e motivo padronizado** — **Atendido** com validação semântica e enumeração de motivos.
12. **Controle de uso excessivo** — **Parcialmente atendido** (detecta e registra evento, mas sem bloqueio automático servidor-side).
13. **Eventos em EVENTOS_OCORRENCIA** — **Atendido** para criação, decisão, conflitos de talão, foto e uso excessivo.
14. **Logs de acesso** — **Atendido** (`LOG_ACESSO`, `LOG_ACESSO_FOTOS`).
15. **Logs de migração** — **Atendido** (`LOG_MIGRACAO`) com status e contexto.
16. **Backup, rollback e dry run** — **Atendido** com pré-condições bloqueantes e restauração assistida.
17. **Proteção contra execução fora do fluxo autorizado** — **Atendido** por validação de contexto autorizado na migração.

## 3) Matriz de riscos residuais

| ID | Risco residual | Prob. | Impacto | Nível | Evidência técnica | Tratativa recomendada |
|---|---|---:|---:|---|---|---|
| R1 | Exposição de dados sensíveis (CPF/RG/saúde) em planilha sem criptografia nativa no app | Média | Alto | **Alto** | Campos sensíveis em `COLUNAS_CASOS`; documentação sem política de mascaramento/retensão automática | Implementar mascaramento por perfil, minimização de coleta e política de retenção/expurgo + DLP institucional |
| R2 | Uso excessivo de imagem sem bloqueio automático definitivo | Média | Alto | **Alto** | `verificarUsoExcessivoFoto_` retorna sugestão de bloqueio, mas fluxo principal não impõe lockout automático | Aplicar bloqueio temporário servidor-side por operador+foto e cooldown auditável |
| R3 | Dependência de configuração operacional para segurança de Drive/Sheets | Média | Alto | **Alto** | Controle de acesso é lógico no GAS; risco permanece se permissões do Drive estiverem abertas | Forçar compartilhamento restrito por pasta, revisão periódica de ACL e alertas de link público |
| R4 | Duplicidade operacional por talão fora de cenários previstos (ex.: integração externa inconsistente) | Baixa | Alto | **Médio** | Há bloqueios de conflito e possível duplicidade, porém sem “merge assistido” | Implementar fila de conciliação assistida e painel de conflitos |
| R5 | Rollback assistido sujeito a erro humano durante incidente | Baixa | Médio | **Médio** | Restauração é assistida e por aba, com passos manuais de operação | Playbook automatizado com checklist executável e validação pós-restore |
| R6 | Auditoria local no frontend pode ser apagada pelo navegador | Média | Médio | **Médio** | `auditLogService.ts` usa armazenamento local do cliente | Tornar log local apenas auxiliar; priorizar logs imutáveis no backend |

## 4) Checklist de produção (go/no-go)

### Segurança operacional
- [ ] Confirmar ACL do Google Drive (sem “qualquer pessoa com link”).
- [ ] Confirmar permissão mínima por perfil (`OPERADOR`, `SUPERVISOR`, `ADMIN`, `AUDITOR`).
- [ ] Ativar política de rotação/revogação de operadores inativos.

### Rastreabilidade
- [ ] Validar geração de `CASO_CRIADO`, `DECISAO_OPERACIONAL`, `FOTO_*`, `USO_EXCESSIVO_FOTO`, `CONFLITO_TALAO_PMESP`.
- [ ] Validar integridade de `LOG_ACESSO`, `LOG_ACESSO_FOTOS`, `LOG_MIGRACAO` com timestamp e operador.

### LGPD e dados sensíveis
- [ ] Definir base legal, finalidade e prazo de retenção por campo sensível.
- [ ] Implementar política de minimização para CPF/RG quando não estritamente necessários.
- [ ] Formalizar trilha de consentimento/autorizações de uso de imagem.

### Continuidade e legado
- [ ] Executar dry run de migração em base homolog.
- [ ] Confirmar backup recente antes de qualquer execução real.
- [ ] Testar rollback completo em janela controlada.

## 5) Pontos bloqueantes (para “APTO” sem ressalvas)

1. **Implementar bloqueio automático de abuso de visualização de foto** no backend (não apenas evento/sugestão).
2. **Formalizar controles LGPD executáveis**: retenção, descarte e minimização de dados sensíveis.
3. **Endurecer governança de acesso em Drive/Sheets** com validação recorrente automatizada (ACL drift).

## 6) Pontos recomendados (não impeditivos)

1. Painel dedicado de conflitos `idCaso` x `talaoPMESP` com workflow de conciliação.
2. Alertas proativos (e-mail/chat) para eventos críticos (`ACESSO_NEGADO`, `USO_EXCESSIVO_FOTO`, `CONFLITO_TALAO_PMESP`).
3. Assinatura digital de evidências de auditoria (hash diário de logs).
4. Testes de caos operacionais para indisponibilidade parcial de Sheets/Drive.

## 7) Próximos passos para go live controlado

1. **Fase 0 (D-7 a D-1)**: hardening de permissões, validação LGPD, simulação de incidentes e rollback.
2. **Fase 1 (D0)**: ativação com escopo reduzido (apenas turno piloto + supervisão presencial).
3. **Fase 2 (D+1 a D+7)**: expansão gradual por equipe/turno com checkpoint diário.
4. **Fase 3 (D+8 a D+30)**: operação plena condicionada a métricas mínimas de conformidade.

## 8) Monitoramento recomendado dos primeiros 30 dias

### Indicadores diários
- Taxa de bloqueios por perfil/acesso negado.
- Total de visualizações de foto por operador e taxa de tentativas bloqueadas.
- Incidência de `USO_EXCESSIVO_FOTO`.
- Incidência de `CONFLITO_TALAO_PMESP` e `POSSIVEL_DUPLICIDADE_TALAO_PMESP`.
- Tempo médio entre criação do caso e decisão operacional.
- Taxa de erros de gravação multiabas.

### Ritos operacionais
- **War room diário (30 min)** com Segurança + Operação + Dados.
- **Revisão semanal de auditoria** (amostra de casos com foto sigilosa).
- **Gate de continuidade em D+15 e D+30**: manter/ajustar/restringir escopo.

## Conclusão institucional

Há base técnica consistente para operação supervisionada do Cabine Verde, com boa trilha de auditoria e controles específicos para imagem e migração. Entretanto, para ambiente de alta sensibilidade institucional, recomenda-se avançar com **go live controlado e condicionado** às ações de bloqueio automático de abuso de imagem e formalização robusta de governança LGPD/ACL.
