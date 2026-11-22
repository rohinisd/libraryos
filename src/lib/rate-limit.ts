import "server-only";

// Basic in-memory sliding-window limiter — this app has no Redis/Upstash yet
// (same gap noted for login/reset), so this is a best-effort guard for a public,
// unauthenticated route, not a hardened one: it resets on deploy/cold start and
// only limits per-instance, not globally across Vercel's serverless instances.
const hits = new Map<string, number[]>();

export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const timestamps = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  timestamps.push(now);
  hits.set(key, timestamps);

  // Opportunistic cleanup so this map can't grow unbounded over the process's lifetime.
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t >= windowMs)) hits.delete(k);
    }
  }

  return timestamps.length > limit;
}
