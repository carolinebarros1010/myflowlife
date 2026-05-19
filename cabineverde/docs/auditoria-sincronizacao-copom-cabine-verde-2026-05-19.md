# Auditoria técnica — sincronização COPOM/Cabine Verde (2026-05-19)

## Fluxo frontend → payload → backend → planilha

1. Frontend coleta os campos do formulário em `obterCasoDoFormulario()`.
2. Frontend converte para payload tabular `CASOS` em `gerarPayloadSheets()` e envia por `salvarCasoSheets()`.
3. Backend (`persistirRegistro`) normaliza aliases do caso com `normalizarPayloadCaso_()` **antes** das validações.
4. Backend valida obrigatórios mínimos via `validarCamposObrigatoriosCaso_()`.
5. Backend realiza UPSERT em `CASOS` e sincroniza no Talão 190 via `sincronizarTalao190(caso)`.

## Padrão de abas diárias Talão 190

- Nome obrigatório: `ddMMMyy` (ex.: `19MAI26`).
- Mês abreviado em português, maiúsculo e sem acento.
- Data inválida agora gera erro controlado: `DATA_SERVICO_INVALIDA_PARA_NOME_DA_ABA`.
- Quando a aba não existe:
  - usa modelo `MODELO_TALAO_190`;
  - move para primeira posição com `setActiveSheet` + `moveActiveSheet(1)`.

## Aliases aceitos e normalização centralizada

A função `normalizarPayloadCaso_()` unifica:

- Talão: `talaoPMESP`, `talaoBopm`, `numeroTalao`, `talao`
- Nome desaparecido: `nomeCompletoDesaparecido`, `nomeDesaparecido`
- Observações: `observacoesOperacionais`, `observacoes`
- Status 190: `encerrado190`, `status190`
- Operador: `operadorResponsavel`, `operadorPM`
- Foto: `urlFoto`, `linkFoto`
- `cpfRg` é consolidado por `cpf + rg` quando ausente.

## Campos obrigatórios mínimos

Validados após normalização:

- `talaoBopm`
- `nomeCompletoDesaparecido`
- `nomeSolicitante`
- `telefoneSolicitante`

Retorno padronizado de ausência:

- `sucesso: false`
- `codigo: CAMPO_OBRIGATORIO_AUSENTE`
- `mensagem` objetiva
- `camposAusentes`
- `diagnostico` mínimo (sem payload integral)

## Estrutura da aba COPOM - CABINE VERDE (linha operacional)

A montagem da linha continua posicional (A..K), sem depender de cabeçalhos repetidos `DATA`/`OBS.`:

- A DATA
- B BOPM
- C CPF/RG
- D Nome desaparecido
- E OBS operacional
- F DATA serviço
- G Nome solicitante
- H Telefone
- I OBS complementar
- J 190
- K Operador/identificador técnico

## UPSERT e proteção de rodapé

- Busca de existente prioriza índice `INDICE_TALOES` + validação da referência.
- Fallback usa assinatura/talão/ID em varredura operacional.
- Inserção sempre ocorre antes da âncora `### INICIO_RODAPE_FIXO ###`.
- Atualização no rodapé é bloqueada por proteção estrutural.

## Índice central `INDICE_TALOES`

Mantido após INSERT/UPDATE com:

- `idCaso`
- `hashOperacional`
- `talaoNormalizado`
- `nomeAba` e `linhaRelatorio`

Referência inválida gera evento de auditoria e fallback tradicional para evitar duplicidades.

## Funções de diagnóstico

- `testeTalao190()` permanece disponível e pode ser executada com payload de teste operacional.
- `sincronizarTalao190()` agora retorna estrutura padronizada com `sucesso`, `acao`, `nomeAba`, `linha`, `idCaso`, `talaoBopm` e `mensagem`.
