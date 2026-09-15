"""Regras puras para classificar a situação operacional exibida na busca."""

from __future__ import annotations


def _texto(valor: object) -> str:
    return str(valor or "").strip().upper()


def calcular_status_historico(analises: list[dict]) -> tuple[str | None, str]:
    """Retorna (status, origem), priorizando situação explícita no histórico."""
    ordenadas = sorted(
        analises,
        key=lambda item: str(item.get("dataHoraAnalise") or item.get("data") or ""),
    )
    for analise in reversed(ordenadas):
        situacao = analise.get("situacaoInformada")
        if situacao:
            return str(situacao), "HISTORICO_EXPLICITO"
    return None, "SEM_SITUACAO_EXPLICITA"


def _tem_contato_telefonico(eventos: list[dict]) -> bool:
    marcadores = ("CONTATO", "TELEFONE", "LIGACAO", "LIGAÇÃO", "RETORNO", "SOLICITANTE")
    for evento in eventos:
        tipo = _texto(evento.get("tipoEvento") or evento.get("tipoEventoOperacional"))
        if any(marcador in tipo for marcador in marcadores):
            return True
        if evento.get("contatoTelefonicoRegistrado") is True:
            return True
    return False


def classificar_estagio_atendimento(
    pessoa: dict,
    analises: list[dict],
    qualificacoes: list[dict],
    eventos: list[dict],
) -> dict:
    """Classifica sem alterar registros e sem usar marcador de andamento como status."""
    status, origem_status = calcular_status_historico(analises)
    if status is None and (pessoa.get("statusAtual") or pessoa.get("statusPessoa")):
        status = str(pessoa.get("statusAtual") or pessoa.get("statusPessoa"))
        origem_status = "CACHE_LEGADO_SEM_HISTORICO_EXPLICITO"
    tem_f2 = bool(analises)
    tem_caso = any(str(item.get("idCaso") or "").strip() for item in analises)
    tem_qualificacao = bool(qualificacoes)
    qualificacao_completa = any(
        item.get("qualificacaoConcluida") is True or _texto(item.get("status")) in {"CONCLUIDA", "COMPLETA"}
        for item in qualificacoes
    )
    tem_contato = _tem_contato_telefonico(eventos)

    if qualificacao_completa:
        estagio = "QUALIFICACAO_COMPLETA"
        condicao = "QUALIFICADA"
        atendimento_calculado = "EM_PESQUISA"
    elif tem_qualificacao:
        estagio = "QUALIFICACAO_INICIADA"
        condicao = "EM_QUALIFICACAO"
        atendimento_calculado = "EM_QUALIFICACAO"
    elif tem_contato:
        estagio = "CONTATO_REGISTRADO"
        condicao = "EM_ACOMPANHAMENTO"
        atendimento_calculado = "EM_ACOMPANHAMENTO"
    elif tem_f2:
        estagio = "ANALISE_F2_VINCULADA" if tem_caso else "APENAS_ANALISE_F2"
        condicao = "PENDENTE_QUALIFICACAO"
        atendimento_calculado = "EM_PESQUISA"
    else:
        estagio = "SEM_REGISTRO_F2"
        condicao = "SEM_ATENDIMENTO_F2"
        atendimento_calculado = "TRIAGEM_NAO_INICIADA"

    if _texto(pessoa.get("statusAtendimento")) == "ENCERRADO":
        condicao = "ENCERRADA"
        atendimento_calculado = "ENCERRADO"

    return {
        "statusAtual": status,
        "statusOrigem": origem_status,
        "statusAtendimentoCalculado": atendimento_calculado,
        "statusAtendimentoInformado": pessoa.get("statusAtendimento"),
        "statusAtendimentoCoerente": not pessoa.get("statusAtendimento") or _texto(pessoa.get("statusAtendimento")) == atendimento_calculado,
        "condicao": condicao,
        "estagioAtendimento": estagio,
        "temAnaliseF2": tem_f2,
        "temCaso": tem_caso,
        "temQualificacao": tem_qualificacao,
        "qualificacaoCompleta": qualificacao_completa,
        "temContatoTelefonico": tem_contato,
        "quantidadeAnalisesF2": len(analises),
    }
