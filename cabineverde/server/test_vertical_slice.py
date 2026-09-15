import json
import base64
import os
import tempfile
import threading
import unittest
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from .server import CabineVerdeHandler, ThreadingHTTPServer, preparar_pastas
import server.server as modulo


class TestBaseOficial(unittest.TestCase):
    def setUp(self):
        self.pasta = Path(tempfile.mkdtemp())
        (self.pasta / "dados").mkdir()
        (self.pasta / "dados" / "metadados.json").write_text(json.dumps({"sistema": "Cabine Verde", "schemaVersion": "1.0.0", "databaseVersion": 1}), encoding="utf-8")
        (self.pasta / "dados" / "pessoas.json").write_text(json.dumps([{"idPessoa": "PES-000001", "nome": "Maria da Silva"}]), encoding="utf-8")
        os.environ["CABINE_VERDE_DATA_ROOT"] = str(self.pasta)
        modulo.BASE_DIR = self.pasta
        modulo.ARQUIVO_OCORRENCIAS = self.pasta / "dados" / "casos.json"
        modulo.ARQUIVO_PESSOAS = self.pasta / "dados" / "pessoas.json"
        modulo.ARQUIVO_ANALISES = self.pasta / "dados" / "analises-f2.json"
        modulo.ARQUIVO_EVENTOS = self.pasta / "dados" / "eventos.json"
        modulo.PASTA_FOTOS = self.pasta / "fotos"
        modulo.PASTA_DOCUMENTOS = self.pasta / "documentos"
        modulo.PASTA_BACKUP = self.pasta / "backup"
        modulo.PASTA_LOGS = self.pasta / "logs"
        preparar_pastas()

    def tearDown(self):
        import shutil
        shutil.rmtree(self.pasta, ignore_errors=True)
        os.environ.pop("CABINE_VERDE_DATA_ROOT", None)

    def test_preserva_base_preexistente_e_bloqueia_schema_incompativel(self):
        self.assertEqual(json.loads((self.pasta / "dados" / "pessoas.json").read_text())[0]["idPessoa"], "PES-000001")
        metadados = json.loads((self.pasta / "dados" / "metadados.json").read_text())
        metadados["schemaVersion"] = "9.0.0"
        (self.pasta / "dados" / "metadados.json").write_text(json.dumps(metadados), encoding="utf-8")
        with self.assertRaises(RuntimeError):
            preparar_pastas()

    def test_bloqueia_base_sem_metadados(self):
        (self.pasta / "dados" / "metadados.json").unlink()
        with self.assertRaisesRegex(RuntimeError, "BASE OFICIAL DA CABINE VERDE NÃO LOCALIZADA"):
            preparar_pastas()

    def test_duas_gravacoes_concorrentes_e_reinicio(self):
        servidor = ThreadingHTTPServer(("127.0.0.1", 0), CabineVerdeHandler)
        threading.Thread(target=servidor.serve_forever, daemon=True).start()
        base = f"http://127.0.0.1:{servidor.server_port}"

        def gravar(numero):
            corpo = json.dumps({"idPessoa": "PES-000001", "dataHoraAnalise": f"2026-08-19T09:0{numero}", "dataTalao": "2026-08-19", "talao": str(1200 + numero), "operador": "Teste"}).encode()
            requisicao = urllib.request.Request(f"{base}/api/analises", data=corpo, headers={"Content-Type": "application/json"}, method="POST")
            try:
                return urllib.request.urlopen(requisicao).status
            except urllib.error.HTTPError as erro:
                raise AssertionError(erro.read().decode()) from erro

        with ThreadPoolExecutor(max_workers=2) as executor:
            self.assertEqual(sorted(executor.map(gravar, (1, 2))), [201, 201])
        servidor.shutdown()
        servidor.server_close()
        preparar_pastas()
        self.assertEqual(len(modulo.REPOSITORIO.load_list("analisesF2")), 2)

    def test_atualizacao_de_caso_preserva_evento_de_auditoria(self):
        servidor = ThreadingHTTPServer(("127.0.0.1", 0), CabineVerdeHandler)
        threading.Thread(target=servidor.serve_forever, daemon=True).start()
        base = f"http://127.0.0.1:{servidor.server_port}"
        criar = urllib.request.Request(
            f"{base}/api/ocorrencias",
            data=json.dumps({"id": "CASO-1", "nome": "Pessoa teste", "origemEntrada": "CASO_190", "operador": "teste"}).encode(),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        urllib.request.urlopen(criar).read()
        atualizar = urllib.request.Request(
            f"{base}/api/ocorrencias/CASO-1",
            data=json.dumps({"desfechoCaso": "LOCALIZADO", "operador": "teste"}).encode(),
            headers={"Content-Type": "application/json"},
            method="PUT",
        )
        urllib.request.urlopen(atualizar).read()
        eventos = json.loads(urllib.request.urlopen(f"{base}/api/eventos?idCaso=CASO-1").read())
        servidor.shutdown()
        servidor.server_close()
        tipos = {evento.get("tipoEvento") for evento in eventos}
        self.assertIn("CASO_190_CRIADO", tipos)
        self.assertIn("FINALIZACAO_ATUALIZADA", tipos)

    def test_busca_foto_central_por_nome_parcial_e_talao_formatado(self):
        servidor = ThreadingHTTPServer(("127.0.0.1", 0), CabineVerdeHandler)
        threading.Thread(target=servidor.serve_forever, daemon=True).start()
        base = f"http://127.0.0.1:{servidor.server_port}"
        criar = urllib.request.Request(f"{base}/api/ocorrencias", data=json.dumps({"id": "CASO-FOTO", "nome": "Maria da Silva", "talao_pm": "190/2026"}).encode(), headers={"Content-Type": "application/json"}, method="POST")
        urllib.request.urlopen(criar).read()
        arquivo = urllib.request.Request(f"{base}/api/fotos", data=json.dumps({"idOcorrencia": "CASO-FOTO", "nomeArquivo": "foto.jpg", "conteudoBase64": base64.b64encode(b"imagem").decode(), "nome": "Maria da Silva", "talao": "190/2026"}).encode(), headers={"Content-Type": "application/json"}, method="POST")
        urllib.request.urlopen(arquivo).read()
        por_nome = json.loads(urllib.request.urlopen(f"{base}/api/fotos?termo=maria").read())
        por_talao = json.loads(urllib.request.urlopen(f"{base}/api/fotos?termo=1902026").read())
        servidor.shutdown(); servidor.server_close()
        self.assertEqual(len(por_nome), 1)
        self.assertEqual(len(por_talao), 1)
        self.assertEqual(por_nome[0]["idOcorrencia"], "CASO-FOTO")

    def test_finalizacao_recalcula_indicadores_a_partir_do_caso_central(self):
        servidor = ThreadingHTTPServer(("127.0.0.1", 0), CabineVerdeHandler)
        threading.Thread(target=servidor.serve_forever, daemon=True).start()
        base = f"http://127.0.0.1:{servidor.server_port}"
        criar = urllib.request.Request(f"{base}/api/ocorrencias", data=json.dumps({"id": "CASO-DASH", "nome": "Pessoa dashboard"}).encode(), headers={"Content-Type": "application/json"}, method="POST")
        urllib.request.urlopen(criar).read()
        antes = json.loads(urllib.request.urlopen(f"{base}/api/indicadores").read())
        finalizar = urllib.request.Request(f"{base}/api/ocorrencias/CASO-DASH", data=json.dumps({"desfechoCaso": "Encerrado - óbito", "statusVitima": "Localizada morta", "operador": "teste"}).encode(), headers={"Content-Type": "application/json"}, method="PUT")
        resposta = json.loads(urllib.request.urlopen(finalizar).read())
        depois = json.loads(urllib.request.urlopen(f"{base}/api/indicadores").read())
        eventos = json.loads(urllib.request.urlopen(f"{base}/api/eventos?idCaso=CASO-DASH").read())
        servidor.shutdown(); servidor.server_close()
        self.assertTrue(resposta["finalizado"])
        self.assertEqual(depois["dashboardOperacional"]["total"], antes["dashboardOperacional"]["total"] + 1)
        self.assertEqual(depois["dashboardOperacional"]["categorias"][-1]["valor"], antes["dashboardOperacional"]["categorias"][-1]["valor"] + 1)
        self.assertTrue(any(item["tipoEvento"] == "FINALIZACAO_ATUALIZADA" for item in eventos))

    def test_repositorios_concorrentes_nao_compartilham_arquivo_temporario(self):
        from .storage_repository import JsonStorageRepository
        repositorios = [JsonStorageRepository(self.pasta) for _ in range(2)]
        with ThreadPoolExecutor(max_workers=2) as executor:
            list(executor.map(lambda indice: repositorios[indice].save_list("casos", [{"id": indice}]), (0, 1)))
        temporarios = list((self.pasta / "dados").glob("*.tmp"))
        self.assertEqual(temporarios, [])


if __name__ == "__main__":
    unittest.main()
