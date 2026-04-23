# Integração Google Sheets (Apps Script)

## Visão geral
A integração da Cabine Verde grava casos da triagem na aba `Desaparecidos` via **HTTP POST** para um Web App do Google Apps Script.

- **Endpoint padrão (dev):**
  `https://script.google.com/macros/s/AKfycbyWmW1-MNFprc83mtns2FrQCL2x-k5rckwUDI2p6d0L4dzVYxLLQRg4cyB28JLG_501zw/exec`
- **`GET`**: apenas healthcheck (`doGet()`).
- **`POST`**: gravação real (`doPost(e)`).

## Arquivos-chave da integração
- `src/config/env.ts`: configuração central (`CABINE_VERDE_SHEETS_ENDPOINT`, `CABINE_VERDE_SPREADSHEET_ID`).
- `src/utils/sheetsPayload.ts`: mapeamento explícito de colunas e valores da aba `Desaparecidos`.
- `src/services/sheetsService.ts`: envio `POST` com tratamento robusto de sucesso/erro.
- `scripts/google-apps-script/Code.gs`: script pronto para publicação no Apps Script.

## Variáveis de configuração
Defina globalmente antes de carregar o frontend:

```html
<script>
  globalThis.CABINE_VERDE_SHEETS_ENDPOINT = 'https://script.google.com/macros/s/.../exec';
  globalThis.CABINE_VERDE_SPREADSHEET_ID = 'SEU_SPREADSHEET_ID';
</script>
```

> Se `CABINE_VERDE_SHEETS_ENDPOINT` não for definido, o projeto usa o endpoint padrão de desenvolvimento.

## Estrutura do payload enviado (POST)
Exemplo enviado pelo frontend:

```json
{
  "service": "cabineverde",
  "aba": "Desaparecidos",
  "spreadsheetId": "SEU_SPREADSHEET_ID",
  "colunas": ["dataHoraRegistro", "municipio", "talaoBopm", "..."],
  "payload": {
    "dataHoraRegistro": "2026-04-23T14:30",
    "municipio": "Belém",
    "talaoBopm": "12345",
    "nomeCompletoDesaparecido": "Nome Exemplo",
    "sexoGenero": "Masculino",
    "idade": 16,
    "faixaEtaria": "Adolescente",
    "classificacaoRisco": "Alto risco",
    "prioridade": "Crítica",
    "acaoSugerida": "Acionar protocolo prioritário.",
    "aptoCabineVerde": true,
    "statusCaso": "Em triagem"
  }
}
```

## Mapeamento da aba `Desaparecidos`
A ordem esperada de colunas no Apps Script segue:

1. dataHoraRegistro
2. municipio
3. talaoBopm
4. nomeCompletoDesaparecido
5. sexoGenero
6. idade
7. faixaEtaria
8. cpf
9. rg
10. nomeMae
11. dataNascimento
12. fotoDisponivel
13. linkFoto
14. telefoneDesaparecido
15. dispositivoLigado
16. dataHoraUltimaVisualizacao
17. localUltimaVisualizacao
18. roupaUltimaVisualizacao
19. meioTransporte
20. dadosVeiculo
21. nomeSolicitante
22. vinculoSolicitante
23. telefoneSolicitante
24. vulnerabilidade
25. condicaoMentalCognitivaComportamental
26. limitacaoFisica
27. usoMedicacaoEssencial
28. usoAlcoolOutrasDrogas
29. historicoDesaparecimentoAnterior
30. conflitoPrevio
31. suspeitaCrime
32. locaisHabituais
33. buscasPreliminares
34. camerasResidencia
35. camerasUltimoLocal
36. classificacaoRisco
37. prioridade
38. acaoSugerida
39. aptoCabineVerde
40. observacoesOperacionais
41. statusCaso

## Publicação do Apps Script
1. Acesse `script.google.com` e crie um projeto.
2. Cole o conteúdo de `scripts/google-apps-script/Code.gs`.
3. Em **Project Settings > Script Properties**, defina:
   - `CABINE_VERDE_SPREADSHEET_ID`
   - (opcional) `CABINE_VERDE_SHEET_NAME` (`Desaparecidos` por padrão)
4. Clique em **Deploy > New deployment > Web app**.
5. Execute como: **Me**.
6. Quem tem acesso: **Anyone with the link** (ou política interna da sua operação).
7. Copie a URL `/exec` e configure no frontend.

## Teste rápido
### Healthcheck (`GET`)
```bash
curl 'https://script.google.com/macros/s/.../exec'
```
Retorno esperado:
```json
{"ok":true,"service":"cabineverde","message":"Endpoint ativo"}
```

### Gravação (`POST`)
```bash
curl -X POST 'https://script.google.com/macros/s/.../exec' \
  -H 'Content-Type: application/json' \
  -d '{"spreadsheetId":"SEU_SPREADSHEET_ID","aba":"Desaparecidos","payload":{"nomeCompletoDesaparecido":"Teste","idade":15}}'
```
Retorno esperado (exemplo):
```json
{"ok":true,"message":"Caso salvo com sucesso","sheet":"Desaparecidos","row":12}
```

## Fluxo de feedback no frontend
Ao salvar:
- sucesso: `caso salvo com sucesso`
- erro: `falha ao salvar`

Ambos com detalhe técnico adicional da resposta do endpoint.
