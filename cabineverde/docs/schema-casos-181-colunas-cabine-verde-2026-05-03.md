# Schema CASOS com 181 colunas (Cabine Verde)

## Decisão arquitetural
>A aba CASOS será a base mestre completa, contendo todas as respostas da triagem.

## Fonte canônica
- Front-end `payload.colunas` de `action: salvarCaso` em `public/js/core.js`.
- Logs obrigatórios implementados:
  - `COLUNAS SALVAR CASO`
  - `VALORES SALVAR CASO`
  - `PAYLOAD SALVAR CASO`

## Lista canônica (181)

A ordem oficial foi alinhada ao front e aplicada no `CABINE_VERDE_SCHEMA.CASOS` e em `src/utils/sheetsPayload.ts`.

1-51: campos base operacionais (id, solicitante, risco, observações etc.)
52-181: árvore (`arv_p1` a `arv_p5` + subabas por faixa etária), com pares `_resp` e `_comp`.

> Observação: a lista completa está materializada em código nas constantes `COLUNAS_CASOS` / `CABINE_VERDE_SCHEMA.CASOS`.

## Tabela coluna → pergunta (resumo por bloco)

| Bloco | Etapa | Pergunta correspondente | Tipo | Manter no CASOS? |
|---|---|---|---|---|
| `arv_p1_*_resp` | Passo 1 | Identificação inicial da emergência/desaparecido | resposta | Sim |
| `arv_p1_*_comp` | Passo 1 | Complemento textual do Passo 1 | complemento | Sim |
| `arv_p2_*_resp` | Passo 2 | Última visualização, local, roupa, transporte | resposta | Sim |
| `arv_p2_*_comp` | Passo 2 | Complemento textual do Passo 2 | complemento | Sim |
| `arv_p3_*_resp` | Passo 3 | Vínculo, rotina e contexto relacional | resposta | Sim |
| `arv_p3_*_comp` | Passo 3 | Complemento textual do Passo 3 | complemento | Sim |
| `arv_p4_*_resp` | Passo 4 | Vulnerabilidades e indícios de risco/crime | resposta | Sim |
| `arv_p4_*_comp` | Passo 4 | Complemento textual do Passo 4 | complemento | Sim |
| `arv_p5_*_resp` | Passo 5 | Ações preliminares de busca/checagens | resposta | Sim |
| `arv_p5_*_comp` | Passo 5 | Complemento textual do Passo 5 | complemento | Sim |
| `arv_crianca_*` | Subaba criança | Perguntas específicas criança | resp/comp | Sim |
| `arv_preadolescente_*` | Subaba pré-adolescente | Perguntas específicas pré-adolescente | resp/comp | Sim |
| `arv_adolescente_*` | Subaba adolescente | Perguntas específicas adolescente | resp/comp | Sim |
| `arv_adulto_*` | Subaba adulto | Perguntas específicas adulto | resp/comp | Sim |
| `arv_idoso_*` | Subaba idoso | Perguntas específicas idoso | resp/comp | Sim |

## Campos legados e equivalentes atuais

| Campo legado | Campo novo equivalente | Manter? | Observação |
|---|---|---|---|
| `talaoBopm` | `talaoPMESP` | Sim | Mantido por compatibilidade de payload legado.
| `statusCaso` | `status` | Sim | `statusCaso` segue no payload atual do front.
| `dadosVeiculo` | `dadosVeiculoTransporte` | Sim | Mesmo domínio semântico.
| `fotoDisponivel` | `fotoDigitalDisponivel` | Sim | Campo legado continua no envio.
| `dispositivoLigado` | `dispositivoVinculado` | Sim | Campo legado continua no envio.
| `vulnerabilidade` | `vulnerabilidadeIdentificada` | Sim | Não remover até migração total.
| `classificacaoRisco` | `risco` | Sim | Campo legado operacional.
| `acaoSugerida` | `classificacaoOperacional` | Sim | Mantido por histórico de integração.

## Regra de gravação
- Garantir estrutura antes de gravar.
- Validar `colunas.length === valores.length`.
- Se header da CASOS estiver menor, anexar colunas faltantes no final.
- Montar linha na ordem do header da aba, preenchendo vazio para campos sem valor.
- Não remover colunas existentes e não apagar dados.
