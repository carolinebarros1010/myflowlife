# Fluxo de Triagem Dinâmica

1. **Entrada do caso**: dados da ocorrência, desaparecido e solicitante.
2. **Árvore dinâmica**:
   - idade ativa subfluxo por faixa etária;
   - suspeita de crime ativa bloco de indícios;
   - dispositivo/câmeras ativa apoio tecnológico;
   - vulnerabilidade impacta prioridade.
3. **Cálculo automático**:
   - `calcularFaixaEtaria`
   - `calcularRisco`
   - `calcularPrioridade`
   - `calcularAcaoSugerida`
   - `calcularAptoCabineVerde`
4. **Persistência**:
   - salva localmente para operação imediata;
   - gera payload para aba `Desaparecidos` no Sheets.
5. **Saída operacional**:
   - resumo do caso;
   - listagem e detalhe;
   - relatório diário institucional.
