// In-memory, per-instance store of "when was an OTP last sent for this key" —
// same tradeoffs as the rate limiter in lib/rate-limit.ts (resets on
// redeploy/restart, doesn't share state across instances; fine for a single
// Node process). Used to enforce the resend cooldown and the code's expiry
// window entirely app-side, before ever calling Supabase.
const store = new Map<string, number>();

const MAX_STORE_SIZE = 10_000;
const CLEANUP_INTERVAL_MS = 60_000;
// Anything older than this is stale for both cooldown and expiry purposes —
// bounds how long a dead entry can linger between cleanup passes.
const MAX_AGE_MS = 30 * 60_000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, sentAt] of store) {
    if (now - sentAt > MAX_AGE_MS) store.delete(key);
  }
}

export function markOtpSent(key: string): void {
  cleanup();

  if (!store.has(key) && store.size >= MAX_STORE_SIZE) {
    // Map preserves insertion order, so this evicts the oldest entry (FIFO).
    const oldestKey = store.keys().next().value;
    if (oldestKey) store.delete(oldestKey);
  }

  store.set(key, Date.now());
}

// Milliseconds since the last OTP was sent for this key, or null if none was
// ever recorded (never sent, or evicted for being stale/over capacity) — a
// null should always be treated as "no valid code," not "no cooldown."
export function msSinceOtpSent(key: string): number | null {
  const sentAt = store.get(key);
  return sentAt === undefined ? null : Date.now() - sentAt;
}
