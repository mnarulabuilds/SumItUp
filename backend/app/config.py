import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_PATH = Path(os.getenv("UPLOAD_PATH", str(BASE_DIR / "uploads")))
PDF_PATH = BASE_DIR / "pdfs"

PORT = int(os.getenv("PORT", "3000"))
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://127.0.0.1:27017/sumitup")
JWT_SECRET = os.getenv("JWT_SECRET", "")
NODE_ENV = os.getenv("NODE_ENV", os.getenv("ENV", "development"))
EMAIL_USER = os.getenv("EMAIL_USER", "")
EMAIL_PASS = os.getenv("EMAIL_PASS", "")
CLIENT_URL = os.getenv("CLIENT_URL", "http://localhost:8080")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_SUMMARY_MODEL = os.getenv("OPENAI_SUMMARY_MODEL", "gpt-4o-mini")
ASSEMBLYAI_API_KEY = os.getenv("ASSEMBLYAI_API_KEY", "")

UPLOAD_PATH.mkdir(parents=True, exist_ok=True)
PDF_PATH.mkdir(parents=True, exist_ok=True)
