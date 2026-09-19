"""Objective warm/red pixel audit for brand images + uploads."""
from PIL import Image
import os, glob

def warm_ratio(path):
    im = Image.open(path).convert("RGB").resize((200, 200))
    px = list(im.getdata())
    n = len(px)
    red_strong = sum(1 for r, g, b in px if r > 120 and r - b > 50 and r - g > 30)
    warm = sum(1 for r, g, b in px if r > 110 and (r - b) > 35)
    return red_strong / n * 100, warm / n * 100

targets = sorted(glob.glob("/home/z/my-project/public/img/*.png")) + glob.glob("/home/z/my-project/public/uploads/*.png")
print(f"{'file':38} {'red%':>6} {'warm%':>6}")
for t in targets:
    rs, w = warm_ratio(t)
    flag = "  <-- CHECK" if rs > 1.0 or w > 8.0 else ""
    print(f"{os.path.basename(t):38} {rs:6.2f} {w:6.2f}{flag}")
