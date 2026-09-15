#!/usr/bin/env python3
"""DEEP SIGNAL retheme: red/gold v3 -> navy/cerulean/cyan v4.

Restores the blue theme the user chose from their reference photo:
- ink tokens: navy #070E1A..#14243D (never pure black)
- brand: #4A90E2 cerulean, dark #2E7CDE
- flare: #2FD4FF electric cyan, deep #0A5BC4
- gold slot -> arctic ice #A9E2FF (legacy class names kept)
- semantic colors (destructive/blocked/amber/success) kept true
"""
import re
from pathlib import Path

ROOT = Path("/home/z/my-project/src")
EXTRA = [Path("/home/z/my-project/tailwind.config.ts")]

# ---- hex mapping (case-insensitive, preserves case) ----
HEX = {
    # brand reds -> cerulean
    "E10600": "4A90E2", "B80500": "2E7CDE",
    # flare reds -> electric cyan
    "FF3B2F": "2FD4FF", "8F0400": "0A5BC4",
    # btn gradient stops
    "FF3226": "45B6FF", "A80400": "1A54A8",
    # light red tints -> light cyan
    "FF6A5E": "6FCBFF", "FF5A46": "5FC6FF", "FF6A60": "6FCBFF",
    # gold family -> arctic ice
    "E9B44C": "A9E2FF", "B58531": "7CC4E8", "F5CD6E": "BFE4FF",
    "A89B74": "8FB8D8", "151109": "0E1B2E", "2A2312": "1B3350", "3A2F14": "16294A",
    "1A1408": "101E33",
    # ink ladder -> navy ladder
    "090909": "070E1A", "0C0C0C": "0A1220", "0D0D0D": "0A1322",
    "111111": "0A1424", "121212": "0D1626", "1A1A1A": "0C1526",
    "161616": "0B1628", "171717": "14243D", "101010": "081020",
    "262626": "1C3050",
}

# ---- rgba triplet mapping ----
RGBA = {
    "225, 6, 0": "10, 91, 196",      # brand glow
    "233, 180, 76": "169, 226, 255",  # gold glow -> ice glow
    "255, 226, 150": "200, 240, 255", # warm tint -> ice tint
    "255, 94, 74": "47, 212, 255",    # btn border
    "255, 90, 70": "47, 212, 255",
    "255, 106, 94": "111, 203, 255",
    "255, 59, 47": "47, 212, 255",
    "255, 50, 38": "69, 182, 255",
    "168, 4, 0": "26, 84, 168",
    "184, 5, 0": "46, 134, 222",
    "143, 4, 0": "10, 91, 196",
    "9, 9, 9": "7, 14, 26",
    "18, 18, 18": "13, 22, 38",
    "23, 23, 23": "20, 36, 61",
}

# semantic colors that must stay: DC2626, EF4444, D08700 (amber), 3E9E63 (green),
# grays (A1A1A1, 6F6F6A, 6B6B6B, 3A3A3A, 2E2E2E), whites/blacks.

FILES = sorted(set(list(ROOT.rglob("*.tsx")) + list(ROOT.rglob("*.ts")) +
                   list(ROOT.rglob("*.css")) + EXTRA))


def retheme(text: str, path: Path) -> str:
    # pre-pass: admin views-ops status badges use brand red semantically (blocked/
    # rejected) -> convert to true semantic reds instead of cerulean
    if path.name == "views-ops.tsx":
        text = re.sub(r"#E10600", "#DC2626", text)
        text = re.sub(r"#e10600", "#dc2626", text)
        text = re.sub(r"#ff6a5e", "#EF4444", text)
        text = re.sub(r"#FF6A5E", "#EF4444", text)

    for old, new in HEX.items():
        text = re.sub(f"#{old}", f"#{new}", text)
        text = re.sub(f"#{old.lower()}", f"#{new.lower()}", text)

    for old, new in RGBA.items():
        text = text.replace(f"rgba({old}", f"rgba({new}")

    # globals.css: keep comments honest
    text = text.replace(
        "DEYOUNG brand: RED / BLACK / WHITE + GOLD whisper. Disciplined signal color.",
        "DEYOUNG brand: DEEP SIGNAL. Navy field, cerulean primary, electric cyan energy.")
    text = text.replace("Flare range: highlight red for gradients and glows",
                        "Flare range: electric cyan for gradients and glows")
    text = text.replace(
        "Champagne gold: luxury marker, used sparingly (badges, ratings, owner chips)",
        "Arctic ice: premium marker, used sparingly (badges, ratings, owner chips)")
    text = text.replace("Primary: red flare. The hero action.",
                        "Primary: cerulean flare. The hero action.")
    return text


def main() -> None:
    changed = 0
    for f in FILES:
        try:
            src = f.read_text()
        except Exception as e:
            print(f"SKIP {f}: {e}")
            continue
        out = retheme(src, f)
        if out != src:
            f.write_text(out)
            changed += 1
            print(f"OK   {f.relative_to(ROOT.parent)}")
    print(f"\n{changed} files rethemed")

    # post-check: any straggler reds?
    stragglers = []
    for f in FILES:
        try:
            src = f.read_text()
        except Exception:
            continue
        for pat in ["e10600", "ff3b2f", "8f0400", "e9b44c", "b80500", "ff3226",
                    "a80400", "b58531", "ff6a5e", "f5cd6e", "a89b74", "151109"]:
            if pat in src.lower():
                stragglers.append((str(f.relative_to(ROOT.parent)), pat))
    if stragglers:
        print("STRAGGLERS:", stragglers)
    else:
        print("POST-CHECK: zero red/gold tokens remain (semantic DC2626/EF4444/D08700 exempt)")


if __name__ == "__main__":
    main()
