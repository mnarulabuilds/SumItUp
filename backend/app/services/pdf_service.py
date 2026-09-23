import time
from pathlib import Path

from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

from app.config import PDF_PATH


def generate_pdf(summary: str) -> str:
    if not summary or not summary.strip():
        raise ValueError("Summary is required")

    filename = f"summary_{int(time.time() * 1000)}.pdf"
    filepath = PDF_PATH / filename
    c = canvas.Canvas(str(filepath), pagesize=letter)
    width, height = letter
    y = height - 72
    for line in summary.split("\n"):
        c.drawString(72, y, line[:100])
        y -= 14
        if y < 72:
            c.showPage()
            y = height - 72
    c.save()
    return str(filepath)
