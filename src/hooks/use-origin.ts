import { useSyncExternalStore } from "react";
import { SITE_URL } from "@/lib/constants";

function subscribe() {
  return () => {};
}

function getSnapshot() {
  return window.location.origin;
}

function getServerSnapshot() {
  return SITE_URL;
}

/**
 * The real browser origin, read without an effect (useSyncExternalStore
 * handles the server/client snapshot split for us, so there's no hydration
 * mismatch). Falls back to the build-time SITE_URL during SSR — client code
 * that needs an absolute URL (share links, referral links) should use this
 * instead of the constant directly, since NEXT_PUBLIC_SITE_URL is inlined at
 * build time and can go stale if a platform's build ran before it was set.
 */
export function useOrigin(): string {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
