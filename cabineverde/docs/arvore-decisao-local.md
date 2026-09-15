# Árvore de decisão local

O fluxo local reproduz a organização que funcionava no HTML legado.

## Fluxo principal

1. Identificação mínima;
2. Última visualização;
3. Vínculo e contexto;
4. Vulnerabilidade e risco;
5. Buscas preliminares e meios disponíveis.

O operador vê um passo por vez, pode voltar, e responde apenas as perguntas do passo atual. As perguntas podem ser textuais ou de seleção (`Sim`, `Não`, `Não informado`) e podem ter complemento.

## Subfluxo por faixa etária

No quinto passo, o sistema calcula a faixa pela idade e abre o subfluxo correspondente: criança, pré-adolescente, adolescente, adulto ou idoso.

## Regras preservadas

- sincronização conceitual entre respostas da árvore e campos principais;
- cálculo de indicadores operacionais;
- alertas específicos por faixa etária;
- cálculo de risco, prioridade, criticidade e aptidão;
- resumo operacional vivo do caso;
- perguntas da lista-mestra de 300 como conteúdo complementar, sem substituir o fluxo principal.

A implementação usa `ARVORE_DECISAO_CONFIG`, `avaliarAlertasArvore`, `mapearIndicadoresOperacionais`, `calcularRisco`, `calcularPrioridade` e `calcularAptoCabineVerde` do legado, agora exibidos dentro da aplicação React/Electron local.
# Ordem operacional do novo atendimento

Após as perguntas e o subfluxo etário, a etapa final permite inserir a imagem da pessoa desaparecida. A autorização é registrada nos metadados locais da foto com o texto técnico: “O responsável autoriza o uso desta imagem exclusivamente para fins de busca, identificação e divulgação operacional interna pela Polícia Militar do Estado de São Paulo?”.

O botão **Novo caso** inicia um atendimento em branco e conduz o operador nesta ordem:

1. **Entrevista inicial — localização imediata**, com perguntas essenciais de identificação, última visualização, vestimenta, deslocamento e riscos urgentes;
2. **Entrevista qualificada**, com os painéis completos de identificação, vulnerabilidade, saúde, contexto, buscas, contatos e acionamentos;
3. subfluxo específico de criança, pré-adolescente, adolescente, adulto ou idoso, quando aplicável.

A entrevista inicial fica destacada visualmente e pode ser salva de forma independente. A busca não deve aguardar o preenchimento da entrevista qualificada. A etapa qualificada serve para aprofundar a investigação, registrar informações complementares e apoiar revisões posteriores do caso.

As perguntas e os cálculos de risco continuam reutilizando as regras do legado.

## Autopreenchimento entre etapas

As respostas informadas na análise F2, na entrevista inicial ou na entrevista qualificada são registradas em uma camada unificada no armazenamento local. O mesmo valor é associado ao ID da pergunta, aos nomes canônicos do caso e aos campos legados equivalentes.

Assim, informações como idade, município, nome, documentos, telefone, endereço, características, última visualização, vestimenta, meio de transporte e riscos urgentes reaparecem automaticamente nas demais etapas. O operador pode revisar e substituir o valor quando houver informação mais recente.

## Auditoria e correção

A aba de auditoria lista os casos incompletos e permite localizar qualquer registro. A correção exige justificativa, grava os valores anterior/novo em `auditoria_local` e marca o caso como `CORRIGIDO`, preservando o histórico local.
