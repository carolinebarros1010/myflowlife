# Confronto facial local

O módulo de **Buscar imagem** permite selecionar uma foto recebida pela Cabine Verde e calcular proximidade facial contra as fotos armazenadas localmente.

## Funcionamento

1. A imagem de referência é selecionada sem sair do computador.
2. O motor Python/InsightFace detecta o maior rosto da imagem e gera um embedding.
3. As fotos da tabela `fotos` são processadas e comparadas por similaridade de cosseno.
4. A interface exibe os dez melhores candidatos, percentual de proximidade e classificação.
5. O operador abre a imagem original e realiza a validação humana.

## Limites operacionais

O percentual é um indicador de proximidade, não uma identificação confirmada. Imagens sem rosto detectável são ignoradas. O processamento é local e usa CPU por padrão. O modelo `buffalo_l` pode ser baixado na primeira execução e fica disponível no cache local.

Dependências: `python -m pip install -r tools/requirements-face.txt`.
