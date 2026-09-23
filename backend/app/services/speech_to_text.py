from pathlib import Path

from app.config import ASSEMBLYAI_API_KEY
from app.errors import AppError


async def transcribe_file(file_path: Path) -> str:
    if not ASSEMBLYAI_API_KEY:
        if file_path.suffix.lower() == ".txt":
            return file_path.read_text(encoding="utf-8", errors="ignore")
        raise AppError("Speech transcription service unavailable", 503)

    try:
        import assemblyai as aai

        aai.settings.api_key = ASSEMBLYAI_API_KEY
        transcriber = aai.Transcriber()
        transcript = transcriber.transcribe(str(file_path))
        if transcript.status == aai.TranscriptStatus.error:
            raise AppError(transcript.error or "Transcription failed", 422)
        text = (transcript.text or "").strip()
        if not text:
            raise AppError("No text found in the audio.", 400)
        return text
    except AppError:
        raise
    except Exception as exc:
        raise AppError("Speech transcription failed", 500) from exc
