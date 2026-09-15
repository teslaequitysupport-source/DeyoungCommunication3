#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""DEYOUNG COMMUNICATION Project Dossier - ReportLab body builder.

Chapter Numbering Plan (Step 3.5):
| Outline | Type    | Chapter | Title                                          |
|---------|---------|---------|------------------------------------------------|
| 1       | cover   | -       | Cover (separate HTML/Playwright PDF, merged)   |
| 2       | toc     | -       | Table of Contents (roman numerals)             |
| 3..16   | content | 1..14   | Chapters 1-14 (arabic page numbers reset to 1) |
"""
import os
import sys
import hashlib

PDF_SKILL_DIR = "/home/z/my-project/skills/pdf"
sys.path.insert(0, os.path.join(PDF_SKILL_DIR, "scripts"))
sys.path.insert(0, "/home/z/my-project/scripts")

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak,
    CondPageBreak, KeepTogether, Image, Flowable, HRFlowable,
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
from PIL import Image as PILImage

from dossier_content_a import CH_A
from dossier_content_b import CH_B

# ---------------- Fonts ----------------
FONT_DIR = "/usr/share/fonts"
pdfmetrics.registerFont(TTFont("NotoSerifSC", f"{FONT_DIR}/truetype/noto-serif-sc/NotoSerifSC-Regular.ttf"))
pdfmetrics.registerFont(TTFont("NotoSerifSC-Bold", f"{FONT_DIR}/truetype/noto-serif-sc/NotoSerifSC-Bold.ttf"))
pdfmetrics.registerFont(TTFont("FreeSerif", f"{FONT_DIR}/truetype/freefont/FreeSerif.ttf"))
pdfmetrics.registerFont(TTFont("FreeSerif-Bold", f"{FONT_DIR}/truetype/freefont/FreeSerifBold.ttf"))
pdfmetrics.registerFont(TTFont("FreeSerif-Italic", f"{FONT_DIR}/truetype/freefont/FreeSerifItalic.ttf"))
pdfmetrics.registerFont(TTFont("FreeSerif-BoldItalic", f"{FONT_DIR}/truetype/freefont/FreeSerifBoldItalic.ttf"))
pdfmetrics.registerFont(TTFont("DejaVuSans", f"{FONT_DIR}/truetype/dejavu/DejaVuSansMono.ttf"))
registerFontFamily("NotoSerifSC", normal="NotoSerifSC", bold="NotoSerifSC-Bold")
registerFontFamily("FreeSerif", normal="FreeSerif", bold="FreeSerif-Bold",
                   italic="FreeSerif-Italic", boldItalic="FreeSerif-BoldItalic")
registerFontFamily("DejaVuSans", normal="DejaVuSans", bold="DejaVuSans")

from pdf import install_font_fallback  # noqa: E402
install_font_fallback()

# ---------------- Palette (cascade, seed 7) ----------------
PAGE_BG = colors.HexColor("#eff0f1")
SECTION_BG = colors.HexColor("#f0f1f2")
CARD_BG = colors.HexColor("#e4e7e8")
TABLE_STRIPE = colors.HexColor("#ebedee")
HEADER_FILL = colors.HexColor("#334650")
COVER_BLOCK = colors.HexColor("#5a7886")
BORDER = colors.HexColor("#b8c8cf")
ICON = colors.HexColor("#52798c")
ACCENT = colors.HexColor("#3681a6")
ACCENT_2 = colors.HexColor("#b43a4e")
TEXT_PRIMARY = colors.HexColor("#1a1b1c")
TEXT_MUTED = colors.HexColor("#6f7578")

# ---------------- Page geometry ----------------
PAGE_W, PAGE_H = A4
MARGIN = 1.0 * inch
AVAIL_W = PAGE_W - 2 * MARGIN
AVAIL_H = PAGE_H - 2 * MARGIN
MAX_KEEP_HEIGHT = PAGE_H * 0.4
H1_ORPHAN = AVAIL_H * 0.25

DOC_TITLE = "DEYOUNG COMMUNICATION Project Dossier"
FOOT_AUTHOR = "DEYOUNG COMMUNICATION"
BASE = "/home/z/my-project"
BODY_PDF = f"{BASE}/scripts/dossier_body.pdf"

# ---------------- Styles ----------------
body_style = ParagraphStyle(
    "Body", fontName="FreeSerif", fontSize=10.5, leading=17,
    alignment=TA_JUSTIFY, textColor=TEXT_PRIMARY, spaceBefore=0, spaceAfter=10,
)
bullet_style = ParagraphStyle(
    "Bullet", fontName="FreeSerif", fontSize=10.5, leading=16,
    alignment=TA_LEFT, textColor=TEXT_PRIMARY, leftIndent=18,
    bulletIndent=6, spaceBefore=0, spaceAfter=5,
    bulletFontName="FreeSerif", bulletFontSize=10.5,
)
h1_style = ParagraphStyle(
    "H1", fontName="FreeSerif-Bold", fontSize=21, leading=26,
    alignment=TA_LEFT, textColor=HEADER_FILL, spaceBefore=0, spaceAfter=4,
)
h2_style = ParagraphStyle(
    "H2", fontName="FreeSerif-Bold", fontSize=14.5, leading=19,
    alignment=TA_LEFT, textColor=TEXT_PRIMARY, spaceBefore=16, spaceAfter=8,
)
h3_style = ParagraphStyle(
    "H3", fontName="FreeSerif-Bold", fontSize=11.5, leading=15,
    alignment=TA_LEFT, textColor=TEXT_PRIMARY, spaceBefore=12, spaceAfter=6,
)
tbl_header_style = ParagraphStyle(
    "TblHeader", fontName="FreeSerif-Bold", fontSize=9.5, leading=12,
    alignment=TA_LEFT, textColor=colors.white,
)
tbl_cell_style = ParagraphStyle(
    "TblCell", fontName="FreeSerif", fontSize=9, leading=12,
    alignment=TA_LEFT, textColor=TEXT_PRIMARY,
)
caption_style = ParagraphStyle(
    "Caption", fontName="FreeSerif-Italic", fontSize=8.5, leading=11,
    alignment=TA_CENTER, textColor=TEXT_MUTED, spaceBefore=0, spaceAfter=0,
)
toc_title_style = ParagraphStyle(
    "TocTitle", fontName="FreeSerif-Bold", fontSize=20, leading=25,
    alignment=TA_LEFT, textColor=HEADER_FILL, spaceAfter=14,
)
toc_l0 = ParagraphStyle(
    "TOCL0", fontName="FreeSerif-Bold", fontSize=10.5, leading=15,
    leftIndent=0, spaceBefore=7, textColor=TEXT_PRIMARY,
)
toc_l1 = ParagraphStyle(
    "TOCL1", fontName="FreeSerif", fontSize=9.5, leading=13,
    leftIndent=16, spaceBefore=2, textColor=TEXT_PRIMARY,
)

# ---------------- Doc template ----------------
ROMAN = {1: "i", 2: "ii", 3: "iii", 4: "iv", 5: "v", 6: "vi", 7: "vii", 8: "viii", 9: "ix", 10: "x"}


class BodyStart(Flowable):
    """Zero-size marker placed after the TOC, before the TOC->content PageBreak.
    Records that the body begins on the NEXT physical page."""

    def __init__(self):
        Flowable.__init__(self)
        self.width = 0
        self.height = 0

    def draw(self):
        pass


class TocDocTemplate(SimpleDocTemplate):
    def __init__(self, *a, **kw):
        SimpleDocTemplate.__init__(self, *a, **kw)
        self._body_start_phys = None

    def afterFlowable(self, flowable):
        if isinstance(flowable, BodyStart):
            self._body_start_phys = self.page + 1
            return
        if hasattr(flowable, "bookmark_name"):
            level = getattr(flowable, "bookmark_level", 0)
            text = getattr(flowable, "bookmark_text", "")
            key = getattr(flowable, "bookmark_key", "")
            if self._body_start_phys:
                display = self.page - self._body_start_phys + 1
            else:
                display = self.page
            self.notify("TOCEntry", (level, text, display, key))


def decorate_page(cv, doc):
    """Header + footer for every body-PDF page."""
    cv.saveState()
    # Header: doc title left + thin accent rule
    cv.setFont("FreeSerif", 7.5)
    cv.setFillColor(TEXT_MUTED)
    cv.drawString(MARGIN, PAGE_H - 0.62 * inch, DOC_TITLE)
    cv.setStrokeColor(ACCENT)
    cv.setLineWidth(1.2)
    cv.line(MARGIN, PAGE_H - 0.70 * inch, PAGE_W - MARGIN, PAGE_H - 0.70 * inch)
    # Footer: light rule + author left + page number right
    cv.setStrokeColor(BORDER)
    cv.setLineWidth(0.5)
    cv.line(MARGIN, 0.62 * inch, PAGE_W - MARGIN, 0.62 * inch)
    cv.setFont("FreeSerif", 7.5)
    cv.setFillColor(TEXT_MUTED)
    cv.drawString(MARGIN, 0.46 * inch, FOOT_AUTHOR)
    start = doc._body_start_phys
    if start and doc.page >= start:
        label = str(doc.page - start + 1)
    else:
        label = ROMAN.get(doc.page, str(doc.page))
    cv.drawRightString(PAGE_W - MARGIN, 0.46 * inch, label)
    cv.restoreState()


# ---------------- Helpers ----------------
def add_heading(text, style, level=0):
    key = "h_" + hashlib.md5(text.encode()).hexdigest()[:8]
    p = Paragraph(f'<a name="{key}"/>{text}', style)
    p.bookmark_name = key
    p.bookmark_level = level
    p.bookmark_text = text
    p.bookmark_key = key
    return p


def safe_keep_together(elements):
    total_h = 0
    for el in elements:
        try:
            w, h = el.wrap(AVAIL_W, AVAIL_H)
        except Exception:
            h = 0
        total_h += h
    if total_h <= MAX_KEEP_HEIGHT:
        return [KeepTogether(elements)]
    elif len(elements) >= 2:
        return [KeepTogether(elements[:2])] + list(elements[2:])
    return list(elements)


def embed_image(path, max_width=None, max_height=None):
    if max_width is None:
        max_width = AVAIL_W
    if max_height is None:
        max_height = PAGE_H * 0.35
    pil = PILImage.open(path)
    ow, oh = pil.size
    ratio = min(max_width / ow if ow > max_width else 1.0,
                max_height / oh if oh > max_height else 1.0)
    return Image(path, width=ow * ratio, height=oh * ratio)


def build_table(spec):
    ratios = spec["ratios"]
    col_widths = [r * AVAIL_W * 0.99 for r in ratios]
    assert sum(col_widths) <= AVAIL_W + 0.5, "table overflow"
    data = []
    data.append([Paragraph(f"<b>{h}</b>", tbl_header_style) for h in spec["headers"]])
    for row in spec["rows"]:
        data.append([Paragraph(str(c), tbl_cell_style) for c in row])
    t = Table(data, colWidths=col_widths, repeatRows=1, hAlign="CENTER")
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), HEADER_FILL),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, TABLE_STRIPE]),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
        ("VALIGN", (0, 0), (-1, 0), "MIDDLE"),
        ("VALIGN", (0, 1), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return t


def render_blocks(story, blocks, h1=None):
    pending_h1 = h1  # (heading, rule) waiting to be glued to first element

    def flush(first_elements):
        nonlocal pending_h1
        if pending_h1 is not None:
            h, rule = pending_h1
            glue = [h, rule] + first_elements[:1]
            story.extend(safe_keep_together(glue))
            story.extend(first_elements[1:])
            pending_h1 = None
        else:
            story.extend(first_elements)

    for kind, payload in blocks:
        if kind == "p":
            flush([Paragraph(payload, body_style)])
        elif kind == "h2":
            flush([Paragraph(payload, h2_style)])
        elif kind == "h3":
            flush([Paragraph(payload, h3_style)])
        elif kind == "bullets":
            items = [Paragraph(item, bullet_style, bulletText="\u2022") for item in payload]
            flush(items)
            story.append(Spacer(1, 6))
        elif kind == "table":
            flush([])
            t = build_table(payload)
            cap = Paragraph(payload["caption"], caption_style)
            story.append(Spacer(1, 14))
            story.append(t)
            story.append(Spacer(1, 6))
            story.append(cap)
            story.append(Spacer(1, 16))
        elif kind == "image":
            flush([])
            img = embed_image(os.path.join(BASE, payload["path"]))
            cap = Paragraph(payload["caption"], caption_style)
            story.append(Spacer(1, 18))
            story.extend(safe_keep_together([img, Spacer(1, 8), cap]))
            story.append(Spacer(1, 18))
        else:
            raise ValueError(f"unknown block kind: {kind}")


def main():
    doc = TocDocTemplate(
        BODY_PDF, pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=MARGIN, bottomMargin=MARGIN,
        title=DOC_TITLE, author="Z.ai", creator="Z.ai",
        subject="Phase 1 planning dossier: research, PRD, architecture, schema, design system, roadmap",
    )

    story = []
    # --- TOC (front matter, roman) ---
    story.append(Paragraph("Table of Contents", toc_title_style))
    toc = TableOfContents()
    toc.levelStyles = [toc_l0, toc_l1]
    story.append(toc)
    story.append(BodyStart())
    story.append(PageBreak())

    # --- Chapters (body starts at Chapter 1) ---
    for ch in CH_A + CH_B:
        story.append(CondPageBreak(H1_ORPHAN))
        h = add_heading(f"{ch['num']}. {ch['title']}", h1_style, level=0)
        rule = HRFlowable(width="100%", color=ACCENT, thickness=1.2,
                          spaceBefore=2, spaceAfter=12)
        render_blocks(story, list(ch["blocks"]), h1=(h, rule))
        story.append(Spacer(1, 22))

    doc.multiBuild(story, onFirstPage=decorate_page, onLaterPages=decorate_page)
    print("body built:", BODY_PDF)


if __name__ == "__main__":
    main()
