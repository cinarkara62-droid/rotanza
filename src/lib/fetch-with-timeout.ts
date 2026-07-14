// A plain fetch() to our own API routes can hang far longer than expected if
// the underlying serverless function gets killed by the platform mid-request
// rather than returning a clean error — this guarantees the UI always moves
// on within a bounded time.
export async function fetchWithTimeout(url: string, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
