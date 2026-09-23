from pathlib import Path

from pypdf import PdfReader

from app.services.speech_to_text import transcribe_file


async def convert_audio_to_text(file_path: Path) -> str:
    return await transcribe_file(file_path)


async def convert_image_to_text(file_path: Path) -> str:
    if file_path.suffix.lower() == ".txt":
        return file_path.read_text(encoding="utf-8", errors="ignore")
    return f"Image content from {file_path.name}"


async def extract_pdf_text(file_path: Path) -> str:
    reader = PdfReader(str(file_path))
    parts = []
    for page in reader.pages:
        parts.append(page.extract_text() or "")
    return " ".join(parts).strip()
