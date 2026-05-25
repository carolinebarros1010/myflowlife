#!/usr/bin/env python3
"""Valida tasks.json local sem chamadas externas."""

from __future__ import annotations

import argparse
import json
import sys
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any

PRIORIDADES_VALIDAS = {"P0", "P1", "P2"}


@dataclass
class TarefaNormalizada:
    indice: int
    title: str
    notes: str
    date_str: str
    start_str: str
    end_str: str
    start_minutos: int
    end_minutos: int
    prioridade: str | None
    fase: str | None


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Valida tasks.json local (estrutura, horarios e sobreposicoes)."
    )
    parser.add_argument(
        "--tasks-file",
        default="tasks.json",
        help="Arquivo JSON de tarefas (padrao: tasks.json)",
    )
    return parser.parse_args()


def _erro(msg: str) -> None:
    print(f"ERRO: {msg}")


def _hora_para_minutos(valor: str) -> int:
    hora = datetime.strptime(valor, "%H:%M")
    return hora.hour * 60 + hora.minute


def _validar_item(item: Any, indice: int, erros: list[str]) -> TarefaNormalizada | None:
    if not isinstance(item, dict):
        erros.append(f"Item {indice} deve ser um objeto JSON.")
        return None

    obrigatorios = ["title", "notes", "date", "start", "end"]
    faltando = [campo for campo in obrigatorios if campo not in item]
    if faltando:
        erros.append(
            f"Item {indice} sem campos obrigatorios: {', '.join(faltando)}."
        )
        return None

    title = item["title"]
    notes = item["notes"]
    date_str = item["date"]
    start_str = item["start"]
    end_str = item["end"]

    if not isinstance(title, str) or not title.strip():
        erros.append(f"Item {indice}: 'title' deve ser texto nao vazio.")
    if not isinstance(notes, str) or not notes.strip():
        erros.append(f"Item {indice}: 'notes' deve ser texto nao vazio.")
    if not isinstance(date_str, str):
        erros.append(f"Item {indice}: 'date' deve ser texto no formato YYYY-MM-DD.")
    if not isinstance(start_str, str):
        erros.append(f"Item {indice}: 'start' deve ser texto no formato HH:MM.")
    if not isinstance(end_str, str):
        erros.append(f"Item {indice}: 'end' deve ser texto no formato HH:MM.")

    if erros and any(e.startswith(f"Item {indice}:") for e in erros):
        return None

    try:
        datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        erros.append(f"Item {indice}: data invalida '{date_str}'. Use YYYY-MM-DD.")
        return None

    try:
        start_minutos = _hora_para_minutos(start_str)
    except ValueError:
        erros.append(f"Item {indice}: horario inicial invalido '{start_str}'. Use HH:MM.")
        return None

    try:
        end_minutos = _hora_para_minutos(end_str)
    except ValueError:
        erros.append(f"Item {indice}: horario final invalido '{end_str}'. Use HH:MM.")
        return None

    if end_minutos <= start_minutos:
        erros.append(
            f"Item {indice}: horario final ({end_str}) deve ser maior que inicial ({start_str})."
        )

    prioridade = item.get("priority")
    if prioridade is not None:
        if not isinstance(prioridade, str) or prioridade not in PRIORIDADES_VALIDAS:
            erros.append(
                f"Item {indice}: 'priority' invalida. Use apenas P0, P1 ou P2."
            )

    fase = item.get("phase")
    if fase is not None and not isinstance(fase, str):
        erros.append(f"Item {indice}: 'phase' deve ser texto quando informado.")

    if any(e.startswith(f"Item {indice}:") for e in erros):
        return None

    return TarefaNormalizada(
        indice=indice,
        title=title.strip(),
        notes=notes.strip(),
        date_str=date_str,
        start_str=start_str,
        end_str=end_str,
        start_minutos=start_minutos,
        end_minutos=end_minutos,
        prioridade=prioridade,
        fase=fase.strip() if isinstance(fase, str) else None,
    )


def _validar_sobreposicoes(tarefas: list[TarefaNormalizada], erros: list[str]) -> None:
    por_data: dict[str, list[TarefaNormalizada]] = defaultdict(list)
    for tarefa in tarefas:
        por_data[tarefa.date_str].append(tarefa)

    for data, itens in por_data.items():
        itens_ordenados = sorted(itens, key=lambda t: (t.start_minutos, t.end_minutos, t.indice))
        anterior = None
        for atual in itens_ordenados:
            if anterior and atual.start_minutos < anterior.end_minutos:
                erros.append(
                    "Sobreposicao em "
                    f"{data}: item {anterior.indice} ({anterior.start_str}-{anterior.end_str}) "
                    f"conflita com item {atual.indice} ({atual.start_str}-{atual.end_str})."
                )
            if anterior is None or atual.end_minutos > anterior.end_minutos:
                anterior = atual


def _imprimir_resumo(tarefas: list[TarefaNormalizada]) -> None:
    total = len(tarefas)
    datas = sorted({t.date_str for t in tarefas})

    minutos_totais = sum(t.end_minutos - t.start_minutos for t in tarefas)
    horas = minutos_totais // 60
    minutos = minutos_totais % 60

    por_dia = Counter(t.date_str for t in tarefas)
    por_prioridade = Counter(t.prioridade for t in tarefas if t.prioridade)

    fases = sorted({t.fase for t in tarefas if t.fase})

    print("VALIDACAO CONCLUIDA COM SUCESSO")
    print(f"- Total de tarefas: {total}")
    if datas:
        print(f"- Datas cobertas: {datas[0]} ate {datas[-1]} ({len(datas)} dia(s))")
    else:
        print("- Datas cobertas: nenhuma")
    print(f"- Horas totais planejadas: {horas}h{minutos:02d}")

    print("- Tarefas por dia:")
    for data in sorted(por_dia):
        print(f"  * {data}: {por_dia[data]}")

    print("- Distribuicao por prioridade:")
    for prioridade in ["P0", "P1", "P2"]:
        print(f"  * {prioridade}: {por_prioridade.get(prioridade, 0)}")

    if fases:
        print(f"- Fases encontradas: {', '.join(fases)}")
    else:
        print("- Fases encontradas: nenhuma")


def main() -> int:
    args = _parse_args()
    caminho = Path(args.tasks_file)

    if not caminho.exists():
        _erro(f"Arquivo nao encontrado: {caminho}")
        return 1

    try:
        conteudo = json.loads(caminho.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        _erro(f"JSON invalido em {caminho}: {exc}")
        return 1

    if not isinstance(conteudo, list):
        _erro("O JSON precisa ser uma lista de tarefas.")
        return 1

    erros: list[str] = []
    tarefas: list[TarefaNormalizada] = []

    for idx, item in enumerate(conteudo, start=1):
        normalizada = _validar_item(item, idx, erros)
        if normalizada:
            tarefas.append(normalizada)

    _validar_sobreposicoes(tarefas, erros)

    if erros:
        _erro("Foram encontrados problemas no arquivo de tarefas:")
        for msg in erros:
            print(f"- {msg}")
        return 1

    _imprimir_resumo(tarefas)
    return 0


if __name__ == "__main__":
    sys.exit(main())
