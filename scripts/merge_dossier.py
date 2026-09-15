#!/usr/bin/env python3
"""Merge cover + body into final dossier PDF, normalize to A4."""
from pypdf import PdfReader, PdfWriter

A4_W, A4_H = 595.28, 841.89
BASE = "/home/z/my-project"
COVER = f"{BASE}/scripts/dossier_cover.pdf"
BODY = f"{BASE}/scripts/dossier_body.pdf"
OUT = f"{BASE}/download/DEYOUNG_COMMUNICATION_Project_Dossier.pdf"


def normalize(page):
    w, h = float(page.mediabox.width), float(page.mediabox.height)
    if abs(w - A4_W) > 0.1 or abs(h - A4_H) > 0.1:
        page.scale_to(A4_W, A4_H)
        page.mediabox.lower_left = (0, 0)
        page.mediabox.upper_right = (A4_W, A4_H)
    return page


writer = PdfWriter()
writer.add_page(normalize(PdfReader(COVER).pages[0]))
for p in PdfReader(BODY).pages:
    writer.add_page(normalize(p))
writer.add_metadata({
    "/Title": "DEYOUNG COMMUNICATION Project Dossier",
    "/Author": "Z.ai",
    "/Creator": "Z.ai",
    "/Subject": "Phase 1 planning dossier: research, PRD, architecture, schema, design system, roadmap",
})
with open(OUT, "wb") as f:
    writer.write(f)
print("final:", OUT, "pages:", len(writer.pages))
