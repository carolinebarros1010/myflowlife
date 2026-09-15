# Correção do fluxo por idade

O fluxo operacional utiliza a idade da pergunta `p7` da lista-mestra de 300 perguntas. A aplicação agora extrai esse valor como número, inclusive quando o operador informa texto como `12 anos`, e seleciona o subfluxo correspondente ao avançar para a etapa de qualificação por idade.

As faixas são: criança (0–7), pré-adolescente (8–11), adolescente (12–17), adulto (18–59) e idoso (60+).
