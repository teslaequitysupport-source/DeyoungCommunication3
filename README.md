# DEYOUNG COMMUNICATION

AI voice employees that answer, understand and act: a receptionist, a sales assistant, a support agent and an appointment scheduler, each speaking with real emotion in the voice (prosody, breaths, pacing) instead of written-out feelings.

Everything that ships in this repo runs with zero paid services:

- Live calls with barge-in, mid-call coaching and emotional delivery
- Messenger-grade web chat with knowledge-grounded replies
- Voice cloning (browser Timbre Match: your measured pitch, pace, energy drive the voice)
- Automations that draft follow-ups from real call transcripts
- Admin panel on real data (Supabase Postgres)

The only thing labeled Coming soon is the mobile app.

## Quick start

```bash
npm install
cp .env.example .env   # or create .env as below
npx prisma db push
npx tsx scripts/seed.ts
npm run dev            # http://localhost:3000
```

`.env` (never commit this file):

```bash
DATABASE_URL="postgresql://postgres.<ref>:<password>@<pooler-host>:5432/postgres"
ADMIN_EMAIL="admin@deyoungcommunication.com"
ADMIN_PASSWORD="change-me-on-first-login"
```

Sign in at `/` with the seeded admin account, then open `/admin`. All data (users, calls, CMS, automations) lives in your Postgres.

## Real-time voice: two honest tiers

### Tier 1 · Browser voices (default, free, no GPU)

Every call speaks and listens with the Web Speech API, with emotion carried by per-segment pitch, rate, pauses and synthesized breaths, sighs and catch-breaths. Works today, costs nothing, needs no hardware. This is the default and the automatic fallback for every other tier.

### Tier 2 · Self-hosted voice server (OpenAI-compatible)

Point the site at your own TTS/STT endpoints in **Admin -> Settings -> Real-time voice engine**. Every call then synthesizes and transcribes through your server, and if it ever fails mid-call, the browser tier takes over within one segment (60 s circuit breaker), so calls never die with the server.

The site speaks the OpenAI-compatible protocol, so any of these drop in:

| Goal | Server | Hardware |
| --- | --- | --- |
| Natural voices, no cloning | [Kokoro-FastAPI](https://github.com/remsky/Kokoro-FastAPI) | Any CPU VPS |
| Cloned voices (XTTS) | [xtts-api-server](https://github.com/daswer123/xtts-api-server) | GPU |
| Cloned voices, multi-backend | [LocalAI](https://localai.io) or [Speaches](https://github.com/speaches-ai/speaches) | GPU |
| Streaming Whisper STT | Speaches / faster-whisper-server | CPU or GPU |

Example: Kokoro on a CPU VPS, no GPU needed, already human-sounding:

```bash
docker run -d --name kokoro -p 8880:8880 \
  ghcr.io/remsky/kokoro-fastapi-cpu
# Admin -> Settings: turn on "Self-hosted server"
#   TTS: http://<host>:8880/v1/audio/speech   model: kokoro   voice: af_sky
#   STT: leave empty (browser recognition keeps working)
```

For true voice cloning, run XTTS on a GPU host, register a speaker from a consented 6 s+ recording in that server's own console, then paste the speaker id into Clone Lab (the field appears when self-hosting is on). Calls then speak with the cloned timbre from your server.

Honest hardware notes, so nothing is oversold:

- Real-time cloning needs a GPU. A rented one (RunPod, Vast, Lambda) costs roughly 0.20 to 0.60 USD per hour.
- Kaggle's free T4s work for experiments, but sessions cap at 12 h and GPU hours are weekly-limited: fine for trying cloning, not for a 24/7 phone line.
- Whisper STT on CPU is slower than real time; keep browser recognition or use a GPU for STT if you need full-duplex self-hosting.

## Stack

Next.js (App Router) - TypeScript - Tailwind - Prisma + Postgres (Supabase) - three.js hero - Web Speech + WebAudio voice engine - zod APIs with session auth.

## Repository layout

- `src/lib/voice-engine.ts` two-tier real-time voice: browser STT/TTS, self-hosted OpenAI-compatible path, circuit breakers, barge-in
- `src/lib/emotion.ts` cue parsing and prosody mapping (emotion lives in the voice, never as text)
- `src/lib/voice-dna.ts` in-browser voice measurement for cloning
- `src/app/api/*` auth, calls, employees, automations, CMS, voice proxy routes
- `src/components/admin/*` the /admin control surface (users, calls, content, settings, automations)
- `src/components/three/*` the photoreal hero phone
- `scripts/` seeding and diagnostics

## Security notes

Secrets live in `.env` only (gitignored). The self-hosted voice server's API keys are stored server-side in SiteSettings and never sent to the browser; all synthesis and transcription is proxied through `/api/voice/*` with session auth.
