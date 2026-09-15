"""Importa linhas novas da planilha F2 para a base JSON central.

O vínculo por caso só é criado quando já existe na base. Linhas novas sem
idCaso permanecem em pessoas/analises/eventos, preservando a rastreabilidade
da fonte sem inventar uma associação operacional.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import unicodedata
from datetime import date, datetime, timezone
from pathlib import Path

from openpyxl import load_workbook


MESES = {"ABR": 4, "MAI": 5, "JUN": 6, "JUL": 7, "AGO": 8, "SET": 9, "OUT": 10, "NOV": 11, "DEZ": 12}
PADRAO_ABA = re.compile(r"^(\d{2})(ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)26\s*$", re.IGNORECASE)


def texto(valor: object) -> str:
    if valor is None:
        return ""
    if isinstance(valor, float) and valor.is_integer():
        return str(int(valor))
    return str(valor).strip()


def data_iso(valor: object) -> str:
    if isinstance(valor, (datetime, date)):
        return valor.date().isoformat() if isinstance(valor, datetime) else valor.isoformat()
    encontrado = re.search(r"(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})", texto(valor))
    if encontrado:
        dia, mes, ano = encontrado.groups()
        ano = f"20{ano}" if len(ano) == 2 else ano
        return f"{int(ano):04d}-{int(mes):02d}-{int(dia):02d}"
    return texto(valor)


def normalizar(valor: str) -> str:
    decomposto = unicodedata.normalize("NFKD", valor.upper())
    sem_acento = "".join(c for c in decomposto if not unicodedata.combining(c))
    return re.sub(r"\s+", " ", sem_acento).strip()


def status_derivado(obs_e: str, obs_i: str) -> str:
    texto_status = normalizar(f"{obs_e} {obs_i}")
    if "MORT" in texto_status or "OBITO" in texto_status:
        return "LOCALIZADO_MORTO"
    if "LOCALIZ" in texto_status or "ENCONTRAD" in texto_status:
        return "LOCALIZADO"
    if "DESAPARECID" in texto_status:
        return "DESAPARECIDO"
    return "DESAPARECIDO_PRESUMIDO_F2"


def proximo_id(registros: list[dict], campo: str, prefixo: str) -> str:
    maior = 0
    for registro in registros:
        encontrado = re.match(rf"{re.escape(prefixo)}-(\d+)$", texto(registro.get(campo)))
        if encontrado:
            maior = max(maior, int(encontrado.group(1)))
    return f"{prefixo}-{maior + 1:05d}"


def id_f2(aba: str, linha: int, nome: str) -> str:
    base = f"{aba.strip()}|{linha}|{nome}"
    return f"F2-{hashlib.sha1(base.encode('utf-8')).hexdigest()[:12].upper()}"


def carregar(caminho: Path) -> list[dict]:
    return json.loads(caminho.read_text(encoding="utf-8"))


def executar(planilha: Path, data_root: Path, limite: date) -> dict[str, int | str]:
    dados = data_root / "dados"
    caminhos = {
        "analises": dados / "analises-f2.json",
        "eventos": dados / "eventos.json",
        "pessoas": dados / "pessoas.json",
        "metadados": dados / "metadados.json",
    }
    analises = carregar(caminhos["analises"])
    eventos = carregar(caminhos["eventos"])
    pessoas = carregar(caminhos["pessoas"])
    metadados = json.loads(caminhos["metadados"].read_text(encoding="utf-8"))
    origens = {(texto(a.get("origem", {}).get("aba")), int(a.get("origem", {}).get("linha", 0) or 0)) for a in analises}
    pessoa_por_chave = {}
    for pessoa in pessoas:
        chave = (normalizar(texto(pessoa.get("nomeNormalizado") or pessoa.get("nomeOriginal"))), tuple(sorted(texto(x) for x in pessoa.get("documentos", []))))
        pessoa_por_chave[chave] = pessoa
    novas_analises: list[dict] = []
    novos_eventos: list[dict] = []
    novas_pessoas = 0
    wb = load_workbook(planilha, read_only=True, data_only=True)
    try:
        for nome_aba in wb.sheetnames:
            match = PADRAO_ABA.match(nome_aba)
            if not match:
                continue
            dia, mes_abrev = int(match.group(1)), match.group(2).upper()
            data_aba = date(2026, MESES[mes_abrev], dia)
            if data_aba > limite:
                continue
            aba = wb[nome_aba]
            for linha_numero, valores in enumerate(aba.iter_rows(min_row=7, values_only=True), start=7):
                nome = texto(valores[3] if len(valores) > 3 else "")
                if not nome or nome.lower() in {"nan", "nat"} or nome.startswith("*") or nome in {"AGUILERA", "REIS", "SANDRO"}:
                    continue
                chave_origem = (nome_aba.strip(), linha_numero)
                if chave_origem in origens:
                    continue
                data_registro = data_iso(valores[0] if valores else "") or data_aba.isoformat()
                bopm = texto(valores[1] if len(valores) > 1 else "")
                documento = texto(valores[2] if len(valores) > 2 else "")
                obs_e = texto(valores[4] if len(valores) > 4 else "")
                solicitante = texto(valores[6] if len(valores) > 6 else "")
                telefone = texto(valores[7] if len(valores) > 7 else "")
                obs_i = texto(valores[8] if len(valores) > 8 else "")
                status_fonte = texto(valores[9] if len(valores) > 9 else "")
                operador = texto(valores[10] if len(valores) > 10 else "")
                status = status_derivado(obs_e, obs_i)
                nome_normalizado = normalizar(nome)
                documentos = tuple(sorted(filter(None, [documento])))
                chave_pessoa = (nome_normalizado, documentos)
                pessoa = pessoa_por_chave.get(chave_pessoa)
                if pessoa is None:
                    pessoa = {
                        "idPessoa": proximo_id(pessoas, "idPessoa", "PES"),
                        "nomeOriginal": nome,
                        "nomeNormalizado": nome_normalizado,
                        "documentos": list(documentos),
                        "statusPessoa": "LOCALIZADO" if status.startswith("LOCALIZADO") else "DESAPARECIDO",
                        "statusAtendimento": "ENCERRADO" if status.startswith("LOCALIZADO") else "EM_QUALIFICACAO",
                        "situacaoOperacional": "LOCALIZADO" if status.startswith("LOCALIZADO") else "AINDA_DESAPARECIDO",
                        "primeiroRegistro": data_registro,
                        "ultimoRegistro": data_registro,
                    }
                    pessoas.append(pessoa)
                    pessoa_por_chave[chave_pessoa] = pessoa
                    novas_pessoas += 1
                else:
                    pessoa["ultimoRegistro"] = max(texto(pessoa.get("ultimoRegistro")), data_registro)
                    if status.startswith("LOCALIZADO"):
                        pessoa.update({"statusPessoa": "LOCALIZADO", "statusAtendimento": "ENCERRADO", "situacaoOperacional": "LOCALIZADO"})
                identificador = id_f2(nome_aba, linha_numero, nome)
                observacoes = [item for item in (obs_e, obs_i) if item]
                analise = {
                    "idAnaliseF2": identificador,
                    "idCaso": None,
                    "idPessoa": pessoa["idPessoa"],
                    "data": data_registro,
                    "nome": nome,
                    "documentoRaw": documento,
                    "bopmOriginal": bopm,
                    "taloesEncontrados": " | ".join(filter(None, re.split(r"\s*/\s*", bopm))),
                    "statusFonteJ": status_fonte,
                    "statusDerivado": status,
                    "situacaoInformada": obs_e or None,
                    "observacoes": observacoes,
                    "solicitante": solicitante,
                    "telefoneSolicitante": telefone,
                    "operador": operador,
                    "origem": {"arquivo": planilha.name, "aba": nome_aba.strip(), "linha": linha_numero},
                }
                evento = {
                    "idEvento": identificador,
                    "idCaso": None,
                    "idPessoa": pessoa["idPessoa"],
                    "dataEvento": data_registro,
                    "abaOrigem": nome_aba.strip(),
                    "linhaOrigem": linha_numero,
                    "nomeOriginal": nome,
                    "nomeNormalizado": nome_normalizado,
                    "documentoRaw": documento,
                    "bopmOriginal": bopm,
                    "taloes": bopm,
                    "obsE": obs_e,
                    "dataContato": data_registro,
                    "solicitante": solicitante,
                    "telefoneSolicitante": telefone,
                    "obsI": obs_i,
                    "colunaJOriginal": status_fonte,
                    "operador": operador,
                    "tipoEventoOperacional": "OUTRO_OPERACIONAL",
                    "statusDerivado": status,
                    "fonteStatus": "PLANILHA_F2",
                    "confiancaStatus": "MEDIA",
                    "evidenciaStatus": obs_e or obs_i,
                }
                analises.append(analise)
                eventos.append(evento)
                pessoa["ultimoEventoId"] = identificador
                origens.add(chave_origem)
                novas_analises.append(analise)
                novos_eventos.append(evento)
    finally:
        wb.close()
    if not novas_analises:
        return {"novasAnalises": 0, "novosEventos": 0, "novasPessoas": 0, "mensagem": "Nenhuma linha nova encontrada"}
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    backup = data_root / "backup" / f"antes-importacao-incremental-{timestamp}"
    backup.mkdir(parents=True, exist_ok=True)
    for caminho in caminhos.values():
        if caminho.exists():
            shutil.copy2(caminho, backup / caminho.name)
    for chave in ("analises", "eventos", "pessoas"):
        caminhos[chave].write_text(json.dumps({"analises": analises, "eventos": eventos, "pessoas": pessoas}[chave], ensure_ascii=False, indent=2), encoding="utf-8")
    metadados.update({"source": planilha.name, "sourceUpdatedAt": datetime.now().isoformat(timespec="seconds"), "ultimaImportacao": {"registrosAdicionados": len(novas_analises), "novasPessoas": novas_pessoas, "backup": str(backup)}})
    metadados["totais"] = {**metadados.get("totais", {}), "pessoas": len(pessoas), "eventos": len(eventos), "analisesF2": len(analises)}
    metadados.update({"totalPessoas": len(pessoas), "totalEventos": len(eventos), "totalAnalisesF2": len(analises)})
    caminhos["metadados"].write_text(json.dumps(metadados, ensure_ascii=False, indent=2), encoding="utf-8")
    return {"novasAnalises": len(novas_analises), "novosEventos": len(novos_eventos), "novasPessoas": novas_pessoas, "backup": str(backup)}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--planilha", type=Path, required=True)
    parser.add_argument("--data-root", type=Path, required=True)
    parser.add_argument("--ate", default="2026-08-20")
    args = parser.parse_args()
    print(json.dumps(executar(args.planilha.resolve(), args.data_root.resolve(), date.fromisoformat(args.ate)), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
