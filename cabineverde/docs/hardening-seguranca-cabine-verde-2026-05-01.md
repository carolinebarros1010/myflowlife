# Hardening final de segurança — Cabine Verde (2026-05-01)

## Escopo
Fortalecimento institucional no Apps Script para mitigar três riscos críticos:
1. LGPD e dados sensíveis.
2. Abuso de visualização de fotos.
3. Exposição indevida de arquivos no Google Drive.

## Medidas implementadas

### 1) Mascaramento de dados sensíveis
- Nova função `mascararDadosSensivel_(valor, perfil)`.
- Política aplicada:
  - `OPERADOR`: recebe valor mascarado.
  - `SUPERVISOR` e `ADMIN`: recebem valor completo.
  - `AUDITOR`: recebe marcador controlado `***AUDITORIA_CONTROLADA***`.
- Integração na leitura da aba `CASOS` e retorno ao frontend via ação `listarCasos`.

### 2) Bloqueio automático por uso excessivo de foto
- Ajuste em `verificarUsoExcessivoFoto_`:
  - Janela: 10 minutos.
  - Limite: mais de 5 acessos por `idFoto` e operador.
  - Ação automática: bloqueio por 15 minutos.
- Novos artefatos:
  - Aba `BLOQUEIOS_FOTO` para persistir bloqueios temporários.
  - Evento `BLOQUEIO_TEMPORARIO_FOTO` em `EVENTOS_OCORRENCIA`.
- Fluxo de visualização passa a impedir novas aberturas durante o bloqueio.

### 3) Monitoramento de permissões no Drive
- Nova função `verificarSegurancaDrive_(corrigirAutomaticamente)`:
  - Percorre recursivamente `Cabine Verde/Fotos`.
  - Detecta arquivos com acesso diferente de `PRIVATE`.
  - Registra evento `ARQUIVO_EXPOSTO`.
  - Opcional de autocorreção para `PRIVATE`.

### 4) Execução automática diária
- Nova rotina `rotinaDiariaSeguranca_()`:
  - Executa `verificarSegurancaDrive_(true)`.
  - Gera trilha em `RELATORIO_SEGURANCA` via `gerarRelatorioSeguranca_`.
- Operação recomendada:
  - Configurar gatilho time-driven diário no Apps Script para `rotinaDiariaSeguranca_`.

## Resultado operacional
Transição de um modelo “seguro por lógica” para “seguro mesmo com erro humano”, com:
- Controle de acesso por perfil.
- Detecção e bloqueio de comportamento abusivo.
- Varredura preventiva de exposição no Drive.
- Evidências de auditoria e relatório periódico.
