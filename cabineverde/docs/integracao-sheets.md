# Integração Google Sheets (Cabine Verde + Apps Script)

## Endpoint principal (produção)
A referência oficial da operação Cabine Verde é:

`https://script.google.com/macros/s/AKfycby0K8dr5dvHAK_graS1qoYq_r4n0116w7VHup3MDk_3TNkfUB_9T-x1kL_a-EKhqtmDdQ/exec`

- `GET /exec`: healthcheck simples (`doGet`).
- `POST /exec`: gravação de casos na aba `Desaparecidos` (`doPost`).

## Estrutura operacional da planilha
A estrutura é garantida pelo Apps Script (`garantirEstruturaPlanilha`) sempre que ocorre um `POST`.

### 1) Aba `Desaparecidos` (principal)
Linha 1 (ordem exata):

1. idCaso
2. dataHoraRegistro
3. dataServico
4. turno
5. equipe
6. operadorResponsavel
7. municipio
8. talaoBopm
9. statusCaso
10. nomeCompletoDesaparecido
11. sexoGenero
12. idade
13. faixaEtaria
14. cpf
15. rg
16. nomeMae
17. dataNascimento
18. dataHoraUltimaVisualizacao
19. localUltimaVisualizacao
20. roupaUltimaVisualizacao
21. meioTransporte
22. dadosVeiculo
23. fotoDisponivel
24. linkFoto
25. telefoneDesaparecido
26. dispositivoLigado
27. camerasResidencia
28. camerasUltimoLocal
29. aptoCabineVerde
30. nomeSolicitante
31. vinculoSolicitante
32. telefoneSolicitante
33. vulnerabilidade
34. condicaoMentalCognitivaComportamental
35. limitacaoFisica
36. usoMedicacaoEssencial
37. usoAlcoolOutrasDrogas
38. historicoDesaparecimentoAnterior
39. conflitoPrevio
40. suspeitaCrime
41. locaisHabituais
42. buscasPreliminares
43. classificacaoRisco
44. prioridade
45. acaoSugerida
46. localizado
47. dataHoraLocalizacao
48. formaLocalizacao
49. encerrado190
50. numeroBo
51. observacoesOperacionais

### 2) Aba `Listas`
Cabeçalho: `tipoLista | valor`

Blocos carregados automaticamente:
- `statusCaso`: Aberto | Em análise | Em busca | Localizado | Encerrado
- `faixaEtaria`: Criança | Pré-adolescente | Adolescente | Adulto | Idoso
- `classificacaoRisco`: Alto | Moderado | Baixo
- `prioridade`: Máxima | Alta | Média | Baixa
- `acaoSugerida`: Despacho imediato | Cabine Verde | Monitoramento | Orientação | Encaminhamento investigativo
- `vinculoSolicitante`: Pai | Mãe | Responsável | Familiar | Vizinho | Escola | Outro
- `turno`: Diurno | Noturno
- `formaLocalizacao`: Contato do solicitante | Busca local | Ferramenta inteligente | Viatura | Outro

### 3) Aba `Relatorio_Diario`
Cabeçalho:
- dataServico
- turno
- equipe
- totalCasosAnalisados
- totalContatosDeclarantes
- totalLocalizados
- totalBaixas
- totalFotosRecebidas
- totalAptosCabineVerde
- totalSuspeitaCrime
- totalCriancas
- totalAdolescentes
- totalIdosos
- textoOcorrenciasRelevancia
- textoOrientacoesPublico
- textoEncerramento

### 4) Aba `Painel`
Cabeçalho: `Indicador | Valor`

Indicadores-base inseridos automaticamente:
- Casos do dia
- Casos abertos
- Casos localizados
- Crianças
- Idosos
- Suspeita de crime
- Com foto
- Com câmera
- Aptos Cabine Verde

### 5) Aba `Ocorrencias_Relevancia`
Cabeçalho:
- idCaso
- dataServico
- talaoBopm
- nomeCompletoDesaparecido
- motivoRelevancia
- resumoNarrativo
- incluidoNoRelatorio
- responsavelRegistro

### 6) Aba `Config`
Cabeçalho: `chave | valor`

Chaves padrão:
- spreadsheetVersion
- sheetPrincipal
- ultimaAtualizacaoEstrutura
- responsavelEstrutura

## Compatibilidade frontend ↔ GAS
Arquivos de referência:
- Frontend payload: `src/utils/sheetsPayload.ts`
- Endpoint/config: `src/config/env.ts`, `src/services/sheetsService.ts`
- Apps Script: `GAS/Code.gs`, `GAS/SheetsMapping.gs`, `GAS/Utils.gs`

Regras de integração:
1. O frontend envia `POST` com `Content-Type: application/json`.
2. O payload segue os mesmos nomes de coluna da aba `Desaparecidos`.
3. O Apps Script normaliza valores e grava com `appendRow`.
4. O retorno JSON padroniza `ok`, `message`, `timestamp` e, em sucesso, `aba` + `linha`.

## Exemplo de requisição (POST)
```bash
curl -X POST 'https://script.google.com/macros/s/AKfycby0K8dr5dvHAK_graS1qoYq_r4n0116w7VHup3MDk_3TNkfUB_9T-x1kL_a-EKhqtmDdQ/exec' \
  -H 'Content-Type: application/json' \
  --data @GAS/MockPayload.json
```

Resposta esperada (exemplo):
```json
{
  "ok": true,
  "service": "cabineverde",
  "message": "Caso salvo com sucesso",
  "aba": "Desaparecidos",
  "linha": 42
}
```

## Healthcheck (GET)
```bash
curl 'https://script.google.com/macros/s/AKfycby0K8dr5dvHAK_graS1qoYq_r4n0116w7VHup3MDk_3TNkfUB_9T-x1kL_a-EKhqtmDdQ/exec'
```

Resposta esperada (exemplo):
```json
{
  "ok": true,
  "service": "cabineverde",
  "message": "Cabine Verde Sheets endpoint ativo"
}
```

## Como testar fluxo completo
1. **Frontend**
   - Confirmar endpoint em `src/config/env.ts`.
   - Abrir a interface, preencher a triagem e salvar.
2. **Endpoint `/exec`**
   - Validar healthcheck via `GET`.
   - Enviar payload real via `POST`.
3. **Planilha `Desaparecidos`**
   - Verificar linha inserida ao final da aba.
   - Conferir se colunas e valores estão alinhados com `SheetsMapping.gs`.
