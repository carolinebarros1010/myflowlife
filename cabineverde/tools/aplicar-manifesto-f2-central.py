"""Aplica o manifesto F2 na base JSON central, com backup e idempotência."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import unicodedata
from datetime import datetime, timezone
from pathlib import Path


def texto(valor: object) -> str:
    return "" if valor is None else str(valor).strip()


def normalizar(valor: str) -> str:
    sem_acento = "".join(
        c for c in unicodedata.normalize("NFKD", valor.upper())
        if not unicodedata.combining(c)
    )
    return re.sub(r"\s+", " ", sem_acento).strip()


def data_iso(valor: str) -> str:
    encontrado = re.search(r"(\d{4})-(\d{2})-(\d{2})", texto(valor))
    return "-".join(encontrado.groups()) if encontrado else texto(valor)


def carregar(caminho: Path, padrao: object) -> object:
    if not caminho.exists():
        return padrao
    return json.loads(caminho.read_text(encoding="utf-8-sig"))


def id_estavel(registro: dict) -> str:
    origem = f"{registro.get('sheet','')}|{registro.get('linha_origem','')}|{registro.get('nome','')}"
    return f"F2-IMPORT-{hashlib.sha1(origem.encode('utf-8')).hexdigest()[:12].upper()}"


def proximo_id(registros: list[dict], campo: str, prefixo: str) -> str:
    maior = 0
    for item in registros:
        encontrado = re.match(rf"{re.escape(prefixo)}-(\d+)$", texto(item.get(campo)))
        if encontrado:
            maior = max(maior, int(encontrado.group(1)))
    return f"{prefixo}-{maior + 1:05d}"


def salvar(caminho: Path, valor: object) -> None:
    caminho.write_text(json.dumps(valor, ensure_ascii=False, indent=2), encoding="utf-8")


def executar(manifesto: Path, data_root: Path) -> dict[str, int | str]:
    dados = data_root / "dados"
    caminhos = {nome: dados / f"{nome}.json" for nome in ("pessoas", "eventos")}
    caminhos["analises"] = dados / "analises-f2.json"
    caminhos["metadados"] = dados / "metadados.json"
    pessoas = carregar(caminhos["pessoas"], [])
    analises = carregar(caminhos["analises"], [])
    eventos = carregar(caminhos["eventos"], [])
    metadados = carregar(caminhos["metadados"], {})
    if not all(isinstance(valor, list) for valor in (pessoas, analises, eventos)):
        raise RuntimeError("A base central possui coleção JSON inválida")
    if not isinstance(metadados, dict):
        raise RuntimeError("metadados.json inválido")

    existentes = {(texto(item.get("origem", {}).get("aba")), int(item.get("origem", {}).get("linha", 0) or 0)) for item in analises}
    pessoa_por_chave = {}
    for pessoa in pessoas:
        chave = (normalizar(texto(pessoa.get("nomeOriginal") or pessoa.get("nome"))), texto((pessoa.get("documentos") or [""])[0]))
        pessoa_por_chave[chave] = pessoa

    manifesto_registros = carregar(manifesto, [])
    adicionadas = 0
    novas_pessoas = 0
    for item in manifesto_registros:
        if not isinstance(item, dict):
            continue
        origem = (texto(item.get("sheet")), int(item.get("linha_origem", 0) or 0))
        if not origem[0] or origem in existentes:
            continue
        nome = texto(item.get("nome"))
        if not nome:
            continue
        documento = texto(item.get("documento"))
        chave = (normalizar(nome), documento)
        pessoa = pessoa_por_chave.get(chave)
        if pessoa is None:
            pessoa = {
                "idPessoa": proximo_id(pessoas, "idPessoa", "PES"),
                "nomeOriginal": nome,
                "nomeNormalizado": normalizar(nome),
                "documentos": [documento] if documento else [],
                "statusPessoa": "DESAPARECIDO",
                "statusAtendimento": "EM_PESQUISA",
                "situacaoOperacional": "AINDA_DESAPARECIDO",
                "primeiroRegistro": data_iso(texto(item.get("data"))),
                "ultimoRegistro": data_iso(texto(item.get("data"))),
            }
            pessoas.append(pessoa)
            pessoa_por_chave[chave] = pessoa
            novas_pessoas += 1
        identificador = id_estavel(item)
        data_registro = data_iso(texto(item.get("data")))
        talão = texto(item.get("talao"))
        analises.append({
            "idAnaliseF2": identificador,
            "idCaso": None,
            "idPessoa": pessoa["idPessoa"],
            "data": data_registro,
            "nome": nome,
            "documentoRaw": documento,
            "bopmOriginal": talão,
            "taloesEncontrados": talão,
            "statusFonteJ": texto(item.get("statusOrigem")),
            "statusDerivado": "DESAPARECIDO_PRESUMIDO_F2",
            "observacoes": [texto(item.get("observacao"))] if texto(item.get("observacao")) else [],
            "solicitante": texto(item.get("nomeSolicitante")),
            "telefoneSolicitante": texto(item.get("telefoneSolicitante")),
            "operador": texto(item.get("operador")),
            "origem": {"arquivo": manifesto.name, "aba": origem[0], "linha": origem[1]},
        })
        eventos.append({
            "idEvento": identificador,
            "idCaso": None,
            "idPessoa": pessoa["idPessoa"],
            "dataEvento": data_registro,
            "abaOrigem": origem[0],
            "linhaOrigem": origem[1],
            "nomeOriginal": nome,
            "nomeNormalizado": normalizar(nome),
            "documentoRaw": documento,
            "bopmOriginal": talão,
            "taloes": talão,
            "obsE": texto(item.get("observacao")),
            "solicitante": texto(item.get("nomeSolicitante")),
            "telefoneSolicitante": texto(item.get("telefoneSolicitante")),
            "operador": texto(item.get("operador")),
            "tipoEventoOperacional": "ANALISE_F2_IMPORTADA",
            "statusDerivado": "DESAPARECIDO_PRESUMIDO_F2",
            "fonteStatus": "PLANILHA_F2",
        })
        pessoa["ultimoRegistro"] = max(texto(pessoa.get("ultimoRegistro")), data_registro)
        pessoa["ultimoEventoId"] = identificador
        existentes.add(origem)
        adicionadas += 1

    if not adicionadas:
        return {"analisesAdicionadas": 0, "novasPessoas": 0, "mensagem": "Nenhum registro novo"}

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    backup = data_root / "backup" / f"antes-f2-central-{timestamp}"
    backup.mkdir(parents=True, exist_ok=True)
    for caminho in caminhos.values():
        if caminho.exists():
            shutil.copy2(caminho, backup / caminho.name)
    salvar(caminhos["pessoas"], pessoas)
    salvar(caminhos["analises"], analises)
    salvar(caminhos["eventos"], eventos)
    metadados.update({
        "sourceUpdatedAt": datetime.now().isoformat(timespec="seconds"),
        "ultimaImportacaoF2": {"registrosAdicionados": adicionadas, "novasPessoas": novas_pessoas, "backup": str(backup)},
        "totais": {**metadados.get("totais", {}), "pessoas": len(pessoas), "eventos": len(eventos), "analisesF2": len(analises)},
        "totalPessoas": len(pessoas), "totalEventos": len(eventos), "totalAnalisesF2": len(analises),
    })
    salvar(caminhos["metadados"], metadados)
    return {"analisesAdicionadas": adicionadas, "novasPessoas": novas_pessoas, "backup": str(backup)}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifesto", type=Path, required=True)
    parser.add_argument("--data-root", type=Path, required=True)
    args = parser.parse_args()
    print(json.dumps(executar(args.manifesto.resolve(), args.data_root.resolve()), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
