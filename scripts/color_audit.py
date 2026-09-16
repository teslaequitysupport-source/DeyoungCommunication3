#!/usr/bin/env python3
"""Extract every hex color used in src/ and public/ source files, classify by hue.
Flags reddish hues (330-20 deg) so nothing escapes the de-red pass."""
import re, os, sys, colorsys

ROOTS = ["src", "public"]
HEX_RE = re.compile(r'#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b')

def hex_to_rgb(h):
    h = h.lstrip('#')
    if len(h) == 3:
        h = ''.join(c*2 for c in h)
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def classify(r, g, b):
    h, s, v = colorsys.rgb_to_hsv(r/255, g/255, b/255)
    hue = h * 360
    if s < 0.12:  # achromatic
        return "gray/neutral"
    if 330 <= hue or hue < 15:
        return "RED"
    if 15 <= hue < 45:
        return "orange/amber"
    if 45 <= hue < 70:
        return "yellow"
    if 70 <= hue < 165:
        return "green"
    if 165 <= hue < 200:
        return "teal/cyan-green"
    if 200 <= hue < 250:
        return "BLUE"
    if 250 <= hue < 290:
        return "purple"
    return "magenta/pink"

findings = {}
for root in ROOTS:
    for dirpath, _, files in os.walk(root):
        for fn in files:
            path = os.path.join(dirpath, fn)
            if not fn.endswith(('.tsx', '.ts', '.css', '.js', '.svg', '.html')):
                continue
            try:
                text = open(path, encoding='utf-8', errors='ignore').read()
            except Exception:
                continue
            for m in HEX_RE.finditer(text):
                hx = m.group(0)
                r, g, b = hex_to_rgb(hx)
                cat = classify(r, g, b)
                if cat in ("RED", "orange/amber", "magenta/pink"):
                    line_no = text[:m.start()].count('\n') + 1
                    findings.setdefault(path, []).append((line_no, hx, cat))

if not findings:
    print("NO red/amber/pink hex colors found in src/ or public/")
else:
    for path in sorted(findings):
        print(f"\n{path}:")
        for line_no, hx, cat in findings[path]:
            print(f"  L{line_no}: {hx}  [{cat}]")
