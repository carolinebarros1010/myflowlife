from __future__ import annotations

import argparse
import json
from datetime import date, datetime
from pathlib import Path

import pandas as pd


INDICES_DIARIOS = {
    "analiseCadastros": 3,
    "contatosDeclarantes": 4,
    "localizacoesTalao": 5,
    "transferencias6190": 6,
    "coletaFotos": 7,
    "transferenciaAudio": 8,
    "atualizacoesSiopm": 9,
    "ocorrenciasGeradas": 10,
}


def serializar(valor: object) -> object:
    if pd.isna(valor):
        return None
    if isinstance(valor, (datetime, date)):
        return valor.isoformat()
    if hasattr(valor, "item"):
        return valor.item()
    return valor


def linha_bruta(linha: list[object]) -> list[object]:
    return [serializar(valor) for valor in linha]


def numero(valor: object) -> int:
    try:
        return max(0, int(float(valor or 0)))
    except (TypeError, ValueError):
        return 0


def importar(origem: Path, destino: Path) -> dict:
    planilha = pd.ExcelFile(origem)
    abas: list[dict] = []
    mensais: list[dict] = []
    diarios: list[dict] = []

    for nome_aba in planilha.sheet_names:
        bruto = pd.read_excel(origem, sheet_name=nome_aba, header=None, dtype=object)
        cabecalho = [str(serializar(valor) or "").strip() for valor in bruto.iloc[5].tolist()]
        linhas = [linha_bruta(linha) for linha in bruto.iloc[6:].values.tolist()]
        aba = {
            "nome": nome_aba,
            "totalLinhas": len(bruto),
            "totalColunas": len(bruto.columns),
            "cabecalho": cabecalho,
            "linhas": linhas,
        }
        abas.append(aba)

        e_mensal = "MENSAL" in nome_aba.upper()
        data_diaria_atual: datetime | None = None
        for indice, linha in enumerate(linhas, start=7):
            data_valor = pd.to_datetime(linha[0] if linha else None, errors="coerce")
            if linha and linha[0] is not None and not pd.isna(linha[0]) and pd.isna(data_valor):
                # Ignora linhas de totalização e legendas ao final das abas.
                continue
            if not pd.isna(data_valor) and data_valor.year >= 2020:
                data_diaria_atual = data_valor.to_pydatetime()
            if e_mensal:
                if pd.isna(data_valor) or data_valor.year < 2020:
                    continue
                mensais.append({
                    "id": f"mensal-{len(mensais) + 1:04d}",
                    "origemAba": nome_aba,
                    "linhaOrigem": indice,
                    "dataInicio": data_valor.date().isoformat(),
                    "dataFinal": serializar(linha[1]),
                    "localizacaoDesaparecido": numero(linha[2]),
                    **{campo: numero(linha[pos]) for campo, pos in INDICES_DIARIOS.items()},
                    "diasTrabalhados": numero(linha[11]),
                    "camposOriginais": linha,
                })
            else:
                if data_diaria_atual is None:
                    continue
                diarios.append({
                    "id": f"consolidado-{len(diarios) + 1:04d}",
                    "origemAba": nome_aba,
                    "linhaOrigem": indice,
                    "data": data_diaria_atual.date().isoformat(),
                    "diaSemana": linha[1],
                    "operador": linha[2],
                    **{campo: numero(linha[pos]) for campo, pos in INDICES_DIARIOS.items()},
                    "observacao": linha[11] or "",
                    "camposOriginais": linha,
                })

    resultado = {
        "versao": 1,
        "tipo": "producao-consolidada",
        "fonte": origem.name,
        "importadoEm": datetime.now().astimezone().isoformat(),
        "abas": abas,
        "resumoMensal": mensais,
        "registrosDiarios": diarios,
        "totais": {
            campo: sum(item[campo] for item in diarios)
            for campo in INDICES_DIARIOS
        },
        "totalRegistrosDiarios": len(diarios),
    }
    destino.mkdir(parents=True, exist_ok=True)
    (destino / "producao-consolidada.json").write_text(
        json.dumps(resultado, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (destino / "manifest.json").write_text(
        json.dumps({
            "tipo": resultado["tipo"],
            "versao": resultado["versao"],
            "fonte": resultado["fonte"],
            "importadoEm": resultado["importadoEm"],
            "abas": [{"nome": aba["nome"], "totalLinhas": aba["totalLinhas"], "totalColunas": aba["totalColunas"]} for aba in abas],
            "totalRegistrosDiarios": resultado["totalRegistrosDiarios"],
            "totalResumosMensais": len(mensais),
        }, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    return resultado


def main() -> None:
    parser = argparse.ArgumentParser(description="Importa o consolidado de produção para a pasta de consulta.")
    parser.add_argument("origem", type=Path)
    parser.add_argument("destino", type=Path)
    argumentos = parser.parse_args()
    resultado = importar(argumentos.origem, argumentos.destino)
    print(json.dumps({"abas": len(resultado["abas"]), "diarios": len(resultado["registrosDiarios"]), "mensais": len(resultado["resumoMensal"])}, ensure_ascii=False))


if __name__ == "__main__":
    main()
