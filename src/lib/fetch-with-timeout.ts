// A plain fetch() to our own API routes can hang far longer than expected if
// the underlying serverless function gets killed by the platform mid-request
// rather than returning a clean error — this guarantees the UI always moves
// on within a bounded time.
// Kept just above our API routes' own maxDuration=30 budget so a slow-but-
// eventually-successful Overpass response isn't cut off client-side first.
export async function fetchWithTimeout(url: string, init?: RequestInit, timeoutMs = 28000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
