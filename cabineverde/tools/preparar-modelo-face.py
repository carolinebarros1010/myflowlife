"""Baixa/prepara o modelo InsightFace no cache local para inclusão no pacote."""
from pathlib import Path
from insightface.app import FaceAnalysis

root = Path(__file__).resolve().parent.parent / "build" / "modelos"
root.mkdir(parents=True, exist_ok=True)
motor = FaceAnalysis(name="buffalo_l", root=str(root), providers=["CPUExecutionProvider"])
motor.prepare(ctx_id=0, det_size=(640, 640))
print(f"Modelo preparado em: {root / 'buffalo_l'}")
