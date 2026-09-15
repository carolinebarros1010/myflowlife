# Consulta completa por talão

A aba Buscar talão mantém o editor e acrescenta uma consulta de todos os campos
disponíveis, com atualização manual e impressão/salvamento em PDF. A consulta
inclui cadastro, vítimas, respostas e complementos, histórico e metadados das
fotos. No servidor atualizado, também inclui cadastro das pessoas, análises F2,
qualificações, pistas e eventos vinculados por identificador de caso ou pessoa.
As fotos são relacionadas por seus metadados; o relatório não incorpora os
arquivos de imagem.

A situação atual de cada vítima é calculada pela mesma regra da busca de pessoas:
última situação explícita nas análises F2. Uma análise sem situação não apaga a
anterior. A situação de uma vítima não encerra automaticamente as demais vítimas
nem o talão. Na lista, as situações individuais aparecem abaixo do status do caso.

O cliente preserva os campos de nível superior e os campos de `dados` retornados
pelo servidor. Uma falha na consulta central não usa silenciosamente a cópia
local. Falhas de carregamento de vítimas, histórico ou fotos impedem a emissão do
relatório completo. O histórico local não é mais limitado a 50 registros.

Salvar um painel de caso existente não força mais o status Em triagem. O servidor
mescla atualizações parciais de `dados`, `respostasArvore` e `complementosArvore`,
preservando outros painéis e permitindo limpar explicitamente um campo.

## Atualização

É necessário distribuir o cliente recompilado e atualizar `server/server.py`
no servidor central. A mudança não reconstitui informações que já tenham sido
apagadas por versões anteriores; esses casos exigem conferência do histórico.

## Validação

- `npm run build`
- `node --check electron/main.cjs`
- `python -m unittest server.test_consulta_completa server.test_search_methodology -v`

A suíte antiga `server.test_vertical_slice` ainda prepara uma base JSON e falha
antes dos testes porque a inicialização atual exige o SQLite central. Não foi
alterada a base operacional para executar esses testes.
