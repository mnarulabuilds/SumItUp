import hashlib

from app.cache_service import cache_service
from app.config import OPENAI_API_KEY, OPENAI_SUMMARY_MODEL
from app.utils.generate_summary_from_text import generate_summary_from_text


async def summarize(text: str, options: dict | None = None) -> str:
    if not text or not text.strip():
        return ""
    if OPENAI_API_KEY:
        try:
            from openai import OpenAI

            client = OpenAI(api_key=OPENAI_API_KEY)
            response = client.chat.completions.create(
                model=OPENAI_SUMMARY_MODEL,
                messages=[
                    {"role": "system", "content": "Summarize the following text concisely."},
                    {"role": "user", "content": text[:12000]},
                ],
            )
            content = response.choices[0].message.content
            return content.strip() if content else generate_summary_from_text(text, options)
        except Exception:
            pass
    return generate_summary_from_text(text, options)


async def summarize_cached(text: str, options: dict | None = None) -> str:
    key = f"summary:text:{hashlib.sha256(text.encode()).hexdigest()}"
    cached = cache_service.get(key)
    if cached is not None:
        return cached

    summary = await summarize(text, options)
    cache_service.set(key, summary, ttl=60 * 30)
    return summary
