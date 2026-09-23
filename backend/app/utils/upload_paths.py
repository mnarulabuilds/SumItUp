from pathlib import Path

from app.config import UPLOAD_PATH
from app.errors import AppError


def resolve_upload_path(filename: str) -> Path:
    if not filename or not filename.strip():
        raise AppError("Filename is required", 400)
    safe_name = Path(filename).name
    if not safe_name:
        raise AppError("Filename is required", 400)
    return UPLOAD_PATH / safe_name


def assert_upload_exists(filename: str) -> Path:
    path = resolve_upload_path(filename)
    if not path.is_file():
        raise AppError("File not found", 404)
    return path
