from __future__ import annotations

import base64
import argparse
import gzip
import json
import mimetypes
import os
import re
import shutil
import socket
import threading
import sys
import unicodedata
import uuid
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse
try:
    from storage_repository import JsonStorageRepository, SCHEMA_VERSION, metadata_inicial
except ModuleNotFoundError:
    from server.storage_repository import JsonStorageRepository, SCHEMA_VERSION, metadata_inicial
try:
    from search_methodology import classificar_estagio_atendimento
except ModuleNotFoundError:
    from server.search_methodology import classificar_estagio_atendimento

HOST = "0.0.0.0"
PORT = int(os.environ.get("CABINE_VERDE_PORT", "80"))
TEMPO_LIMITE_SOCKET = float(os.environ.get("CABINE_VERDE_SOCKET_TIMEOUT", "30"))
PASTA_SCRIPT = Path(__file__).resolve().parent
def obter_data_root() -> Path:
    configurado = os.environ.get("CABINE_VERDE_DATA_ROOT") or os.environ.get("CABINE_VERDE_BASE_DIR")
    if configurado:
        return Path(configurado).expanduser().resolve()
    if sys.platform == "win32" and Path("D:/CabineVerde").exists():
        return Path("D:/CabineVerde").resolve()
    base_desktop = Path(r"C:\Users\Ricardo Junior\Desktop\CabineVerde")
    if (base_desktop / "dados" / "metadados.json").exists():
        return base_desktop.resolve()
    return (PASTA_SCRIPT.parent if PASTA_SCRIPT.name == "server" else PASTA_SCRIPT).resolve()


BASE_DIR = obter_data_root()
ARQUIVO_OCORRENCIAS = BASE_DIR / "dados" / "casos.json"
ARQUIVO_PESSOAS = BASE_DIR / "dados" / "pessoas.json"
ARQUIVO_ANALISES = BASE_DIR / "dados" / "analises-f2.json"
ARQUIVO_EVENTOS = BASE_DIR / "dados" / "eventos.json"
PASTA_FOTOS = BASE_DIR / "fotos"
PASTA_DOCUMENTOS = BASE_DIR / "documentos"
PASTA_BACKUP = BASE_DIR / "backup"
PASTA_LOGS = BASE_DIR / "logs"
PASTA_CONSULTA_PRODUCAO = BASE_DIR / "dados" / "consulta" / "producao-consolidada"
ARQUIVO_PRODUCAO_CONSOLIDADA = PASTA_CONSULTA_PRODUCAO / "producao-consolidada.json"
ARQUIVO_PRODUCAO_CONSOLIDADA_DIRETO = BASE_DIR / "dados" / "consulta" / "producao-consolidada.json"
LOCK_ESCRITA = threading.Lock()
REPOSITORIO: JsonStorageRepository | None = None


def mesclar_atualizacao_caso(anterior: dict, atualizacao: dict) -> dict:
    """Atualizações parciais preservam respostas e complementos de outros painéis."""
    resultado = {**anterior, **atualizacao}
    for campo in ("dados", "respostasArvore", "complementosArvore"):
        if isinstance(anterior.get(campo), dict) and isinstance(atualizacao.get(campo), dict):
            resultado[campo] = mesclar_atualizacao_caso(anterior[campo], atualizacao[campo])
    return resultado


def nome_seguro_arquivo(valor: object, fallback: str = "SEM-INFORMACAO") -> str:
    texto = unicodedata.normalize("NFD", str(valor or ""))
    texto = "".join(caractere for caractere in texto if unicodedata.category(caractere) != "Mn")
    texto = re.sub(r"[^A-Za-z0-9]+", "-", texto).strip("-")[:80]
    return texto or fallback


def agora() -> str:
    return datetime.now(timezone.utc).isoformat()


def metadados_foto_com_fallback(informacoes: dict, id_ocorrencia: str, nome_arquivo: str, ocorrencias: list[dict] | None = None) -> dict:
    """Completa fotos antigas cujo .meta.json não tinha nome/talão/data."""
    resultado = dict(informacoes)
    resultado.setdefault("idOcorrencia", id_ocorrencia)
    ocorrencias = ocorrencias if ocorrencias is not None else (REPOSITORIO.load_list("casos") if REPOSITORIO is not None else [])
    caso = next((item for item in ocorrencias if str(item.get("id", item.get("idCaso", ""))) == str(id_ocorrencia)), {})
    nome = resultado.get("nomeVitima") or resultado.get("nome") or caso.get("nome") or caso.get("nome_desaparecido") or caso.get("nomeCompletoDesaparecido")
    talao = resultado.get("talao") or caso.get("talao") or caso.get("talao_pm") or caso.get("talaoPMESP")
    data_talao = resultado.get("dataTalao") or caso.get("dataTalao") or caso.get("data_talao")
    base = Path(nome_arquivo).stem
    padrao = re.match(r"^(?:[A-Z]+-)?(\d{4}-\d{2}-\d{2})[_-]([^_-]+)[_-](.+)$", base, re.IGNORECASE)
    if padrao:
        data_talao = data_talao or padrao.group(1)
        talao = talao or padrao.group(2)
        nome = nome or re.sub(r"[_-]+", " ", padrao.group(3)).strip()
    if nome:
        resultado["nome"] = str(nome).strip()
    if talao:
        resultado["talao"] = str(talao).strip()
    if data_talao:
        resultado["dataTalao"] = str(data_talao).strip()
    return resultado


def normalizar_busca(valor: object) -> str:
    texto = unicodedata.normalize("NFKD", str(valor or "")).casefold()
    return "".join(caractere for caractere in texto if unicodedata.category(caractere) != "Mn").strip()


def compactar_talao(valor: object) -> str:
    return re.sub(r"[^a-z0-9]", "", normalizar_busca(valor))


def corresponde_busca(termo: object, campos: list[object]) -> bool:
    consulta = normalizar_busca(termo)
    if not consulta:
        return True
    texto = normalizar_busca(" ".join(str(campo or "") for campo in campos))
    tokens = [token for token in re.split(r"\s+", consulta) if token]
    if all(token in texto for token in tokens):
        return True
    consulta_talao = compactar_talao(consulta)
    taloes = [compactar_talao(campo) for campo in campos]
    return bool(consulta_talao) and any(consulta_talao in talao for talao in taloes)


def classificar_categoria_dashboard(texto: str) -> str:
    if any(valor in texto for valor in ("obito", "morta", "em óbito")):
        return "obito"
    if any(valor in texto for valor in ("preso", "presa", "prisao", "custodia", "custodiada")):
        return "preso"
    if any(valor in texto for valor in ("vtr", "viatura")):
        return "vtr"
    if any(valor in texto for valor in ("muralha", "cabine")):
        return "cabine"
    if any(valor in texto for valor in ("vulto", "imprensa", "outros", "outro")):
        return "vultoOutros"
    return ""


def classificar_historico_dashboard(item: dict) -> str:
    categoria = normalizar_busca(item.get("categoriaAdministrativa")).upper()
    equivalencias = {
        "CABINE_MURALHA": "cabine",
        "CABINE_VERDE": "cabine",
        "VTR_PM": "vtr",
        "VULTO_IMPRENSA_OUTROS": "vultoOutros",
        "VULTO_OUTROS": "vultoOutros",
        "PRESA_CUSTODIA": "preso",
        "MORTA": "obito",
    }
    return equivalencias.get(categoria) or classificar_categoria_dashboard(normalizar_busca(" ".join(str(item.get(campo, "")) for campo in ("categoriaOriginal", "executorFisicoV7", "resultadoLocalizacao"))))


def preparar_pastas() -> None:
    global REPOSITORIO
    if not BASE_DIR.is_dir():
        raise RuntimeError(f"BASE OFICIAL DA CABINE VERDE NÃO LOCALIZADA\n\nDataRoot esperado:\n{BASE_DIR}")
    REPOSITORIO = JsonStorageRepository(BASE_DIR)
    dados_metadados = REPOSITORIO.load_object("metadados")
    if not dados_metadados:
        raise RuntimeError(f"BANCO SQLITE CENTRAL NÃO INICIALIZADO\n\nArquivo esperado:\n{REPOSITORIO.database_path}")
    if dados_metadados.get("schemaVersion") != SCHEMA_VERSION:
        raise RuntimeError(f"SCHEMA INCOMPATÍVEL: encontrado {dados_metadados.get('schemaVersion')!r}; esperado {SCHEMA_VERSION}")
    for pasta in (REPOSITORIO.data_dir, PASTA_FOTOS, PASTA_DOCUMENTOS, PASTA_BACKUP, PASTA_LOGS, PASTA_CONSULTA_PRODUCAO):
        pasta.mkdir(parents=True, exist_ok=True)
    for colecao in ("pessoas", "casos", "vitimas", "eventos", "analisesF2", "qualificacoes", "pistas", "taloes", "atribuicoes", "historicosV7", "producaoDiaria", "aliasesCasos"):
        REPOSITORIO.load_list(colecao)


def validar_json_existente(arquivo: Path, tipo) -> None:
    try:
        valor = json.loads(arquivo.read_text(encoding="utf-8-sig"))
    except (OSError, json.JSONDecodeError) as erro:
        raise RuntimeError(f"Base oficial inválida ou inacessível: {arquivo} ({erro})") from erro
    if not isinstance(valor, tipo):
        raise RuntimeError(f"Base oficial com formato inválido: {arquivo}; esperado {tipo.__name__}")


def inicializar_base_administrativa() -> None:
    """Cria uma base vazia somente mediante comando explícito."""
    BASE_DIR.mkdir(parents=True, exist_ok=True)
    (BASE_DIR / "dados").mkdir(parents=True, exist_ok=True)
    for pasta in (PASTA_FOTOS, PASTA_DOCUMENTOS, PASTA_BACKUP, PASTA_LOGS, PASTA_CONSULTA_PRODUCAO):
        pasta.mkdir(parents=True, exist_ok=True)
    repositorio = JsonStorageRepository(BASE_DIR)
    if repositorio.path_for("metadados").exists():
        raise RuntimeError(f"Base já inicializada: {repositorio.path_for('metadados')}")
    repositorio.save_object("metadados", metadata_inicial(BASE_DIR))
    for colecao in ("pessoas", "casos", "vitimas", "eventos", "analisesF2", "qualificacoes", "pistas", "taloes", "atribuicoes", "historicosV7", "aliasesCasos"):
        repositorio.save_list(colecao, [])


class CabineVerdeHandler(BaseHTTPRequestHandler):
    server_version = "CabineVerde/1.0"
    protocol_version = "HTTP/1.1"

    def ids_relacionados_caso(self, id_caso: object) -> set[str]:
        procurado = str(id_caso)
        relacionados = {procurado}
        for alias in self.repositorio.load_list("aliasesCasos"):
            atual = str(alias.get("idCasoAtual", ""))
            historicos = {str(item) for item in alias.get("idsCasosHistoricos", []) if item}
            if procurado == atual or procurado in historicos:
                relacionados.add(atual)
                relacionados.update(historicos)
        return relacionados

    def setup(self) -> None:
        super().setup()
        self.connection.settimeout(TEMPO_LIMITE_SOCKET)
        self.connection.setsockopt(socket.SOL_SOCKET, socket.SO_KEEPALIVE, 1)

    def log_message(self, formato: str, *argumentos) -> None:
        PASTA_LOGS.mkdir(parents=True, exist_ok=True)
        linha = f"{agora()} ip={self.client_address[0]} {self.command} {self.path} " + formato % argumentos + "\n"
        with (PASTA_LOGS / "server.log").open("a", encoding="utf-8") as arquivo:
            arquivo.write(linha)

    def enviar_json(self, dados, status: int = 200) -> None:
        conteudo = json.dumps(dados, ensure_ascii=False).encode("utf-8")
        deve_comprimir = "gzip" in self.headers.get("Accept-Encoding", "").lower() and len(conteudo) >= 1024
        if deve_comprimir:
            conteudo = gzip.compress(conteudo, compresslevel=6)
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(conteudo)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Vary", "Accept-Encoding")
        if deve_comprimir:
            self.send_header("Content-Encoding", "gzip")
        self.end_headers()
        self.wfile.write(conteudo)

    def enviar_erro(self, mensagem: str, status: int) -> None:
        self.enviar_json({"ok": False, "erro": mensagem}, status)

    def carregar_ocorrencias(self) -> list:
        return self.repositorio.load_list("casos")

    @staticmethod
    def normalizar_producao_diaria(dados: dict, identificador: str | None = None) -> dict:
        campos_numericos = ("analiseCadastros", "contatosDeclarantes", "localizacoesTalao", "transferencias6190", "coletaFotos", "transferenciaAudio", "atualizacoesSiopm", "ocorrenciasGeradas")
        equipe_plantao = str(dados.get("equipePlantao") or dados.get("equipe_plantao") or "").strip()
        if equipe_plantao not in ("Equipe 1", "Equipe 2"):
            equipe_plantao = ""
        registro = {"id": identificador or dados.get("id"), "data": str(dados.get("data", "")).strip(), "operadorEmail": str(dados.get("operadorEmail", "")).strip().lower(), "operadorNome": str(dados.get("operadorNome", "")).strip(), "equipePlantao": equipe_plantao, "estagiario": str(dados.get("estagiario", "")).strip(), "observacao": str(dados.get("observacao", "")).strip()}
        for campo in campos_numericos:
            try:
                registro[campo] = max(0, int(dados.get(campo, 0) or 0))
            except (TypeError, ValueError):
                registro[campo] = 0
        registro["criadoEm"] = str(dados.get("criadoEm") or agora())
        registro["atualizadoEm"] = agora()
        return registro

    def consultar_producao_diaria(self, consulta: dict[str, list[str]]) -> list[dict]:
        inicio = (consulta.get("inicio") or ["0000-01-01"])[0]
        fim = (consulta.get("fim") or ["9999-12-31"])[0]
        operador_email = (consulta.get("operadorEmail") or [""])[0].strip().lower()
        registros = self.repositorio.load_list("producaoDiaria")
        return sorted([item for item in registros if inicio <= str(item.get("data", "")) <= fim and (not operador_email or str(item.get("operadorEmail", "")).lower() == operador_email)], key=lambda item: (str(item.get("data", "")), str(item.get("operadorNome", ""))), reverse=True)

    def consultar_producao_consolidada(self, consulta: dict[str, list[str]]) -> dict:
        dados = self.repositorio.load_object("producaoConsolidada")
        if not dados:
            return {"fonte": None, "resumoMensal": [], "registrosDiarios": [], "totais": {}, "totalRegistrosDiarios": 0}
        inicio = (consulta.get("inicio") or ["0000-01-01"])[0]
        fim = (consulta.get("fim") or ["9999-12-31"])[0]
        diarios = [item for item in dados.get("registrosDiarios", []) if inicio <= str(item.get("data", "")) <= fim]
        mensais = [item for item in dados.get("resumoMensal", []) if str(item.get("dataInicio", "")) <= fim and str(item.get("dataFinal", item.get("dataInicio", ""))) >= inicio]

        # Algumas abas históricas possuem o detalhe diário, mas não preencheram
        # a linha do resumo mensal. Nesse caso, a API consolida o detalhe real
        # por competência e calcula dias trabalhados por data distinta.
        campos_numericos = ("analiseCadastros", "contatosDeclarantes", "localizacoesTalao", "transferencias6190", "coletaFotos", "transferenciaAudio", "atualizacoesSiopm", "ocorrenciasGeradas")
        por_mes: dict[str, list[dict]] = {}
        for diario in diarios:
            data_diario = str(diario.get("data", ""))[:10]
            if len(data_diario) >= 7:
                por_mes.setdefault(data_diario[:7], []).append(diario)
        mensais_por_mes = {str(item.get("dataInicio", ""))[:7]: item for item in mensais}
        for mes, registros in por_mes.items():
            existente = mensais_por_mes.get(mes)
            # Mantém o resumo mensal original quando ele já contém produção.
            if existente and any(int(existente.get(campo, 0) or 0) > 0 for campo in campos_numericos):
                continue
            datas_validas = sorted({str(item.get("data", ""))[:10] for item in registros if str(item.get("data", ""))[:10]})
            agregado = {
                "id": f"mensal-api-{mes}",
                "origemAba": "registrosDiarios",
                "dataInicio": datas_validas[0] if datas_validas else f"{mes}-01",
                "dataFinal": datas_validas[-1] if datas_validas else None,
                "diasTrabalhados": len(datas_validas),
            }
            for campo in campos_numericos:
                agregado[campo] = sum(int(item.get(campo, 0) or 0) for item in registros)
            if existente:
                mensais[ mensais.index(existente) ] = agregado
            else:
                mensais.append(agregado)
        mensais.sort(key=lambda item: str(item.get("dataInicio", "")))
        return {"fonte": dados.get("fonte"), "importadoEm": dados.get("importadoEm"), "resumoMensal": mensais, "registrosDiarios": diarios, "totais": dados.get("totais", {}), "totalRegistrosDiarios": len(diarios)}

    def enriquecer_ocorrencia(self, ocorrencia: dict, vitimas_por_caso: dict[str, list[dict]] | None = None, pessoas: dict[str, dict] | None = None, analises: list[dict] | None = None) -> dict:
        """Expõe aliases operacionais sem alterar o JSON oficial da ocorrência."""
        id_caso = ocorrencia.get("id", ocorrencia.get("idCaso"))
        indice_vitimas_fornecido = vitimas_por_caso is not None
        if vitimas_por_caso is None:
            vitimas_por_caso = {}
            for item in self.repositorio.load_list("vitimas"):
                vitimas_por_caso.setdefault(str(item.get("idCaso")), []).append(item)
        if pessoas is None:
            pessoas = {str(item.get("idPessoa")): item for item in self.carregar_registros(ARQUIVO_PESSOAS)}
        vitimas = []
        ids_consulta = {str(id_caso)} if indice_vitimas_fornecido else self.ids_relacionados_caso(id_caso)
        for id_relacionado in ids_consulta:
            vitimas.extend(vitimas_por_caso.get(id_relacionado, []))
        vitimas = list({str(item.get("idVitima", item.get("id"))): item for item in vitimas}.values())
        if analises is None:
            analises = self.carregar_analises_api()
        vitimas = [{**item, "pessoa": pessoas.get(str(item.get("idPessoa")), {}),
                    "statusAtual": classificar_estagio_atendimento(
                        pessoas.get(str(item.get("idPessoa")), {}),
                        [analise for analise in analises if item.get("idPessoa") and
                         str(analise.get("idPessoa")) == str(item["idPessoa"])], [], []
                    )["statusAtual"] or item.get("statusVitima") or item.get("statusAtual")}
                   for item in vitimas]
        nomes = [str(pessoas.get(str(item.get("idPessoa")), {}).get("nomeOriginal") or pessoas.get(str(item.get("idPessoa")), {}).get("nome") or "").strip() for item in vitimas]
        nomes = [item for item in nomes if item]
        talao = ocorrencia.get("talao") or ocorrencia.get("talaoPrincipal") or ocorrencia.get("talaoPMESP") or ocorrencia.get("talao_pm") or ""
        status = ocorrencia.get("status") or ocorrencia.get("statusCaso") or ocorrencia.get("status_caso") or ""
        return {
            **ocorrencia,
            "id": id_caso,
            "idCaso": id_caso,
            "nome": ocorrencia.get("nome") or ocorrencia.get("nome_desaparecido") or (nomes[0] if nomes else "Sem nome"),
            "nome_desaparecido": ocorrencia.get("nome_desaparecido") or ocorrencia.get("nome") or (nomes[0] if nomes else "Sem nome"),
            "talao": talao,
            "talao_pm": ocorrencia.get("talao_pm") or talao,
            "status": status,
            "statusCaso": status,
            "vitimas": vitimas,
            "nomesVitimas": nomes,
        }

    def detalhar_ocorrencia(self, ocorrencia: dict) -> dict:
        registro = self.enriquecer_ocorrencia(ocorrencia)
        ids_pessoas = {str(item["idPessoa"]) for item in registro["vitimas"] if item.get("idPessoa")}
        ids_caso = self.ids_relacionados_caso(registro["id"])
        def relacionado(item: dict) -> bool:
            return (bool(item.get("idCaso")) and str(item["idCaso"]) in ids_caso) or (bool(item.get("idPessoa")) and str(item["idPessoa"]) in ids_pessoas)
        return {**registro,
                "analisesF2": [item for item in self.carregar_analises_api() if relacionado(item)],
                "qualificacoes": [item for item in self.repositorio.load_list("qualificacoes") if relacionado(item)],
                "pistas": [item for item in self.repositorio.load_list("pistas") if relacionado(item)],
                "eventos": [item for item in self.carregar_registros(ARQUIVO_EVENTOS) if relacionado(item)]}

    def enriquecer_ocorrencias(self, ocorrencias: list[dict]) -> list[dict]:
        vitimas_por_caso: dict[str, list[dict]] = {}
        for item in self.repositorio.load_list("vitimas"):
            vitimas_por_caso.setdefault(str(item.get("idCaso")), []).append(item)
        for alias in self.repositorio.load_list("aliasesCasos"):
            atual = str(alias.get("idCasoAtual", ""))
            if not atual:
                continue
            reunidas = list(vitimas_por_caso.get(atual, []))
            for historico in alias.get("idsCasosHistoricos", []):
                reunidas.extend(vitimas_por_caso.get(str(historico), []))
            vitimas_por_caso[atual] = list({str(item.get("idVitima", item.get("id"))): item for item in reunidas}.values())
        pessoas = {str(item.get("idPessoa")): item for item in self.carregar_registros(ARQUIVO_PESSOAS)}
        analises = self.carregar_analises_api()
        return [self.enriquecer_ocorrencia(item, vitimas_por_caso, pessoas, analises) for item in ocorrencias]

    def carregar_historicos_v7(self) -> list[dict]:
        """Lê o recorte V7 importado sem tratá-lo como caso operacional."""
        return self.repositorio.load_list("historicosV7")

    @staticmethod
    def texto_busca(valor: object) -> str:
        return normalizar_busca(valor)

    def listar_fotos_central(self, termo: object = "") -> list[dict]:
        ocorrencias = self.carregar_ocorrencias()
        casos = {str(item.get("id", item.get("idCaso", ""))): item for item in ocorrencias}
        fotos: list[dict] = []
        for arquivo in PASTA_FOTOS.rglob("*"):
            if not arquivo.is_file() or arquivo.name.endswith(".meta.json"):
                continue
            if not (mimetypes.guess_type(arquivo.name)[0] or "").startswith("image/"):
                continue
            relativo = arquivo.relative_to(PASTA_FOTOS).as_posix()
            partes = relativo.split("/", 1)
            metadados = arquivo.with_name(f"{arquivo.name}.meta.json")
            try:
                informacoes = json.loads(metadados.read_text(encoding="utf-8")) if metadados.exists() else {}
            except json.JSONDecodeError:
                informacoes = {}
            id_ocorrencia = str(informacoes.get("idOcorrencia") or partes[0])
            informacoes = metadados_foto_com_fallback(informacoes, id_ocorrencia, partes[-1], ocorrencias)
            caso = casos.get(id_ocorrencia, {})
            nome = informacoes.get("nomeVitima") or informacoes.get("nome") or caso.get("nome") or "Sem nome"
            talao = informacoes.get("talao") or caso.get("talao") or "Sem talão"
            campos = [id_ocorrencia, nome, talao, informacoes.get("dataTalao"), partes[-1], caso.get("nome_desaparecido")]
            if not corresponde_busca(termo, campos):
                continue
            fotos.append({**informacoes, "idOcorrencia": id_ocorrencia, "idCaso": id_ocorrencia, "nome": str(nome).strip(), "talao": str(talao).strip(), "dataTalao": informacoes.get("dataTalao") or "", "nomeArquivo": partes[-1], "url": f"/fotos/{relativo}", "autorizacao": informacoes.get("autorizacao", "Pendente")})
        return fotos

    def buscar_base_unificada(self, consulta: dict[str, list[str]]) -> list[dict]:
        termo = self.texto_busca(" ".join(consulta.get("termo", [""])))
        status = self.texto_busca(" ".join(consulta.get("status", [""])))
        resultados: list[dict] = []
        for caso in self.enriquecer_ocorrencias(self.carregar_ocorrencias()):
            campos = " ".join(str(caso.get(chave, "")) for chave in ("id", "idCaso", "nome", "nome_desaparecido", "talao", "talao_pm", "talaoPrincipal", "status", "statusCaso", "cpf", "rg", "telefone", "nomeSolicitante", "solicitante")).casefold()
            status_caso = self.texto_busca(caso.get("status") or caso.get("statusCaso"))
            if termo and termo not in campos:
                continue
            if status and status_caso != status:
                continue
            resultados.append({**caso, "tipoRegistro": "CASO_OPERACIONAL", "origemBase": "BASE_CENTRAL"})
        for historico in self.carregar_historicos_v7():
            pessoas = historico.get("pessoas") if isinstance(historico.get("pessoas"), list) else []
            nomes = " ".join(str(item.get("nome", "")) for item in pessoas if isinstance(item, dict))
            taloes = " ".join(str(item) for item in historico.get("taloes", []) if item is not None)
            campos = " ".join(str(historico.get(chave, "")) for chave in ("idCasoHistorico", "categoriaOriginal", "categoriaAdministrativa", "statusNoCaso", "comoFoiEncontrada", "ondeFoiEncontrada", "acoesBusca")) + " " + nomes + " " + taloes
            status_historico = self.texto_busca(historico.get("statusNoCaso"))
            if termo and termo not in campos.casefold():
                continue
            if status and status_historico != status:
                continue
            resultados.append({
                **historico,
                "id": historico.get("idCasoHistorico"),
                "idCaso": historico.get("idCasoCentralCandidato"),
                "nome": nomes or "Sem nome",
                "talao": taloes,
                "status": historico.get("statusNoCaso"),
                "statusCaso": historico.get("statusNoCaso"),
                "tipoRegistro": "HISTORICO_V7",
                "origemBase": "V7_ATRIBUICAO_CAUSAL",
            })
        return resultados[:500]

    def indicadores_centrais(self, consulta: dict[str, list[str]] | None = None) -> dict:
        """Calcula o resumo do Dashboard diretamente dos JSONs centrais."""
        consulta = consulta or {}
        pessoas = self.repositorio.load_list("pessoas")
        casos = self.repositorio.load_list("casos")
        analises = self.repositorio.load_list("analisesF2")
        eventos = self.repositorio.load_list("eventos")
        historicos = self.carregar_historicos_v7()
        metadados = self.repositorio.load_object("metadados")
        v7 = metadados.get("historicoV7") if isinstance(metadados.get("historicoV7"), dict) else {}
        inicio = (consulta.get("inicio") or [""])[0]
        fim = (consulta.get("fim") or [""])[0]

        def no_periodo(item: dict, campos: tuple[str, ...]) -> bool:
            if not inicio and not fim:
                return True
            valor = next((str(item.get(campo) or "")[:10] for campo in campos if item.get(campo)), "")
            return bool(valor) and (not inicio or valor >= inicio) and (not fim or valor <= fim)

        pessoas_periodo = [item for item in pessoas if no_periodo(item, ("ultimoRegistro", "primeiroRegistro"))]
        eventos_periodo = [item for item in eventos if no_periodo(item, ("dataEvento", "dataContato"))]
        analises_periodo = [item for item in analises if no_periodo(item, ("data", "dataHoraAnalise"))]

        def texto(item: dict, *campos: str) -> str:
            return normalizar_busca(" ".join(str(item.get(campo) or "") for campo in campos))

        def categoria_caso(item: dict) -> str:
            if normalizar_busca(item.get("vultoImprensa")) in {"sim", "true", "1"}:
                return "vultoOutros"
            return classificar_categoria_dashboard(texto(item, "categoriaAdministrativa", "desfechoCaso", "resultadoLocalizacao", "recursoLocalizacao", "observacoesLocalizacao"))

        def caso_finalizado(item: dict) -> bool:
            valores = texto(item, "finalizado", "statusCaso", "status", "statusVitima", "desfechoCaso", "resultadoLocalizacao")
            return bool(item.get("finalizado") or any(chave in valores for chave in ("encerrado", "localizada", "localizado", "obito", "morta", "preso")))

        casos_periodo = [item for item in casos if no_periodo(item, ("dataHoraLocalizacao", "dataEncerramento", "atualizado_em", "criado_em"))]
        casos_finalizados = [item for item in casos_periodo if caso_finalizado(item)]

        status_localizados = {"LOCALIZADO", "LOCALIZADO_CUSTODIA", "LOCALIZADO_SEM_VIDA"}
        status_pessoas = [str(item.get("statusPessoa") or "").upper() for item in pessoas_periodo]
        localizados = sum(status in status_localizados for status in status_pessoas)
        desaparecidos = sum(status not in status_localizados for status in status_pessoas)
        localizados_custodia = status_pessoas.count("LOCALIZADO_CUSTODIA")
        localizados_sem_vida = status_pessoas.count("LOCALIZADO_SEM_VIDA")
        retorno_espontaneo = sum(any(palavra in texto(item, "obsI", "evidenciaStatus", "observacoes") for palavra in ("retornou", "retorno", "chegou em casa")) for item in eventos_periodo)

        status_atendimento = [str(item.get("statusAtendimento") or "").upper() for item in pessoas_periodo]
        em_acompanhamento = status_atendimento.count("EM_ACOMPANHAMENTO")
        encerrados = status_atendimento.count("ENCERRADO")
        em_pesquisa = len(status_atendimento) - em_acompanhamento - encerrados

        categorias_v7 = v7.get("categoriasAdministrativas", []) if isinstance(v7.get("categoriasAdministrativas"), list) else []
        historicos_periodo = [item for item in historicos if no_periodo(item, ("data",))]
        definicoes = [("cabine", "LOCALIZAÇÃO DIRETA PELA EQUIPE MURALHA", "amarelo"), ("vtr", "LOCALIZAÇÃO COM APOIO DE VTR", "azul"), ("vultoOutros", "VULTO / IMPRENSA E OUTROS", "vermelho"), ("preso", "LOCALIZAÇÃO COM RESULTADO PRISÃO", "laranja"), ("obito", "LOCALIZAÇÃO COM RESULTADO ÓBITO", "cinza")]
        if historicos_periodo:
            categorias = [{"id": id_categoria, "valor": sum(classificar_historico_dashboard(item) == id_categoria for item in historicos_periodo), "titulo": titulo, "cor": cor} for id_categoria, titulo, cor in definicoes]
            total_dashboard = sum(item["valor"] for item in categorias)
            ids_historicos_vinculados = {str(pessoa.get("idCasoCentralCandidato")) for item in historicos_periodo for pessoa in (item.get("pessoas") if isinstance(item.get("pessoas"), list) else []) if pessoa.get("idCasoCentralCandidato")}
            casos_novos_finalizados = [item for item in casos_finalizados if item.get("finalizado") is True and str(item.get("id", item.get("idCaso"))) not in ids_historicos_vinculados]
            for categoria in categorias:
                categoria["valor"] += sum(categoria_caso(item) == categoria["id"] for item in casos_novos_finalizados)
            total_dashboard += len(casos_novos_finalizados)
        elif v7.get("categoriasAdministrativas") and not inicio and not fim:
            categorias_v7 = v7.get("categoriasAdministrativas", [])
            categorias = [{"id": id_categoria, "valor": int(categorias_v7[indice].get("quantidade", 0)) if indice < len(categorias_v7) else 0, "titulo": titulo, "cor": cor} for indice, (id_categoria, titulo, cor) in enumerate(definicoes)]
        else:
            localizados_eventos = [item for item in eventos_periodo if str(item.get("statusDerivado") or "").upper() in status_localizados]
            categorias = [{"id": "cabine", "valor": sum("cabine" in texto(item, "obsE", "obsI", "colunaJOriginal") or "muralha" in texto(item, "obsE", "obsI", "colunaJOriginal") for item in localizados_eventos), "titulo": "LOCALIZAÇÃO DIRETA PELA EQUIPE MURALHA", "cor": "amarelo"}, {"id": "vtr", "valor": sum("vtr" in texto(item, "obsE", "obsI", "colunaJOriginal") for item in localizados_eventos), "titulo": "LOCALIZAÇÃO COM APOIO DE VTR", "cor": "azul"}, {"id": "vultoOutros", "valor": sum(classificar_categoria_dashboard(texto(item, "obsE", "obsI", "colunaJOriginal")) == "vultoOutros" for item in localizados_eventos), "titulo": "VULTO / IMPRENSA E OUTROS", "cor": "vermelho"}, {"id": "preso", "valor": localizados_custodia, "titulo": "LOCALIZAÇÃO COM RESULTADO PRISÃO", "cor": "laranja"}, {"id": "obito", "valor": localizados_sem_vida, "titulo": "LOCALIZAÇÃO COM RESULTADO ÓBITO", "cor": "cinza"}]
        if not historicos_periodo:
            for categoria in categorias:
                categoria["valor"] += sum(categoria_caso(item) == categoria["id"] for item in casos_finalizados)
        if not historicos_periodo:
            total_dashboard = (int(v7.get("totalAdministrativo", len(historicos))) + len(casos_finalizados)) if not inicio and not fim else sum(item["valor"] for item in categorias)
        divisor = total_dashboard or 1
        for item in categorias:
            item["percentual"] = item["valor"] / divisor * 100

        return {"ok": True, "fonte": "BASE_CENTRAL_API", "totais": {"pessoas": len(pessoas_periodo), "casos": len(casos), "analisesF2": len(analises_periodo), "eventos": len(eventos_periodo)}, "status": {"desaparecidos": desaparecidos, "localizados": localizados, "localizadosCustodia": localizados_custodia, "localizadosSemVida": localizados_sem_vida, "retornoEspontaneo": retorno_espontaneo}, "atendimentos": {"emPesquisa": em_pesquisa, "emAcompanhamento": em_acompanhamento, "encerrados": encerrados}, "baseCentral": {"totalCasos": len(casos), "casosAtivos": sum(str(item.get("statusCaso") or "").upper() != "ENCERRADO" for item in casos)}, "historicoV7": {"totalRegistros": int(v7.get("totalAdministrativo", len(historicos))), "registrosIndividualizados": len(historicos), "categorias": categorias_v7, "dataReferencia": v7.get("dataReferencia"), "naoSomarAoCentral": True, "fonte": v7.get("fonte")}, "totalRegistrosPesquisaveis": len(casos) + len(historicos), "dashboardOperacional": {"total": total_dashboard, "categorias": categorias, "periodo": {"inicio": inicio or v7.get("dataReferencia") or "", "fim": fim or v7.get("dataReferencia") or ""}}}

    def salvar_ocorrencias(self, ocorrencias: list) -> None:
        self.repositorio.save_list("casos", ocorrencias)

    def carregar_registros(self, arquivo: Path) -> list:
        colecao = self.colecao_por_arquivo(arquivo)
        return self.repositorio.load_list(colecao)

    def carregar_pessoas_api(self) -> list:
        return [self.normalizar_pessoa(item) for item in self.carregar_registros(ARQUIVO_PESSOAS)]

    def carregar_analises_api(self) -> list:
        return [self.normalizar_analise_f2(item) for item in self.carregar_registros(ARQUIVO_ANALISES)]

    @staticmethod
    def normalizar_pessoa(pessoa: dict) -> dict:
        """Adapta aliases da base unificada para o contrato da API sem gravar por cima dela."""
        resultado = dict(pessoa)
        resultado.setdefault("nome", resultado.get("nomeOriginal", ""))
        documentos = resultado.get("documentos") if isinstance(resultado.get("documentos"), list) else []
        for documento in documentos:
            if not isinstance(documento, dict):
                continue
            tipo = str(documento.get("tipo", "")).lower()
            valor = documento.get("valor", documento.get("numero", ""))
            if tipo == "cpf":
                resultado.setdefault("cpf", valor)
            if tipo == "rg":
                resultado.setdefault("rg", valor)
        return resultado

    @staticmethod
    def normalizar_analise_f2(analise: dict) -> dict:
        """Lê tanto o contrato atual quanto os aliases já presentes na base preparada."""
        resultado = dict(analise)
        resultado.setdefault("idAnalise", resultado.get("idAnaliseF2", ""))
        resultado.setdefault("dataHoraAnalise", resultado.get("data", ""))
        resultado.setdefault("dataTalao", resultado.get("data", ""))
        resultado.setdefault("talao", resultado.get("bopmOriginal", ""))
        resultado.setdefault("nomeSolicitante", resultado.get("solicitante", ""))
        resultado.setdefault("historicoF2", resultado.get("observacoes", ""))
        resultado.setdefault("situacaoInformada", resultado.get("situacaoInformada"))
        resultado.setdefault("marcadoresAndamento", {})
        return resultado

    def salvar_registros(self, arquivo: Path, registros: list) -> None:
        self.repositorio.save_list(self.colecao_por_arquivo(arquivo), registros)

    @property
    def repositorio(self) -> JsonStorageRepository:
        if REPOSITORIO is None:
            raise RuntimeError("Repositório central não inicializado")
        return REPOSITORIO

    def colecao_por_arquivo(self, arquivo: Path) -> str:
        por_nome = {"pessoas.json": "pessoas", "casos.json": "casos", "vitimas.json": "vitimas", "eventos.json": "eventos", "analises-f2.json": "analisesF2", "qualificacoes.json": "qualificacoes", "pistas.json": "pistas", "taloes.json": "taloes", "atribuicoes.json": "atribuicoes", "historicos-v7.json": "historicosV7"}
        if arquivo.name in por_nome:
            return por_nome[arquivo.name]
        raise KeyError(f"Arquivo fora do repositório: {arquivo}")

    def registrar_evento(self, evento: dict) -> dict:
        evento = {"idEvento": self.repositorio.next_id("eventos", "EVT", "idEvento"), **evento, "dataHora": evento.get("dataHora") or agora()}
        resultado = self.repositorio.append("eventos", evento)
        arquivo_log = PASTA_LOGS / f"auditoria-{datetime.now(timezone.utc).strftime('%Y-%m')}.jsonl"
        with arquivo_log.open("a", encoding="utf-8") as log:
            log.write(json.dumps({"timestamp": resultado["dataHora"], "operador": resultado.get("operador", ""), "acao": resultado.get("tipoEvento", ""), "entidadeTipo": "ANALISE_F2" if resultado.get("idAnalise") else "PESSOA", "entidadeId": resultado.get("idAnalise") or resultado.get("idPessoa")}, ensure_ascii=False) + "\n")
        return resultado

    def atualizar_metadados(self) -> None:
        metadados = self.repositorio.load_object("metadados")
        metadados.update({
            "schemaVersion": SCHEMA_VERSION,
            "totalPessoas": len(self.repositorio.load_list("pessoas")),
            "totalCasos": len(self.repositorio.load_list("casos")),
            "totalEventos": len(self.repositorio.load_list("eventos")),
        })
        self.repositorio.save_object("metadados", metadados)

    def calcular_status_pessoa(self, id_pessoa: str):
        analises = [item for item in self.carregar_analises_api() if str(item.get("idPessoa")) == str(id_pessoa) and item.get("situacaoInformada")]
        analises.sort(key=lambda item: str(item.get("dataHoraAnalise", "")))
        return analises[-1].get("situacaoInformada") if analises else None

    def ler_corpo_json(self) -> dict:
        tamanho = int(self.headers.get("Content-Length", 0))
        corpo = self.rfile.read(tamanho)
        valor = json.loads(corpo.decode("utf-8"))
        if not isinstance(valor, dict):
            raise ValueError("O corpo deve ser um objeto JSON")
        return valor

    def localizar_id(self, caminho: str):
        partes = [unquote(parte) for parte in urlparse(caminho).path.split("/") if parte]
        if len(partes) == 2 and partes[0] == "api" and partes[1] == "ocorrencias":
            return None
        if len(partes) == 3 and partes[0] == "api" and partes[1] == "ocorrencias":
            return int(partes[2])
        return None

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self) -> None:
        caminho = urlparse(self.path).path
        consulta = parse_qs(urlparse(self.path).query)
        if caminho == "/api/status":
            metadados = self.repositorio.load_object("metadados")
            casos = self.repositorio.load_list("casos")
            self.enviar_json({"online": True, "sistema": "Cabine Verde", "schemaVersion": metadados.get("schemaVersion"), "databaseInitialized": True, "databaseWritable": os.access(BASE_DIR, os.W_OK), "dataRoot": str(BASE_DIR), "totalPessoas": len(self.repositorio.load_list("pessoas")), "totalCasos": len(casos), "casosAtivos": len([item for item in casos if item.get("statusAtendimento") != "ENCERRADO"]), "totalEventos": len(self.repositorio.load_list("eventos")), "servidor": self.server.server_address[0], "hora": agora()})
            return
        if caminho == "/api/indicadores":
            self.enviar_json(self.indicadores_centrais(consulta))
            return
        if caminho == "/api/producao-diaria":
            self.enviar_json(self.consultar_producao_diaria(consulta))
            return
        if caminho == "/api/consulta/producao-consolidada":
            self.enviar_json(self.consultar_producao_consolidada(consulta))
            return
        if caminho == "/api/busca":
            self.enviar_json(self.buscar_base_unificada(consulta))
            return
        if caminho == "/api/pessoas/busca":
            termo = " ".join(consulta.get("termo", [""])).strip().lower()
            data_talao = " ".join(consulta.get("dataTalao", [""])).strip()
            talao = " ".join(consulta.get("talao", [""])).strip().lower()
            filtro_status = " ".join(consulta.get("status", [""])).strip().upper()
            filtro_condicao = " ".join(consulta.get("condicao", [""])).strip().upper()
            filtro_estagio = " ".join(consulta.get("estagio", [""])).strip().upper()
            filtro_contato = " ".join(consulta.get("contato", [""])).strip().upper()
            pessoas = self.carregar_pessoas_api()
            analises = self.carregar_analises_api()
            qualificacoes = self.repositorio.load_list("qualificacoes")
            eventos = self.carregar_registros(ARQUIVO_EVENTOS)
            resultados = []
            for pessoa in pessoas:
                campos = " ".join(str(pessoa.get(chave, "")) for chave in ("nome", "cpf", "rg", "telefone")).lower()
                relacionados = [item for item in analises if str(item.get("idPessoa")) == str(pessoa.get("idPessoa"))]
                qualificacoes_pessoa = [item for item in qualificacoes if str(item.get("idPessoa")) == str(pessoa.get("idPessoa"))]
                eventos_pessoa = [item for item in eventos if str(item.get("idPessoa")) == str(pessoa.get("idPessoa"))]
                classificacao = classificar_estagio_atendimento(pessoa, relacionados, qualificacoes_pessoa, eventos_pessoa)
                campos_analises = " ".join(str(item.get(chave, "")) for item in relacionados for chave in ("nome", "cpf", "rg", "telefone", "nomeSolicitante", "telefoneSolicitante", "natureza", "historicoF2", "endereco", "sentidoTomado", "caracteristicasBasicas")).lower()
                coincide_talao = any((not data_talao or item.get("dataTalao") == data_talao) and (not talao or str(item.get("talao", "")).lower() == talao) for item in relacionados)
                coincide_texto = termo and (termo in campos or termo in campos_analises)
                coincide_filtros = (
                    (not filtro_status or str(classificacao.get("statusAtual") or "").upper() == filtro_status)
                    and (not filtro_condicao or classificacao["condicao"] == filtro_condicao)
                    and (not filtro_estagio or classificacao["estagioAtendimento"] == filtro_estagio)
                    and (not filtro_contato or (filtro_contato == "SIM" and classificacao["temContatoTelefonico"]) or (filtro_contato == "NAO" and not classificacao["temContatoTelefonico"]))
                )
                if (coincide_texto or (data_talao and talao and coincide_talao) or (not termo and not data_talao and not talao)) and coincide_filtros:
                    resultados.append({**pessoa, **classificacao, "ultimaAnalise": max(relacionados, key=lambda item: str(item.get("dataHoraAnalise") or item.get("data") or ""), default=None)})
            self.enviar_json(resultados[:50])
            return
        if caminho == "/api/analises":
            id_pessoa = " ".join(consulta.get("idPessoa", [""])).strip()
            analises = self.carregar_analises_api()
            if id_pessoa:
                analises = [item for item in analises if str(item.get("idPessoa")) == id_pessoa]
            analises.sort(key=lambda item: str(item.get("dataHoraAnalise", "")), reverse=True)
            self.enviar_json(analises)
            return
        if caminho == "/api/eventos":
            id_pessoa = " ".join(consulta.get("idPessoa", [""])).strip()
            id_caso = " ".join(consulta.get("idCaso", [""])).strip()
            eventos = self.carregar_registros(ARQUIVO_EVENTOS)
            if id_pessoa:
                eventos = [item for item in eventos if str(item.get("idPessoa")) == id_pessoa]
            if id_caso:
                eventos = [item for item in eventos if str(item.get("idCaso")) == id_caso]
            eventos.sort(key=lambda item: str(item.get("dataHora", "")), reverse=True)
            self.enviar_json(eventos)
            return
        if caminho in ("/api/qualificacoes", "/api/pistas"):
            colecao = "qualificacoes" if caminho.endswith("qualificacoes") else "pistas"
            id_pessoa = " ".join(consulta.get("idPessoa", [""])).strip()
            registros = self.repositorio.load_list(colecao)
            if id_pessoa:
                registros = [item for item in registros if str(item.get("idPessoa")) == id_pessoa]
            self.enviar_json(registros)
            return
        if caminho == "/api/vitimas":
            id_caso = " ".join(consulta.get("idCaso", [""])).strip()
            id_pessoa = " ".join(consulta.get("idPessoa", [""])).strip()
            vitimas = self.repositorio.load_list("vitimas")
            if id_caso:
                ids_caso = self.ids_relacionados_caso(id_caso)
                vitimas = [item for item in vitimas if str(item.get("idCaso")) in ids_caso]
            if id_pessoa:
                vitimas = [item for item in vitimas if str(item.get("idPessoa")) == id_pessoa]
            vitimas.sort(key=lambda item: (int(item.get("ordem", 0) or 0), str(item.get("atualizadoEm", ""))))
            self.enviar_json([{**item, "id": item.get("id", item.get("idVitima"))} for item in vitimas])
            return
        if caminho.startswith("/api/analises/"):
            id_analise = unquote(caminho.rsplit("/", 1)[1])
            registro = next((item for item in self.carregar_analises_api() if str(item.get("idAnalise")) == id_analise), None)
            self.enviar_json(registro if registro else {"erro": "Análise F2 não encontrada"}, 200 if registro else 404)
            return
        if caminho == "/api/ocorrencias":
            try:
                with LOCK_ESCRITA:
                    self.enviar_json(self.enriquecer_ocorrencias(self.carregar_ocorrencias()))
            except Exception as erro:
                self.enviar_erro(str(erro), 500)
            return
        if caminho == "/api/fotos":
            self.enviar_json(self.listar_fotos_central(" ".join(consulta.get("termo", [""]))))
            return
        if caminho.startswith("/api/ocorrencias/"):
            try:
                id_texto = unquote(caminho.rsplit("/", 1)[1])
                id_ocorrencia = int(id_texto) if id_texto.isdigit() else id_texto
                ocorrencias = self.carregar_ocorrencias()
                registro = next((item for item in ocorrencias if str(item.get("id", item.get("idCaso"))) == str(id_ocorrencia)), None)
                if registro is None:
                    registro = next((item for item in self.carregar_historicos_v7() if str(item.get("idCasoHistorico")) == str(id_ocorrencia)), None)
                    if registro is not None:
                        pessoas = registro.get("pessoas") if isinstance(registro.get("pessoas"), list) else []
                        registro = {**registro, "id": registro.get("idCasoHistorico"), "idCaso": registro.get("idCasoCentralCandidato"), "nome": " ".join(str(item.get("nome", "")) for item in pessoas), "talao": " / ".join(str(item) for item in registro.get("taloes", [])), "status": registro.get("statusNoCaso"), "tipoRegistro": "HISTORICO_V7", "origemBase": "V7_ATRIBUICAO_CAUSAL"}
                self.enviar_json(self.detalhar_ocorrencia(registro) if registro else {"erro": "Ocorrência não encontrada"}, 200 if registro else 404)
            except ValueError:
                self.enviar_erro("ID inválido", 400)
            return
        if caminho.startswith("/fotos/") or caminho.startswith("/documentos/"):
            pasta = PASTA_FOTOS if caminho.startswith("/fotos/") else PASTA_DOCUMENTOS
            relativo = unquote(caminho.split("/", 2)[2])
            arquivo = (pasta / relativo).resolve()
            if not str(arquivo).startswith(str(pasta.resolve()) + os.sep) or not arquivo.is_file():
                self.enviar_erro("Arquivo não encontrado", 404)
                return
            self.send_response(200)
            self.send_header("Content-Type", mimetypes.guess_type(arquivo.name)[0] or "application/octet-stream")
            self.send_header("Content-Length", str(arquivo.stat().st_size))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            with arquivo.open("rb") as origem:
                shutil.copyfileobj(origem, self.wfile)
            return
        self.enviar_erro("Rota não encontrada", 404)

    def do_POST(self) -> None:
        caminho = urlparse(self.path).path
        try:
            dados = self.ler_corpo_json()
            if caminho == "/api/producao-diaria":
                if any(not str(dados.get(campo, "")).strip() for campo in ("data", "operadorEmail", "operadorNome")):
                    self.enviar_erro("Data e operador são obrigatórios", 400)
                    return
                with LOCK_ESCRITA:
                    existentes = self.consultar_producao_diaria({"inicio": [str(dados["data"])], "fim": [str(dados["data"])], "operadorEmail": [str(dados["operadorEmail"])]})
                    if existentes:
                        self.enviar_erro("Produção já cadastrada para esta data e operador; use PUT para atualizar", 409)
                        return
                    registro = self.normalizar_producao_diaria(dados, self.repositorio.next_id("producaoDiaria", "PD", "id"))
                    self.repositorio.append("producaoDiaria", registro)
                self.enviar_json(registro, 201)
                return
            if caminho == "/api/pessoas":
                nome = str(dados.get("nome", "")).strip()
                if not nome:
                    self.enviar_erro("Nome da pessoa é obrigatório", 400)
                    return
                with LOCK_ESCRITA:
                    pessoas = self.carregar_registros(ARQUIVO_PESSOAS)
                    pessoa = {"idPessoa": self.repositorio.next_id("pessoas", "PES", "idPessoa"), "nome": nome, "cpf": str(dados.get("cpf", "")).strip(), "rg": str(dados.get("rg", "")).strip(), "dataNascimento": str(dados.get("dataNascimento", "")).strip(), "telefone": str(dados.get("telefone", "")).strip(), "statusPessoa": None, "statusAtual": None, "statusAtendimento": "TRIAGEM_NAO_INICIADA", "situacaoOperacional": "REQUER_ACAO", "criadoEm": agora(), "atualizadoEm": agora()}
                    pessoas.append(pessoa)
                    self.salvar_registros(ARQUIVO_PESSOAS, pessoas)
                    self.registrar_evento({"idPessoa": pessoa["idPessoa"], "idAnalise": None, "tipoEvento": "PESSOA_CRIADA", "campoAlterado": None, "valorAnterior": None, "valorNovo": pessoa["nome"], "operador": str(dados.get("operador", "")), "origem": "ANALISE_F2", "observacao": "Pessoa criada para uma nova análise F2"})
                    self.atualizar_metadados()
                self.enviar_json(pessoa, 201)
                return
            if caminho == "/api/analises":
                obrigatorios = ("idPessoa", "dataHoraAnalise", "dataTalao", "talao", "operador")
                if any(not str(dados.get(chave, "")).strip() for chave in obrigatorios):
                    self.enviar_erro("Pessoa, data/hora da análise, data/talão e operador são obrigatórios", 400)
                    return
                with LOCK_ESCRITA:
                    analises = self.carregar_registros(ARQUIVO_ANALISES)
                    chave_talao = f"{dados['dataTalao']}_{dados['talao']}"
                    if any(item.get("chaveTalao") == chave_talao for item in analises):
                        self.enviar_erro("Já existe uma análise para esta data e talão", 409)
                        return
                    analise = {"idAnalise": self.repositorio.next_id("analisesF2", "F2", "idAnalise"), "origemEntrada": "ANALISE_F2", "dataHoraAnalise": str(dados["dataHoraAnalise"]), "dataTalao": str(dados["dataTalao"]), "horaTalao": str(dados.get("horaTalao", "")), "talao": str(dados["talao"]), "chaveTalao": chave_talao, "idPessoa": str(dados["idPessoa"]), "idCaso": dados.get("idCaso"), "nome": str(dados.get("nome", "")), "cpf": str(dados.get("cpf", "")), "rg": str(dados.get("rg", "")), "telefone": str(dados.get("telefone", "")), "nomeSolicitante": str(dados.get("nomeSolicitante", "")), "telefoneSolicitante": str(dados.get("telefoneSolicitante", "")), "natureza": str(dados.get("natureza", "")), "caracteristicasBasicas": str(dados.get("caracteristicasBasicas", "")), "endereco": str(dados.get("endereco", "")), "sentidoTomado": str(dados.get("sentidoTomado", "")), "historicoF2": str(dados.get("historicoF2", "")), "observacoes": str(dados.get("observacoes", "")), "situacaoInformada": dados.get("situacaoInformada") or None, "marcadoresAndamento": dados.get("marcadoresAndamento") if isinstance(dados.get("marcadoresAndamento"), dict) else {}, "origem": str(dados.get("origem", "ANALISE_F2")), "operador": str(dados["operador"]), "criadoEm": agora(), "atualizadoEm": agora()}
                    analises.append(analise)
                    self.salvar_registros(ARQUIVO_ANALISES, analises)
                    pessoas = self.carregar_registros(ARQUIVO_PESSOAS)
                    pessoa = next((item for item in pessoas if str(item.get("idPessoa")) == analise["idPessoa"]), None)
                    if pessoa:
                        pessoa["statusPessoa"] = self.calcular_status_pessoa(analise["idPessoa"])
                        pessoa["statusAtual"] = pessoa["statusPessoa"]
                        pessoa["statusAtendimento"] = "EM_PESQUISA"
                        pessoa["situacaoOperacional"] = "LOCALIZADO" if pessoa["statusPessoa"] and pessoa["statusPessoa"].startswith("LOCALIZADO") else "REQUER_ACAO"
                        pessoa["atualizadoEm"] = agora()
                        self.salvar_registros(ARQUIVO_PESSOAS, pessoas)
                    self.registrar_evento({"idPessoa": analise["idPessoa"], "idAnalise": analise["idAnalise"], "tipoEvento": "ANALISE_F2_CRIADA", "campoAlterado": None, "valorAnterior": None, "valorNovo": analise["situacaoInformada"], "operador": analise["operador"], "origem": analise["origem"], "observacao": "Pesquisa F2 registrada"})
                    self.atualizar_metadados()
                self.enviar_json(analise, 201)
                return
            if caminho == "/api/eventos":
                with LOCK_ESCRITA:
                    evento = self.registrar_evento(dados)
                    self.atualizar_metadados()
                self.enviar_json(evento, 201)
                return
            if caminho in ("/api/qualificacoes", "/api/pistas"):
                colecao = "qualificacoes" if caminho.endswith("qualificacoes") else "pistas"
                prefixo = "QLF" if colecao == "qualificacoes" else "PST"
                campo_id = "idQualificacao" if colecao == "qualificacoes" else "idPista"
                with LOCK_ESCRITA:
                    registro = {campo_id: self.repositorio.next_id(colecao, prefixo, campo_id), **dados, "dataHora": dados.get("dataHora") or agora()}
                    self.repositorio.append(colecao, registro)
                    self.registrar_evento({"idPessoa": registro.get("idPessoa"), "idAnalise": registro.get("idAnalise"), "tipoEvento": "QUALIFICACAO" if colecao == "qualificacoes" else "PISTA_IDENTIFICADA", "campoAlterado": None, "valorAnterior": None, "valorNovo": registro, "operador": registro.get("operador", ""), "origem": registro.get("origem", colecao.upper()), "observacao": "Registro operacional criado"})
                    self.atualizar_metadados()
                self.enviar_json(registro, 201)
                return
            if caminho == "/api/vitimas":
                id_caso = str(dados.get("idCaso", "")).strip()
                if not id_caso:
                    self.enviar_erro("Caso é obrigatório", 400)
                    return
                with LOCK_ESCRITA:
                    vitimas = self.repositorio.load_list("vitimas")
                    ordens = [int(item.get("ordem", 0) or 0) for item in vitimas if str(item.get("idCaso")) == id_caso]
                    ordem = int(dados.get("ordem") or (max(ordens, default=0) + 1))
                    registro = {
                        "idVitima": self.repositorio.next_id("vitimas", "VIT", "idVitima"),
                        "idCaso": id_caso,
                        "idPessoa": dados.get("idPessoa"),
                        "ordem": ordem,
                        "nome": str(dados.get("nome", "")).strip(),
                        "respostasArvore": dados.get("respostasArvore") if isinstance(dados.get("respostasArvore"), dict) else {},
                        "complementosArvore": dados.get("complementosArvore") if isinstance(dados.get("complementosArvore"), dict) else {},
                        "ultimaEdicaoArvore": dados.get("ultimaEdicaoArvore") if isinstance(dados.get("ultimaEdicaoArvore"), dict) else None,
                        "criadoEm": agora(),
                        "atualizadoEm": agora(),
                    }
                    vitimas.append(registro)
                    self.repositorio.save_list("vitimas", vitimas)
                    self.atualizar_metadados()
                self.enviar_json({**registro, "id": registro["idVitima"]}, 201)
                return
            if caminho == "/api/ocorrencias":
                with LOCK_ESCRITA:
                    ocorrencias = self.carregar_ocorrencias()
                    ids_numericos = [int(item.get("id")) for item in ocorrencias if str(item.get("id", "")).isdigit()]
                    novo_id = dados.get("id") or (max(ids_numericos, default=0) + 1)
                    if any(str(item.get("id")) == str(novo_id) for item in ocorrencias):
                        self.enviar_json({"erro": "HTTP 409: Ocorrência já cadastrada", "id": novo_id}, 409)
                        return
                    dados["id"] = novo_id
                    dados["criado_em"] = agora()
                    dados["atualizado_em"] = dados["criado_em"]
                    ocorrencias.append(dados)
                    self.salvar_ocorrencias(ocorrencias)
                    self.registrar_evento({"idCaso": str(novo_id), "tipoEvento": "CASO_190_CRIADO", "campoAlterado": None, "valorAnterior": None, "valorNovo": dados, "operador": str(dados.get("operador", "")), "origem": str(dados.get("origemEntrada", "CASO_190")), "observacao": "Novo caso registrado pela entrada formal via 190"})
                self.enviar_json(dados, 201)
                return
            if caminho == "/api/fotos/consentimento":
                url = str(dados.get("url", ""))
                partes = [unquote(parte) for parte in url.split("/") if parte]
                if len(partes) < 3 or partes[0] != "fotos":
                    self.enviar_erro("Imagem central inválida", 400)
                    return
                arquivo = PASTA_FOTOS.joinpath(*partes[1:]).resolve()
                if not str(arquivo).startswith(str(PASTA_FOTOS.resolve()) + os.sep) or not arquivo.is_file():
                    self.enviar_erro("Imagem não encontrada", 404)
                    return
                autorizacao = str(dados.get("autorizacao", "")).strip()
                if autorizacao not in {"Sim", "Não", "Não informado"}:
                    self.enviar_erro("Autorização inválida", 400)
                    return
                metadados = arquivo.with_name(f"{arquivo.name}.meta.json")
                informacoes = json.loads(metadados.read_text(encoding="utf-8")) if metadados.exists() else {}
                informacoes.update({"autorizacao": autorizacao, "autorizacaoRegistradaEm": agora()})
                metadados.write_text(json.dumps(informacoes, ensure_ascii=False), encoding="utf-8")
                self.enviar_json({"ok": True, **informacoes})
                return
            if caminho == "/api/fotos" or caminho == "/api/documentos":
                pasta = PASTA_FOTOS if caminho == "/api/fotos" else PASTA_DOCUMENTOS
                conteudo = base64.b64decode(str(dados.get("conteudoBase64", "")), validate=True)
                nome = Path(str(dados.get("nomeArquivo", "arquivo.bin"))).name
                id_referencia = str(dados.get("idOcorrencia", "sem-id"))
                metadados_foto = {"idOcorrencia": id_referencia, "idCaso": id_referencia, "nomeArquivo": nome, "nome": str(dados.get("nome", "")).strip(), "dataTalao": str(dados.get("dataTalao", "")).strip(), "talao": str(dados.get("talao", "")).strip(), "operador": str(dados.get("operador", "sessao-local")).strip(), "inseridoEm": str(dados.get("inseridoEm", agora())), "autorizacao": "Pendente"}
                if pasta == PASTA_FOTOS:
                    chave_pasta = f"{nome_seguro_arquivo(metadados_foto['dataTalao'], 'SEM-DATA')}_{nome_seguro_arquivo(metadados_foto['talao'], 'SEM-TALAO')}_{nome_seguro_arquivo(metadados_foto['nome'], 'SEM-NOME')}"
                    destino_dir = pasta / chave_pasta
                else:
                    destino_dir = pasta / id_referencia
                destino_dir.mkdir(parents=True, exist_ok=True)
                destino = destino_dir / nome
                if destino.exists():
                    nome = f"{Path(nome).stem}_{uuid.uuid4().hex[:8]}{Path(nome).suffix}"
                    metadados_foto["nomeArquivo"] = nome
                    destino = destino_dir / nome
                destino.write_bytes(conteudo)
                destino.with_name(f"{nome}.meta.json").write_text(json.dumps(metadados_foto, ensure_ascii=False), encoding="utf-8")
                prefixo = "fotos" if pasta == PASTA_FOTOS else "documentos"
                pasta_url = destino_dir.name
                self.enviar_json({"ok": True, **metadados_foto, "url": f"/{prefixo}/{pasta_url}/{nome}"}, 201)
                return
            self.enviar_erro("Rota não encontrada", 404)
        except (json.JSONDecodeError, ValueError, base64.binascii.Error) as erro:
            self.enviar_erro(f"Dados inválidos: {erro}", 400)
        except Exception as erro:
            self.enviar_erro(str(erro), 500)

    def do_PUT(self) -> None:
        if urlparse(self.path).path.startswith("/api/producao-diaria/"):
            self.atualizar_producao_diaria()
            return
        if urlparse(self.path).path.startswith("/api/vitimas/"):
            self.atualizar_vitima()
            return
        self.atualizar_ocorrencia()

    def atualizar_producao_diaria(self) -> None:
        identificador = unquote(urlparse(self.path).path.rsplit("/", 1)[1])
        try:
            dados = self.ler_corpo_json()
            with LOCK_ESCRITA:
                registros = self.repositorio.load_list("producaoDiaria")
                indice = next((indice for indice, item in enumerate(registros) if str(item.get("id")) == identificador), None)
                if indice is None:
                    self.enviar_erro("Produção diária não encontrada", 404)
                    return
                registro = self.normalizar_producao_diaria({**registros[indice], **dados}, identificador)
                registros[indice] = registro
                self.repositorio.save_list("producaoDiaria", registros)
            self.enviar_json(registro)
        except (json.JSONDecodeError, ValueError) as erro:
            self.enviar_erro(f"Dados inválidos: {erro}", 400)
        except Exception as erro:
            self.enviar_erro(str(erro), 500)

    def do_PATCH(self) -> None:
        if urlparse(self.path).path.startswith("/api/vitimas/"):
            self.atualizar_vitima()
            return
        if urlparse(self.path).path.startswith("/api/analises/"):
            self.atualizar_analise()
            return
        self.atualizar_ocorrencia()

    def atualizar_vitima(self) -> None:
        try:
            id_vitima = unquote(urlparse(self.path).path.rsplit("/", 1)[1])
            dados = self.ler_corpo_json()
            with LOCK_ESCRITA:
                vitimas = self.repositorio.load_list("vitimas")
                registro = next((item for item in vitimas if str(item.get("idVitima", item.get("id"))) == id_vitima), None)
                if registro is None:
                    self.enviar_erro("Vítima não encontrada", 404)
                    return
                respostas_anteriores = registro.get("respostasArvore") if isinstance(registro.get("respostasArvore"), dict) else {}
                complementos_anteriores = registro.get("complementosArvore") if isinstance(registro.get("complementosArvore"), dict) else {}
                if isinstance(dados.get("respostasArvore"), dict):
                    registro["respostasArvore"] = {**respostas_anteriores, **dados["respostasArvore"]}
                if isinstance(dados.get("complementosArvore"), dict):
                    registro["complementosArvore"] = {**complementos_anteriores, **dados["complementosArvore"]}
                for campo in ("nome", "idPessoa", "ordem", "ultimaEdicaoArvore"):
                    if campo in dados:
                        registro[campo] = dados[campo]
                registro["atualizadoEm"] = agora()
                self.repositorio.save_list("vitimas", vitimas)
                self.registrar_evento({"idCaso": registro.get("idCaso"), "idPessoa": registro.get("idPessoa"), "tipoEvento": "QUALIFICACAO_VITIMA_ATUALIZADA", "campoAlterado": "respostasArvore", "valorAnterior": {"quantidade": len(respostas_anteriores)}, "valorNovo": {"quantidade": len(registro.get("respostasArvore", {}))}, "operador": str(dados.get("operador", "")), "origem": "QUALIFICACAO_300", "observacao": "Respostas da qualificação reaproveitáveis por pessoa/vítima"})
                self.atualizar_metadados()
            self.enviar_json({**registro, "id": registro.get("idVitima", registro.get("id"))})
        except (ValueError, json.JSONDecodeError) as erro:
            self.enviar_erro(f"Dados inválidos: {erro}", 400)

    def atualizar_analise(self) -> None:
        try:
            id_analise = unquote(urlparse(self.path).path.rsplit("/", 1)[1])
            dados = self.ler_corpo_json()
            with LOCK_ESCRITA:
                analises = self.carregar_registros(ARQUIVO_ANALISES)
                analise = next((item for item in analises if str(item.get("idAnalise", item.get("idAnaliseF2", ""))) == id_analise), None)
                if analise is None:
                    self.enviar_erro("Análise F2 não encontrada", 404)
                    return
                anterior = dict(analise)
                analise.update(dados)
                analise.setdefault("idAnalise", id_analise)
                analise["situacaoInformada"] = dados.get("situacaoInformada") if "situacaoInformada" in dados else anterior.get("situacaoInformada")
                analise["atualizadoEm"] = agora()
                self.salvar_registros(ARQUIVO_ANALISES, analises)
                self.registrar_evento({"idPessoa": analise.get("idPessoa"), "idAnalise": id_analise, "tipoEvento": "ANALISE_F2_ATUALIZADA", "campoAlterado": "dados", "valorAnterior": anterior, "valorNovo": dados, "operador": str(dados.get("operador", analise.get("operador", ""))), "origem": str(dados.get("origem", "ANALISE_F2")), "observacao": "Análise F2 atualizada"})
            self.enviar_json(analise)
        except (ValueError, json.JSONDecodeError) as erro:
            self.enviar_erro(f"Dados inválidos: {erro}", 400)

    def atualizar_ocorrencia(self) -> None:
        try:
            id_texto = unquote(urlparse(self.path).path.rsplit("/", 1)[1])
            id_ocorrencia = int(id_texto) if id_texto.isdigit() else id_texto
            dados = self.ler_corpo_json()
            with LOCK_ESCRITA:
                ocorrencias = self.carregar_ocorrencias()
                registro = next((item for item in ocorrencias if str(item.get("id", item.get("idCaso"))) == str(id_ocorrencia)), None)
                if registro is None:
                    self.enviar_erro("Ocorrência não encontrada", 404)
                    return
                anterior = dict(registro)
                registro.update(mesclar_atualizacao_caso(registro, dados))
                registro["id"] = id_ocorrencia
                registro["atualizado_em"] = agora()
                campos_finalizacao = {"statusVitima", "condicaoVitima", "desfechoCaso", "resultadoLocalizacao", "dataHoraLocalizacao", "encaminhamento", "recursoLocalizacao", "atuacaoExclusivaCabineVerde", "vultoImprensa", "teveMidia", "categoriaAdministrativa", "observacoesLocalizacao"}
                if campos_finalizacao.intersection(dados):
                    registro["finalizado"] = True
                    registro["dataEncerramento"] = str(dados.get("dataEncerramento") or agora())
                    desfecho = normalizar_busca(registro.get("desfechoCaso"))
                    status_vitima = normalizar_busca(registro.get("statusVitima"))
                    if "obito" in desfecho or "morta" in status_vitima:
                        registro["statusCaso"] = "LOCALIZADO_SEM_VIDA"
                    elif "pres" in desfecho or "custod" in normalizar_busca(registro.get("condicaoVitima")):
                        registro["statusCaso"] = "LOCALIZADO_CUSTODIA"
                    elif "encerr" in desfecho or "localiz" in desfecho or "localiz" in status_vitima:
                        registro["statusCaso"] = "LOCALIZADO"
                    if registro.get("statusCaso") in {"LOCALIZADO", "LOCALIZADO_CUSTODIA", "LOCALIZADO_SEM_VIDA"}:
                        registro["status"] = registro["statusCaso"]
                        registro["statusAtendimento"] = registro["statusCaso"]
                self.salvar_ocorrencias(ocorrencias)
                tipo_evento = "FINALIZACAO_ATUALIZADA" if campos_finalizacao.intersection(dados) else "OCORRENCIA_ATUALIZADA"
                self.registrar_evento({
                    "idCaso": str(id_ocorrencia),
                    "tipoEvento": tipo_evento,
                    "campoAlterado": "dados",
                    "valorAnterior": anterior,
                    "valorNovo": dados,
                    "operador": str(dados.get("operador", "")),
                    "origem": str(dados.get("origem", "API_CENTRAL")),
                    "observacao": "Atualização preservada no histórico central",
                })
            self.enviar_json(registro)
        except (ValueError, json.JSONDecodeError) as erro:
            self.enviar_erro(f"Dados inválidos: {erro}", 400)
        except Exception as erro:
            self.enviar_erro(str(erro), 500)


if __name__ == "__main__":
    argumentos = argparse.ArgumentParser(description="Servidor HTTP central da Cabine Verde")
    argumentos.add_argument("--init-database", action="store_true", help="Inicializa uma base vazia explicitamente")
    opcoes = argumentos.parse_args()
    if opcoes.init_database:
        inicializar_base_administrativa()
        print(f"Base administrativa criada em: {BASE_DIR}")
        raise SystemExit(0)
    preparar_pastas()
    servidor = ThreadingHTTPServer((HOST, PORT), CabineVerdeHandler)
    servidor.daemon_threads = True
    servidor.request_queue_size = 64
    servidor.allow_reuse_address = True
    print(f"Cabine Verde ativa em http://{HOST}:{PORT}")
    print(f"Base oficial: {BASE_DIR}")
    servidor.serve_forever()
