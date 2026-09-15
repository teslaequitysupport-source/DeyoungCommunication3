"""Synthetic voice-like WAV for testing the Clone Lab DSP honestly.

150 Hz fundamental with harmonics, 4 syllables/sec amplitude envelope,
~0.35 RMS voiced energy: shaped so autocorrelation pitch detection,
syllable counting and energy measurement all have real work to do.
"""
import math
import struct
import wave

SR = 16000
DUR = 3.0
F0 = 150.0
N = int(SR * DUR)
OUT = "/home/z/my-project/scripts/test-voice-150hz.wav"

frames = bytearray()
for i in range(N):
    t = i / SR
    # syllable envelope: 4/sec, 70% voiced duty
    syll_phase = (t * 4.0) % 1.0
    env = 1.0 if syll_phase < 0.7 else 0.0
    # smooth the envelope edges to avoid clicks
    if syll_phase < 0.02:
        env = syll_phase / 0.02
    elif 0.68 < syll_phase < 0.70:
        env = (0.70 - syll_phase) / 0.02
    # vowel-ish source: f0 + harmonics, slight jitter for realism
    jitter = 1.0 + 0.008 * math.sin(2 * math.pi * 1.7 * t)
    ph = 2 * math.pi * F0 * jitter * t
    s = (
        0.55 * math.sin(ph)
        + 0.25 * math.sin(2 * ph)
        + 0.12 * math.sin(3 * ph)
        + 0.06 * math.sin(4 * ph)
    )
    # soft breath noise between harmonics
    s += 0.02 * (math.sin(2 * math.pi * 913.7 * t) * math.sin(2 * math.pi * 7.3 * t))
    v = s * env * 0.35
    pcm = int(max(-1.0, min(1.0, v)) * 32767)
    frames += struct.pack("<h", pcm)

with wave.open(OUT, "w") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(bytes(frames))

print(f"wrote {OUT}: {DUR}s @ {SR}Hz mono 16-bit")
