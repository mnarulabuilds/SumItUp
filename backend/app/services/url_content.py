import httpx
from bs4 import BeautifulSoup

from app.errors import AppError
from app.utils.safe_url import assert_safe_public_url


async def extract_main_text(url: str) -> str:
    await assert_safe_public_url(url)
    async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
        response = await client.get(url)
        response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")
    paragraphs = [p.get_text(" ", strip=True) for p in soup.find_all("p") if p.get_text(strip=True)]
    text = " ".join(paragraphs).strip()
    if len(text) < 100:
        text = soup.body.get_text(" ", strip=True) if soup.body else text
    if len(text) < 100:
        raise AppError("Insufficient text content extracted from URL", 422)
    return text
