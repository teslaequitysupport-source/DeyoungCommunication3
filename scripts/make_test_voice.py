"""Generate a speech-like WAV for testing the clone-lab voice measurement.

Mimics a male-ish voice: 140 Hz fundamental + harmonics, formant emphasis,
4 Hz syllable-rate amplitude modulation, 3.5 s, mono 16-bit 22050 Hz.
"""
import math
import struct
import wave

SR = 22050
DUR = 3.5
N = int(SR * DUR)
F0 = 140.0

samples = []
for i in range(N):
    t = i / SR
    # syllable envelope ~4.2 Hz with pauses (speech rhythm)
    env = 0.15 + 0.85 * max(0.0, math.sin(2 * math.pi * 4.2 * t)) ** 1.5
    # sentence-level breath: fade in/out + small dip mid-way
    sent = min(1.0, t / 0.25) * min(1.0, (DUR - t) / 0.3)
    # harmonic stack with formant-ish weighting
    sig = 0.0
    for h, w in [(1, 1.0), (2, 0.55), (3, 0.30), (4, 0.18), (5, 0.10), (6, 0.06)]:
        sig += w * math.sin(2 * math.pi * F0 * h * t + h)
    # slight vibrato/jitter for realism
    sig *= 1.0 + 0.02 * math.sin(2 * math.pi * 1.7 * t)
    v = sig * env * sent * 0.55
    samples.append(max(-1.0, min(1.0, v)))

with wave.open("/home/z/my-project/scripts/test-voice.wav", "wb") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(b"".join(struct.pack("<h", int(s * 32767)) for s in samples))

print("wrote scripts/test-voice.wav", N, "samples", DUR, "s")
