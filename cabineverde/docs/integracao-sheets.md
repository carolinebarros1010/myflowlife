# Integração Google Sheets (Cabine Verde + Apps Script)

## Endpoint oficial (referência única)
`https://script.google.com/macros/s/AKfycbyWmW1-MNFprc83mtns2FrQCL2x-k5rckwUDI2p6d0L4dzVYxLLQRg4cyB28JLG_501zw/exec`

> O projeto Cabine Verde não deve usar endpoints antigos nem alternativos.

## Método HTTP por finalidade
- `GET /exec`: **somente healthcheck**.
- `POST /exec`: **somente gravação/atualização** de caso na aba `Desaparecidos`.

## Fluxo frontend → Apps Script → planilha
1. Frontend gera payload compatível com `SheetsMapping.gs`.
2. Frontend envia requisição:

```js
fetch(ENDPOINT, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payload)
})
```

3. Apps Script valida e persiste na aba `Desaparecidos`.
4. Resposta retorna JSON operacional com `ok`, `action`, `idCaso`, `linha`, `aba`, `timestamp`.

## Estrutura operacional da aba `Desaparecidos`
Ordem oficial (51 colunas):

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

## Respostas esperadas do backend
### Criação
```json
{
  "ok": true,
  "action": "created",
  "idCaso": "CV-2026-0001",
  "aba": "Desaparecidos",
  "linha": 2,
  "timestamp": "2026-04-28T12:00:00.000Z"
}
```

### Atualização
```json
{
  "ok": true,
  "action": "updated",
  "idCaso": "CV-2026-0001",
  "aba": "Desaparecidos",
  "linha": 2,
  "timestamp": "2026-04-28T12:00:00.000Z"
}
```

### Erro
```json
{
  "ok": false,
  "error": "mensagem do erro"
}
```

## Feedback visual obrigatório no frontend
Mensagens esperadas para operador:
- `Caso criado com sucesso`
- `Caso atualizado com sucesso`
- `Falha ao salvar caso`
- `Endpoint indisponível`
- `Erro de integração com Google Sheets`

Sempre que disponível, exibir também:
- `idCaso`
- `linha`
- `action` (`created` ou `updated`)

## URLs do frontend
- URL oficial de produção: `https://myflowlife.com.br/cabineverde/`
- `https://myflowlife.com.br/public/index.html` **não é URL oficial do Cabine Verde**.

## Testes de integração
### 1) Healthcheck (GET)
```bash
curl 'https://script.google.com/macros/s/AKfycbyWmW1-MNFprc83mtns2FrQCL2x-k5rckwUDI2p6d0L4dzVYxLLQRg4cyB28JLG_501zw/exec'
```

### 2) Gravação/atualização (POST)
```bash
curl -X POST 'https://script.google.com/macros/s/AKfycbyWmW1-MNFprc83mtns2FrQCL2x-k5rckwUDI2p6d0L4dzVYxLLQRg4cyB28JLG_501zw/exec' \
  -H 'Content-Type: application/json' \
  --data @GAS/MockPayload.json
```

### 3) Teste local do frontend
```bash
python3 -m http.server 4173 -d .
```
Acesse `http://localhost:4173/cabineverde/public/index.html`, registre um caso e confirme feedback + resposta no painel.

### 4) Teste em produção
1. Abrir `https://myflowlife.com.br/cabineverde/`.
2. Registrar caso com `idCaso` novo e confirmar mensagem de criação.
3. Reenviar mesmo `idCaso` com alteração operacional e confirmar mensagem de atualização.
4. Verificar a aba `Desaparecidos` e linha retornada.
