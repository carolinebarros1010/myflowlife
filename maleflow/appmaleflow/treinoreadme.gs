📘 README OFICIAL — PLANILHA DE TREINOS FEMFLOW
1️⃣ Objetivo da Planilha

Esta planilha é a fonte estrutural dos treinos do FemFlow, utilizada para alimentar o sistema (Firebase + App) com treinos organizados por:

ciclo de treino (AB, ABC, ABCD, ABCDE)

dia do ciclo de treino

nível da aluna

ênfase muscular

A planilha não executa lógica.
Toda a lógica de ordenação, intercalamento e renderização é feita pelo treino-engine.js.

2️⃣ Estrutura das Colunas (Padrão Oficial)
Coluna	Obrigatória	Descrição
tipo	✅	Tipo do bloco (aquecimento, treino, hiit, cardio_final, resfriamento)
box	✅	Agrupador lógico do bloco (número + sufixo opcional)
ordem	✅	Ordem interna dentro do box
enfase	✅	Ênfase principal do treino (ex: gluteo)
ciclo	✅	Ciclo de treino (AB, ABC, ABCD, ABCDE)
dia	✅	Dia do ciclo de treino (1–5)
titulo_pt	⚠️	Nome do exercício (português)
titulo_en	⚠️	Nome do exercício (inglês)
titulo_fr	⚠️	Nome do exercício (francês)
link	⚠️	Link do exercício (YouTube Shorts)
series	⚠️	Número de séries
reps	⚠️	Repetições
tempo	⚠️	Tempo (em segundos)
intervalo	⚠️	Intervalo (em segundos)
forte	⚠️	Tempo forte do HIIT
leve	⚠️	Tempo leve do HIIT
ciclos	⚠️	Número de ciclos do HIIT

🔹 Campos marcados como ⚠️ são usados apenas quando o tipo exige.
🔹 Dia do ciclo é o índice da letra no ciclo: A=1, B=2, C=3, D=4, E=5.

3️⃣ Tipos de Bloco e Regras
🔹 Aquecimento
tipo = aquecimento
box = 0


Séries, reps, tempo e intervalo não são utilizados

O app converte automaticamente para o Aquecimento Premium FemFlow

🔹 Treino (Exercícios)
tipo = treino
box = 1, 2, 3...


Pode usar letras no box (1T, 2AE, 3S)

O número define a ordem

A letra define série especial (visual e pedagógica)

🔹 HIIT
tipo = hiit


Regras obrigatórias:

Se vinculado a um box → box = número do box

Se HIIT solto → box = 0

ordem ≥ 90 (padrão oficial)

🔹 Cardio Final
tipo = cardio_final
box = 900


Sempre após o treino

Usa apenas a coluna tempo

🔹 Resfriamento
tipo = resfriamento
box = 999   ✅ PADRÃO OFICIAL


Séries, reps e tempo não são utilizados

Convertido automaticamente para Resfriamento Premium FemFlow

4️⃣ Séries Especiais (Resumo)
Código	Nome	Observação
B	Biset	2 exercícios seguidos
T	Triset	3 exercícios seguidos
Q	Quadriset	4 exercícios seguidos
C	Cluster	Reps divididas
D	Dropset	Redução de carga
RP	Rest-Pause	Falha + redução
I	Isometria	Contração mantida
CC	Cadência Controlada	Excêntrica lenta
AE	Advanced Effort	Indicador de alta exigência
SM SubMAX

📌 O engine não calcula carga.
As séries especiais são guias de execução.

📅 DIA MODELO — INICIANTE • GLÚTEO

Ciclo: ABC
Dia: 2

tipo            box   ordem  enfase   ciclo  dia  titulo_pt
aquecimento     0     1      gluteo  ABC    2    Aquecimento inicial

treino          1     1      gluteo  ABC    2    Agachamento com halter
treino          1     2      gluteo  ABC    2    Afundo alternado
treino          1     3      gluteo  ABC    2    Elevação pélvica
treino          2     1     gluteo  ABC    2    Abdutor máquina
treino          2     2      gluteo  ABC    2    Supino maquina
treino          3T     1      gluteo  ABC    2    triceps Testa
treino          3T     2      gluteo  ABC    2    triceps corda
treino          3T     3     gluteo  ABC    2    triceps paralela
treino          4RP     1      gluteo  ABC    2    Agachamento Smith
treino          5C    1      gluteo  ABC    2    Cadeira Extensora


hiit            1     99     gluteo  ABC    2    HIIT curto 20/30

cardio_final    900   1      gluteo  ABC    2    Cardio leve

resfriamento    999   1      gluteo  ABC    2    Resfriamento final

🧠 O que o engine fará automaticamente:

Renderizar Aquecimento Premium

Agrupar os 4 exercícios no Box 1

Inserir o HIIT ao final do box

Inserir o Cardio Final

Renderizar Resfriamento Premium

Garantir que aquecimento e resfriamento apareçam apenas uma vez

5️⃣ Princípios FemFlow (regra de ouro)

A planilha não pensa

O engine não ensina

O método educa o corpo

📌 Se a planilha estiver limpa e coerente,
📌 o app sempre mostrará o treino certo, no dia certo, para o corpo certo.
