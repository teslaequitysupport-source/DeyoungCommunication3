#!/usr/bin/env python3
"""Purge every em dash from the DEYOUNG codebase.

Rules:
- Exact overrides for known UI strings (hand-curated rewrites).
- If surrounding context is uppercase-heavy (mono labels) -> " · "
- Otherwise (prose) -> ", "
- Standalone placeholder "—" in stats -> "0"
"""
import re
from pathlib import Path

ROOT = Path("/home/z/my-project")
TARGETS = [ROOT / "src", ROOT / "scripts"]

# Hand-curated rewrites first (applied as exact substring replacements)
OVERRIDES = [
    # hero.tsx sample dialogue + labels
    ('"Hi — do you take bookings on Sundays?"', '"Hi, do you take bookings on Sundays?"'),
    ("We do — Sundays run nine to two. Would you like me to hold a slot?",
     "We do. Sundays run nine to two. Would you like me to hold a slot?"),
    ('"Wait — afternoon instead"', '"Wait, afternoon instead"'),
    ("ADA — 412MS", "ADA · 412MS"),
    ("CALL CONSOLE — VOICE", "CALL CONSOLE · VOICE"),
    ("INTERRUPTED — BARGE-IN", "INTERRUPTED · BARGE-IN"),
    ("PRODUCT PREVIEW — REAL CONSOLE IN THE APP", "PRODUCT PREVIEW · REAL CONSOLE IN THE APP"),
    (': "—"', ': "0"'),
    # hero sub default: rebuild the sentence without dashes
    ("builds AI employees — receptionists, sales assistants, support agents — that answer in voice and text",
     "builds AI employees (receptionists, sales assistants, support agents) that answer in voice and text"),
    ("They read from the database — zero until real work happens here.",
     "They read from the database: zero until real work happens here."),
]

EM = "\u2014"

def context_upper_ratio(text, start, end, span=48):
    lo = max(0, start - span)
    hi = min(len(text), end + span)
    ctx = text[lo:hi]
    letters = [c for c in ctx if c.isalpha()]
    if not letters:
        return 0.0
    upper = sum(1 for c in letters if c.isupper())
    return upper / len(letters)

def replace_dashes(text):
    out = []
    i = 0
    while True:
        idx = text.find(EM, i)
        if idx < 0:
            out.append(text[i:])
            break
        out.append(text[i:idx])
        ratio = context_upper_ratio(text, idx, idx + 1)
        # standalone dash used as an empty placeholder
        before = text[idx - 1] if idx > 0 else ""
        after = text[idx + 1] if idx + 1 < len(text) else ""
        if before in "\"'`" and after in "\"'`":
            out.append("0")
        elif ratio > 0.55:
            out.append(" · ")
        else:
            out.append(", ")
        i = idx + 1
    return "".join(out)

def process(path):
    src = path.read_text(encoding="utf-8")
    text = src
    for old, new in OVERRIDES:
        text = text.replace(old, new)
    text = replace_dashes(text)
    if text != src:
        path.write_text(text, encoding="utf-8")
        return text.count(EM)
    return 0

total_files = 0
remaining = 0
for base in TARGETS:
    for p in base.rglob("*"):
        if p.suffix not in {".ts", ".tsx", ".css"} or not p.is_file():
            continue
        if "node_modules" in str(p):
            continue
        left = process(p)
        if left == 0:
            # recount from disk to report files touched
            if p.read_text(encoding="utf-8") != "":
                pass
        total_files += 1

# verify
bad = []
for base in TARGETS:
    for p in base.rglob("*"):
        if p.suffix not in {".ts", ".tsx", ".css"} or not p.is_file():
            continue
        if "node_modules" in str(p):
            continue
        if EM in p.read_text(encoding="utf-8"):
            bad.append(str(p))

print(f"Scanned {total_files} files")
print("Remaining em dashes:", len(bad))
for b in bad:
    print("  STILL HAS:", b)
