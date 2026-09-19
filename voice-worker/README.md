# DEYOUNG voice worker (self-hosted, free, with an off switch)

This is the neural voice server behind the website's "self-hosted voice engine".
It is yours: no per-character billing, no third-party listening, runs on free
hardware. The website talks to it through the admin panel, and the admin panel
has the off switch that powers it down when you are not using it.

## What it gives you

- Natural neural voices (Kokoro, 14 US/UK English voices), real-time on a plain
  CPU, zero GPU needed for this part.
- Optional GPU engine (XTTS v2) for zero-shot voice cloning from a ~10s
  reference clip. Runs on free Kaggle GPU hours.
- OpenAI-compatible API (`/v1/audio/speech`), so the site and any OpenAI SDK
  client can drive it without custom code.
- The off switch: `POST /shutdown` (the admin button calls this), plus
  auto-sleep after `IDLE_TIMEOUT_MIN` minutes of silence (default 15).
- A bearer token gate on every endpoint. The website's server keeps the token,
  browsers never see it.

## Quick start (any machine, CPU, 5 minutes)

```bash
cd voice-worker
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python3 download_models.py          # ~120MB, one time
WORKER_TOKEN=my-secret python3 server.py
# listening on http://0.0.0.0:8787
```

Then in the website admin panel (Settings, Voice engine):

- Mode: Self-hosted
- TTS URL: `http://<host>:8787/v1/audio/speech`
- Token: `my-secret`
- Model: `kokoro`, Voice: `af_sky` (or any from the Test connection result)

## Free run options

1. **Your own machine / any free CPU box.** Best latency if the machine is
   near you. Use the quick start above. To reach it from the deployed site,
   expose it with a free Cloudflare quick tunnel: `./cloudflared tunnel --url
   http://localhost:8787` (no account needed) and paste the https URL.
2. **Kaggle (free GPU ~30h/week, or CPU).** Use `kaggle_worker.py` as the
   notebook cell; it installs deps, loads models, starts the worker and the
   tunnel, and prints the public URL. Pick GPU when you want cloning
   (ENGINE=xtts), CPU when plain natural voices are enough. Remember: Kaggle
   kills idle sessions and the hours are weekly-limited, which is exactly why
   the off switch exists.
3. **Hugging Face Spaces (free CPU, public URL, sleeps when idle).** Create a
   Docker Space with this folder (add a `Dockerfile` that runs
   `pip install -r requirements.txt && python3 download_models.py && python3
   server.py`, expose port 8787). The Space sleeping is a free built-in
   off switch.

## Endpoints

| Endpoint | What it does |
| --- | --- |
| `GET /` | public liveness, no auth |
| `GET /health` | engine, device, voices, idle countdown (Bearer) |
| `GET /voices` | voice id to description map (Bearer) |
| `POST /v1/audio/speech` | OpenAI-style TTS, returns mp3 or wav (Bearer) |
| `POST /v1/audio/transcriptions` | optional STT, 501 if not installed (Bearer) |
| `POST /v1/clone` | XTTS only: upload a reference clip (Bearer) |
| `POST /shutdown` | THE OFF SWITCH: powers the worker off (Bearer) |

Example:

```bash
curl http://localhost:8787/v1/audio/speech \
  -H "Authorization: Bearer my-secret" \
  -H "Content-Type: application/json" \
  -d '{"model":"kokoro","input":"Thanks for holding, I can pick that up now.","voice":"af_sky","speed":1.0}' \
  --output hi.mp3
```

## The off switch, exactly as requested

- **App side:** admin panel, Voice engine, mode switch. Browser mode means the
  site stops calling the worker entirely.
- **Worker side:** "Shut down worker" button (calls /shutdown, process exits),
  and auto-sleep after 15 idle minutes so a forgotten worker never burns
  Kaggle quota. On Kaggle also stop the session to release the VM fully.
- Idle countdown is visible in /health, so the panel can show minutes left.

## Upgrade path (from free to paid, zero code changes)

The site only knows an OpenAI-compatible URL. When call volume grows:

1. Move this same server to a dedicated GPU host (any provider, spot or
   reserved).
2. Update the URL in the admin panel, save. Done.
3. If you outgrow Kokoro/XTTS, point the URL at any OpenAI-compatible voice
   server (LocalAI, Speaches, or a paid API). Same fields, no redeploy.

## Honesty notes (read before production)

- The Kokoro CPU engine was tested end to end (health, synthesis, latency,
  shutdown, auto-sleep).
- The XTTS v2 cloning engine is provided as a documented pattern and was NOT
  tested here (no GPU in the build sandbox). Test it on Kaggle before
  promising cloning to anyone.
- XTTS v2 model weights are licensed Coqui Public Model License
  (non-commercial). For commercial cloning use an MIT engine instead, e.g.
  OpenVoice v2, which slots into the same engine interface.
- Free tiers are for pilots and personal use, not for 24/7 production. The off
  switch exists because free GPU hours are weekly and finite.
