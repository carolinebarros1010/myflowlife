import json
import sqlite3
from datetime import datetime, timezone

fonte = 'data/imports/casos-google-cabine-verde.json'
registros = json.loads(open(fonte, encoding='utf-8').read())
banco = sqlite3.connect('data/cabine-verde.sqlite')
atualizados = 0
for registro in registros:
    id_caso = str(registro.get('idCaso') or '').strip()
    if not id_caso:
        continue
    nome = str(registro.get('nomeCompletoDesaparecido') or '').strip()
    talao = str(registro.get('talaoBopm') or '').strip()
    status = str(registro.get('statusCaso') or 'LEGADO').strip() or 'LEGADO'
    dados = {**registro, 'idCaso': id_caso, 'talaoPMESP': talao}
    cursor = banco.execute(
        "UPDATE casos SET talao_pm=?, nome_desaparecido=?, status_caso=?, status_migracao=?, dados_json=?, bruto_json=?, origem_arquivo=?, importado_em=? WHERE id_caso=? AND json_extract(dados_json, '$.novoCasoLocal') IS NOT 1",
        (talao, nome, status, 'MIGRADO' if talao and nome else 'INCOMPLETO', json.dumps(dados, ensure_ascii=False), json.dumps(registro, ensure_ascii=False), fonte, datetime.now(timezone.utc).isoformat(), id_caso),
    )
    atualizados += cursor.rowcount
banco.commit()
banco.close()
print(atualizados)
