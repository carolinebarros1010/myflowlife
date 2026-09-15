# Metodologia operacional da Cabine Verde

## Princípio central

A Cabine Verde possui duas portas de entrada que convergem para o mesmo banco central e para o mesmo ciclo operacional:

```text
NOVO CASO VIA 190 ─┐
                   ├─> BANCO CENTRAL ─> busca ─> atualização ─> qualificação ─> pesquisa ─> desfecho
ANÁLISE F2 ────────┘
```

O sistema recebe casos formalmente identificados pelo 190 e também descobre registros de interesse por meio da pesquisa F2. Uma Análise F2 não é, por si só, um caso completo.

## Entradas

### Novo Caso via 190

Existe uma ocorrência formal de desaparecimento. O operador identifica o solicitante, cadastra uma ou mais vítimas e inicia a qualificação completa, incluindo características, fotos, documentos, histórico e demais informações disponíveis.

### Análise F2

Não existe inicialmente uma ocorrência classificada como desaparecimento. O operador pesquisa talões correlatos no COPOM/SIOPM e registra os dados preliminares: data/hora, data e número do talão, natureza, pessoa, telefone, solicitante, endereço, sentido, características, histórico e observações.

A F2 pode permanecer em análise, receber eventos e novas informações, ser relacionada a outra análise, ser vinculada a um caso, originar um caso ou evoluir para qualificação completa.

## Entidades e histórico

```text
PESSOA
├── ANÁLISES F2
└── CASOS
    ├── VÍTIMAS
    ├── QUALIFICAÇÕES
    ├── EVENTOS
    ├── PISTAS
    ├── FOTOS
    ├── DOCUMENTOS
    └── FINALIZAÇÕES
```

Atualização não substitui silenciosamente o passado. Toda nova informação deve gerar um evento ou uma nova análise, preservando a linha do tempo, operador, origem, data/hora e referência à pessoa, caso ou análise.

O status da pessoa é reconstruído pelas situações explícitas e cronológicas das Análises F2. Marcadores de andamento e eventos operacionais, como foto recebida, pesquisa realizada ou contato registrado, não alteram automaticamente esse status. `pessoa.statusAtual` é somente cache de leitura.

Status da pessoa e situação do atendimento são dimensões diferentes:

- pessoa: `DESAPARECIDO`, `LOCALIZADO`, `LOCALIZADO_CUSTODIA`, `LOCALIZADO_SEM_VIDA`, `RETORNO_ESPONTANEO`;
- atendimento: `TRIAGEM_NAO_INICIADA`, `TRIAGEM_INCOMPLETA`, `EM_QUALIFICACAO`, `EM_PESQUISA`, `EM_ACOMPANHAMENTO`, `AGUARDANDO_CONTATO`, `AGUARDANDO_FOTO`, `ENCERRADO`.

## Área de Trabalho

É o ponto de execução operacional. Deve permitir iniciar o Novo Caso via 190, selecionar a vítima, preencher a qualificação e salvar cada painel sem perder o que já foi informado. Cada salvamento deve registrar painel, operador e data/hora.

Quando o modo central estiver ativo, a Área de Trabalho deve ler e gravar em `/api/ocorrencias`; não deve abrir o SQLite local como fonte operacional. A Nova Análise F2 utiliza as rotas `/api/pessoas`, `/api/analises`, `/api/eventos`, `/api/qualificacoes` e `/api/pistas`.

## Busca

A busca deve localizar pessoa, caso ou análise por nome, CPF, RG, telefone, solicitante, data e talão. Os filtros de status, condição, estágio e contato são classificações operacionais derivadas do conjunto de registros.

Ao abrir um resultado, o operador deve conseguir continuar o atendimento: adicionar informação, registrar contato, anexar foto/documento, criar nova F2, continuar a qualificação, registrar pista, executar ação ou acessar a finalização.

`APENAS_ANALISE_F2` significa: existe F2 para a pessoa, mas ainda não existe qualificação nem evento explícito de contato telefônico. Isso não define se a pessoa está desaparecida ou localizada.

## Finalização e desfecho

Finalização é uma etapa posterior às entradas. Nenhum caso é encerrado automaticamente por ter vindo do 190 ou por possuir uma F2.

O desfecho deve ser registrado por vítima, com desfecho, data/hora, fonte da confirmação, local, executor físico, forma de localização, contribuição da Cabine, encaminhamento e observações. O executor físico e a contribuição da Cabine são campos independentes.

Desfechos possíveis incluem `LOCALIZADO`, `LOCALIZADO_CUSTODIA`, `LOCALIZADO_SEM_VIDA`, `RETORNO_ESPONTANEO`, `PERMANECE_DESAPARECIDA` e `OUTRO_DESFECHO_CONFIRMADO`.

Caso com múltiplas vítimas só pode ser considerado encerrado quando todas as vítimas possuírem desfecho compatível com encerramento. Se alguma vítima permanecer desaparecida ou em acompanhamento, o caso continua aberto.

## Pontos de auditoria

| Momento | Registro mínimo | Evidência de controle |
|---|---|---|
| Entrada 190 | ocorrência, operador, solicitante, vítimas | evento `CASO_190_CRIADO` |
| Entrada F2 | data + talão, pessoa, origem, operador | `AnaliseF2` e evento `ANALISE_F2_CRIADA` |
| Alteração | campos anteriores e novos | evento de atualização |
| Contato | data/hora, operador, tipo e relato | `EventoHistorico` explícito |
| Qualificação | progresso e conclusão | qualificação vinculada à pessoa/caso |
| Foto/documento | arquivo, autorização e origem | metadados e evento |
| Pista/ação | fonte, confiança e resultado | pista/evento operacional |
| Finalização | desfecho por vítima e fonte | evento `FINALIZACAO_ATUALIZADA` |
| Correção | justificativa obrigatória | histórico local ou evento central |

## Fluxo resumido

```text
receber ou descobrir
→ identificar
→ registrar
→ qualificar
→ correlacionar
→ atualizar
→ pesquisar
→ produzir pistas
→ articular recursos
→ confirmar
→ finalizar ou continuar acompanhando
```

