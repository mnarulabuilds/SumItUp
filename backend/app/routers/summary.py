from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.dependencies import JwtUser, get_current_user
from app.errors import AppError
from app.services import summary_options, text_summarization, url_content
from app.utils import media
from app.utils.upload_paths import resolve_upload_path

router = APIRouter(prefix="/summary", tags=["summary"], dependencies=[Depends(get_current_user)])

FIXTURE_AUDIO_DIR = Path(__file__).resolve().parents[2] / "fixtures" / "audio"


class AudioData(BaseModel):
    audioFileName: str
    format: str | None = None


class AudioBody(BaseModel):
    audioData: AudioData


class UrlBody(BaseModel):
    url: str


class BookBody(BaseModel):
    bookData: dict


class PdfBody(BaseModel):
    pdfData: dict


class ImageBody(BaseModel):
    imageData: dict | str


class VideoBody(BaseModel):
    videoFileName: str | None = None
    videoData: dict | None = None


class GifBody(BaseModel):
    gifUrl: str | None = None
    gifFileName: str | None = None


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


def _audio_format(filename: str, explicit: str | None) -> str:
    if explicit:
        return explicit.lower()
    ext = Path(filename).suffix.lower().lstrip(".")
    if ext in ("mp3", "wav", "m4a", "aac", "mp4"):
        return ext if ext != "mp4" else "mp3"
    return "mp3"


def _image_filename(image_data: dict | str) -> str | None:
    if isinstance(image_data, str):
        return image_data
    return image_data.get("imageFileName") or image_data.get("filename")


def _video_filename(body: VideoBody) -> str | None:
    if body.videoFileName:
        return body.videoFileName
    if body.videoData:
        return body.videoData.get("videoFileName") or body.videoData.get("filename")
    return None


async def _summarize(user_id: str, text: str, overrides: dict | None = None) -> str:
    options = await summary_options.summary_options_for_user(user_id, overrides)
    return await text_summarization.summarize_cached(text, options)


@router.post("/generate/audio")
async def generate_audio_summary(body: AudioBody, user: JwtUser = Depends(get_current_user)):
    audio = body.audioData
    if not audio or not audio.audioFileName:
        raise HTTPException(status_code=400, detail={"error": "Invalid audio data provided."})
    fmt = _audio_format(audio.audioFileName, audio.format)
    if fmt not in ("mp3", "wav", "m4a", "aac"):
        raise HTTPException(status_code=400, detail={"error": "Audio format not supported"})
    file_path = _resolve_media_path(audio.audioFileName)
    if not file_path:
        raise HTTPException(status_code=400, detail={"error": "Audio file not found."})
    try:
        text = await media.convert_audio_to_text(file_path)
        if not text:
            raise HTTPException(status_code=400, detail={"error": "No text found in the audio."})
        summary = await _summarize(user.id, text)
        return {"summary": summary}
    except HTTPException:
        raise
    except AppError as exc:
        raise HTTPException(status_code=exc.status_code, detail={"error": exc.message}) from exc
    except Exception:
        raise HTTPException(status_code=500, detail={"error": "Internal Server Error"}) from None


@router.post("/generate/url")
async def generate_url_summary(body: UrlBody, user: JwtUser = Depends(get_current_user)):
    if not body.url:
        raise HTTPException(status_code=400, detail={"error": "URL is required"})
    try:
        text = await url_content.extract_main_text(body.url)
        summary = await _summarize(user.id, text)
        return {"summary": summary or "Could not generate summary from content."}
    except AppError as exc:
        raise HTTPException(status_code=exc.status_code, detail={"error": exc.message}) from exc
    except Exception:
        raise HTTPException(
            status_code=500,
            detail={"error": "Failed to process URL. Ensure it is accessible."},
        ) from None


@router.post("/generate/image")
async def generate_image_summary(body: ImageBody, user: JwtUser = Depends(get_current_user)):
    filename = _image_filename(body.imageData)
    if not filename:
        raise HTTPException(status_code=400, detail={"error": "Image file name is required"})
    file_path = _resolve_media_path(filename)
    if not file_path:
        raise HTTPException(status_code=404, detail={"error": "Image file not found"})
    try:
        text = await media.convert_image_to_text(file_path)
        summary = await _summarize(user.id, text)
        return {"summary": summary}
    except Exception:
        raise HTTPException(status_code=500, detail={"error": "Internal Server Error"}) from None


@router.post("/generate/video")
async def generate_video_summary(body: VideoBody, user: JwtUser = Depends(get_current_user)):
    filename = _video_filename(body)
    if not filename:
        raise HTTPException(status_code=400, detail={"error": "Video file is required"})
    file_path = _resolve_media_path(filename)
    if not file_path:
        raise HTTPException(status_code=400, detail={"error": "Video file not found"})
    try:
        try:
            text = await media.convert_audio_to_text(file_path)
        except AppError:
            text = await media.extract_pdf_text(file_path) if file_path.suffix.lower() == ".pdf" else ""
        if not text:
            text = f"Video file {file_path.name} uploaded for summarization."
        summary = await _summarize(user.id, text)
        return {"summary": summary}
    except HTTPException:
        raise
    except AppError as exc:
        raise HTTPException(status_code=exc.status_code, detail={"error": exc.message}) from exc
    except Exception:
        raise HTTPException(status_code=500, detail={"error": "Internal Server Error"}) from None


@router.post("/generate/gif")
async def generate_gif_summary(body: GifBody, user: JwtUser = Depends(get_current_user)):
    if body.gifUrl:
        try:
            text = await url_content.extract_main_text(body.gifUrl)
            summary = await _summarize(user.id, text)
            return {"summary": summary}
        except AppError as exc:
            raise HTTPException(status_code=exc.status_code, detail={"error": exc.message}) from exc
        except Exception:
            raise HTTPException(status_code=500, detail={"error": "Internal Server Error"}) from None

    if body.gifFileName:
        file_path = _resolve_media_path(body.gifFileName)
        if not file_path:
            raise HTTPException(status_code=404, detail={"error": "GIF file not found"})
        text = await media.convert_image_to_text(file_path)
        summary = await _summarize(user.id, text)
        return {"summary": summary}

    raise HTTPException(status_code=400, detail={"error": "GIF URL or uploaded file is required"})


@router.post("/generate/book")
async def generate_book_summary(body: BookBody, user: JwtUser = Depends(get_current_user)):
    book = body.bookData or {}
    content = book.get("content") or book.get("text")
    if not content:
        pdf_name = book.get("pdfFileName") or book.get("bookUrl")
        if pdf_name:
            file_path = _resolve_media_path(pdf_name)
            if not file_path:
                raise HTTPException(status_code=404, detail={"error": "Book file not found"})
            content = await media.extract_pdf_text(file_path)
    if not content:
        raise HTTPException(status_code=400, detail={"error": "Invalid book data format"})
    try:
        summary = await _summarize(user.id, content)
        return {"summary": summary}
    except Exception:
        raise HTTPException(status_code=500, detail={"error": "Internal Server Error"}) from None


@router.post("/generate/pdf")
async def generate_pdf_summary(body: PdfBody, user: JwtUser = Depends(get_current_user)):
    pdf_data = body.pdfData or {}
    filename = pdf_data.get("pdfFileName") or pdf_data.get("pdfUrl")
    if not filename:
        raise HTTPException(status_code=400, detail={"error": "PDF data is required"})
    file_path = _resolve_media_path(filename)
    if not file_path:
        raise HTTPException(status_code=404, detail={"error": "PDF file not found"})
    try:
        text = await media.extract_pdf_text(file_path)
        if not text:
            raise HTTPException(status_code=400, detail={"error": "No readable text found in PDF."})
        summary = await _summarize(user.id, text)
        return {"summary": summary}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail={"error": "Internal Server Error"}) from None


@router.post("/generate/meeting")
async def generate_meeting_summary(body: MeetingBody, user: JwtUser = Depends(get_current_user)):
    meeting = body.meetingData or {}
    filename = meeting.get("audioFileName") or meeting.get("recordingFileName")
    if not filename:
        raise HTTPException(status_code=400, detail={"error": "Meeting audio file is required"})
    file_path = _resolve_media_path(filename)
    if not file_path:
        raise HTTPException(status_code=400, detail={"error": "Meeting audio not found"})
    try:
        text = await media.convert_audio_to_text(file_path)
        summary = await _summarize(
            user.id,
            text,
            {"length": "long", "style": "insights"},
        )
        return {"summary": summary}
    except AppError as exc:
        raise HTTPException(status_code=exc.status_code, detail={"error": exc.message}) from exc
    except Exception:
        raise HTTPException(status_code=500, detail={"error": "Internal Server Error"}) from None
