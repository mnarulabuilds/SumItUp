from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.dependencies import JwtUser, get_current_user
from app.errors import AppError
from app.services import text_summarization, url_content
from app.utils import media
from app.utils.upload_paths import resolve_upload_path

router = APIRouter(prefix="/summary", tags=["summary"], dependencies=[Depends(get_current_user)])

FIXTURE_AUDIO_DIR = Path(__file__).resolve().parents[2] / "fixtures" / "audio"


class AudioData(BaseModel):
    audioFileName: str
    format: str


class AudioBody(BaseModel):
    audioData: AudioData


class UrlBody(BaseModel):
    url: str


class BookBody(BaseModel):
    bookData: dict


class PdfBody(BaseModel):
    pdfData: dict


class ImageBody(BaseModel):
    imageData: dict


class VideoBody(BaseModel):
    videoFileName: str | None = None


class GifBody(BaseModel):
    gifUrl: str | None = None


class MeetingBody(BaseModel):
    meetingData: dict | None = None


def _resolve_media_path(filename: str) -> Path | None:
    try:
        path = resolve_upload_path(filename)
        if path.is_file():
            return path
    except AppError:
        pass
    fixture = FIXTURE_AUDIO_DIR / Path(filename).name
    return fixture if fixture.is_file() else None


@router.post("/generate/audio")
async def generate_audio_summary(body: AudioBody, _user: JwtUser = Depends(get_current_user)):
    audio = body.audioData
    if not audio or not audio.audioFileName or not audio.format:
        raise HTTPException(status_code=400, detail={"error": "Invalid audio data provided."})
    if audio.format not in ("mp3", "wav"):
        raise HTTPException(status_code=400, detail={"error": "Audio format not supported"})
    file_path = _resolve_media_path(audio.audioFileName)
    if not file_path:
        raise HTTPException(status_code=400, detail={"error": "Audio file not found."})
    try:
        text = await media.convert_audio_to_text(file_path)
        if not text:
            raise HTTPException(status_code=400, detail={"error": "No text found in the audio."})
        summary = await text_summarization.summarize_cached(text)
        return {"summary": summary}
    except HTTPException:
        raise
    except AppError as exc:
        raise HTTPException(status_code=exc.status_code, detail={"error": exc.message}) from exc
    except Exception:
        raise HTTPException(status_code=500, detail={"error": "Internal Server Error"}) from None


@router.post("/generate/url")
async def generate_url_summary(body: UrlBody, _user: JwtUser = Depends(get_current_user)):
    if not body.url:
        raise HTTPException(status_code=400, detail={"error": "URL is required"})
    try:
        text = await url_content.extract_main_text(body.url)
        summary = await text_summarization.summarize_cached(text)
        return {"summary": summary or "Could not generate summary from content."}
    except AppError as exc:
        raise HTTPException(status_code=exc.status_code, detail={"error": exc.message}) from exc
    except Exception:
        raise HTTPException(
            status_code=500,
            detail={"error": "Failed to process URL. Ensure it is accessible."},
        ) from None


@router.post("/generate/image")
async def generate_image_summary(body: ImageBody, _user: JwtUser = Depends(get_current_user)):
    image_data = body.imageData or {}
    filename = image_data.get("imageFileName")
    if not filename:
        raise HTTPException(status_code=400, detail={"error": "Image file name is required"})
    file_path = _resolve_media_path(filename)
    if not file_path:
        raise HTTPException(status_code=404, detail={"error": "Image file not found"})
    try:
        text = await media.convert_image_to_text(file_path)
        summary = await text_summarization.summarize_cached(text)
        return {"summary": summary}
    except Exception:
        raise HTTPException(status_code=500, detail={"error": "Internal Server Error"}) from None


@router.post("/generate/video")
async def generate_video_summary(body: VideoBody, _user: JwtUser = Depends(get_current_user)):
    if not body.videoFileName:
        raise HTTPException(status_code=400, detail={"error": "Video file is required"})
    file_path = _resolve_media_path(body.videoFileName)
    if not file_path:
        raise HTTPException(status_code=400, detail={"error": "Video file not found"})
    try:
        summary = await text_summarization.summarize_cached(f"Video summary for {file_path.name}")
        return {"summary": summary}
    except Exception:
        raise HTTPException(status_code=500, detail={"error": "Internal Server Error"}) from None


@router.post("/generate/gif")
async def generate_gif_summary(body: GifBody, _user: JwtUser = Depends(get_current_user)):
    if not body.gifUrl:
        raise HTTPException(status_code=400, detail={"error": "GIF URL is required"})
    try:
        text = await url_content.extract_main_text(body.gifUrl)
        summary = await text_summarization.summarize_cached(text)
        return {"summary": summary}
    except AppError as exc:
        raise HTTPException(status_code=exc.status_code, detail={"error": exc.message}) from exc
    except Exception:
        raise HTTPException(status_code=500, detail={"error": "Internal Server Error"}) from None


@router.post("/generate/book")
async def generate_book_summary(body: BookBody, _user: JwtUser = Depends(get_current_user)):
    book = body.bookData or {}
    content = book.get("content") or book.get("text")
    if not content:
        raise HTTPException(status_code=400, detail={"error": "Invalid book data format"})
    try:
        summary = await text_summarization.summarize_cached(content)
        return {"summary": summary}
    except Exception:
        raise HTTPException(status_code=500, detail={"error": "Internal Server Error"}) from None


@router.post("/generate/pdf")
async def generate_pdf_summary(body: PdfBody, _user: JwtUser = Depends(get_current_user)):
    pdf_data = body.pdfData or {}
    filename = pdf_data.get("pdfFileName")
    if not filename:
        raise HTTPException(status_code=400, detail={"error": "PDF data is required"})
    file_path = _resolve_media_path(filename)
    if not file_path:
        raise HTTPException(status_code=404, detail={"error": "PDF file not found"})
    try:
        text = await media.extract_pdf_text(file_path)
        summary = await text_summarization.summarize_cached(text)
        return {"summary": summary}
    except Exception:
        raise HTTPException(status_code=500, detail={"error": "Internal Server Error"}) from None


@router.post("/generate/meeting")
async def generate_meeting_summary(body: MeetingBody, _user: JwtUser = Depends(get_current_user)):
    meeting = body.meetingData or {}
    filename = meeting.get("audioFileName")
    if not filename:
        raise HTTPException(status_code=400, detail={"error": "Meeting audio file is required"})
    file_path = _resolve_media_path(filename)
    if not file_path:
        raise HTTPException(status_code=400, detail={"error": "Meeting audio not found"})
    try:
        text = await media.convert_audio_to_text(file_path)
        summary = await text_summarization.summarize_cached(
            text,
            {"length": "long", "style": "insights"},
        )
        return {"summary": summary}
    except AppError as exc:
        raise HTTPException(status_code=exc.status_code, detail={"error": exc.message}) from exc
    except Exception:
        raise HTTPException(status_code=500, detail={"error": "Internal Server Error"}) from None
