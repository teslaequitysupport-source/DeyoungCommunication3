"""Download the Kokoro ONNX models for the DEYOUNG voice worker.

Files land in ./models/ (gitignored). ~120MB total for the int8 model,
~330MB for the full-precision one. Skips files that already exist.

Usage:
    python3 download_models.py            # int8 (recommended for CPU)
    python3 download_models.py --full    # full precision
"""
from __future__ import annotations

import sys
import urllib.request
from pathlib import Path

BASE = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.1"
MODELS = Path(__file__).resolve().parent / "models"
MODELS.mkdir(exist_ok=True)


def fetch(url: str, dest: Path) -> None:
    if dest.exists() and dest.stat().st_size > 1_000_000:
        print(f"skip (exists): {dest.name}")
        return
    print(f"downloading {url} -> {dest}")
    tmp = dest.with_suffix(dest.suffix + ".part")
    urllib.request.urlretrieve(url, tmp)
    tmp.rename(dest)
    mb = dest.stat().st_size / 1e6
    print(f"done: {dest.name} ({mb:.1f} MB)")


def main() -> None:
    full = "--full" in sys.argv
    onnx = "kokoro-v1.0.onnx" if full else "kokoro-v1.0.int8.onnx"
    fetch(f"{BASE}/{onnx}", MODELS / onnx)
    fetch(f"{BASE}/voices-v1.0.bin", MODELS / "voices-v1.0.bin")
    print("models ready")


if __name__ == "__main__":
    main()
