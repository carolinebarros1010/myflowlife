# Integração Google Sheets (Cabine Verde + Apps Script)

## Endpoint principal (produção)
A referência oficial da operação Cabine Verde é:

`https://script.google.com/macros/s/AKfycbyWmW1-MNFprc83mtns2FrQCL2x-k5rckwUDI2p6d0L4dzVYxLLQRg4cyB28JLG_501zw/exec`

- `GET /exec`: healthcheck simples (`doGet`).
- `POST /exec`: criação/atualização de casos na aba `Desaparecidos` (`doPost`, única aba permitida).

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
3. `idCaso` é obrigatório e funciona como chave primária lógica.
4. Se `idCaso` ainda não existir, o Apps Script cria a linha (`action: "created"`).
5. Se `idCaso` já existir, o Apps Script atualiza somente campos operacionais (`action: "updated"`):
   - `statusCaso`
   - `localizado`
   - `dataHoraLocalizacao`
   - `formaLocalizacao`
   - `observacoesOperacionais`
6. O retorno JSON padroniza `ok`, `action`, `idCaso`, `linha` e `timestamp`.

## Exemplo de requisição (POST)
```bash
curl -X POST 'https://script.google.com/macros/s/AKfycbyWmW1-MNFprc83mtns2FrQCL2x-k5rckwUDI2p6d0L4dzVYxLLQRg4cyB28JLG_501zw/exec' \
  -H 'Content-Type: application/json' \
  --data @GAS/MockPayload.json
```

Resposta esperada ao criar (exemplo):
```json
{
  "ok": true,
  "action": "created",
  "idCaso": "CV-2026-0001",
  "linha": 42,
  "timestamp": "2026-04-23T12:00:00.000Z"
}
```

Resposta esperada ao atualizar (exemplo):
```json
{
  "ok": true,
  "action": "updated",
  "idCaso": "CV-2026-0001",
  "linha": 42,
  "timestamp": "2026-04-23T12:05:00.000Z"
}
```

## Healthcheck (GET)
```bash
curl 'https://script.google.com/macros/s/AKfycbyWmW1-MNFprc83mtns2FrQCL2x-k5rckwUDI2p6d0L4dzVYxLLQRg4cyB28JLG_501zw/exec'
```

Resposta esperada (exemplo):
```json
{
  "ok": true,
  "service": "cabineverde",
  "message": "Endpoint ativo"
}
```

## Como testar fluxo completo
1. **Criar caso**
   - Não preencher `idCaso` no formulário (frontend gera ID automaticamente) ou enviar ID novo no payload.
   - Validar retorno `action: "created"`.
2. **Atualizar caso**
   - Reenviar o mesmo `idCaso` com novo `statusCaso` e/ou dados operacionais de localização.
   - Validar retorno `action: "updated"` e ausência de linha duplicada.
3. **Healthcheck do endpoint**
   - Consultar `GET /exec`.
   - Confirmar retorno JSON: `{ ok: true, service: "cabineverde", message: "Endpoint ativo" }`.
