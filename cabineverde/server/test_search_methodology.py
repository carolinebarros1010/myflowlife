import unittest

try:
    from .search_methodology import classificar_estagio_atendimento
except ImportError:
    from search_methodology import classificar_estagio_atendimento


class MetodologiaBuscaTest(unittest.TestCase):
    def test_apenas_f2_sem_qualificacao_ou_contato(self):
        resultado = classificar_estagio_atendimento(
            {"idPessoa": "P1", "statusAtual": "DESAPARECIDO"},
            [{"idAnalise": "A1", "idPessoa": "P1", "situacaoInformada": "DESAPARECIDO", "dataHoraAnalise": "2026-08-17T08:00:00"}],
            [],
            [],
        )

        self.assertEqual(resultado["statusAtual"], "DESAPARECIDO")
        self.assertEqual(resultado["condicao"], "PENDENTE_QUALIFICACAO")
        self.assertEqual(resultado["estagioAtendimento"], "APENAS_ANALISE_F2")
        self.assertEqual(resultado["statusAtendimentoCalculado"], "EM_PESQUISA")
        self.assertFalse(resultado["temContatoTelefonico"])

    def test_sinaliza_status_de_atendimento_legado_incoerente(self):
        resultado = classificar_estagio_atendimento(
            {"idPessoa": "P1", "statusAtendimento": "EM_QUALIFICACAO"},
            [{"idAnalise": "A1", "situacaoInformada": "DESAPARECIDO"}],
            [],
            [],
        )

        self.assertEqual(resultado["statusAtendimentoCalculado"], "EM_PESQUISA")
        self.assertEqual(resultado["statusAtendimentoInformado"], "EM_QUALIFICACAO")
        self.assertFalse(resultado["statusAtendimentoCoerente"])

    def test_marcador_sem_situacao_nao_altera_status(self):
        resultado = classificar_estagio_atendimento(
            {"idPessoa": "P1"},
            [
                {"idAnalise": "A1", "situacaoInformada": "DESAPARECIDO", "dataHoraAnalise": "2026-08-17T08:00:00"},
                {"idAnalise": "A2", "situacaoInformada": None, "marcadoresAndamento": {"semNovaInformacao": True}, "dataHoraAnalise": "2026-08-18T10:00:00"},
            ],
            [],
            [],
        )

        self.assertEqual(resultado["statusAtual"], "DESAPARECIDO")
        self.assertEqual(resultado["statusOrigem"], "HISTORICO_EXPLICITO")

    def test_contato_explicito_muda_estagio_mas_nao_status(self):
        resultado = classificar_estagio_atendimento(
            {"idPessoa": "P1"},
            [{"idAnalise": "A1", "situacaoInformada": "DESAPARECIDO", "dataHoraAnalise": "2026-08-17T08:00:00"}],
            [],
            [{"tipoEvento": "CONTATO_TELEFONICO", "dataHora": "2026-08-18T12:00:00"}],
        )

        self.assertEqual(resultado["statusAtual"], "DESAPARECIDO")
        self.assertEqual(resultado["estagioAtendimento"], "CONTATO_REGISTRADO")
        self.assertEqual(resultado["condicao"], "EM_ACOMPANHAMENTO")

    def test_qualificacao_concluida(self):
        resultado = classificar_estagio_atendimento(
            {"idPessoa": "P1"},
            [{"idAnalise": "A1", "situacaoInformada": "DESAPARECIDO"}],
            [{"idPessoa": "P1", "qualificacaoConcluida": True}],
            [],
        )

        self.assertEqual(resultado["estagioAtendimento"], "QUALIFICACAO_COMPLETA")
        self.assertEqual(resultado["condicao"], "QUALIFICADA")

    def test_cache_legado_e_apenas_fallback(self):
        resultado = classificar_estagio_atendimento(
            {"idPessoa": "P1", "statusAtual": "LOCALIZADO"}, [], [], []
        )

        self.assertEqual(resultado["statusAtual"], "LOCALIZADO")
        self.assertEqual(resultado["statusOrigem"], "CACHE_LEGADO_SEM_HISTORICO_EXPLICITO")


if __name__ == "__main__":
    unittest.main()
