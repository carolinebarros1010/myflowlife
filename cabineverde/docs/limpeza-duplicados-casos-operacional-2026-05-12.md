# Rotina conservadora `limparDuplicadosCasos()` (2026-05-12)

## Estratégia e segurança
- Usa `LockService` do início ao fim para evitar concorrência.
- Cria backup obrigatório da aba `CASOS` antes de qualquer ação, com nome `BACKUP_CASOS_YYYYMMDD_HHMMSS`.
- Opera em modo simulação por padrão (`SIMULACAO=true`) quando chamada sem parâmetro.
- Nunca remove cabeçalho, linhas vazias estruturais, registros únicos ou casos com conflito de identidade.

## Critérios de duplicidade
Assinatura operacional forte:
- `dataServico`
- `talaoBopm`
- `nomeCompletoDesaparecido` normalizado
- `telefoneSolicitante` normalizado

Critérios auxiliares para validação/conflito:
- `cpf`
- `rg`
- `observacoesOperacionais`
- `nomeSolicitante`

## Regra de escolha do principal
1. tem `talaoBopm`
2. tem `cpf` e `rg`
3. maior observação
4. maior quantidade de campos preenchidos
5. linha mais antiga (primeira)

## Mesclagem
Antes de remover duplicado real, campos vazios do principal são preenchidos com dados úteis do duplicado.
A `dataServico` do primeiro registro válido é preservada quando o principal estiver sem data.

## Auditoria
- Todos os eventos são enviados para `LOG_AUDITORIA` em lote.
- Estrutura registrada no `mensagemTecnica` inclui:
  `acao`, `idCasoPrincipal`, `idCasoRemovido`, `motivo`, `assinaturaOperacional`, `dadosMesclados`.
- Casos ambíguos são marcados como `conflito_manual` e não removidos.

## Modos de uso
- Simulação (padrão): `limparDuplicadosCasos()`
- Execução real: `limparDuplicadosCasos(false)`

## Checklist operacional
- [ ] Rodar em simulação e validar relatório.
- [ ] Revisar `conflitosManuais`.
- [ ] Confirmar backup criado.
- [ ] Executar modo real apenas após validação manual.
- [ ] Registrar janela operacional da limpeza.
