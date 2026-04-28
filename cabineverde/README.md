# Cabine Verde

Aplicação web operacional para triagem dinâmica, registro de casos de desaparecidos, preparação de payload para Google Sheets e emissão de relatório operacional diário.

## Decisão de stack
- **Camada funcional atual**: HTML/CSS/JavaScript modular (rápida para operar no ambiente atual do repositório).
- **Camada de evolução**: estrutura TypeScript em `src/` já preparada para crescimento com tipagem forte e serviços desacoplados.

## URLs oficiais
- Site principal: `https://myflowlife.com.br/`
- Cabine Verde (oficial): `https://myflowlife.com.br/cabineverde/`
- `https://myflowlife.com.br/public/index.html` **não é URL oficial do Cabine Verde**.

## Endpoint oficial Apps Script (único)
`https://script.google.com/macros/s/AKfycbyWmW1-MNFprc83mtns2FrQCL2x-k5rckwUDI2p6d0L4dzVYxLLQRg4cyB28JLG_501zw/exec`

Regras:
- `GET`: healthcheck do endpoint.
- `POST`: gravação/atualização de casos na aba `Desaparecidos`.

## Como rodar localmente
```bash
python3 -m http.server 4173 -d .
```
Acesse:
- `http://localhost:4173/` (site principal)
- `http://localhost:4173/cabineverde/public/index.html` (rota local de desenvolvimento)

> A rota local `.../public/index.html` é apenas de desenvolvimento no repositório.

## Publicação do Cabine Verde
```bash
scripts/deploy-cabineverde.sh /caminho/para/public_html
```
O script copia `cabineverde/public/` para `/caminho/para/public_html/cabineverde/`.

## Testes
```bash
cd cabineverde
npm test
```

## Configuração da integração com Google Sheets
Variável global suportada:
- `CABINE_VERDE_SPREADSHEET_ID`

> O endpoint é fixo no código para garantir uso exclusivo do endpoint oficial.

### Fluxo de integração
1. Frontend monta payload completo de 51 colunas (`Desaparecidos`).
2. Frontend envia `POST` com `Content-Type: application/json` para o endpoint oficial.
3. Apps Script cria (`action: created`) ou atualiza (`action: updated`) pelo `idCaso`.
4. Frontend exibe feedback operacional:
   - `Caso criado com sucesso`
   - `Caso atualizado com sucesso`
   - `Falha ao salvar caso`
   - `Endpoint indisponível`
   - `Erro de integração com Google Sheets`

Consulte `docs/integracao-sheets.md` para passo a passo completo.
