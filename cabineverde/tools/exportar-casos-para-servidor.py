import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
BANCO = BASE / "dados" / "cabine-verde.sqlite"
DESTINO = BASE / "release" / "Cabine-Verde-Servidor" / "dados" / "ocorrencias.json"
DESTINO.parent.mkdir(parents=True, exist_ok=True)

conexao = sqlite3.connect(BANCO)
conexao.row_factory = sqlite3.Row
ocorrencias = []
for registro in conexao.execute("SELECT * FROM casos ORDER BY importado_em"):
    try:
        dados = json.loads(registro["dados_json"] or "{}")
    except json.JSONDecodeError:
        dados = {}
    ocorrencias.append({
        "id": registro["id_caso"],
        "idCaso": registro["id_caso"],
        "talao_pm": registro["talao_pm"] or dados.get("talaoBopm", ""),
        "nome": registro["nome_desaparecido"] or dados.get("nomeCompletoDesaparecido", "Sem nome"),
        "status": registro["status_caso"] or dados.get("statusCaso", "Em triagem"),
        "statusMigracao": registro["status_migracao"],
        "dados": dados,
        "migradoEm": datetime.now(timezone.utc).isoformat(),
    })
conexao.close()
DESTINO.write_text(json.dumps(ocorrencias, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Exportadas {len(ocorrencias)} ocorrências para {DESTINO}")
