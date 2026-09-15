import unittest
from unittest.mock import Mock, PropertyMock, patch

from .server import CabineVerdeHandler, ARQUIVO_PESSOAS, mesclar_atualizacao_caso


class TestConsultaCompleta(unittest.TestCase):
    def setUp(self):
        self.handler = object.__new__(CabineVerdeHandler)
        self.colecoes = {
            "vitimas": [{"idVitima": "V1", "idCaso": "C1", "idPessoa": "P1"},
                        {"idVitima": "V2", "idCaso": "C1", "idPessoa": "P2"}],
            "qualificacoes": [{"idPessoa": "P1", "respostas": {"p1": "Sim"}}],
            "pistas": [{"idPessoa": "P2", "descricao": "Pista vinculada"}, {"idPessoa": "OUTRA"}],
        }
        repositorio = Mock()
        repositorio.load_list.side_effect = lambda chave: self.colecoes.get(chave, [])
        substituicao = patch.object(CabineVerdeHandler, 'repositorio', new_callable=PropertyMock, return_value=repositorio)
        substituicao.start()
        self.addCleanup(substituicao.stop)
        self.handler.carregar_registros = lambda arquivo: ([{"idPessoa": "P1", "nome": "Pessoa 1"}, {"idPessoa": "P2", "nome": "Pessoa 2"}]
            if arquivo == ARQUIVO_PESSOAS else [{"idCaso": "C1", "observacao": "Evento do caso"}])
        self.analises = [
            {"idPessoa": "P1", "dataHoraAnalise": "2026-09-01", "situacaoInformada": "DESAPARECIDO"},
            {"idPessoa": "P1", "dataHoraAnalise": "2026-09-02", "situacaoInformada": "LOCALIZADO"},
            {"idPessoa": "P1", "dataHoraAnalise": "2026-09-03", "situacaoInformada": None},
            {"idPessoa": "P2", "dataHoraAnalise": "2026-09-02", "situacaoInformada": "DESAPARECIDO"},
        ]
        self.handler.carregar_analises_api = lambda: self.analises

    def test_status_atual_por_vitima_sem_encerrar_outra_pessoa(self):
        registro = self.handler.enriquecer_ocorrencia({"id": "C1", "status": "Em triagem"})
        self.assertEqual([v["statusAtual"] for v in registro["vitimas"]], ["LOCALIZADO", "DESAPARECIDO"])
        self.assertEqual(registro["status"], "Em triagem")
        self.analises.append({"idPessoa": "P1", "dataHoraAnalise": "2026-09-04", "situacaoInformada": "DESAPARECIDO"})
        self.assertEqual(self.handler.enriquecer_ocorrencia({"id": "C1"})["vitimas"][0]["statusAtual"], "DESAPARECIDO")

    def test_detalhe_preserva_campos_e_todos_registros_vinculados(self):
        registro = self.handler.detalhar_ocorrencia({"id": "C1", "dados": {"campoLegado": "preservar"}, "observacao": "Completa"})
        self.assertEqual(registro["dados"]["campoLegado"], "preservar")
        self.assertEqual(len(registro["analisesF2"]), 4)
        self.assertEqual(len(registro["vitimas"]), 2)
        self.assertEqual(len(registro["qualificacoes"]), 1)
        self.assertEqual(len(registro["pistas"]), 1)
        self.assertEqual(len(registro["eventos"]), 1)

    def test_salvar_painel_preserva_demais_respostas_e_permite_limpar_campo(self):
        anterior = {"status": "LOCALIZADO", "dados": {"telefone": "123", "respostasArvore": {"p1": "Sim", "p2": "Antes"}}, "respostasArvore": {"p1": "Sim", "p2": "Antes"}}
        atualizacao = {"dados": {"respostasArvore": {"p2": ""}}, "respostasArvore": {"p2": ""}}
        resultado = mesclar_atualizacao_caso(anterior, atualizacao)
        self.assertEqual(resultado["status"], "LOCALIZADO")
        self.assertEqual(resultado["dados"]["telefone"], "123")
        self.assertEqual(resultado["dados"]["respostasArvore"], {"p1": "Sim", "p2": ""})
        self.assertEqual(resultado["respostasArvore"], {"p1": "Sim", "p2": ""})
        self.assertEqual(anterior["respostasArvore"]["p2"], "Antes")


if __name__ == '__main__':
    unittest.main()
