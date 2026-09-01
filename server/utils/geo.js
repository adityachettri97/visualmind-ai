const PRIVATE_IP_PATTERN = /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|::1$|::ffff:127\.)/;

/** Best-effort IP → country lookup via ip-api.com's free, keyless endpoint. Never throws —
    callers should treat this as fire-and-forget and not block a response on it. */
export async function resolveCountry(ip) {
  if (!ip || PRIVATE_IP_PATTERN.test(ip)) {
    return "Local/Development";
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country`, {
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) return null;

    const body = await response.json();

    return body.status === "success" ? body.country : null;
  } catch {
    return null;
  }
}

/** Express puts the client IP behind a chain when running behind proxies/load balancers — this
    takes the first (originating) entry from x-forwarded-for when present, otherwise req.ip. */
export function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];

  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }

  return req.ip;
}
