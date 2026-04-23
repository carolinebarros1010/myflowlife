# Cabine Verde

Aplicação web operacional para triagem dinâmica, registro de casos de desaparecidos, preparação de payload para Google Sheets e emissão de relatório operacional diário.

## Decisão de stack
- **Camada funcional atual**: HTML/CSS/JavaScript modular (rápida para operar no ambiente atual do repositório).
- **Camada de evolução**: estrutura TypeScript em `src/` já preparada para crescimento com tipagem forte e serviços desacoplados.

## Como rodar
```bash
cd cabineverde
python3 -m http.server 4173 -d .
```
Acesse `http://localhost:4173/public/index.html`.

## Testes
```bash
cd cabineverde
npm test
```

## Configuração da integração com Google Sheets
Defina as variáveis globais antes de carregar a página:

- `CABINE_VERDE_SHEETS_ENDPOINT` (usa endpoint padrão de desenvolvimento caso ausente)
- `CABINE_VERDE_SPREADSHEET_ID`

### Fluxo de integração
- `GET` no Apps Script (`doGet`) é somente healthcheck.
- `POST` no Apps Script (`doPost`) grava na aba `Desaparecidos`.
- O frontend envia JSON com mapeamento explícito de colunas.

### Script pronto para publicação
Use os arquivos em:
- `scripts/google-apps-script/Code.gs`
- `scripts/google-apps-script/README.md`

Consulte `docs/integracao-sheets.md` para passo a passo completo.
