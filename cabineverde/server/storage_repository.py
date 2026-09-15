from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

SCHEMA_VERSION = "2.1.0-reconciliado"
LIST_FILES = {
    "pessoas": "pessoas.json", "casos": "casos.json", "vitimas": "vitimas.json", "eventos": "eventos.json",
    "analisesF2": "analises-f2.json", "qualificacoes": "qualificacoes.json", "pistas": "pistas.json",
    "taloes": "taloes.json", "atribuicoes": "atribuicoes.json", "historicosV7": "historicos-v7.json",
    "producaoDiaria": "producao-diaria.json",
    "aliasesCasos": "aliases-casos.json",
}


class JsonStorageRepository:
    """Compatibilidade da API antiga, com persistência exclusiva em SQLite."""

    def __init__(self, data_root: Path):
        self.data_root = data_root.resolve()
        self.data_dir = self.data_root / "dados"
        self.backup_dir = self.data_root / "backup"
        self.database_path = self.data_root / "cabine-verde-server.sqlite"
        self.data_root.mkdir(parents=True, exist_ok=True)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.backup_dir.mkdir(parents=True, exist_ok=True)
        self.connection = sqlite3.connect(self.database_path, check_same_thread=False)
        self.connection.row_factory = sqlite3.Row
        self.connection.execute("PRAGMA journal_mode=WAL")
        self.connection.execute("CREATE TABLE IF NOT EXISTS colecoes_json (colecao TEXT NOT NULL, chave TEXT NOT NULL, dados TEXT NOT NULL, atualizado_em TEXT NOT NULL, PRIMARY KEY (colecao, chave))")
        self.connection.commit()

    def close(self) -> None:
        self.connection.close()

    def path_for(self, collection: str) -> Path:
        return self.database_path

    def load(self, collection: str) -> Any:
        if collection == "metadados" or collection == "producaoConsolidada":
            linha = self.connection.execute("SELECT dados FROM colecoes_json WHERE colecao = ? AND chave = '__object__'", (collection,)).fetchone()
            return json.loads(linha["dados"]) if linha else {}
        linhas = self.connection.execute("SELECT dados FROM colecoes_json WHERE colecao = ? ORDER BY CAST(chave AS INTEGER), chave", (collection,)).fetchall()
        return [json.loads(linha["dados"]) for linha in linhas]

    def load_list(self, collection: str) -> list[dict]:
        valor = self.load(collection)
        if not isinstance(valor, list):
            raise RuntimeError(f"Coleção SQLite inválida: {collection}")
        return valor

    def load_object(self, collection: str) -> dict:
        valor = self.load(collection)
        if not isinstance(valor, dict):
            raise RuntimeError(f"Objeto SQLite inválido: {collection}")
        return valor

    def save_list(self, collection: str, registros: list[dict]) -> None:
        agora = datetime.now(timezone.utc).isoformat()
        with self.connection:
            self.connection.execute("DELETE FROM colecoes_json WHERE colecao = ?", (collection,))
            self.connection.executemany("INSERT INTO colecoes_json(colecao,chave,dados,atualizado_em) VALUES(?,?,?,?)", [(collection, str(indice), json.dumps(registro, ensure_ascii=False), agora) for indice, registro in enumerate(registros)])

    def save_object(self, collection: str, registro: dict) -> None:
        agora = datetime.now(timezone.utc).isoformat()
        with self.connection:
            self.connection.execute("INSERT INTO colecoes_json(colecao,chave,dados,atualizado_em) VALUES(?,?,?,?) ON CONFLICT(colecao,chave) DO UPDATE SET dados=excluded.dados, atualizado_em=excluded.atualizado_em", (collection, "__object__", json.dumps(registro, ensure_ascii=False), agora))

    def append(self, collection: str, registro: dict) -> dict:
        registros = self.load_list(collection)
        registros.append(registro)
        self.save_list(collection, registros)
        return registro

    def next_id(self, collection: str, prefix: str, field: str) -> str:
        maior = 0
        for item in self.load_list(collection):
            valor = str(item.get(field, ""))
            if valor.startswith(f"{prefix}-"):
                try:
                    maior = max(maior, int(valor.rsplit("-", 1)[1]))
                except ValueError:
                    continue
        return f"{prefix}-{maior + 1:06d}"


def metadata_inicial(data_root: Path) -> dict:
    return {"sistema": "Cabine Verde", "schemaVersion": SCHEMA_VERSION, "databaseVersion": 3, "generatedAt": datetime.now(timezone.utc).isoformat(), "source": "SQLITE_SERVER", "dataRootEsperado": str(data_root)}
