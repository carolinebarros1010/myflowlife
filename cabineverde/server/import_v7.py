"""Importação explícita e idempotente do recorte histórico V7.

Não é executada na inicialização do servidor. Os registros ficam em uma
coleção própria para pesquisa unificada, sem aumentar dados/casos.json.
"""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

try:
    from storage_repository import JsonStorageRepository
except ModuleNotFoundError:
    from server.storage_repository import JsonStorageRepository


def importar(data_root: Path, pacote_v7: Path) -> dict:
    origem = pacote_v7 / "dados" / "casos-historicos-v7.json"
    indicadores = pacote_v7 / "dados" / "indicadores-historicos-v7.json"
    validacao = pacote_v7 / "VALIDACAO.json"
    casos = json.loads(origem.read_text(encoding="utf-8-sig"))["casos"]
    dados_indicadores = json.loads(indicadores.read_text(encoding="utf-8-sig"))
    dados_validacao = json.loads(validacao.read_text(encoding="utf-8-sig"))
    if not isinstance(casos, list) or len(casos) != 213:
        raise RuntimeError("A fonte V7 não contém os 213 casos individualizados esperados.")
    repositorio = JsonStorageRepository(data_root)
    arquivo = repositorio.path_for("historicosV7")
    existentes = repositorio.load_list("historicosV7") if arquivo.exists() else []
    por_id = {str(item.get("idCasoHistorico")): item for item in existentes}
    for caso in casos:
        por_id[str(caso["idCasoHistorico"])] = {**caso, "origemImportacao": "V7_ATRIBUICAO_CAUSAL"}
    repositorio.save_list("historicosV7", list(por_id.values()))
    metadados = repositorio.load_object("metadados")
    metadados["historicoV7"] = {
        "fonte": dados_indicadores.get("fonte", "V7"),
        "dataReferencia": dados_indicadores.get("dataReferencia"),
        "totalAdministrativo": dados_indicadores.get("historicoAdministrativo", {}).get("totalCasos", 214),
        "categoriasAdministrativas": dados_indicadores.get("categoriasAdministrativas", []),
        "validacao": dados_validacao.get("status"),
        "importadoEm": datetime.now(timezone.utc).isoformat(),
    }
    repositorio.save_object("metadados", metadados)
    return {"importados": len(casos), "totalAdministrativo": metadados["historicoV7"]["totalAdministrativo"], "casosCentraisPreservados": len(repositorio.load_list("casos"))}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-root", type=Path, required=True)
    parser.add_argument("--v7-root", type=Path, required=True)
    args = parser.parse_args()
    print(json.dumps(importar(args.data_root, args.v7_root), ensure_ascii=False, indent=2))
