import pytest

from app.cache_service import CacheService


@pytest.fixture
def cache_service():
    service = CacheService()
    service.flush_all()
    return service


def test_set_and_get(cache_service):
    cache_service.set("key", "value")
    assert cache_service.get("key") == "value"


def test_ttl_and_keys(cache_service):
    cache_service.set("ttl-key", 42, 60)
    assert cache_service.has("ttl-key") is True
    assert "ttl-key" in cache_service.keys()
    assert cache_service.get_ttl("ttl-key") is not None
    assert cache_service.ttl("ttl-key", 120) is True


def test_delete_and_stats(cache_service):
    cache_service.set("a", 1)
    cache_service.set("b", 2)
    assert cache_service.delete("a") == 1
    assert isinstance(cache_service.get_stats(), dict)


@pytest.mark.asyncio
async def test_get_or_set(cache_service):
    calls = 0

    async def fetch():
        nonlocal calls
        calls += 1
        return "loaded"

    first = await cache_service.get_or_set("load-key", fetch, ttl=30)
    second = await cache_service.get_or_set("load-key", fetch, ttl=30)
    assert first == "loaded"
    assert second == "loaded"
    assert calls == 1


@pytest.mark.asyncio
async def test_memoize(cache_service):
    calls = 0

    async def fn(item_id):
        nonlocal calls
        calls += 1
        return f"value-{item_id}"

    memoized = cache_service.memoize(fn, lambda item_id: f"memo-{item_id}", 30)
    assert await memoized("x") == "value-x"
    assert await memoized("x") == "value-x"
    assert calls == 1
