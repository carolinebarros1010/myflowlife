"""Confronto facial local entre uma imagem de referÃƒÂªncia e as fotos do SQLite."""
import argparse
from contextlib import redirect_stdout
import json
import sqlite3
import sys
from pathlib import Path


def erro(mensagem: str) -> None:
    print(json.dumps({"ok": False, "mensagem": mensagem}, ensure_ascii=False))
    raise SystemExit(0)


def carregar_motor(model_root: Path | None = None):
    try:
        from insightface.app import FaceAnalysis
        import cv2
        import numpy as np
    except ImportError:
        erro("Motor facial nÃƒÂ£o instalado. Execute: python -m pip install -r tools/requirements-face.txt")
    argumentos = {"name": "buffalo_l", "providers": ["CPUExecutionProvider"], "allowed_modules": ["detection", "recognition"]}
    if model_root:
        argumentos["root"] = str(model_root)
    motor = FaceAnalysis(**argumentos)
    motor.prepare(ctx_id=0, det_size=(640, 640))
    return motor, cv2, np


def embedding(motor, cv2, imagem_path: Path):
    imagem = cv2.imread(str(imagem_path))
    if imagem is None:
        return None
    try:
        rostos = motor.get(imagem)
    except Exception:
        return None
    if not rostos:
        return None
    rosto = max(rostos, key=lambda item: float(item.bbox[2] - item.bbox[0]) * float(item.bbox[3] - item.bbox[1]))
    vetor = rosto.normed_embedding
    return vetor


def confrontar(imagem_referencia: Path, banco_path: Path, pasta_fotos: Path, limite: int, model_root: Path | None, manifest_path: Path | None = None, limiar: float = 60.0):
    # InsightFace/ONNXRuntime pode emitir logs de inicialização no stdout.
    # O Electron espera que stdout contenha exclusivamente o JSON final.
    with redirect_stdout(sys.stderr):
        motor, cv2, np = carregar_motor(model_root)
    referencia = embedding(motor, cv2, imagem_referencia)
    if referencia is None:
        return {"ok": False, "mensagem": "NÃƒÂ£o foi possÃƒÂ­vel detectar um rosto na imagem de referÃƒÂªncia."}
    if manifest_path:
        fotos = json.loads(manifest_path.read_text(encoding="utf-8"))
    else:
        conexao = sqlite3.connect(banco_path)
        conexao.row_factory = sqlite3.Row
        fotos = conexao.execute("SELECT f.id, f.id_caso AS idCaso, f.dados_json, c.nome_desaparecido AS nome, c.talao_pm AS talao FROM fotos f LEFT JOIN casos c ON c.id_caso = f.id_caso ORDER BY f.id DESC").fetchall()
    candidatos = []
    for foto in fotos:
        try:
            if manifest_path:
                dados = foto
                caminho = Path(foto.get("caminhoLocal", ""))
            else:
                dados = json.loads(foto["dados_json"] or "{}")
                caminho = Path(dados.get("caminhoLocal", ""))
            if not caminho.is_absolute():
                caminho = pasta_fotos / caminho
            vetor = embedding(motor, cv2, caminho)
            if vetor is None:
                continue
            similaridade = float(np.dot(referencia, vetor) / (np.linalg.norm(referencia) * np.linalg.norm(vetor)))
            similaridade_normalizada = max(0.0, min(1.0, similaridade))
            percentual = similaridade_normalizada * 100
            if percentual < limiar:
                continue
            candidatos.append({"id": foto["id"], "idCaso": foto["idCaso"], "nome": foto["nome"] or "Sem nome", "talao": foto["talao"] or "Sem talÃƒÆ’Ã‚Â£o", "nomeArquivo": dados.get("nomeArquivo", "Imagem"), "caminhoLocal": str(caminho), "similaridade": round(percentual, 2), "distancia": round(1.0 - similaridade_normalizada, 4), "classificacao": "Alta similaridade" if percentual >= 70 else "PossÃƒÆ’Ã‚­vel correspondÃƒÆ’Ã‚ªncia"})
        except (OSError, ValueError, TypeError, json.JSONDecodeError):
            continue
    candidatos.sort(key=lambda item: item["distancia"])
    return {"ok": True, "motor": "InsightFace buffalo_l Ã‚Â· CPU local", "limiarSemelhanca": limiar, "candidatos": candidatos[:limite]}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--referencia", required=True)
    parser.add_argument("--banco", required=True)
    parser.add_argument("--fotos", required=True)
    parser.add_argument("--model-root")
    parser.add_argument("--limite", type=int, default=10)
    parser.add_argument("--limiar", type=float, default=60.0)
    parser.add_argument("--manifest")
    args = parser.parse_args()
    print(json.dumps(confrontar(Path(args.referencia), Path(args.banco), Path(args.fotos), args.limite, Path(args.model_root) if args.model_root else None, Path(args.manifest) if args.manifest else None, max(0.0, min(100.0, args.limiar))), ensure_ascii=False))


if __name__ == "__main__":
    main()
