#!/usr/bin/env python3
"""Convert the marketing surface from light to dark premium (RED/BLACK/WHITE brand).

Protects intentional whites (Agency white button, timeline dots) via placeholders,
runs exact class-token replacements, then restores.
"""
import re
from pathlib import Path

FILES = [
    "src/components/marketing/nav.tsx",
    "src/components/marketing/footer.tsx",
    "src/components/marketing/sections.tsx",
    "src/components/marketing/pages.tsx",
    "src/components/marketing/pages2.tsx",
    "src/components/marketing/hero.tsx",
    "src/app/page.tsx",
]
ROOT = Path("/home/z/my-project")

# Ordered (pattern, replacement) applied as exact class tokens.
# Lookarounds make them token-safe: bg-white/[0.03] etc. are NOT touched.
TOKEN_RULES = [
    # protect intentional whites first
    (r'bg-white text-ink hover:bg-neutral-200', 'KEEP_WHITE_BTN text-ink hover:bg-neutral-200'),
    (r'border-brand bg-white', 'border-brand KEEP_WHITE_DOT'),
    (r'bg-white text-ink', 'KEEP_WHITE_BTN text-ink'),
    # nav + chrome
    (r'(?<![\w:-])bg-white/85(?![\w:/-])', 'bg-ink/85'),
    (r'(?<![\w:-])text-neutral-800(?![\w-])', 'text-neutral-200'),
    (r'hover:bg-neutral-50', 'hover:bg-white/5'),
    (r'(?<![\w:-])bg-neutral-300(?![\w-])', 'bg-white/25'),
    (r'(?<![\w:-])bg-neutral-200(?![\w-])', 'bg-white/10'),
    (r'hover:text-ink', 'hover:text-white'),
    # surfaces
    (r'hover:bg-paper', 'hover:bg-white/[0.04]'),
    (r'(?<![\w:-])bg-paper(?![\w-])', 'bg-ink-2'),
    (r'(?<![\w:-])bg-white(?![\w/-])', 'bg-ink-3'),
    # text
    (r'(?<![\w:-])text-ink(?![\w-])', 'text-white'),
    (r'(?<![\w:-])text-neutral-700(?![\w-])', 'text-neutral-300'),
    (r'(?<![\w:-])text-neutral-600(?![\w-])', 'text-neutral-400'),
    (r'text-\[#5c5c58\]', 'text-neutral-400'),
    # borders
    (r'(?<![\w:-])border-neutral-300(?![\w-])', 'border-white/15'),
    (r'(?<![\w:-])border-neutral-200(?![\w-])', 'border-white/10'),
    (r'(?<![\w:-])divide-neutral-200(?![\w-])', 'divide-white/10'),
    # hairlines / grids
    (r'hairline-t-light', 'hairline-t'),
    (r'hairline-b-light', 'hairline-b'),
    (r'dy-grid-bg-light', 'dy-grid-bg'),
    # light shadows -> deep dark shadows
    (r'rgba\(9,9,9,0\.14\)', 'rgba(0,0,0,0.55)'),
    (r'rgba\(9,9,9,0\.12\)', 'rgba(0,0,0,0.5)'),
    (r'rgba\(9,9,9,0\.18\)', 'rgba(0,0,0,0.6)'),
]

RESTORE = [
    ('KEEP_WHITE_BTN', 'bg-white'),
    ('KEEP_WHITE_DOT', 'bg-white'),
]

def convert(path: Path):
    src = path.read_text()
    text = src
    for pat, rep in TOKEN_RULES:
        text = re.sub(pat, rep, text)
    for old, new in RESTORE:
        text = text.replace(old, new)
    if text != src:
        path.write_text(text)
        return True
    return False

changed = 0
for f in FILES:
    p = ROOT / f
    if convert(p):
        changed += 1
        print("converted", f)
    else:
        print("no change", f)
print(f"done: {changed} files converted")
