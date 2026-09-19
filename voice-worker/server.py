"""
DEYOUNG voice worker: self-hosted, free, neural voice server.

OpenAI-compatible TTS so the DEYOUNG app (and any OpenAI SDK client) can use it:
    POST /v1/audio/speech   {model, input, voice, speed, response_format}

Engines (pick with the ENGINE env):
    kokoro  - Kokoro-82M ONNX. Runs real-time on a plain CPU. 14 natural
              built-in English voices (US + UK). No cloning. TESTED on CPU.
    xtts    - Coqui XTTS v2. Zero-shot voice cloning from a ~10s reference
              clip. Needs a GPU (Kaggle T4/P100 class) for call latency.
              Code provided as a documented pattern: test before production.
              NOTE: XTTS v2 weights ship under the Coqui Public Model License
              (non-commercial). For commercial cloning swap in an MIT engine
              such as OpenVoice v2; this server's engine interface is 3 calls.

The off switch (user requirement):
    POST /shutdown          - powers the worker off immediately
    IDLE_TIMEOUT_MIN env    - auto-sleep after N idle minutes (default 15, 0 = never)
    The app-side master switch (admin panel) stops all traffic when off, so an
    idle worker sleeps by itself and free-tier quota is never burned.

Auth: set WORKER_TOKEN; every endpoint except GET / requires
      "Authorization: Bearer <token>". The DEYOUNG Next.js proxy keeps the
      token server-side, browsers never see it.

Run:  python3 server.py            (or: uvicorn server:app --host 0.0.0.0 --port 8787)
Env:  ENGINE=kokoro|xtts   PORT=8787   WORKER_TOKEN=secret
      IDLE_TIMEOUT_MIN=15   MODELS_DIR=./models   MODEL_FILE=kokoro-v1.0.int8.onnx
"""

from __future__ import annotations

import io
import os
import threading
import time
from pathlib import Path

import numpy as np
import soundfile as sf
from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, Field

VERSION = "1.0.0"
HERE = Path(__file__).resolve().parent
ENGINE = os.environ.get("ENGINE", "kokoro").strip().lower()
PORT = int(os.environ.get("PORT", "8787"))
TOKEN = os.environ.get("WORKER_TOKEN", "").strip()
IDLE_TIMEOUT_MIN = float(os.environ.get("IDLE_TIMEOUT_MIN", "15"))
MODELS_DIR = Path(os.environ.get("MODELS_DIR", HERE / "models")).resolve()
MODEL_FILE = os.environ.get("MODEL_FILE", "kokoro-v1.0.int8.onnx")
MAX_CHARS = 2000

STARTED = time.time()
_last_hit = {"t": time.time()}


def log(msg: str) -> None:
    print(f"[voice-worker {time.strftime('%H:%M:%S')}] {msg}", flush=True)


def touch() -> None:
    _last_hit["t"] = time.time()


def require_token(request: Request) -> None:
    if TOKEN and request.headers.get("authorization") != f"Bearer {TOKEN}":
        raise HTTPException(status_code=401, detail="missing or invalid worker token")


# --------------------------------------------------------------------------
# Engines
# --------------------------------------------------------------------------

class KokoroEngine:
    """Kokoro-82M via kokoro-onnx. CPU real-time, natural built-in voices."""

    name = "kokoro"
    device = "cpu"

    # Curated English voices shipped with voices-v1.0.bin
    VOICES = {
        "af_sky": "female, US, warm default",
        "af_bella": "female, US, expressive",
        "af_nicole": "female, US, soft",
        "af_aoede": "female, US, conversational",
        "af_kore": "female, US, serious",
        "af_sarah": "female, US, newsroom",
        "af_nova": "female, US, energetic",
        "am_adam": "male, US, plain",
        "am_michael": "male, US, conversational",
        "am_onyx": "male, US, deep",
        "bf_emma": "female, UK, soft",
        "bf_isabella": "female, UK, clear",
        "bm_george": "male, UK, calm",
        "bm_fable": "male, UK, storyteller",
    }

    def __init__(self) -> None:
        from kokoro_onnx import Kokoro  # noqa: imported lazily so /health still works pre-load

        onnx_path = MODELS_DIR / MODEL_FILE
        voices_path = MODELS_DIR / "voices-v1.0.bin"
        if not onnx_path.exists():
            onnx_path = MODELS_DIR / "kokoro-v1.0.onnx"
        if not onnx_path.exists() or not voices_path.exists():
            raise RuntimeError(
                f"model files missing under {MODELS_DIR}. Run the downloader "
                "(python3 download_models.py) or see README.md"
            )
        log(f"loading kokoro ({onnx_path.name}) ...")
        t0 = time.time()
        self.kokoro = Kokoro(str(onnx_path), str(voices_path))
        log(f"kokoro loaded in {time.time() - t0:.1f}s, {len(self.VOICES)} voices")

    def voices(self) -> dict[str, str]:
        return dict(self.VOICES)

    def synthesize(self, text: str, voice: str, speed: float) -> tuple[np.ndarray, int]:
        if voice not in self.VOICES:
            raise HTTPException(status_code=400, detail=f"unknown voice '{voice}'. Use GET /voices")
        audio, sr = self.kokoro.create(text, voice=voice, speed=speed, lang="en-us")
        return audio, sr


class XttsEngine:
    """Coqui XTTS v2 zero-shot cloning. GPU required. Documented pattern,
    test before production use. CPML license: non-commercial."""

    name = "xtts"
    device = "gpu"  # verified at load

    def __init__(self) -> None:
        from TTS.api import TTS  # noqa: coqui-tts package

        log("loading XTTS v2 (first run downloads ~1.8GB) ...")
        t0 = time.time()
        self.tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2")
        self.device = "gpu" if self.tts.is_cuda else "cpu"
        self.speakers_dir = MODELS_DIR / "speakers"
        self.speakers_dir.mkdir(parents=True, exist_ok=True)
        log(f"xtts loaded in {time.time() - t0:.1f}s on {self.device}")

    def voices(self) -> dict[str, str]:
        base = {"af_sky": "built-in reference", "am_michael": "built-in reference"}
        for p in sorted(self.speakers_dir.glob("*.wav")):
            base[p.stem] = "cloned from reference clip"
        return base

    def synthesize(self, text: str, voice: str, speed: float) -> tuple[np.ndarray, int]:
        ref = self.speakers_dir / f"{voice}.wav"
        if not ref.exists():
            raise HTTPException(status_code=400, detail=f"unknown voice '{voice}'. POST /v1/clone first")
        out = io.BytesIO()
        self.tts.tts_to_file(
            text=text,
            speaker_wav=str(ref),
            language="en",
            speed=speed,
            file_path=out,
        )
        out.seek(0)
        data, sr = sf.read(out, dtype="float32")
        return data, sr

    def clone(self, name: str, wav_bytes: bytes) -> str:
        safe = "".join(c for c in name.lower().replace(" ", "_") if c.isalnum() or c == "_")
        if not safe:
            raise HTTPException(status_code=400, detail="bad speaker name")
        path = self.speakers_dir / f"{safe}.wav"
        path.write_bytes(wav_bytes)
        return safe


ENGINE_OBJ: KokoroEngine | XttsEngine | None = None


def get_engine():
    global ENGINE_OBJ
    if ENGINE_OBJ is None:
        ENGINE_OBJ = (XttsEngine if ENGINE == "xtts" else KokoroEngine)()
    return ENGINE_OBJ


# --------------------------------------------------------------------------
# Audio encoding
# --------------------------------------------------------------------------

def to_wav(audio: np.ndarray, sr: int) -> bytes:
    buf = io.BytesIO()
    sf.write(buf, audio, sr, format="WAV", subtype="PCM_16")
    return buf.getvalue()


def to_mp3(audio: np.ndarray, sr: int) -> bytes:
    import lameenc

    enc = lameenc.Encoder()
    enc.set_bit_rate(128)
    enc.set_in_sample_rate(sr)
    enc.set_channels(1)
    enc.set_quality(2)
    pcm = (np.clip(audio, -1.0, 1.0) * 32767.0).astype("<i2").tobytes()
    return bytes(enc.encode(pcm)) + bytes(enc.flush())


# --------------------------------------------------------------------------
# App
# --------------------------------------------------------------------------

app = FastAPI(title="DEYOUNG voice worker", version=VERSION)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def _touch_and_errors(request: Request, call_next):
    touch()
    try:
        return await call_next(request)
    except HTTPException:
        raise
    except Exception as exc:  # noqa: never leak a stack trace to the caller
        log(f"error on {request.url.path}: {exc}")
        return JSONResponse({"error": f"worker error: {type(exc).__name__}"}, status_code=500)


class SpeechReq(BaseModel):
    model: str = "kokoro"
    input: str = Field(min_length=1)
    voice: str = "af_sky"
    speed: float = 1.0
    response_format: str = "mp3"


@app.get("/")
def root():
    """Public liveness ping, no auth, no model load."""
    return {
        "service": "deyoung-voice-worker",
        "version": VERSION,
        "engine": ENGINE,
        "uptimeSec": round(time.time() - STARTED),
    }


@app.get("/health")
def health(request: Request):
    require_token(request)
    info: dict = {
        "ok": True,
        "service": "deyoung-voice-worker",
        "version": VERSION,
        "engine": ENGINE,
        "uptimeSec": round(time.time() - STARTED),
        "idleSec": round(time.time() - _last_hit["t"]),
        "idleTimeoutMin": IDLE_TIMEOUT_MIN,
    }
    try:
        eng = get_engine()
        info["device"] = eng.device
        info["voices"] = eng.voices()
        info["modelLoaded"] = True
    except Exception as exc:
        info["modelLoaded"] = False
        info["loadError"] = str(exc)[:200]
    return info


@app.get("/voices")
def voices(request: Request):
    require_token(request)
    return {"voices": get_engine().voices()}


@app.get("/v1/models")
def models(request: Request):
    require_token(request)
    return {
        "object": "list",
        "data": [{"id": ENGINE, "object": "model", "owned_by": "deyoung-selfhost"}],
    }


@app.post("/v1/audio/speech")
def speech(req: SpeechReq, request: Request):
    require_token(request)
    text = req.input.strip()
    if not text:
        raise HTTPException(status_code=400, detail="empty input")
    if len(text) > MAX_CHARS:
        raise HTTPException(status_code=413, detail=f"text longer than {MAX_CHARS} chars")
    speed = max(0.5, min(2.0, float(req.speed or 1.0)))

    eng = get_engine()
    t0 = time.time()
    audio, sr = eng.synthesize(text, req.voice, speed)
    gen_ms = round((time.time() - t0) * 1000)

    fmt = "wav" if req.response_format == "wav" else "mp3"
    if fmt == "mp3":
        try:
            body = to_mp3(audio, sr)
        except Exception:
            body, fmt = to_wav(audio, sr), "wav"
    else:
        body = to_wav(audio, sr)

    return Response(
        content=body,
        media_type="audio/mpeg" if fmt == "mp3" else "audio/wav",
        headers={
            "X-Voice-Latency": str(gen_ms),
            "X-Voice-Engine": ENGINE,
            "Cache-Control": "no-store",
        },
    )


@app.post("/v1/audio/transcriptions")
async def transcriptions(request: Request, file: UploadFile = File(...), model: str = Form("whisper")):
    """STT is optional in this worker (faster-whisper). 501 when unavailable,
    so the app keeps using its browser STT fast path."""
    require_token(request)
    try:
        from faster_whisper import WhisperModel  # noqa
    except ImportError:
        raise HTTPException(status_code=501, detail="no STT engine installed on this worker")
    data = await file.read()
    tmp = MODELS_DIR / "_stt_in.bin"
    tmp.write_bytes(data)
    try:
        wm = WhisperModel("base.en", device="cpu", compute_type="int8")
        segments, _ = wm.transcribe(str(tmp))
        return {"text": " ".join(s.text.strip() for s in segments).strip()}
    finally:
        tmp.unlink(missing_ok=True)


@app.post("/v1/clone")
async def clone(request: Request, name: str = Form(...), file: UploadFile = File(...)):
    """XTTS engine only: register a cloned voice from a reference clip."""
    require_token(request)
    if ENGINE != "xtts":
        raise HTTPException(status_code=501, detail="cloning needs ENGINE=xtts (GPU worker)")
    eng = get_engine()
    wav = await file.read()
    if len(wav) < 20_000:
        raise HTTPException(status_code=400, detail="reference clip too short (need ~10s)")
    speaker = eng.clone(name, wav)
    return {"speaker": speaker, "hint": "use it as the voice id in /v1/audio/speech"}


@app.post("/shutdown")
def shutdown(request: Request):
    """THE OFF SWITCH. Responds, then the worker process powers off."""
    require_token(request)
    log("shutdown requested via API; powering off in 1s")

    def bye() -> None:
        time.sleep(1.0)
        os._exit(0)

    threading.Thread(target=bye, daemon=True).start()
    return {"ok": True, "bye": "worker powering off"}


def _idle_watchdog() -> None:
    if IDLE_TIMEOUT_MIN <= 0:
        return
    limit = IDLE_TIMEOUT_MIN * 60.0
    while True:
        time.sleep(5)
        if time.time() - _last_hit["t"] > limit:
            log(f"idle for {IDLE_TIMEOUT_MIN} min; auto-sleeping (off switch)")
            os._exit(0)


threading.Thread(target=_idle_watchdog, daemon=True).start()


if __name__ == "__main__":
    import uvicorn

    log(
        f"starting: engine={ENGINE} port={PORT} "
        f"token={'yes' if TOKEN else 'NO (open!)'} idle_timeout_min={IDLE_TIMEOUT_MIN}"
    )
    if not TOKEN:
        log("WARNING: WORKER_TOKEN is empty; anyone who finds this port can use the worker")
    uvicorn.run(app, host="0.0.0.0", port=PORT, log_level="warning")
