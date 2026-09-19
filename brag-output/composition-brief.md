# Hyperframes Composition Brief: DEYOUNG COMMUNICATION

## Objective
Create a 19.5-second vertical launch film for DEYOUNG COMMUNICATION: a live AI voice-employee call, seen — hook inside the product's phone UI, the real headline, the real console exchange with barge-in, the real team, the honesty system, the brand.

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: vertical — 1080x1920
- Duration: 19.5 seconds (30fps)

## Source Material
- Project root: `/home/z/my-project` (Next.js app; dev server was used for a live discovery pass)
- Primary files read: `src/components/three/phone-canvas.tsx` (hero phone screen: wallpaper, aurora, avatar ring, waveform formula, BARGE-IN chip), `src/components/app/call-console.tsx` (console chrome, bubble system, latency chips, operator coach, waveform strip), `src/components/brand/logo.tsx` (monogram D geometry and gradient), `src/components/brand/waveform.tsx` (baseline rail + bars), `src/components/marketing/hero.tsx` + `sections.tsx` (real copy), `src/app/globals.css` (Deep Signal tokens), `scripts/seed.ts` (employee persona), live API data (real Ada exchange, real 2092ms latency)
- Product name: DEYOUNG COMMUNICATION
- Tagline / strongest claim: "Hire intelligence that never puts a caller on hold."
- Key UI or visual moment to recreate: (1) the hero phone live-call screen; (2) the call console with the real exchange and INTERRUPTED barge-in state
- Copy that must appear verbatim (all verified from the live site / database):
  - "AI EMPLOYEES FOR REAL CONVERSATIONS"
  - "Hire intelligence that never puts a caller on hold."
  - "Hi, do you take bookings on Sundays?" (real customer message)
  - "Yes, we take bookings on Sundays from 9:00 to 14:00. Would you like to schedule an appointment?" (real AI reply)
  - "BROWSER VOICE ENGINE · STT ACTIVE"
  - "LIVE · 0:04" style timer; "2092MS" latency chip
  - "MIC · REAL AMPLITUDE" / "SPEECH · SYNTH ACTIVE"
  - "Receptionist — Greets, routes, books. Never a busy line."
  - "Sales assistant — Qualifies leads and captures intent, live."
  - "Support agent — Order status and returns without the queue."
  - "Clone your own voice." + "TIMBRE MATCH · RUNS IN YOUR BROWSER"
  - "NO FAKE NUMBERS" / "BARGE-IN NATIVE" / "KNOWLEDGE GROUNDED" / "CANCEL ANYTIME"
  - "Every turn is saved with measured latency."
  - "Feeling is carried in the voice, never read out."
  - "Speak mid-sentence. It stops."
  - "Start building free"
  - "AI Receptionist · on the line" / "Ada" (real deployed employee name)
  - Phone chrome: "9:41", "5G", "BARGE-IN · LIVE"

## Creative Direction
- Tone preset: polished
- Creative direction: "a live call, seen — premium 20-second launch film"
- Interpretation: restraint sells premium. Camera moves are slow and motivated (push-in on the hook, pull-back for the promise, a single fast dive into the console). Copy enters fast and HOLDS. One dramatic beat (barge-in at 8.74) gets the energy; everything else breathes.
- Angle: the film is structured as one continuous call: phone world → promise → inside the real console → the team you can hire → the honesty system → brand.
- Hook: frame 0 is already the live-call phone screen mid-pulse (no fade-in, no logo first).
- Outro: monogram D assembles; wordmark; tagline; CTA pill; hold.
- Avoid:
  - Generic SaaS language (use only the verbatim copy above)
  - Abstract filler visuals, particles, generic AI imagery, robot imagery
  - Purple gradients, glassmorphism cliches, neon raves
  - Any invented metric (no user counts, no "10x", no "millions")
  - Red hues of any kind (brand rule: zero red)

## Visual Identity (all exact values from the project)
- Background: #05070D (phone wallpaper) over #070E1A site ink; aurora radial rgba(46,124,222,0.34) at 72%/18% + cyan rgba(47,212,255,0.12) at 18%/55%
- Panels: #0A1220 / #101B2E / #0A1424; borders #1C3050 / #24344F
- Text: #F4FAFF / #EAF2FF primary; #cfe3f5 body; #9FB4CC / #A1A1A1 / #6f6f6a muted
- Accent: cerulean #2E7CDE / #4A90E2 / #1E5FB8 / #0E2C57; electric cyan #2FD4FF / #6FCBFF / #A9E2FF / #9FE4FF
- Display font: Sora 600/700/800 (site's display face) — embed via `assets/fonts/sora-*.woff2`
- Body font: Inter 400/500 — embed via `assets/fonts/inter-*.woff2`
- Mono: JetBrains Mono 500/700 — embed via `assets/fonts/jbmono-*.woff2` (labels, chips, tags, timer)
- Photos (real, from the site): `public/img/agent-reception.jpg`, `agent-sales.jpg`, `agent-support.jpg` — copy into `assets/img/`
- Monogram D: SVG per `src/components/brand/logo.tsx` — stem rect (5,5,4,22) + three bars (12,8,14,3.4 / 12,14.3,15,3.4 / 12,20.6,10,3.4), middle bar gradient #6FCBFF→#2FD4FF→#2E7CDE, soft glow filter
- Visual references from the project: hero phone screen (phone-canvas.tsx), call console (call-console.tsx), agent gallery photo-frame cards, mono tag chips

## Storyboard
Use `brag-output/brag-plan.md` as the creative contract. Scene boundaries sit on music beats.

1. The live call — 1.64s (0.00–1.64) — phone screen fills frame, avatar ring pulsing, waveform dancing (site formula), timer ticking; slow push-in
2. The promise — 2.75s (1.64–4.39) — phone eases down/shrinks; eyebrow + two-line headline lands and holds; phone screen stays alive
3. The real exchange — 5.98s (4.39–10.37) — dive into the console; typed customer message (real keypresses), thinking dots, Ada's real reply with 2092MS chip and spoken checkmark; waveform strip state flips to SPEECH · SYNTH ACTIVE; at 8.74 barge-in: INTERRUPTED state + caption "Speak mid-sentence. It stops."
4. Hire your team — 2.74s (10.37–13.11) — three real photo cards arrive one by one; clone-lab bar + TIMBRE MATCH pill
5. The honesty system — 3.27s (13.11–16.38) — giant "NO FAKE NUMBERS" + real trust tags + two real lines + latency chip
6. Brand — 3.12s (16.38–19.50) — monogram D assembles (locks 17.47), wordmark, tagline, CTA pill, hold to end

## Audio
- Audio role: cinematic support, restrained
- Audio arc: fade up 0–0.8 → steady 0.32 → swell into 8.74 (barge-in) → settle → soften 0.28 in honesty scene → resolve under logo → fade out 18.7–19.5
- Music: `assets/music/happy-beats-business-moves-vol-12-by-ende-dot-app.mp3` (109.96 BPM)
- Music treatment: volume 0.32 (data-volume), gentle swell into the 8.74 strong cue, duck at logo, final fade
- Music cue guidance: bundled preset at `assets/music/happy-beats-business-moves-vol-12-by-ende-dot-app.music-cues.json`; strong cues 8.74 / 13.11 / 17.47; beat grid ≈0.546s; scene cuts at 1.64 / 4.39 / 10.37 / 13.11 / 16.38; sequential text never faster than every other beat
- Audio-reactive treatment: subtle — aurora glow and waveform-panel presence breathe with music RMS; no equalizer/waveform-visualizer cliche beyond the product's own waveform
- Audio-coupled moments:
  - 0.15s — soft arrival (drop_001) as the live call world settles
  - ~1.9s — soft impact under the headline land (impactSoft_medium_001)
  - 4.9–5.9s — keypresses (keypress-004/011/017) while the customer message types
  - ~6.9s — gentle drop as Ada's reply lands (drop_002)
  - 8.74s — clean click + soft impact on the barge-in (click_001 + impactSoft_medium_001)
  - 10.37 / 10.92 / 11.46 — card-place sounds as each employee card arrives
  - 13.11s — soft bell under NO FAKE NUMBERS (impactBell_heavy_000 at low volume)
  - 17.47s — deep bell as the monogram locks (impactBell_heavy_000)
- SFX selection guidance: polished restraint; every sound motion-matched; no whoosh spam; nothing sharp repeated
- SFX analysis guidance: `sfx-analysis` rules — chosen files are all low/medium HF risk
- Exact SFX choice: files listed above, all copied into `assets/sfx/`
- Audio files: music + 12 SFX already in `composition/assets/`

## Hyperframes Instructions
Load the composition-building Hyperframes domain skills — hyperframes-core (composition contract + data-* timing), hyperframes-animation (motion), hyperframes-creative (design spec, beats, audio-reactive), hyperframes-keyframes (seek-safe keyframes), hyperframes-cli (lint/check/render). /brag is its own workflow: do not enter the hyperframes entry-point intent interview and do not route into its generic promo / launch-video workflow. Prefer native Hyperframes conventions.

Requirements:
- Show real UI throughout: the phone screen, the console, the cards are recreations of the product's actual components using its exact tokens
- Keep all text readable in the final render (mobile-first: body ≥32px, labels ≥24px, headlines ≥90px at 1080x1920)
- Keep the video at exactly 19.5 seconds
- Music + the 8 planned SFX included; music data-volume 0.32; SFX 0.55–0.75
- Treat the beat/cue metadata as hints: logo locks at 17.47, barge-in at 8.74; readability overrides
- The waveform bars use the site's own deterministic formula (amp = |sin(t·2.6 + i·0.55)·0.7 + sin(t·1.1 + i·0.21)·0.3|) via a seek-safe onUpdate of timeline time — authentic to the product, zero randomness
- Audio-reactive: subtle RMS breathing on the aurora + waveform panel presence (extract-audio-data.py), skip gracefully if extraction fails
- Use local assets only: fonts, music, SFX, images all inside `composition/assets/`
- Deterministic render: no Math.random, no Date.now, finite repeats only, no CSS transitions on animated elements
- Run `npx hyperframes check` before render — the single gate; fix every error including WCAG contrast
