# Deploy do Cabine Verde (subprojeto)

## URLs oficiais
- **Site principal**: `https://myflowlife.com.br/`
- **Módulo Cabine Verde**: `https://myflowlife.com.br/cabineverde/`

> O Cabine Verde é um subprojeto. A raiz `/` continua sendo exclusiva do site principal.

## Entradas corretas
- Site principal: `index.html` (na raiz do repositório).
- Cabine Verde (fonte do deploy): `cabineverde/public/index.html`.

## Estratégia recomendada de publicação
Publicar o conteúdo de `cabineverde/public/` diretamente na pasta pública `cabineverde/` do servidor.

### Opção A — script local
```bash
scripts/deploy-cabineverde.sh
```
Saída local para conferência: `_deploy/cabineverde/`.

### Opção B — hospedagem tradicional (`public_html`)
```bash
scripts/deploy-cabineverde.sh /home/USUARIO/public_html
```
Destino final:
```text
/home/USUARIO/public_html/cabineverde/
```

## O que não fazer
- Não substituir o `index.html` da raiz do domínio.
- Não usar `/public/index.html` da raiz como URL oficial do Cabine Verde.
- Não mover o subprojeto Cabine Verde para fora de `cabineverde/`.

## Teste local
Na raiz do repositório:
```bash
python3 -m http.server 4173 -d .
```
Teste:
- Site principal: `http://localhost:4173/`
- Cabine Verde (subprojeto): `http://localhost:4173/cabineverde/public/index.html`

## Teste pós-deploy
1. Acesse `https://myflowlife.com.br/` e valide o site principal.
2. Acesse `https://myflowlife.com.br/cabineverde/` e valide carregamento de CSS/JS.
3. No DevTools (Network), confirme `200` para:
   - `/cabineverde/index.html`
   - `/cabineverde/styles/main.css`
   - `/cabineverde/js/app.js`
4. Realize um envio de caso e valide `POST` no endpoint Apps Script.
