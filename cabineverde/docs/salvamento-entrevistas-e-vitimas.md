# Salvamento das entrevistas e da vítima

Os botões de salvamento da entrevista inicial e da entrevista qualificada usam `cv:salvar-painel-arvore`.

Cada salvamento:

- grava ou atualiza o caso no banco local ou no servidor central, conforme o modo de operação;
- grava ou atualiza automaticamente a vítima de ordem 1 com as respostas disponíveis até aquele momento;
- retorna `confirmadoNoBanco` somente após a persistência da vítima;
- mantém o formulário aberto e exibe uma confirmação antes de oferecer a limpeza para um novo caso.

O operador pode continuar no caso salvo ou iniciar um novo caso. A limpeza não remove o registro salvo; os dados permanecem disponíveis nas consultas.
