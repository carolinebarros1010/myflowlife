# Auditoria técnica — fluxo de imagens (Cabine Verde)

Data: 2026-05-11
Escopo: `cabineverde/src` (frontend), `cabineverde/GAS` (Apps Script), fluxo upload/salvamento/recuperação de fotos.

## Diagnóstico geral

O fluxo de imagem existe de ponta a ponta (seleção no formulário, envio ao Apps Script, gravação no Drive, metadados em planilha e preview), porém há **inconsistência funcional importante**:

1. O frontend faz upload automático no evento `change` do input de arquivo **antes do caso estar salvo**, potencialmente usando `idCaso` temporário (`CV-${Date.now()}`), criando pasta “órfã” no Drive.
2. Depois, ao clicar em “Adicionar foto agora”, o sistema executa **novo upload** para o caso salvo, gerando duplicidade de arquivo.
3. O fluxo mistura “upload imediato” e “upload pós-triagem” sem trava de estado, permitindo gravação em destino incorreto (pasta de caso temporário).

## Evidências principais

- Input de upload e preview estão na área de foto pós-triagem (`#blocoUploadFotoDesaparecido`, `#previewFotoDesaparecido`).
- O upload no `change` chama `uploadFotoCaso` diretamente e calcula `idCaso` fallback temporário.
- O botão “Adicionar foto agora” também chama upload (`salvarFotoDepoisDaTriagem`) com `idCaso` de caso salvo.
- Backend salva no Drive em `Cabine Verde/Fotos/{idCaso}_{talaoPMESP}`.

## Risco operacional

- Duplicidade de arquivos no Drive.
- Foto anexada em pasta errada quando `idCaso` definitivo ainda não existe.
- Divergência entre link exibido no front e vínculo final no caso em planilha.

## Correção recomendada (diretriz)

Padronizar para **um único ponto de upload efetivo**: botão “Adicionar foto agora” (pós-triagem), mantendo no `change` apenas preview local.

### Ajuste sugerido no frontend

- No `change` do input:
  - validar tipo;
  - atualizar preview via `URL.createObjectURL`;
  - **não** chamar `sheetsService.uploadFotoCaso`.
- No clique de “Adicionar foto agora”:
  - exigir `idCaso` persistido;
  - executar upload uma única vez;
  - atualizar campos hidden `urlFoto`/`linkFoto` com retorno do backend.

### Ajuste sugerido no backend (opcional de robustez)

- Em `uploadFotoCaso`, rejeitar `idCaso` com prefixo temporário (`CV-`) para impedir pasta inválida.

