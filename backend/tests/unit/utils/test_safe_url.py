import pytest

from app.errors import AppError
from app.utils.safe_url import assert_safe_public_url


@pytest.mark.asyncio
async def test_rejects_malformed_url():
    with pytest.raises(AppError) as exc:
        await assert_safe_public_url("not-a-url")
    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_rejects_non_http_protocol():
    with pytest.raises(AppError):
        await assert_safe_public_url("ftp://example.com/file")


@pytest.mark.asyncio
async def test_rejects_localhost():
    with pytest.raises(AppError):
        await assert_safe_public_url("http://localhost/path")


@pytest.mark.asyncio
async def test_rejects_private_ip():
    with pytest.raises(AppError):
        await assert_safe_public_url("http://127.0.0.1/")
