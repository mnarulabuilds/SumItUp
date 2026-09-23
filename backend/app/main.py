from datetime import datetime

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import NODE_ENV
from app.errors import AppError
from app.routers import ad, auth, billing, content, docs, donations, file, pdf, search, summary, token, user

app = FastAPI(title="SumItUp API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(HTTPException)
async def http_exception_handler(_request: Request, exc: HTTPException):
    if isinstance(exc.detail, dict):
        return JSONResponse(status_code=exc.status_code, content=exc.detail)
    return JSONResponse(status_code=exc.status_code, content={"error": str(exc.detail)})


@app.exception_handler(AppError)
async def app_error_handler(_request: Request, exc: AppError):
    return JSONResponse(status_code=exc.status_code, content={"error": exc.message})


@app.exception_handler(Exception)
async def unhandled_exception_handler(_request: Request, exc: Exception):
    message = "Internal Server Error" if NODE_ENV == "production" else str(exc) or "Internal Server Error"
    return JSONResponse(status_code=500, content={"error": message})


@app.get("/")
async def health():
    return {
        "status": "success",
        "message": "SumItUp Backend is running successfully!",
        "timestamp": datetime.utcnow().isoformat(),
    }


for router in (
    docs.router,
    ad.router,
    auth.router,
    summary.router,
    pdf.router,
    search.router,
    token.router,
    file.router,
    content.router,
    user.router,
    billing.router,
    donations.router,
):
    app.include_router(router, prefix="/api")
