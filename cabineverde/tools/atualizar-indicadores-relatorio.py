from pathlib import Path
import sqlite3

BASE = Path(__file__).resolve().parents[1]
SQL = """CREATE TABLE IF NOT EXISTS indicadores_producao_legado (
  id INTEGER PRIMARY KEY AUTOINCREMENT, periodo TEXT NOT NULL,
  dias_trabalhados INTEGER NOT NULL DEFAULT 0, localizadas_total INTEGER NOT NULL DEFAULT 0,
  localizadas_cabine INTEGER NOT NULL DEFAULT 0, localizadas_vtr INTEGER NOT NULL DEFAULT 0,
  localizadas_vulto_outros INTEGER NOT NULL DEFAULT 0, localizadas_preso INTEGER NOT NULL DEFAULT 0,
  localizadas_obito INTEGER NOT NULL DEFAULT 0, procedimentos_total INTEGER NOT NULL DEFAULT 0,
  fonte TEXT NOT NULL, incompleto INTEGER NOT NULL DEFAULT 1, importado_em TEXT NOT NULL
)"""
VALORES = ("2026-04-22 a 2026-08-14", 77, 206, 78, 67, 25, 23, 13, 13784,
           "Relatório Diário de PRODUÇÃO da CABINE VERDE.xlsx", 1)

for caminho in (BASE / "data" / "cabine-verde.sqlite", BASE / "dados" / "cabine-verde.sqlite"):
    conexao = sqlite3.connect(caminho)
    conexao.execute(SQL)
    conexao.execute("DELETE FROM indicadores_producao_legado")
    conexao.execute("""INSERT INTO indicadores_producao_legado
      (periodo,dias_trabalhados,localizadas_total,localizadas_cabine,localizadas_vtr,
       localizadas_vulto_outros,localizadas_preso,localizadas_obito,procedimentos_total,
       fonte,incompleto,importado_em)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,datetime('now'))""", VALORES)
    conexao.commit()
    conexao.close()
    print(f"Indicadores atualizados: {caminho}")
