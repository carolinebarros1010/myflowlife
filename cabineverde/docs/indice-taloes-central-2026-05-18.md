# Índice central `INDICE_TALOES` (Talão 190)

## Finalidade
O `INDICE_TALOES` é um índice operacional central para localizar rapidamente o registro do Talão 190 por `idCaso`, `hashOperacional` e `talaoNormalizado`, sem varredura completa em múltiplas abas diárias.

## Relação com UPSERT
O índice não substitui o UPSERT na aba diária. Ele acelera a localização inicial. Após `hit`, o sistema valida referência (aba/linha/chaves). Em `miss` ou referência inválida, executa fallback tradicional e corrige o índice ao final.

## Integridade e índice corrompido
Quando a referência estiver inválida, o fluxo registra `INDICE_TALOES_REFERENCIA_INVALIDA`, ignora a referência e realiza busca tradicional antes de atualizar o índice para a linha correta.

## Rastreabilidade operacional
Cada atualização no índice mantém metadados (`dataOperacional`, `nomeAba`, `linha`, `status`, `criadoEm`, `atualizadoEm`, `origem`) para trilha de auditoria e rastreabilidade policial.
