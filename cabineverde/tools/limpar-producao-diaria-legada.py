"""Remove somente lançamentos importados do histórico da produção diária ativa."""

from __future__ import annotations

import argparse
import json
import shutil
import sqlite3
from datetime import datetime, timezone
from pathlib import Path


PREFIXO_LEGADO = "importacao-xlsx-"


def executar(raiz_json: Path, bancos: list[Path]) -> dict[str, int | str]:
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    backup = raiz_json / "backup" / f"antes-limpeza-producao-diaria-legada-{timestamp}"
    backup.mkdir(parents=True, exist_ok=True)
    removidos_json = 0
    arquivo_json = raiz_json / "dados" / "producao-diaria.json"
    registros = json.loads(arquivo_json.read_text(encoding="utf-8-sig")) if arquivo_json.exists() else []
    if arquivo_json.exists():
        shutil.copy2(arquivo_json, backup / "producao-diaria.json.antes")
    atuais = [item for item in registros if not str(item.get("operadorEmail", "")).startswith(PREFIXO_LEGADO)]
    removidos_json = len(registros) - len(atuais)
    arquivo_json.write_text(json.dumps(atuais, ensure_ascii=False, indent=2), encoding="utf-8")

    removidos_sqlite = 0
    for banco in bancos:
        if not banco.exists():
            continue
        destino = backup / f"{banco.stem}-{banco.parent.parent.name or 'banco'}.sqlite"
        shutil.copy2(banco, destino)
        conexao = sqlite3.connect(banco)
        cursor = conexao.execute("DELETE FROM producao_diaria WHERE operador_email LIKE ?", (f"{PREFIXO_LEGADO}%",))
        removidos_sqlite += cursor.rowcount
        conexao.commit()
        conexao.close()
    return {"removidosJson": removidos_json, "removidosSqlite": removidos_sqlite, "restantesJson": len(atuais), "backup": str(backup)}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--raiz-json", type=Path, required=True)
    parser.add_argument("--banco", type=Path, action="append", default=[])
    args = parser.parse_args()
    print(json.dumps(executar(args.raiz_json.resolve(), [item.resolve() for item in args.banco]), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
