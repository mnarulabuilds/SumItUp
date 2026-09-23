import ipaddress
import socket
from urllib.parse import urlparse

from app.errors import AppError

BLOCKED_HOSTNAMES = {"localhost", "metadata.google.internal"}


def _is_private_ip(ip: str) -> bool:
    try:
        addr = ipaddress.ip_address(ip)
        return addr.is_private or addr.is_loopback or addr.is_link_local
    except ValueError:
        return False


async def assert_safe_public_url(raw_url: str):
    try:
        parsed = urlparse(raw_url)
        if not parsed.scheme or not parsed.netloc:
            raise ValueError("invalid")
    except ValueError as exc:
        raise AppError("Invalid URL format", 400) from exc

    if parsed.scheme not in ("http", "https"):
        raise AppError("Only HTTP and HTTPS URLs are allowed", 400)

    hostname = parsed.hostname
    if not hostname:
        raise AppError("Invalid URL format", 400)

    hostname_lower = hostname.lower()
    if hostname_lower in BLOCKED_HOSTNAMES:
        raise AppError("URL host is not allowed", 400)

    try:
        ipaddress.ip_address(hostname)
        if _is_private_ip(hostname):
            raise AppError("URL host is not allowed", 400)
        return parsed
    except ValueError:
        pass

    loop = socket.getaddrinfo(hostname, None)
    for entry in loop:
        addr = entry[4][0]
        if _is_private_ip(addr):
            raise AppError("URL host is not allowed", 400)

    return parsed
