#!/usr/bin/env python3
"""Atualiza os casos F2 de 18 a 20/08/2026 sem concluir o desfecho."""
from __future__ import annotations

import argparse
import json
import shutil
import sqlite3
from datetime import datetime, timezone
from pathlib import Path


BASE = Path(__file__).resolve().parents[1]
MANIFEST = BASE / "data" / "imports" / "f2-atualizacao-18-20-ago-2026.json"
FONTE_RELATORIO = "relatorio-cabine-verde-atual.xlsx"
INDICADORES = {
    "periodo": "22ABR26-20AGO26",
    "dias_trabalhados": 82,
    "localizadas_total": 223,
    "localizadas_cabine": 86,
    "localizadas_vtr": 70,
    "localizadas_vulto_outros": 29,
    "localizadas_preso": 23,
    "localizadas_obito": 15,
    "procedimentos_total": 13784,
    "fonte": "1p7Q-ZCYr6JA2mLBF1_7s6XgW8_MA-cT9",
}

LOCALIZACOES_RECENTES = [
    ("270", "2026-08-19", "10767/12348", "VANDERLEI DAMICO DA SILVA, 43 ANOS", "MURALHA PAULISTA"),
    ("271", "2026-08-20", "2066 / 3304", "ALICE MARIA VIANA SILVA, 14 ANOS", "MURALHA PAULISTA"),
    ("272", "2026-08-20", "13913", "LEANDRO FERREIRA GUIMARÃES, 18 ANOS", "MURALHA PAULISTA"),
    ("273", "2026-08-20", "6617", "ANTONIO VILANOVA CASTELO BRANCO DA CRUZ JUNIOR, 42 ANOS", "LOCALIZADO MORTO"),
    ("274", "2026-08-20", "12190 / 11794", "JOAQUIM CATARDO, 71 ANOS", "LOCALIZADA -VTR"),
]


def backup(caminho: Path) -> Path:
    destino = caminho.with_name(f"{caminho.name}.backup-antes-f2-20260824")
    if not destino.exists():
        shutil.copy2(caminho, destino)
    return destino


def atualizar(caminho: Path) -> dict[str, int | str]:
    caminho = caminho.resolve()
    if not caminho.exists():
        raise FileNotFoundError(caminho)
    copia = backup(caminho)
    registros = json.loads(MANIFEST.read_text(encoding="utf-8"))
    agora = datetime.now(timezone.utc).isoformat()
    conexao = sqlite3.connect(caminho)
    inseridos = 0
    existentes = 0
    localizacoes = 0
    try:
        conexao.execute("BEGIN")
        for registro in registros:
            origem = f"f2-atualizacao-18-20-ago-2026.json::{registro['sheet']}"
            linha = int(registro["linha_origem"])
            nome = str(registro["nome"]).strip()
            talao = str(registro["talao"]).strip()
            existente = conexao.execute(
                "SELECT id_caso FROM casos WHERE origem_arquivo = ? AND linha_origem = ?",
                (origem, linha),
            ).fetchone()
            if existente:
                existentes += 1
                continue
            duplicado = conexao.execute(
                "SELECT id_caso FROM casos WHERE talao_pm = ? AND nome_desaparecido = ? LIMIT 1",
                (talao, nome),
            ).fetchone()
            if duplicado:
                existentes += 1
                continue
            id_caso = f"LEGADO-F2-{registro['sheet']}-{linha}"
            dados = {
                "idCaso": id_caso,
                "dataHoraRegistro": registro["data"],
                "dataServico": registro["data"],
                "talaoPMESP": talao,
                "talaoBopm": talao,
                "nomeCompletoDesaparecido": nome,
                "documento": registro["documento"],
                "nomeSolicitante": registro["nomeSolicitante"],
                "telefoneSolicitante": registro["telefoneSolicitante"],
                "observacoesOperacionais": registro["observacao"],
                "operadorOrigem": registro["operador"],
                "statusOrigem": registro["statusOrigem"],
                "statusCaso": "Em triagem",
                "localizado": False,
                "encerrado190": False,
                "origemImportacao": origem,
            }
            conexao.execute(
                """INSERT INTO casos
                (id_caso, talao_pm, nome_desaparecido, status_caso, status_migracao,
                 origem_arquivo, linha_origem, dados_json, bruto_json, importado_em)
                VALUES (?, ?, ?, 'Em triagem', 'MIGRADO', ?, ?, ?, ?, ?)""",
                (
                    id_caso,
                    talao,
                    nome,
                    origem,
                    linha,
                    json.dumps(dados, ensure_ascii=False),
                    json.dumps(registro, ensure_ascii=False),
                    agora,
                ),
            )
            inseridos += 1

        for linha, data, talao, nome, categoria in LOCALIZACOES_RECENTES:
            dados = {
                "linha_origem": linha,
                "numero": "",
                "data": data,
                "talao": talao,
                "nome": nome,
                "idade": "",
                "sexo": "",
                "resultado": "Localizado vivo",
                "recurso": "Cabine Verde" if "MURALHA" in categoria else "Viatura",
                "exclusiva": "Sim" if "MURALHA" in categoria else "Não",
                "categoria": categoria,
                "como_encontrada": "",
                "onde_encontrada": "",
                "acoes_busca": "",
                "autorizacao": "",
                "recusa": "",
                "incompleto": "0",
            }
            cursor = conexao.execute(
                """INSERT OR REPLACE INTO localizacoes_legado
                (dados_json, origem_arquivo, linha_origem, incompleto)
                VALUES (?, ?, ?, 0)""",
                (json.dumps(dados, ensure_ascii=False), FONTE_RELATORIO, int(linha)),
            )
            localizacoes += int(cursor.rowcount > 0)

        row = conexao.execute("SELECT id FROM indicadores_producao_legado ORDER BY id DESC LIMIT 1").fetchone()
        valores = (
            INDICADORES["periodo"], INDICADORES["dias_trabalhados"],
            INDICADORES["localizadas_total"], INDICADORES["localizadas_cabine"],
            INDICADORES["localizadas_vtr"], INDICADORES["localizadas_vulto_outros"],
            INDICADORES["localizadas_preso"], INDICADORES["localizadas_obito"],
            INDICADORES["procedimentos_total"], INDICADORES["fonte"], agora,
        )
        if row:
            conexao.execute(
                """UPDATE indicadores_producao_legado SET periodo=?, dias_trabalhados=?,
                localizadas_total=?, localizadas_cabine=?, localizadas_vtr=?,
                localizadas_vulto_outros=?, localizadas_preso=?, localizadas_obito=?,
                procedimentos_total=?, fonte=?, incompleto=1, importado_em=? WHERE id=?""",
                (*valores, row[0]),
            )
        else:
            conexao.execute(
                """INSERT INTO indicadores_producao_legado
                (periodo,dias_trabalhados,localizadas_total,localizadas_cabine,
                 localizadas_vtr,localizadas_vulto_outros,localizadas_preso,
                 localizadas_obito,procedimentos_total,fonte,incompleto,importado_em)
                VALUES (?,?,?,?,?,?,?,?,?,?,1,?)""",
                valores,
            )
        conexao.commit()
    except Exception:
        conexao.rollback()
        raise
    finally:
        conexao.close()
    return {
        "banco": str(caminho),
        "backup": str(copia),
        "casos_inseridos": inseridos,
        "casos_ja_existentes": existentes,
        "localizacoes_atualizadas": localizacoes,
        "indicador_total": 223,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--database", action="append", type=Path, required=True)
    args = parser.parse_args()
    print(json.dumps([atualizar(caminho) for caminho in args.database], ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
