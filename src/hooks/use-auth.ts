"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

/**
 * Shared auth state (backed by a zustand store, so every consumer — header,
 * modals, forms — sees the same user at the same time).
 *
 * Re-syncs from the session cookie on every route change: server actions set
 * auth cookies without emitting client-side auth events, so this is what keeps
 * the header correct right after a server-side sign-in/sign-out redirect.
 */
export function useAuth() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const refresh = useAuthStore((s) => s.refresh);

  useEffect(() => {
    useAuthStore.getState().init();
  }, []);

  useEffect(() => {
    useAuthStore.getState().syncFromSession();
  }, [pathname]);

  return { user, loading, refresh };
}
