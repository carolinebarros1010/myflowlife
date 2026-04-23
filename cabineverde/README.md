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

## Configuração de integração com Sheets
Defina as variáveis globais antes de carregar a página:
- `CABINE_VERDE_SHEETS_ENDPOINT`
- `CABINE_VERDE_SPREADSHEET_ID`
- `CABINE_VERDE_SHEETS_API_KEY` (opcional)

Consulte `docs/integracao-sheets.md`.
