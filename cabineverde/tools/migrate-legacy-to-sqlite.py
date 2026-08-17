#!/usr/bin/env python3
"""Importa exportações legadas da Cabine Verde para um banco SQLite local.

Entrada: arquivos .csv ou .json exportados das abas/coleções legadas.
Saída: banco SQLite com dados normalizados e o registro bruto preservado.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import sqlite3
import unicodedata
import zipfile
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ALIASES = {
    "idCaso": ["idCaso", "id", "codigoCaso", "ID Caso", "Código Caso"],
    "talaoPMESP": ["talaoPMESP", "talaoBopm", "talaoBOPM", "talão", "talao", "numeroTalao"],
    "nomeCompletoDesaparecido": ["nomeCompletoDesaparecido", "nome", "nomeDesaparecido", "Nome"],
    "statusCaso": ["statusCaso", "status", "Status"],
    "observacoesOperacionais": ["observacoesOperacionais", "observacoes", "observacao", "obsOperacional"],
}


def normalizar_chave(valor: Any) -> str:
    texto = unicodedata.normalize("NFKD", str(valor or ""))
    texto = "".join(c for c in texto if not unicodedata.combining(c))
    return "".join(c for c in texto.lower() if c.isalnum())


def texto(valor: Any) -> str:
    return str(valor or "").strip()


def valor_mapeado(registro: dict[str, Any], campo: str) -> str:
    por_chave = {normalizar_chave(k): v for k, v in registro.items()}
    for alias in ALIASES.get(campo, [campo]):
        valor = texto(por_chave.get(normalizar_chave(alias), ""))
        if valor:
            return valor
    return ""


def ler_arquivo(caminho: Path) -> list[dict[str, Any]]:
    if caminho.suffix.lower() == ".json":
        dados = json.loads(caminho.read_text(encoding="utf-8-sig"))
        if isinstance(dados, dict):
            if isinstance(dados.get("payload"), dict):
                return [dados["payload"]]
            for chave in ("data", "rows", "registros", "casos"):
                if isinstance(dados.get(chave), list):
                    dados = dados[chave]
                    break
        if not isinstance(dados, list):
            raise ValueError(f"JSON precisa conter uma lista: {caminho.name}")
        return [item if isinstance(item, dict) else {"valor": item} for item in dados]

    with caminho.open("r", encoding="utf-8-sig", newline="") as arquivo:
        amostra = arquivo.read(4096)
        arquivo.seek(0)
        dialeto = csv.Sniffer().sniff(amostra, delimiters=";,\t,")
        return [dict(linha) for linha in csv.DictReader(arquivo, dialect=dialeto)]


def ler_xlsx(caminho: Path) -> list[tuple[str, list[dict[str, Any]]]]:
    try:
        from openpyxl import load_workbook
    except ImportError:
        return ler_xlsx_sem_dependencias(caminho)
    workbook = load_workbook(caminho, read_only=True, data_only=True)
    resultado: list[tuple[str, list[dict[str, Any]]]] = []
    for planilha in workbook.worksheets:
        linhas = planilha.iter_rows(values_only=True)
        cabecalho_bruto = next(linhas, None)
        if not cabecalho_bruto:
            continue
        cabecalho = [texto(valor) for valor in cabecalho_bruto]
        cabecalho = [valor or f"coluna_{indice + 1}" for indice, valor in enumerate(cabecalho)]
        registros = []
        for linha in linhas:
            if not any(valor not in (None, "") for valor in linha):
                continue
            registros.append({cabecalho[indice]: valor for indice, valor in enumerate(linha) if indice < len(cabecalho)})
        resultado.append((planilha.title, registros))
    workbook.close()
    return resultado


def ler_xlsx_sem_dependencias(caminho: Path) -> list[tuple[str, list[dict[str, Any]]]]:
    """Le XLSX simples usando apenas a biblioteca padrão do Python."""
    ns = {"main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main", "rel": "http://schemas.openxmlformats.org/officeDocument/2006/relationships", "pkg": "http://schemas.openxmlformats.org/package/2006/relationships"}
    with zipfile.ZipFile(caminho) as arquivo:
        shared = []
        if "xl/sharedStrings.xml" in arquivo.namelist():
            raiz = ET.fromstring(arquivo.read("xl/sharedStrings.xml"))
            for item in raiz.findall("main:si", ns):
                shared.append("".join(no.text or "" for no in item.iter(f"{{{ns['main']}}}t")))
        rel_root = ET.fromstring(arquivo.read("xl/_rels/workbook.xml.rels"))
        rels = {item.attrib["Id"]: item.attrib["Target"] for item in rel_root.findall("pkg:Relationship", ns)}
        workbook = ET.fromstring(arquivo.read("xl/workbook.xml"))
        resultado = []
        for sheet in workbook.findall("main:sheets/main:sheet", ns):
            nome = sheet.attrib["name"]
            target = rels[sheet.attrib[f"{{{ns['rel']}}}id"]]
            caminho_xml = target if target.startswith("xl/") else f"xl/{target}"
            raiz = ET.fromstring(arquivo.read(caminho_xml))
            linhas: dict[int, dict[int, Any]] = {}
            for linha in raiz.findall(".//main:sheetData/main:row", ns):
                numero = int(linha.attrib.get("r", "1"))
                valores: dict[int, Any] = {}
                for celula in linha.findall("main:c", ns):
                    referencia = celula.attrib.get("r", "A1")
                    coluna = 0
                    for caractere in referencia:
                        if caractere.isalpha():
                            coluna = coluna * 26 + ord(caractere.upper()) - 64
                    tipo = celula.attrib.get("t")
                    valor_no = celula.find("main:v", ns)
                    valor = valor_no.text if valor_no is not None else ""
                    if tipo == "s" and valor:
                        valor = shared[int(valor)]
                    elif tipo == "inlineStr":
                        valor = "".join(no.text or "" for no in celula.iter(f"{{{ns['main']}}}t"))
                    valores[coluna] = valor
                if valores:
                    linhas[numero] = valores
            if not linhas:
                continue
            cabecalho = linhas[min(linhas)]
            nomes = {indice: texto(valor) or f"coluna_{indice}" for indice, valor in cabecalho.items()}
            registros = []
            for numero in sorted(linhas):
                if numero == min(linhas):
                    continue
                registro = {nomes.get(indice, f"coluna_{indice}"): valor for indice, valor in linhas[numero].items()}
                if any(texto(valor) for valor in registro.values()):
                    registros.append(registro)
            resultado.append((nome, registros))
    return resultado


def criar_schema(conexao: sqlite3.Connection) -> None:
    conexao.executescript(
        """
        PRAGMA foreign_keys = ON;
        CREATE TABLE IF NOT EXISTS casos (
          id_caso TEXT PRIMARY KEY,
          talao_pm TEXT,
          nome_desaparecido TEXT,
          status_caso TEXT NOT NULL DEFAULT 'LEGADO',
          status_migracao TEXT NOT NULL,
          origem_arquivo TEXT NOT NULL,
          linha_origem INTEGER NOT NULL,
          dados_json TEXT NOT NULL,
          bruto_json TEXT NOT NULL,
          importado_em TEXT NOT NULL,
          UNIQUE(origem_arquivo, linha_origem)
        );
        CREATE TABLE IF NOT EXISTS legado_observacoes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          id_caso TEXT NOT NULL,
          origem_arquivo TEXT NOT NULL,
          campo_origem TEXT NOT NULL,
          hash_observacao TEXT NOT NULL,
          texto_bruto TEXT NOT NULL,
          UNIQUE(id_caso, campo_origem, hash_observacao)
        );
        CREATE TABLE IF NOT EXISTS eventos_caso (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          id_caso TEXT NOT NULL,
          dados_json TEXT NOT NULL,
          origem_arquivo TEXT NOT NULL,
          linha_origem INTEGER NOT NULL,
          UNIQUE(origem_arquivo, linha_origem)
        );
        CREATE TABLE IF NOT EXISTS indicadores_operacionais (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          id_caso TEXT NOT NULL,
          dados_json TEXT NOT NULL,
          origem_arquivo TEXT NOT NULL,
          linha_origem INTEGER NOT NULL,
          UNIQUE(origem_arquivo, linha_origem)
        );
        CREATE TABLE IF NOT EXISTS fotos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          id_caso TEXT NOT NULL,
          dados_json TEXT NOT NULL,
          origem_arquivo TEXT NOT NULL,
          linha_origem INTEGER NOT NULL,
          UNIQUE(origem_arquivo, linha_origem)
        );
        CREATE TABLE IF NOT EXISTS dados_auxiliares (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          aba TEXT NOT NULL,
          dados_json TEXT NOT NULL,
          origem_arquivo TEXT NOT NULL,
          linha_origem INTEGER NOT NULL,
          UNIQUE(origem_arquivo, linha_origem)
        );
        CREATE TABLE IF NOT EXISTS migracoes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          executada_em TEXT NOT NULL,
          modo TEXT NOT NULL,
          arquivos INTEGER NOT NULL,
          linhas_lidas INTEGER NOT NULL,
          casos_importados INTEGER NOT NULL,
          incompletos INTEGER NOT NULL,
          duplicados INTEGER NOT NULL,
          erros INTEGER NOT NULL,
          relatorio_json TEXT NOT NULL
        );
        """
    )


def categoria(caminho: Path) -> str:
    nome = normalizar_chave(caminho.stem)
    if "foto" in nome:
        return "fotos"
    if "legadoobservacoes" in nome:
        return "legado_observacoes"
    if "evento" in nome:
        return "eventos_caso"
    if "indicador" in nome:
        return "indicadores_operacionais"
    if nome in {"triagemrespostas", "qualidadedados", "logs", "logauditoria", "historicoedicoes", "auditoriaconsultas", "operadores", "logacesso", "logmigracao", "validacaomigracao"}:
        return "dados_auxiliares"
    return "casos"


def importar(input_dir: Path, output: Path, dry_run: bool) -> dict[str, Any]:
    if not input_dir.exists():
        raise FileNotFoundError(f"Pasta de entrada não encontrada: {input_dir}. Exporte os CSV/JSON legados para uma pasta existente e tente novamente.")
    if not input_dir.is_dir():
        raise NotADirectoryError(f"O caminho de entrada não é uma pasta: {input_dir}")
    arquivos = sorted(p for p in input_dir.iterdir() if p.suffix.lower() in {".csv", ".json", ".xlsx"} and p.name.lower() not in {"appsscript.json", "package.json", "tsconfig.json"})
    agora = datetime.now(timezone.utc).isoformat()
    relatorio = {"arquivos": len(arquivos), "linhas_lidas": 0, "casos_importados": 0, "incompletos": 0, "duplicados": 0, "erros": 0, "detalhes": []}
    if dry_run:
        conexao = sqlite3.connect(":memory:")
    else:
        output.parent.mkdir(parents=True, exist_ok=True)
        conexao = sqlite3.connect(output)
    criar_schema(conexao)

    try:
        for caminho in arquivos:
            try:
                fontes = ler_xlsx(caminho) if caminho.suffix.lower() == ".xlsx" else [(caminho.stem, ler_arquivo(caminho))]
            except Exception as erro:
                relatorio["erros"] += 1
                relatorio["detalhes"].append({"arquivo": caminho.name, "erro": str(erro)})
                continue
            for nome_fonte, registros in fontes:
                tipo = categoria(Path(nome_fonte))
                for numero, registro in enumerate(registros, start=2):
                    relatorio["linhas_lidas"] += 1
                    bruto = json.dumps(registro, ensure_ascii=False, default=str, sort_keys=True)
                    origem = f"{caminho.name}::{nome_fonte}" if caminho.suffix.lower() == ".xlsx" else caminho.name
                    if tipo == "legado_observacoes":
                        id_legado = valor_mapeado(registro, "idCaso") or texto(registro.get("idCaso")) or f"SEM-ID-{nome_fonte}-{numero}"
                        bruto_legado = texto(registro.get("conteudoBruto") or registro.get("textoBruto") or registro.get("observacoesOperacionais"))
                        if bruto_legado:
                            digest = hashlib.sha256(bruto_legado.encode("utf-8")).hexdigest()[:32]
                            conexao.execute("INSERT OR IGNORE INTO legado_observacoes(id_caso, origem_arquivo, campo_origem, hash_observacao, texto_bruto) VALUES (?, ?, ?, ?, ?)", (id_legado, origem, nome_fonte, digest, bruto_legado))
                        continue
                    if tipo in {"fotos", "dados_auxiliares"}:
                        tabela = tipo
                        id_auxiliar = valor_mapeado(registro, "idCaso") or f"SEM-ID-{nome_fonte}-{numero}"
                        if tipo == "fotos":
                            conexao.execute("INSERT OR IGNORE INTO fotos(id_caso, dados_json, origem_arquivo, linha_origem) VALUES (?, ?, ?, ?)", (id_auxiliar, bruto, origem, numero))
                        else:
                            conexao.execute("INSERT OR IGNORE INTO dados_auxiliares(aba, dados_json, origem_arquivo, linha_origem) VALUES (?, ?, ?, ?)", (nome_fonte, bruto, origem, numero))
                        continue
                    if tipo != "casos":
                        tabela = tipo
                        try:
                            conexao.execute(f"INSERT OR IGNORE INTO {tabela}(id_caso, dados_json, origem_arquivo, linha_origem) VALUES (?, ?, ?, ?)", (valor_mapeado(registro, "idCaso") or f"SEM-ID-{nome_fonte}-{numero}", bruto, origem, numero))
                        except sqlite3.Error as erro:
                            relatorio["erros"] += 1
                            relatorio["detalhes"].append({"arquivo": origem, "linha": numero, "erro": str(erro)})
                        continue

                    id_caso = valor_mapeado(registro, "idCaso") or f"LEGADO-{nome_fonte}-{numero}"
                    talao = valor_mapeado(registro, "talaoPMESP")
                    nome = valor_mapeado(registro, "nomeCompletoDesaparecido")
                    status = valor_mapeado(registro, "statusCaso") or "LEGADO"
                    status_migracao = "MIGRADO" if talao and nome else "INCOMPLETO"
                    try:
                        cursor = conexao.execute(
                            "INSERT OR IGNORE INTO casos(id_caso, talao_pm, nome_desaparecido, status_caso, status_migracao, origem_arquivo, linha_origem, dados_json, bruto_json, importado_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                            (id_caso, talao, nome, status, status_migracao, origem, numero, json.dumps({**registro, "idCaso": id_caso, "talaoPMESP": talao}, ensure_ascii=False, default=str), bruto, agora),
                        )
                        if cursor.rowcount == 0:
                            relatorio["duplicados"] += 1
                        else:
                            relatorio["casos_importados"] += 1
                            relatorio["incompletos"] += status_migracao == "INCOMPLETO"
                        observacao = valor_mapeado(registro, "observacoesOperacionais")
                        if observacao:
                            digest = hashlib.sha256(observacao.encode("utf-8")).hexdigest()[:32]
                            conexao.execute("INSERT OR IGNORE INTO legado_observacoes(id_caso, origem_arquivo, campo_origem, hash_observacao, texto_bruto) VALUES (?, ?, ?, ?, ?)", (id_caso, origem, "observacoesOperacionais", digest, observacao))
                    except sqlite3.Error as erro:
                        relatorio["erros"] += 1
                        relatorio["detalhes"].append({"arquivo": origem, "linha": numero, "erro": str(erro)})
        relatorio["incompletos"] = int(relatorio["incompletos"])
        if dry_run:
            conexao.rollback()
        else:
            conexao.execute("INSERT INTO migracoes(executada_em, modo, arquivos, linhas_lidas, casos_importados, incompletos, duplicados, erros, relatorio_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", (agora, "DRY_RUN" if dry_run else "EXECUTADA", relatorio["arquivos"], relatorio["linhas_lidas"], relatorio["casos_importados"], relatorio["incompletos"], relatorio["duplicados"], relatorio["erros"], json.dumps(relatorio, ensure_ascii=False)))
            conexao.commit()
    finally:
        conexao.close()
    return relatorio


def main() -> None:
    parser = argparse.ArgumentParser(description="Migra legado da Cabine Verde para SQLite local")
    parser.add_argument("input", type=Path, help="pasta com CSV/JSON exportados")
    parser.add_argument("--output", type=Path, default=Path("data/cabine-verde.sqlite"), help="arquivo SQLite de saída")
    parser.add_argument("--dry-run", action="store_true", help="valida sem gravar o banco")
    args = parser.parse_args()
    try:
        resultado = importar(args.input, args.output, args.dry_run)
    except (FileNotFoundError, NotADirectoryError) as erro:
        parser.error(str(erro))
    print(json.dumps(resultado, ensure_ascii=False, indent=2))
    raise SystemExit(1 if resultado["erros"] else 0)


if __name__ == "__main__":
    main()
