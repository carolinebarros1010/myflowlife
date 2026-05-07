# Auditoria e correção de duplicidade de casos — Cabine Verde (2026-05-07)

## Causa raiz
- O frontend gerava `idCaso` com `CV-${Date.now()}` quando o campo estava vazio, o que permitia novo ID a cada novo submit/reabertura.
- O frontend não tinha trava de envio (`isSaving`) no submit principal.
- O backend atualizava apenas quando encontrava `idCaso`; sem `idCaso` acabava inserindo nova linha.

## Correções aplicadas
- Frontend com trava de duplo submit (`isSaving`) e desabilitação do botão de salvar durante requisição.
- Persistência de `idCaso` no estado local (`ultimoIdCasoSalvo`, `referenciaCasoSalvo`) e reaproveitamento em novos salvamentos.
- Leitura de `idCaso` da URL (`?idCaso=`) para retorno de auditoria/consulta para triagem.
- Backend com função `localizarLinhaCaso_` com prioridade:
  1. `idCaso`
  2. `talaoPMESP`
  3. `talaoBopm`
  4. `numeroTalao/talao`
  5. `assinaturaCaso`
- Backend com função `gerarAssinaturaCaso_` para deduplicação natural.
- `salvarCaso` via `persistirRegistro` passou a fazer UPSERT e devolver `idCaso` persistido e ação (`created`/`updated`).
- Inclusão de `dataHoraAtualizacao` e `assinaturaCaso` no registro CASOS para rastreabilidade e deduplicação futura.

## Plano de saneamento dos duplicados existentes
1. Extrair candidatos por agrupamento de `nomeCompletoDesaparecido + idade + municipio + dataServico`.
2. Definir registro principal por regras de completude (mais campos preenchidos + última atualização).
3. Marcar demais com `duplicado_de = idCasoPrincipal` (ou consolidar em única linha).
4. Reprocessar eventos/fotos para manter vínculo no `idCasoPrincipal`.
5. Rodar relatório pós-saneamento para validar redução de duplicidade.
