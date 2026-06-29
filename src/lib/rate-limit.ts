import { RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS } from "@/lib/constants";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

const MAX_STORE_SIZE = 10_000;
const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}

export function checkRateLimit(
  ip: string,
  limit = RATE_LIMIT_MAX,
  windowMs = RATE_LIMIT_WINDOW_MS
): { allowed: boolean; remaining: number; resetAt: number } {
  cleanup();

  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now > entry.resetAt) {
    if (store.size >= MAX_STORE_SIZE) {
      const oldestKey = store.keys().next().value;
      if (oldestKey) store.delete(oldestKey);
    }

    const resetAt = now + windowMs;
    store.set(ip, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  entry.count++;
  const remaining = Math.max(0, limit - entry.count);
  return { allowed: entry.count <= limit, remaining, resetAt: entry.resetAt };
}
