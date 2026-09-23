import dns from "dns/promises";
import net from "net";
import { AppError } from "../../lib/errors/AppError";

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
]);

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const parts = ip.split(".").map(Number);
    if (parts[0] === 10) return true;
    if (parts[0] === 127) return true;
    if (parts[0] === 169 && parts[1] === 254) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    if (parts[0] === 0) return true;
  }
  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();
    if (normalized === "::1" || normalized.startsWith("fe80:") || normalized.startsWith("fc") || normalized.startsWith("fd")) {
      return true;
    }
  }
  return false;
}

/**
 * Validates URL for server-side fetch (SSRF mitigation).
 * Allows only http/https to public hosts; resolves DNS and rejects private IPs.
 */
export async function assertSafePublicUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new AppError("Invalid URL format", 400);
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new AppError("Only HTTP and HTTPS URLs are allowed", 400);
  }

  const hostname = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    throw new AppError("URL host is not allowed", 400);
  }

  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      throw new AppError("URL host is not allowed", 400);
    }
    return parsed;
  }

  const addresses = await dns.lookup(hostname, { all: true });
  for (const entry of addresses) {
    if (isPrivateIp(entry.address)) {
      throw new AppError("URL host is not allowed", 400);
    }
  }

  return parsed;
}

export default assertSafePublicUrl;
