import time
from collections.abc import Awaitable, Callable
from dataclasses import dataclass, field
from typing import Any, TypeVar

T = TypeVar("T")

DEFAULT_TTL = 60 * 15


@dataclass
class _CacheEntry:
    value: Any
    expires_at: float | None = None


@dataclass
class CacheService:
    _store: dict[str, _CacheEntry] = field(default_factory=dict)
    _hits: int = 0
    _misses: int = 0

    def _is_expired(self, entry: _CacheEntry) -> bool:
        return entry.expires_at is not None and time.time() > entry.expires_at

    def get(self, key: str) -> Any | None:
        entry = self._store.get(key)
        if entry is None or self._is_expired(entry):
            if entry is not None:
                del self._store[key]
            self._misses += 1
            return None
        self._hits += 1
        return entry.value

    def set(self, key: str, value: Any, ttl: int | None = None) -> bool:
        expires_at = None
        if ttl and ttl > 0:
            expires_at = time.time() + ttl
        elif ttl is None:
            expires_at = time.time() + DEFAULT_TTL
        self._store[key] = _CacheEntry(value=value, expires_at=expires_at)
        return True

    def delete(self, key: str | list[str]) -> int:
        keys = [key] if isinstance(key, str) else key
        removed = 0
        for k in keys:
            if k in self._store:
                del self._store[k]
                removed += 1
        return removed

    def has(self, key: str) -> bool:
        return self.get(key) is not None

    def get_stats(self) -> dict[str, int]:
        return {"keys": len(self._store), "hits": self._hits, "misses": self._misses}

    def flush_all(self) -> None:
        self._store.clear()

    def keys(self) -> list[str]:
        alive = []
        for key, entry in list(self._store.items()):
            if self._is_expired(entry):
                del self._store[key]
            else:
                alive.append(key)
        return alive

    def get_ttl(self, key: str) -> float | None:
        entry = self._store.get(key)
        if entry is None or entry.expires_at is None:
            return None
        return max(0.0, entry.expires_at - time.time())

    def ttl(self, key: str, ttl_seconds: int) -> bool:
        entry = self._store.get(key)
        if entry is None:
            return False
        entry.expires_at = time.time() + ttl_seconds
        return True

    async def get_or_set(
        self,
        key: str,
        fetch_function: Callable[[], Awaitable[T] | T],
        ttl: int | None = None,
    ) -> T:
        cached = self.get(key)
        if cached is not None:
            return cached  # type: ignore[return-value]
        value = fetch_function()
        if isinstance(value, Awaitable):
            value = await value
        self.set(key, value, ttl)
        return value  # type: ignore[return-value]

    def memoize(
        self,
        fn: Callable[..., Awaitable[T]],
        key_generator: Callable[..., str],
        ttl: int | None = None,
    ) -> Callable[..., Awaitable[T]]:
        async def wrapped(*args: Any, **kwargs: Any) -> T:
            key = key_generator(*args, **kwargs)
            cached = self.get(key)
            if cached is not None:
                return cached  # type: ignore[return-value]
            result = await fn(*args, **kwargs)
            self.set(key, result, ttl)
            return result

        return wrapped


cache_service = CacheService()
