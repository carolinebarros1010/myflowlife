#!/usr/bin/env python3
"""Reconstrói os casos locais a partir das abas diárias da planilha F2.

As abas têm um cabeçalho operacional fixo nas colunas A:K. A migração não
assume que os rótulos do cabeçalho estejam repetidos corretamente em todas as
abas: usa a posição dos campos, preserva cada linha em eventos_caso e
consolida o caso por talão + nome.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sqlite3
import unicodedata
from collections import Counter, defaultdict
from datetime import date, datetime
from pathlib import Path

from openpyxl import load_workbook


PADRAO_ABA = re.compile(r"^\s*\d{2}(ABR|MAI|JUN|JUL|AGO|SET)26\s*$", re.IGNORECASE)
MESES = {"ABR": 4, "MAI": 5, "JUN": 6, "JUL": 7, "AGO": 8, "SET": 9}
PLACEHOLDERS = {"", "NAN", "NAT", "AGUILERA", "REIS", "SANDRO", "MEANA"}


def texto(valor: object) -> str:
    if valor is None:
        return ""
    if isinstance(valor, float) and valor.is_integer():
        return str(int(valor))
    if isinstance(valor, (datetime, date)):
        return valor.isoformat()
    return str(valor).strip()


def normalizar(valor: object) -> str:
    base = unicodedata.normalize("NFKD", texto(valor).upper())
    sem_acento = "".join(c for c in base if not unicodedata.combining(c))
    return re.sub(r"\s+", " ", sem_acento).strip()


def data_iso(valor: object, fallback: str) -> str:
    if isinstance(valor, datetime):
        return valor.date().isoformat()
    if isinstance(valor, date):
        return valor.isoformat()
    encontrado = re.search(r"(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})", texto(valor))
    if encontrado:
        dia, mes, ano = encontrado.groups()
        ano = f"20{ano}" if len(ano) == 2 else ano
        return f"{int(ano):04d}-{int(mes):02d}-{int(dia):02d}"
    return fallback


def data_aba(nome: str) -> str:
    match = re.match(r"^\s*(\d{2})(ABR|MAI|JUN|JUL|AGO|SET)26\s*$", nome, re.IGNORECASE)
    if not match:
        return ""
    return date(2026, MESES[match.group(2).upper()], int(match.group(1))).isoformat()


def status_operacional(obs_e: str, obs_i: str, status_j: str, solicitante: str, telefone: str) -> str:
    evidencias = normalizar(" ".join((status_j, obs_e, obs_i)))
    negativa = any(padrao in evidencias for padrao in ("NAO LOCALIZ", "NAO ENCONTR", "AINDA DESAPARECID"))
    if any(palavra in evidencias for palavra in ("MORT", "OBITO", "FALECID")):
        return "LOCALIZADO_SEM_VIDA"
    if any(palavra in evidencias for palavra in ("PRESO", "PRISAO", "CADEIA", "DETID")):
        return "LOCALIZADO_CUSTODIA"
    if not negativa and any(palavra in evidencias for palavra in ("LOCALIZ", "ENCONTRAD", "ACHAD", "LOC. PELA")):
        return "LOCALIZADO"
    if obs_e or obs_i or solicitante or telefone:
        return "Em triagem"
    return "Em andamento"


def chave_caso(talao: str, nome: str, documento: str, aba: str, linha: int) -> str:
    talao_normalizado = normalizar(talao)
    nome_normalizado = normalizar(nome)
    documento_normalizado = normalizar(documento)
    base = f"{talao_normalizado}|{nome_normalizado}|{documento_normalizado}"
    if not talao_normalizado and not documento_normalizado:
        base = f"{nome_normalizado}|{aba}|{linha}"
    return base


def ler_linhas(planilha: Path) -> list[dict[str, object]]:
    workbook = load_workbook(planilha, read_only=True, data_only=True)
    linhas: list[dict[str, object]] = []
    try:
        for nome_aba in workbook.sheetnames:
            if not PADRAO_ABA.match(nome_aba):
                continue
            data_padrao = data_aba(nome_aba)
            aba = workbook[nome_aba]
            for numero_linha, valores in enumerate(aba.iter_rows(min_row=8, values_only=True), start=8):
                valores = list(valores)
                nome = texto(valores[3] if len(valores) > 3 else "")
                nome_normalizado = normalizar(nome)
                if not nome or nome.startswith("*") or nome_normalizado in PLACEHOLDERS:
                    continue
                registro = {
                    "aba": nome_aba.strip(),
                    "linha": numero_linha,
                    "data": data_iso(valores[0] if valores else "", data_padrao),
                    "talao": texto(valores[1] if len(valores) > 1 else ""),
                    "documento": texto(valores[2] if len(valores) > 2 else ""),
                    "nome": nome,
                    "observacao": texto(valores[4] if len(valores) > 4 else ""),
                    "data_contato": data_iso(valores[5] if len(valores) > 5 else "", data_padrao),
                    "solicitante": texto(valores[6] if len(valores) > 6 else ""),
                    "telefone": texto(valores[7] if len(valores) > 7 else ""),
                    "observacao_contato": texto(valores[8] if len(valores) > 8 else ""),
                    "status_fonte": texto(valores[9] if len(valores) > 9 else ""),
                    "operador": texto(valores[10] if len(valores) > 10 else ""),
                }
                registro["status"] = status_operacional(
                    str(registro["observacao"]), str(registro["observacao_contato"]),
                    str(registro["status_fonte"]), str(registro["solicitante"]), str(registro["telefone"]),
                )
                registro["chave"] = chave_caso(
                    str(registro["talao"]), str(registro["nome"]), str(registro["documento"]), nome_aba, numero_linha,
                )
                linhas.append(registro)
    finally:
        workbook.close()
    return linhas


def migrar(planilha: Path, banco: Path) -> dict[str, object]:
    linhas = ler_linhas(planilha)
    agrupados: dict[str, list[dict[str, object]]] = defaultdict(list)
    for linha in linhas:
        agrupados[str(linha["chave"])].append(linha)

    conexao = sqlite3.connect(banco, timeout=60)
    conexao.execute("PRAGMA busy_timeout=60000")
    agora = datetime.now().astimezone().isoformat()
    try:
        conexao.execute("BEGIN IMMEDIATE")
        # Mantém somente casos criados/corrigidos durante a operação local.
        conexao.execute("DELETE FROM casos WHERE origem_arquivo <> 'OPERACAO_LOCAL'")
        conexao.execute("DELETE FROM eventos_caso WHERE origem_arquivo LIKE 'Planilha de Dados F2 CABINE VERDE ABRIL.xlsx%'")

        inserir_caso = conexao.execute
        for chave, itens in agrupados.items():
            itens.sort(key=lambda item: (str(item["data"]), str(item["aba"]), int(item["linha"])))
            ultimo = itens[-1]
            localizados = [item for item in itens if str(item["status"]).startswith("LOCALIZADO")]
            status = str(localizados[-1]["status"] if localizados else ultimo["status"])
            id_caso = f"F2-{hashlib.sha1(chave.encode('utf-8')).hexdigest()[:12].upper()}"
            dados = {
                "idCaso": id_caso,
                "dataServico": ultimo["data"],
                "talaoPMESP": ultimo["talao"],
                "talaoBopm": ultimo["talao"],
                "documento": ultimo["documento"],
                "nomeCompletoDesaparecido": ultimo["nome"],
                "nomeSolicitante": ultimo["solicitante"],
                "telefoneSolicitante": ultimo["telefone"],
                "observacoesOperacionais": "\n\n".join(filter(None, (str(ultimo["observacao"]), str(ultimo["observacao_contato"]))))[-12000:],
                "operadorResponsavel": ultimo["operador"],
                "statusFonte": ultimo["status_fonte"],
                "statusCaso": status,
                "statusAtendimento": status if status.startswith("LOCALIZADO") else status,
                "localizado": status.startswith("LOCALIZADO"),
                "finalizado": status.startswith("LOCALIZADO"),
                "origemImportacao": planilha.name,
                "abasOrigem": sorted({str(item["aba"]) for item in itens}),
                "linhasOrigem": len(itens),
            }
            origem = f"{planilha.name}::{ultimo['aba']}"
            inserir_caso(
                "INSERT OR REPLACE INTO casos (id_caso,talao_pm,nome_desaparecido,status_caso,status_migracao,origem_arquivo,linha_origem,dados_json,bruto_json,importado_em) VALUES (?,?,?,?,?,?,?,?,?,?)",
                (id_caso, str(ultimo["talao"]), str(ultimo["nome"]), status, "PLANILHA_F2", origem, int(ultimo["linha"]), json.dumps(dados, ensure_ascii=False), json.dumps(ultimo, ensure_ascii=False), agora),
            )
            for item in itens:
                evento = {**item, "idCaso": id_caso, "fonteStatus": "PLANILHA_F2"}
                inserir_caso(
                    "INSERT INTO eventos_caso (id_caso,dados_json,origem_arquivo,linha_origem) VALUES (?,?,?,?)",
                    (id_caso, json.dumps(evento, ensure_ascii=False), f"{planilha.name}::{item['aba']}", int(item["linha"])),
                )
        conexao.commit()
    except Exception:
        conexao.rollback()
        raise
    finally:
        conexao.close()

    return {
        "linhas_migradas": len(linhas),
        "casos_consolidados": len(agrupados),
        "status": dict(Counter(str(item["status"]) for item in linhas)),
        "banco": str(banco),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--planilha", type=Path, required=True)
    parser.add_argument("--banco", type=Path, required=True)
    args = parser.parse_args()
    print(json.dumps(migrar(args.planilha.resolve(), args.banco.resolve()), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
