# Integração Google Sheets (Cabine Verde + Apps Script)

## Endpoint oficial (referência única)
`https://script.google.com/macros/s/AKfycbyWmW1-MNFprc83mtns2FrQCL2x-k5rckwUDI2p6d0L4dzVYxLLQRg4cyB28JLG_501zw/exec`

> O projeto Cabine Verde não deve usar endpoints antigos nem alternativos.

## Método HTTP por finalidade
- `GET /exec`: **somente healthcheck**.
- `POST /exec`: **somente gravação/atualização** de caso na aba `Desaparecidos`.

## Publicação obrigatória do Apps Script (evita erro de `doGet`)
Após copiar/atualizar os arquivos de `cabineverde/GAS/` no projeto Apps Script real, é obrigatório publicar uma nova versão:

```text
Deploy > Manage deployments > Edit > New version > Deploy
```

Sem esse fluxo, a URL publicada pode continuar apontando para uma versão antiga sem `doGet()`, causando erro de healthcheck no frontend.

## Fluxo frontend → Apps Script → planilha
1. Frontend gera payload compatível com `SheetsMapping.gs`.
2. Frontend envia requisição:

```js
fetch(ENDPOINT, {
  method: 'POST',
  mode: 'no-cors',
  headers: {
    'Content-Type': 'text/plain;charset=utf-8'
  },
  body: JSON.stringify(payload)
})
```

3. Apps Script valida e persiste na aba `Desaparecidos`.
4. Resposta retorna JSON operacional com `ok`, `action`, `idCaso`, `linha`, `aba`, `timestamp`.


## Envio em `no-cors`: comportamento esperado
- O frontend oficial envia `POST` com `mode: 'no-cors'` para evitar bloqueio de CORS sem backend intermediário.
- Nesse modo, o navegador não expõe `status`, `headers` e `body` da resposta (resposta opaca).
- Portanto, a confirmação operacional deve ser feita direto na planilha, não no retorno HTTP do browser.

## Parse robusto no Apps Script
O backend aceita três formatos de entrada, na ordem:
1. `e.postData.contents` com JSON serializado no corpo (formato adotado pelo frontend).
2. `e.parameter.payload` com JSON string.
3. `e.parameters.payload[0]` com JSON string.

Se o payload estiver vazio ou inválido, o GAS grava erro técnico e retorna: `Payload ausente ou inválido. Verifique body JSON ou campo payload.`

## Aba técnica `Logs_GAS`
A planilha passa a incluir a aba `Logs_GAS` com colunas:
- `timestamp`
- `etapa`
- `ok`
- `mensagem`
- `rawPostData`
- `payloadIdCaso`

Como diagnosticar:
1. Se há linha em `Logs_GAS`, o `POST` chegou ao Apps Script.
2. Se existe `erro_post`, ler `mensagem` para causa raiz.
3. Se há `parse_payload` com `ok=Sim` mas não há linha em `Desaparecidos`, o problema está na persistência/mapeamento.
4. Se há `persistencia_desaparecidos` com `ok=Sim`, a gravação ocorreu e deve existir linha em `Desaparecidos` para o `payloadIdCaso`.

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
- `Endpoint ativo`
- `Caso criado com sucesso`
- `Caso atualizado com sucesso`
- `Falha ao salvar caso`
- `Backend GAS não publicado ou doGet ausente`
- `Verifique se foi feito novo deploy do Apps Script`

Sempre que disponível, exibir também:
- `idCaso`
- `linha`
- `action` (`created` ou `updated`)

## Regras de envio no front (`/cabineverde/`)
- O botão **Salvar caso** executa submissão real via `fetch(..., { method: 'POST' })`.
- O envio do frontend em produção usa `mode: 'no-cors'` para evitar bloqueio CORS no navegador sem backend intermediário.
- Em `no-cors`, o frontend não lê `response.ok` nem `response.json`; o retorno exibido ao operador é: `Caso enviado para processamento (modo silencioso)`.
- O formulário principal usa **somente um** `<form id="f">`.
- Os campos críticos (`nomeCompletoDesaparecido`, `municipio`, `nomeSolicitante`, `telefoneSolicitante`) devem existir **uma única vez** dentro do formulário e ser lidos por `querySelector` no submit.
- O formulário publicado em `/cabineverde/` possui seção dedicada **Dados do Solicitante** com os campos:
  - `nomeSolicitante`
  - `vinculoSolicitante`
  - `telefoneSolicitante`
- A tela exibe três níveis de auditoria:
  - **Payload Sheets** (payload pronto para envio),
  - **Retorno GAS** (JSON bruto devolvido pelo Apps Script),
  - **Debug integração GAS** (payload gerado, status de envio e resposta).
- Campos mínimos bloqueantes antes do envio:
  - `nomeCompletoDesaparecido`
  - `municipio`
  - `nomeSolicitante`
  - `telefoneSolicitante`
- A mensagem final deve seguir o contrato:
  - `ok: true` + `action: created` → `Caso criado com sucesso`
  - `ok: true` + `action: updated` → `Caso atualizado com sucesso`
  - qualquer falha → `Falha ao salvar caso`
- Quando faltar dado mínimo, exibir: `Preencha os campos mínimos: nome do desaparecido, município, nome do solicitante e telefone do solicitante.`

## URLs do frontend
- URL oficial de produção: `https://myflowlife.com.br/cabineverde/`
- `https://myflowlife.com.br/public/index.html` **não é URL oficial do Cabine Verde**.

## Testes de integração
### Checklist rápido pós-deploy
1. Abrir endpoint no navegador.
2. Confirmar JSON de healthcheck.
3. Enviar `POST` com `MockPayload.json`.
4. Confirmar nova linha na aba `Desaparecidos`.

### 1) Healthcheck (GET)
```bash
curl 'https://script.google.com/macros/s/AKfycbyWmW1-MNFprc83mtns2FrQCL2x-k5rckwUDI2p6d0L4dzVYxLLQRg4cyB28JLG_501zw/exec'
```

### 2) Gravação/atualização (POST)
```bash
curl -X POST 'https://script.google.com/macros/s/AKfycbyWmW1-MNFprc83mtns2FrQCL2x-k5rckwUDI2p6d0L4dzVYxLLQRg4cyB28JLG_501zw/exec' \
  -H 'Content-Type: text/plain;charset=utf-8' \
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
