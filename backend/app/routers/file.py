import secrets
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse

from app.config import UPLOAD_PATH
from app.dependencies import JwtUser, get_current_user

router = APIRouter(prefix="/file", tags=["file"])

ALLOWED_TYPES = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/wav": "wav",
    "application/pdf": "pdf",
    "text/plain": "txt",
}
MAX_FILE_SIZE = 10 * 1024 * 1024


@router.post("/upload")
async def upload_file(
    file: UploadFile | None = File(None),
    user: JwtUser = Depends(get_current_user),
):
    if file is None:
        raise HTTPException(status_code=400, detail={"error": "No file uploaded"})
    content_type = file.content_type or ""
    if content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail={"error": "File type not supported", "supportedTypes": list(ALLOWED_TYPES.keys())},
        )
    data = await file.read()
    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail={"error": f"File too large. Maximum size is {MAX_FILE_SIZE // (1024 * 1024)}MB"},
        )
    file_id = secrets.token_hex(16)
    extension = ALLOWED_TYPES[content_type]
    filename = f"{file_id}.{extension}"
    filepath = UPLOAD_PATH / filename
    filepath.write_bytes(data)
    uploaded_at = datetime.utcnow()
    return {
        "message": "File uploaded successfully",
        "file": {
            "id": file_id,
            "originalName": file.filename,
            "filename": filename,
            "size": len(data),
            "type": content_type,
            "uploadedAt": uploaded_at.isoformat(),
        },
    }


def _find_file(file_id: str) -> Path | None:
    for path in UPLOAD_PATH.iterdir():
        if path.is_file() and path.name.startswith(file_id):
            return path
    return None


@router.get("/download/{file_id}")
async def download_file(file_id: str):
    if not file_id:
        raise HTTPException(status_code=400, detail={"error": "File ID is required"})
    filepath = _find_file(file_id)
    if not filepath or not filepath.is_file():
        raise HTTPException(status_code=404, detail={"error": "File not found"})
    return FileResponse(filepath, filename=filepath.name)


@router.delete("/{file_id}")
async def delete_file(file_id: str, _user: JwtUser = Depends(get_current_user)):
    if not file_id:
        raise HTTPException(status_code=400, detail={"error": "File ID is required"})
    filepath = _find_file(file_id)
    if not filepath:
        raise HTTPException(status_code=404, detail={"error": "File not found"})
    filepath.unlink(missing_ok=True)
    return {"message": "File deleted successfully"}


@router.get("/list")
async def list_files(
    limit: int = Query(10),
    offset: int = Query(0),
    _user: JwtUser = Depends(get_current_user),
):
    files = sorted(UPLOAD_PATH.iterdir(), key=lambda p: p.stat().st_mtime)
    sliced = files[offset : offset + limit]
    file_list = []
    for path in sliced:
        if not path.is_file():
            continue
        stats = path.stat()
        file_list.append(
            {
                "id": path.name.split(".")[0],
                "filename": path.name,
                "size": stats.st_size,
                "uploadedAt": datetime.fromtimestamp(stats.st_ctime).isoformat(),
                "lastModified": datetime.fromtimestamp(stats.st_mtime).isoformat(),
            }
        )
    return {"files": file_list, "total": len(files), "limit": limit, "offset": offset}
