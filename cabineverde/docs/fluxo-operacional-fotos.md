# Fluxo operacional de fotos (Cabine Verde)

## Armazenamento
- **Arquivo binário da foto**: Google Drive, em `Cabine Verde/Fotos/{idCaso}_{talaoPMESP}`.
- **Metadados da foto**: aba `FOTOS_DESAPARECIDOS` da planilha operacional.
- **Auditoria da ação**: aba `EVENTOS_OCORRENCIA` com evento `FOTO_ANEXADA`.

## Governança e validação
- Upload exige `idCaso` e `talaoPMESP`.
- Arquivos são privados (`DriveApp.Access.PRIVATE`) e não são publicados automaticamente.
- `statusValidacao` inicia como `Pendente`.
- Fotos rejeitadas permanecem registradas para rastreabilidade.

## Validação e auditoria
1. Operador anexa imagem no formulário (limite 5MB).
2. Frontend converte em base64 e envia com metadados obrigatórios.
3. GAS salva arquivo no Drive e grava metadados em `FOTOS_DESAPARECIDOS`.
4. GAS atualiza resumo do caso (`fotoDisponivel`, `quantidadeFotos`, `fotoPrincipalLink`, `statusFotos`).
5. GAS registra `FOTO_ANEXADA` em `EVENTOS_OCORRENCIA`.

## Acesso
- Somente usuários autorizados no Drive institucional podem acessar o arquivo.
- Auditoria pode ser feita cruzando `idCaso` entre `CASOS`, `FOTOS_DESAPARECIDOS` e `EVENTOS_OCORRENCIA`.

## Fluxo de acesso controlado
- O frontend não deve abrir `linkArquivo` do Drive diretamente.
- Toda visualização deve chamar a ação GAS `visualizarFotoDesaparecido`.
- O GAS valida perfil por `nivelAcesso` (`INTERNO`, `RESTRITO`, `SIGILOSO`) e registra logs obrigatórios.
- Cada visualização permitida gera evento `FOTO_VISUALIZADA` em `EVENTOS_OCORRENCIA`.
- Cada tentativa (permitida ou bloqueada) gera trilha em `LOG_ACESSO_FOTOS`.

## Justificativa obrigatória por sensibilidade
- `INTERNO`: visualização permitida com log simples.
- `RESTRITO`: exige operador autorizado **e justificativa obrigatória**.
- `SIGILOSO`: exige supervisor **e justificativa obrigatória**.
- Se a justificativa estiver vazia para `RESTRITO`/`SIGILOSO`, a visualização é bloqueada.
- A justificativa deve constar em `LOG_ACESSO_FOTOS` e no evento `FOTO_VISUALIZADA`.

## Qualidade mínima da justificativa
Para `RESTRITO` e `SIGILOSO`, a justificativa só é aceita quando:
- possui ao menos 10 caracteres;
- não é termo genérico único (`ok`, `teste`, `-`, `ver`, `foto`, `visualizar`);
- não é apenas números;
- contém ao menos uma palavra com mais de 3 caracteres.

Quando inválida, o acesso é bloqueado com a mensagem:
`Justificativa inválida. Descreva o motivo da visualização.`
