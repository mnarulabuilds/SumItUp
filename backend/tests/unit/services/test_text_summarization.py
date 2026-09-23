import pytest

from app.services import text_summarization


@pytest.mark.asyncio
async def test_blank_returns_empty():
    assert await text_summarization.summarize("") == ""
    assert await text_summarization.summarize("   ") == ""


@pytest.mark.asyncio
async def test_summarize_cached_uses_cache(monkeypatch):
    calls = 0

    async def fake_summarize(text, options=None):
        nonlocal calls
        calls += 1
        return "cached-summary"

    monkeypatch.setattr(text_summarization, "summarize", fake_summarize)
    first = await text_summarization.summarize_cached("same text")
    second = await text_summarization.summarize_cached("same text")
    assert first == "cached-summary"
    assert second == "cached-summary"
    assert calls == 1
