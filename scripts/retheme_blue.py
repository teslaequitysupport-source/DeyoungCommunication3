#!/usr/bin/env python3
"""
DEYOUNG retheme sweep: RED/GOLD/BLACK -> DEEP SIGNAL (navy + cerulean + cyan + ice).
Walks all src/**/*.{ts,tsx,css}, replaces old palette hexes and rgba values.
Semantic colors (error red, attention amber, success green) are intentionally NOT mapped.
Prints per-file counts. Idempotent: old values disappear after first run.
"""
import re
import sys
from pathlib import Path

ROOT = Path("/home/z/my-project/src")

# hex (case-insensitive, 3/6/8 digits) -> new hex
HEX_MAP = {
    # brand reds -> cerulean signal
    "e10600": "2e7cde",
    "b80500": "2565c4",
    "8f0400": "0a5bc4",
    "ff3b2f": "45b6ff",
    "ff3226": "45b6ff",
    "a80400": "1a54a8",
    "ff5a4a": "7fdcff",
    "ff6a5e": "7fc4ff",
    "ff4d44": "6fe4ff",
    "ff9d94": "9fd6ff",
    "ff3527": "45b6ff",
    "160b0a": "0a1a30",
    # gold/amber -> arctic ice
    "e9b44c": "a9e2ff",
    "b58531": "6fb9e8",
    "f2cf82": "d9f1ff",
    "f6d78a": "eaf8ff",
    "f5cd6e": "a9dcf8",
    "e6d9b8": "cfe8fa",
    "a89b74": "7fa8c8",
    "a06a00": "4d8fbf",
    "3a2f14": "1e3a5c",
    "2a2312": "16294a",
    "151109": "0a1626",
    "1c160c": "0d1a2e",
    "1a1408": "0c1828",
    "0d0b06": "0a1322",
    "ffe296": "dcf0ff",
    # neutral grays/black -> navy-cool
    "090909": "070e1a",
    "0c0c0c": "0a1424",
    "0d0d0d": "0a1424",
    "0a0a0a": "081020",
    "101010": "081221",
    "111111": "0e1b30",
    "121212": "0e1b30",
    "141414": "101f36",
    "161616": "0d1b2f",
    "1a1a1a": "101f36",
    "1c1c1c": "12233c",
    "171717": "14243d",
    "222": "14243d",
    "232323": "1c3050",
    "262626": "1c3050",
    "2e2e2e": "24385c",
    "333": "1e3455",
    "3a3a3a": "24385c",
    "4a4a4a": "3c5273",
    "565656": "4a5f7e",
    "6b6b6b": "64798f",
    "6f6f6a": "5d7290",
    "737373": "6b809a",
    "8a8a8a": "8299b3",
    "8f8f89": "8698ae",
    "a1a1a1": "9fb2c8",
    "5c5c58": "5d7290",
    "b8b8b3": "b8c6d9",
    "f5f5f3": "f2f7fd",
    "e5e5e5": "e8f0f8",
    "d4d4d4": "cfdded",
    "e8e8e8": "e6eef7",
    "ccc": "c7d7e8",
}

# rgba prefixes (regex, spacing-flexible) -> new prefix
RGBA_MAP = [
    (r"rgba\(\s*225\s*,\s*6\s*,\s*0\s*,", "rgba(0, 150, 255,"),
    (r"rgba\(\s*233\s*,\s*180\s*,\s*76\s*,", "rgba(169, 226, 255,"),
    (r"rgba\(\s*9\s*,\s*9\s*,\s*9\s*,", "rgba(3, 8, 18,"),
    (r"rgba\(\s*255\s*,\s*94\s*,\s*74\s*,", "rgba(120, 196, 255,"),
    (r"rgba\(\s*255\s*,\s*90\s*,\s*70\s*,", "rgba(110, 190, 255,"),
    (r"rgba\(\s*255\s*,\s*106\s*,\s*94\s*,", "rgba(127, 196, 255,"),
    (r"rgba\(\s*255\s*,\s*226\s*,\s*150\s*,", "rgba(220, 240, 255,"),
    (r"rgba\(\s*255\s*,\s*203\s*,\s*110\s*,", "rgba(169, 220, 248,"),
]

# Build one hex regex: matches "#XXX" or "#XXXXXX" (word-bounded) case-insensitively.
hex_pattern = re.compile(
    r"#(" + "|".join(sorted(HEX_MAP.keys(), key=len, reverse=True)) + r")(?![0-9a-fA-F])",
    re.IGNORECASE,
)

total_files = 0
total_repl = 0

for path in sorted(ROOT.rglob("*")):
    if path.suffix not in (".ts", ".tsx", ".css"):
        continue
    if "node_modules" in str(path):
        continue
    try:
        text = path.read_text(encoding="utf-8")
    except Exception as e:
        print(f"READ FAIL {path}: {e}")
        continue

    original = text
    count = 0

    def hex_sub(m):
        global count
        count += 1
        return "#" + HEX_MAP[m.group(1).lower()]

    text = hex_pattern.sub(hex_sub, text)

    for pat, repl in RGBA_MAP:
        text, n = re.subn(pat, repl, text)
        count += n

    if text != original:
        path.write_text(text, encoding="utf-8")
        total_files += 1
        total_repl += count
        print(f"{path.relative_to(ROOT.parent)}: {count} replacements")

print(f"\nTOTAL: {total_repl} replacements across {total_files} files")

# Post-check: any old palette remnants?
leftovers = []
for path in sorted(ROOT.rglob("*")):
    if path.suffix not in (".ts", ".tsx", ".css") or "node_modules" in str(path):
        continue
    text = path.read_text(encoding="utf-8", errors="ignore")
    for old in ("#e10600", "#E10600", "#E9B44C", "#e9b44c", "#B80500", "#b80500",
                "#262626", "#A1A1A1", "#111111", "#090909", "#0C0C0C", "rgba(225, 6, 0",
                "rgba(225,6,0", "rgba(233, 180, 76", "rgba(233,180,76"):
        if old in text:
            leftovers.append(f"{path}: {old}")
if leftovers:
    print("\nLEFTOVERS FOUND:")
    for l in leftovers[:30]:
        print(" ", l)
    sys.exit(1)
print("\nNo old-palette leftovers. Sweep clean.")
