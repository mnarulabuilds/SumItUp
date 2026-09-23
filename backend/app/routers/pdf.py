from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.services.pdf_service import generate_pdf

router = APIRouter(prefix="/pdf", tags=["pdf"])


class PdfGenerateBody(BaseModel):
    summary: str


@router.get("/generate")
async def generate_pdf_get(summary: str | None = Query(None)):
    if not summary or not summary.strip():
        raise HTTPException(status_code=400, detail={"error": "Summary is required"})
    try:
        path = generate_pdf(summary)
        return {"message": "PDF generated successfully", "path": path}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail={"error": str(exc)}) from exc
    except Exception:
        raise HTTPException(status_code=500, detail={"error": "Failed to generate PDF"}) from None


@router.post("/generate")
async def generate_pdf_post(body: PdfGenerateBody):
    if not body.summary or not body.summary.strip():
        raise HTTPException(status_code=400, detail={"error": "Summary is required"})
    try:
        path = generate_pdf(body.summary)
        return {"message": "PDF generated successfully", "path": path}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail={"error": str(exc)}) from exc
    except Exception:
        raise HTTPException(status_code=500, detail={"error": "Failed to generate PDF"}) from None
