"""Reconcilia a produção/localizações da base local com o repositório JSON central."""

from __future__ import annotations

import argparse
import json
import shutil
import sqlite3
from datetime import datetime, timezone
from pathlib import Path


def carregar(caminho: Path):
    return json.loads(caminho.read_text(encoding="utf-8-sig"))


def salvar(caminho: Path, valor) -> None:
    caminho.write_text(json.dumps(valor, ensure_ascii=False, indent=2), encoding="utf-8")


def categoria(registro: dict) -> tuple[str, str, str, str, str]:
    resultado = str(registro.get("resultado", "")).strip().lower()
    recurso = str(registro.get("recurso", "")).strip().lower()
    if "morto" in resultado:
        status, categoria_admin = "LOCALIZADO_SEM_VIDA", "OBITO"
    elif "preso" in resultado:
        status, categoria_admin = "LOCALIZADO_CUSTODIA", "PRESO"
    elif "viatura" in recurso:
        status, categoria_admin = "LOCALIZADO", "VTR_PM"
    elif "cabine" in recurso:
        status, categoria_admin = "LOCALIZADO", "CABINE_VERDE"
    else:
        status, categoria_admin = "LOCALIZADO", "VULTO_OUTROS"
    atribuivel = "SIM" if categoria_admin == "CABINE_VERDE" else "NAO"
    return status, categoria_admin, atribuivel, recurso.upper(), resultado


def executar(banco: Path, raiz: Path) -> dict[str, int | str]:
    dados = raiz / "dados"
    historicos_path = dados / "historicos-v7.json"
    producao_path = dados / "producao-diaria.json"
    metadados_path = dados / "metadados.json"
    historicos = carregar(historicos_path)
    metadados = carregar(metadados_path)

    conexao = sqlite3.connect(banco)
    conexao.row_factory = sqlite3.Row
    localizacoes = [json.loads(row["dados_json"]) for row in conexao.execute("SELECT dados_json FROM localizacoes_legado ORDER BY linha_origem")]
    producao = [dict(row) for row in conexao.execute("SELECT * FROM producao_diaria ORDER BY data, id")]
    conexao.close()

    linhas_existentes = {str(item.get("linhaFonte")) for item in historicos}
    proximo = max((int(str(item.get("idCasoHistorico", "")).rsplit("-", 1)[-1]) for item in historicos if str(item.get("idCasoHistorico", "")).rsplit("-", 1)[-1].isdigit()), default=0) + 1
    adicionados = 0
    for item in localizacoes:
        linha = str(item.get("linha_origem", ""))
        if linha in linhas_existentes:
            continue
        status, categoria_admin, atribuivel, executor, resultado = categoria(item)
        historicos.append({
            "idCasoHistorico": f"HIST-V7-{proximo:04d}",
            "linhaFonte": int(linha) if linha.isdigit() else linha,
            "data": item.get("data", ""),
            "taloes": [str(item.get("talao", "")).replace(".0", "")],
            "categoriaOriginal": item.get("categoria", ""),
            "categoriaAdministrativa": categoria_admin,
            "statusNoCaso": status,
            "pessoas": [{"nome": item.get("nome", ""), "idPessoaCentral": None, "idCasoCentralCandidato": None, "confiancaVinculo": "NAO_VINCULADO", "metodoVinculo": "RELATORIO_LOCALIZACOES"}],
            "quantidadePessoasNoCaso": 1,
            "comoFoiEncontrada": item.get("como_encontrada", ""),
            "ondeFoiEncontrada": item.get("onde_encontrada", ""),
            "acoesBusca": item.get("acoes_busca", ""),
            "atribuivelCabineV7": atribuivel,
            "classificacaoV7": "LOCALIZACAO_ADMINISTRATIVA_RELATORIO",
            "executorFisicoV7": executor,
            "contribuicaoCabineV7": "DEMONSTRADA" if atribuivel == "SIM" else "NAO_DEMONSTRADA",
            "meioCabineV7": "CABINE_VERDE" if atribuivel == "SIM" else "NAO_DEFINIDO",
            "evidenciaCausalV7": "Registro reconciliado do relatório atualizado de localizações.",
            "tecnologiasComprovadas": [],
            "origemImportacao": "RELATORIO_LOCALIZACOES_ATUALIZADO",
            "idade": item.get("idade", ""),
            "sexo": item.get("sexo", ""),
            "resultadoLocalizacao": resultado,
            "recursoLocalizacao": item.get("recurso", ""),
        })
        linhas_existentes.add(linha)
        proximo += 1
        adicionados += 1

    diario_existente = carregar(producao_path) if producao_path.exists() else []
    por_id = {str(item.get("id")): item for item in diario_existente}
    for item in producao:
        registro = {
            "id": str(item["id"]),
            "data": item["data"],
            "operadorEmail": item["operador_email"],
            "operadorNome": item["operador_nome"],
            "estagiario": item["estagiario"],
            "analiseCadastros": item["analise_cadastros"],
            "contatosDeclarantes": item["contatos_declarantes"],
            "localizacoesTalao": item["localizacoes_talao"],
            "transferencias6190": item["transferencias_6190"],
            "coletaFotos": item["coleta_fotos"],
            "transferenciaAudio": item["transferencia_audio"],
            "atualizacoesSiopm": item["atualizacoes_siopm"],
            "ocorrenciasGeradas": item["ocorrencias_geradas"],
            "observacao": item["observacao"],
            "criadoEm": item["criado_em"],
            "atualizadoEm": item["atualizado_em"],
        }
        por_id[registro["id"]] = registro
    diarios = list(por_id.values())

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    backup = raiz / "backup" / f"antes-migracao-json-central-{timestamp}"
    backup.mkdir(parents=True, exist_ok=True)
    for caminho in (historicos_path, producao_path, metadados_path):
        if caminho.exists():
            shutil.copy2(caminho, backup / caminho.name)

    salvar(historicos_path, historicos)
    salvar(producao_path, diarios)
    categorias = {"CABINE_VERDE": 0, "VTR_PM": 0, "VULTO_OUTROS": 0, "PRESO": 0, "OBITO": 0}
    for item in historicos:
        chave = str(item.get("categoriaAdministrativa", "")).upper()
        if chave in categorias:
            categorias[chave] += 1
    meta_v7 = metadados.get("historicoV7") if isinstance(metadados.get("historicoV7"), dict) else {}
    ids = {"CABINE_VERDE": "cabine", "VTR_PM": "vtr", "VULTO_OUTROS": "vultoOutros", "PRESO": "preso", "OBITO": "obito"}
    titulos = {"CABINE_VERDE": "LOCALIZAÇÃO DIRETA PELA EQUIPE MURALHA", "VTR_PM": "LOCALIZAÇÃO COM APOIO DE VTR", "VULTO_OUTROS": "VULTO / IMPRENSA E OUTROS", "PRESO": "LOCALIZAÇÃO COM RESULTADO PRISÃO", "OBITO": "LOCALIZAÇÃO COM RESULTADO ÓBITO"}
    meta_v7.update({"totalAdministrativo": len(historicos), "totalRegistros": len(historicos), "registrosIndividualizados": len(historicos), "categoriasAdministrativas": [{"id": ids[chave], "quantidade": quantidade, "titulo": titulos[chave]} for chave, quantidade in categorias.items()]})
    metadados["historicoV7"] = meta_v7
    metadados["ultimaMigracaoJsonCentral"] = {"data": datetime.now(timezone.utc).isoformat(), "localizacoesAdicionadas": adicionados, "producaoDiaria": len(diarios), "backup": str(backup)}
    metadados["totalEventos"] = len(carregar(dados / "eventos.json"))
    salvar(metadados_path, metadados)
    return {"localizacoesAdicionadas": adicionados, "historicosTotais": len(historicos), "producaoDiariaTotal": len(diarios), "backup": str(backup)}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--banco", type=Path, required=True)
    parser.add_argument("--data-root", type=Path, required=True)
    args = parser.parse_args()
    print(json.dumps(executar(args.banco.resolve(), args.data_root.resolve()), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
