from pathlib import Path

from fastapi import APIRouter
from fastapi.responses import HTMLResponse

router = APIRouter(prefix="/docs", tags=["docs"])

DOC_PATH = Path(__file__).resolve().parents[2] / "API_DOCUMENTATION.md"


@router.get("/", response_class=HTMLResponse)
async def api_docs():
    if DOC_PATH.is_file():
        body = DOC_PATH.read_text(encoding="utf-8")
    else:
        body = "# SumItUp API\n\nDocumentation placeholder."
    html = f"<!DOCTYPE html><html><body><pre>{body}</pre></body></html>"
    return HTMLResponse(html)
