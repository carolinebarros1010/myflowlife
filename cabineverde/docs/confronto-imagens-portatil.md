# Confronto de imagens portátil

O confronto facial usa `tools/confrontar-imagens.py` como fonte Python e o executável `motor-facial/confrontar-imagens.exe` no pacote Windows. O Electron prefere o executável empacotado e só usa `python` no ambiente de desenvolvimento.

Cada candidato retornado contém o nome, talão, cadastro do caso, caminho da imagem, similaridade e distância. A tela ordena pela menor distância, exibe a miniatura e permite abrir a foto original para validação visual.

O operador pode ajustar a régua de semelhança entre 50% e 95%, em passos de 5 pontos. Esse valor é um limiar de triagem: candidatos abaixo dele não são exibidos. Ele não representa uma probabilidade estatística nem confirma identidade; a comparação humana da fotografia continua obrigatória antes de qualquer providência operacional.

Quando o modo **Servidor HTTP — dados centralizados** está ativo em Configurações, a lista de fotos e os dados dos casos são consultados pela API configurada. As imagens são baixadas temporariamente para processamento local pelo Buffalo e exibidas em grade para comparação visual. O modo local consulta somente a base deste computador.
