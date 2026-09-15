"""Prepara fotos de solicitantes para importação na base central.

O comando é somente preparatório por padrão: lê o acervo, calcula hashes e
gera um manifesto JSON/CSV. A cópia para a pasta do servidor só ocorre com
--copiar e exige um destino explícito.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import mimetypes
import re
import shutil
import unicodedata
from dataclasses import asdict, dataclass
from datetime import date
from pathlib import Path


EXTENSOES_IMAGEM = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".tif", ".tiff"}
MESES = {
    "JAN": 1, "FEV": 2, "MAR": 3, "ABR": 4, "MAI": 5, "JUN": 6,
    "JUL": 7, "AGO": 8, "SET": 9, "OUT": 10, "NOV": 11, "DEZ": 12,
}


@dataclass
class RegistroFoto:
    caminhoOrigem: str
    nomeArquivoOriginal: str
    nomeVitima: str
    talao: str
    dataTalao: str
    sha256: str
    mimeType: str
    tamanhoBytes: int
    pastaDestinoSugerida: str
    nomeArquivoDestinoSugerido: str
    statusImportacao: str
    motivosRevisao: list[str]


def sem_acentos(valor: str) -> str:
    return "".join(
        caractere
        for caractere in unicodedata.normalize("NFKD", valor)
        if not unicodedata.combining(caractere)
    )


def slug(valor: str) -> str:
    limpo = sem_acentos(valor).upper()
    limpo = re.sub(r"[^A-Z0-9]+", "-", limpo).strip("-")
    return limpo[:100] or "SEM-NOME"


def extrair_data(texto: str) -> str:
    normalizado = sem_acentos(texto.upper())
    padrao_extenso = re.search(r"(?<!\d)(\d{1,2})(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)(\d{2,4})(?!\d)", normalizado)
    if padrao_extenso:
        dia, mes, ano = padrao_extenso.groups()
        if len(ano) == 2:
            ano = f"20{ano}"
        elif len(ano) == 3 and 100 <= int(ano) <= 199:
            # Alguns arquivos de 2026 chegam como 06AGO126.
            ano = str(2000 + int(ano) - 100)
        try:
            valor = date(int(ano), MESES[mes], int(dia))
            if 2000 <= valor.year <= 2100:
                return valor.isoformat()
        except ValueError:
            pass
    padrao_numerico = re.search(r"(?<!\d)(\d{1,2})[._-](\d{1,2})[._-](\d{2,4})(?!\d)", normalizado)
    if padrao_numerico:
        dia, mes, ano = padrao_numerico.groups()
        if len(ano) == 2:
            ano = f"20{ano}"
        elif len(ano) == 3 and 100 <= int(ano) <= 199:
            ano = str(2000 + int(ano) - 100)
        try:
            valor = date(int(ano), int(mes), int(dia))
            if 2000 <= valor.year <= 2100:
                return valor.isoformat()
        except ValueError:
            pass
    return ""


def extrair_talao(texto: str) -> str:
    normalizado = sem_acentos(texto.upper())
    padrao = re.search(r"(?:TALAO|TL|OCOR)\s*[-_:#]?\s*(\d{3,})", normalizado)
    return padrao.group(1) if padrao else ""


def extrair_nome(nome_arquivo: str) -> str:
    nome = Path(nome_arquivo).stem
    nome = re.sub(r"^CAPTURA DE TELA.*$", "", nome, flags=re.IGNORECASE)
    nome = re.sub(r"^(?:TAL[AÃ]O|TL|OCOR)\s*[-_:#]?\s*\d+[_ -]*", "", nome, flags=re.IGNORECASE)
    nome = re.sub(r"\b(?:TAL[AÃ]O|TL|OCOR)\s*[-_:#]?\s*\d+", "", nome, flags=re.IGNORECASE)
    nome = re.sub(r"\d{1,2}[A-Z]{3}\d{2,4}", "", nome, flags=re.IGNORECASE)
    nome = re.sub(r"\b\d{1,2}[._/-]\d{1,2}[._/-]\d{2,4}\b", "", nome)
    nome = re.sub(r"\([^)]*(?:anos?|idade)[^)]*\)", "", nome, flags=re.IGNORECASE)
    nome = re.sub(r"\d{1,3}\s+ANOS?", "", nome, flags=re.IGNORECASE)
    nome = re.sub(r"\b\d{1,2}(?:JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)\d{2,4}\b", "", nome, flags=re.IGNORECASE)
    nome = re.sub(r"\b(?:OU|DE|EM)\s*$", "", nome, flags=re.IGNORECASE)
    nome = re.sub(r"[_-]+", " ", nome)
    return re.sub(r"\s+", " ", nome).strip(" _-")


def sha256(arquivo: Path) -> str:
    digest = hashlib.sha256()
    with arquivo.open("rb") as origem:
        for bloco in iter(lambda: origem.read(1024 * 1024), b""):
            digest.update(bloco)
    return digest.hexdigest()


def analisar(arquivo: Path, raiz: Path) -> RegistroFoto:
    relativo = arquivo.relative_to(raiz).as_posix()
    nome = extrair_nome(arquivo.name)
    talao = extrair_talao(arquivo.name) or extrair_talao(relativo)
    data_talao = extrair_data(arquivo.name) or extrair_data(relativo)
    motivos: list[str] = []
    if not nome:
        motivos.append("nome_da_vitima_nao_identificado")
    if not talao:
        motivos.append("talao_nao_identificado")
    if not data_talao:
        motivos.append("data_do_talao_nao_identificada")
    chave = f"{data_talao or 'SEM-DATA'}_{talao or 'SEM-TALAO'}_{slug(nome)}"
    destino = f"IMPORT-{chave}"
    return RegistroFoto(
        caminhoOrigem=relativo,
        nomeArquivoOriginal=arquivo.name,
        nomeVitima=nome,
        talao=talao,
        dataTalao=data_talao,
        sha256=sha256(arquivo),
        mimeType=mimetypes.guess_type(arquivo.name)[0] or "application/octet-stream",
        tamanhoBytes=arquivo.stat().st_size,
        pastaDestinoSugerida=destino,
        nomeArquivoDestinoSugerido=f"{chave}{arquivo.suffix.lower()}",
        statusImportacao="PRONTO" if not motivos else "REVISAR",
        motivosRevisao=motivos,
    )


def executar(raiz: Path, saida: Path, destino: Path | None, copiar: bool) -> None:
    arquivos = sorted(
        arquivo for arquivo in raiz.rglob("*")
        if arquivo.is_file() and arquivo.suffix.lower() in EXTENSOES_IMAGEM
    )
    registros = [analisar(arquivo, raiz) for arquivo in arquivos]
    hashes: dict[str, int] = {}
    for registro in registros:
        hashes[registro.sha256] = hashes.get(registro.sha256, 0) + 1
    for registro in registros:
        if hashes[registro.sha256] > 1:
            registro.motivosRevisao.append("arquivo_duplicado_por_sha256")
            registro.statusImportacao = "REVISAR"

    saida.mkdir(parents=True, exist_ok=True)
    (saida / "manifesto-fotos.json").write_text(
        json.dumps([asdict(registro) for registro in registros], ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    with (saida / "manifesto-fotos.csv").open("w", newline="", encoding="utf-8-sig") as arquivo_csv:
        campos = list(asdict(registros[0]).keys()) if registros else list(RegistroFoto.__annotations__.keys())
        escritor = csv.DictWriter(arquivo_csv, fieldnames=campos)
        escritor.writeheader()
        for registro in registros:
            linha = asdict(registro)
            linha["motivosRevisao"] = ";".join(registro.motivosRevisao)
            escritor.writerow(linha)
    if copiar:
        if destino is None:
            raise ValueError("--destino é obrigatório quando --copiar é usado")
        for registro in registros:
            origem = raiz / registro.caminhoOrigem
            pasta = destino / "fotos" / registro.pastaDestinoSugerida
            pasta.mkdir(parents=True, exist_ok=True)
            nome_destino = registro.nomeArquivoDestinoSugerido
            caminho = pasta / nome_destino
            if caminho.exists() and sha256(caminho) != registro.sha256:
                nome_destino = f"{Path(nome_destino).stem}_{registro.sha256[:12]}{Path(nome_destino).suffix}"
                caminho = pasta / nome_destino
            registro.nomeArquivoDestinoSugerido = nome_destino
            if caminho.exists() and sha256(caminho) != registro.sha256:
                raise FileExistsError(f"Conflito de destino mesmo após desambiguação: {caminho}")
            if not caminho.exists():
                shutil.copy2(origem, caminho)
            meta = caminho.with_name(f"{caminho.name}.meta.json")
            meta.write_text(json.dumps({"idOcorrencia": registro.talao or "sem-talao", **asdict(registro), "autorizacao": "Pendente"}, ensure_ascii=False, indent=2), encoding="utf-8")
    prontos = sum(registro.statusImportacao == "PRONTO" for registro in registros)
    print(json.dumps({"total": len(registros), "prontos": prontos, "revisar": len(registros) - prontos, "duplicadosSha256": sum(quantidade - 1 for quantidade in hashes.values() if quantidade > 1), "saida": str(saida.resolve()), "copiado": copiar}, ensure_ascii=False))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--origem", type=Path, required=True)
    parser.add_argument("--saida", type=Path, required=True)
    parser.add_argument("--destino", type=Path)
    parser.add_argument("--copiar", action="store_true", help="copia para destino/fotos; exige --destino explícito")
    args = parser.parse_args()
    executar(args.origem.resolve(), args.saida.resolve(), args.destino.resolve() if args.destino else None, args.copiar)


if __name__ == "__main__":
    main()
