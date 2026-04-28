# Diagnóstico técnico final — Cabine Verde

## Problema encontrado
O módulo Cabine Verde estava com entrada em `cabineverde/public/index.html`, mas com referência de CSS para `../src/styles/main.css`, o que gera acoplamento com árvore de código-fonte e dificulta publicação estática direta em `/cabineverde/`.

Também havia inconsistência entre endpoint documentado e endpoint oficial informado para Apps Script.

## Arquivos auditados
- `index.html` (raiz)
- `cabineverde/public/index.html`
- `cabineverde/public/js/app.js`
- `cabineverde/public/js/core.js`
- `cabineverde/src/config/env.ts`
- `cabineverde/GAS/Code.gs`
- `cabineverde/scripts/google-apps-script/Code.gs`
- `cabineverde/README.md`

## Ajustes aplicados
1. **Caminhos do frontend do Cabine Verde**
   - CSS alterado para caminho relativo ao pacote público (`./styles/main.css`).
   - CSS replicado para `cabineverde/public/styles/main.css`.

2. **Entrada dedicada do subprojeto**
   - Criado `cabineverde/index.html` para operação clara em `/cabineverde/` sem interferir na raiz `/`.

3. **Deploy simplificado**
   - Criado script `scripts/deploy-cabineverde.sh` para copiar `cabineverde/public/` para destino final `/cabineverde/`.

4. **Integração Apps Script**
   - Endpoint oficial atualizado no frontend (`env.ts`):
     `https://script.google.com/macros/s/AKfycbyWmW1-MNFprc83mtns2FrQCL2x-k5rckwUDI2p6d0L4dzVYxLLQRg4cyB28JLG_501zw/exec`
   - `doGet()` ajustado para healthcheck simples:
     `{ ok: true, service: "cabineverde", message: "Endpoint ativo" }`
   - `doPost(e)` mantido com gravação na aba `Desaparecidos`.

## URL correta
- Site principal: `https://myflowlife.com.br/`
- Cabine Verde: `https://myflowlife.com.br/cabineverde/`

## Dependências de provedor/hospedagem
- Servidor deve mapear a pasta estática `cabineverde/` no domínio principal.
- Se existir cache/CDN, invalidar após publicação.
- Permitir chamadas HTTPS para `script.google.com` no frontend.

## Próximos passos
1. Publicar com `scripts/deploy-cabineverde.sh /caminho/public_html`.
2. Validar carregamento dos assets no navegador (sem 404).
3. Validar `GET` de healthcheck no Apps Script.
4. Validar `POST` com payload real e conferência da aba `Desaparecidos`.
