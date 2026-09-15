from __future__ import annotations

import argparse
import json
from pathlib import Path

from storage_repository import JsonStorageRepository, SCHEMA_VERSION


LISTAS = {
    "pessoas": "pessoas.json", "casos": "casos.json", "vitimas": "vitimas.json", "eventos": "eventos.json",
    "analisesF2": "analises-f2.json", "qualificacoes": "qualificacoes.json", "pistas": "pistas.json",
    "taloes": "taloes.json", "atribuicoes": "atribuicoes.json", "historicosV7": "historicos-v7.json",
    "producaoDiaria": "producao-diaria.json",
}


def ler(caminho: Path, padrao):
    if not caminho.exists():
        return padrao
    valor = json.loads(caminho.read_text(encoding="utf-8-sig"))
    if not isinstance(valor, type(padrao)):
        raise RuntimeError(f"Formato inválido: {caminho}")
    return valor


def migrar(origem: Path, destino: Path) -> dict[str, int | str]:
    repositorio = JsonStorageRepository(destino)
    for colecao, nome in LISTAS.items():
        repositorio.save_list(colecao, ler(origem / "dados" / nome, []))
    metadados = ler(origem / "dados" / "metadados.json", {})
    metadados["schemaVersion"] = SCHEMA_VERSION
    metadados["databaseVersion"] = 2
    metadados["source"] = "MIGRACAO_JSON_PARA_SQLITE"
    metadados["dataRootEsperado"] = str(destino)
    repositorio.save_object("metadados", metadados)
    producao = ler(origem / "dados" / "consulta" / "producao-consolidada" / "producao-consolidada.json", {})
    repositorio.save_object("producaoConsolidada", producao)
    resultado = {colecao: len(repositorio.load_list(colecao)) for colecao in LISTAS}
    resultado["producaoMensal"] = len(producao.get("resumoMensal", []))
    resultado["banco"] = str(repositorio.database_path)
    repositorio.close()
    return resultado


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--origem", type=Path, required=True)
    parser.add_argument("--destino", type=Path, required=True)
    args = parser.parse_args()
    print(json.dumps(migrar(args.origem.resolve(), args.destino.resolve()), ensure_ascii=False, indent=2))
