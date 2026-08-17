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

1. **P0 — Caracterização inicial do risco**;
2. **P1 — Idade da pessoa desaparecida**, que seleciona o subfluxo correto;
3. **P2 — Vulnerabilidade**;
4. **P3 — Identificação, características e contexto**;
5. **P4 — Buscas preliminares e meios disponíveis**;
6. subfluxo específico de criança, pré-adolescente, adolescente, adulto ou idoso.

As perguntas e os cálculos de risco continuam reutilizando as regras do legado.

## Auditoria e correção

A aba de auditoria lista os casos incompletos e permite localizar qualquer registro. A correção exige justificativa, grava os valores anterior/novo em `auditoria_local` e marca o caso como `CORRIGIDO`, preservando o histórico local.
