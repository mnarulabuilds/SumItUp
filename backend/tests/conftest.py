import os

import pytest

os.environ.setdefault("NODE_ENV", "test")
os.environ.setdefault("JWT_SECRET", "test-jwt-secret-key-for-unit-tests")
os.environ.setdefault("MONGODB_URI", "mongodb://localhost:27017/sumitup-test")


@pytest.fixture(autouse=True)
def _reset_cache():
    from app.cache_service import cache_service

    cache_service.flush_all()
    yield
    cache_service.flush_all()
