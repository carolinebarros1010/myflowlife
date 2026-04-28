#!/usr/bin/env bash
set -euo pipefail

# Publica arquivos estáticos do módulo Cabine Verde para uma pasta equivalente a /cabineverde/
# Uso:
#   scripts/deploy-cabineverde.sh [DESTINO_BASE]
# Exemplo hospedagem compartilhada:
#   scripts/deploy-cabineverde.sh /home/usuario/public_html

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ORIGEM="${REPO_ROOT}/cabineverde/public"
DESTINO_BASE="${1:-${REPO_ROOT}/_deploy}"
DESTINO_FINAL="${DESTINO_BASE%/}/cabineverde"

if [[ ! -f "${ORIGEM}/index.html" ]]; then
  echo "Erro: origem inválida em ${ORIGEM}" >&2
  exit 1
fi

mkdir -p "${DESTINO_FINAL}"
rm -rf "${DESTINO_FINAL}"/*
cp -R "${ORIGEM}"/. "${DESTINO_FINAL}"/

echo "Cabine Verde publicado em: ${DESTINO_FINAL}"
echo "URL esperada (produção): https://myflowlife.com.br/cabineverde/"
