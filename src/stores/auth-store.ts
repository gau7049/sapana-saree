"use client";

import { create } from "zustand";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  /** One-time bootstrap: fetch the current user and subscribe to auth events. */
  init: () => void;
  /** Re-fetch the authenticated user (network call). Use after sign-in. */
  refresh: () => Promise<User | null>;
  /** Cheap cookie-based re-sync (no network). Use on route changes. */
  syncFromSession: () => Promise<void>;
  /** Optimistically clear the user (e.g. right before server-side sign-out). */
  clear: () => void;
}

// Auth state was previously per-component (each useAuth() call held its own
// useState), so signing in via the modal updated that component but left the
// header showing "Sign In" until a hard reload. A single shared store keeps
// every consumer in sync.
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  initialized: false,

  init: () => {
    if (get().initialized) return;
    set({ initialized: true });

    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      set({ user: data.user, loading: false });
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null, loading: false });
    });
  },

  refresh: async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    set({ user: data.user, loading: false });
    return data.user;
  },

  syncFromSession: async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    const sessionUser = data.session?.user ?? null;
    // Only write on change to avoid pointless re-renders on every navigation.
    if (sessionUser?.id !== get().user?.id) {
      set({ user: sessionUser, loading: false });
    }
  },

  clear: () => set({ user: null, loading: false }),
}));

// Dev-only debugging handle; stripped from production bundles.
if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
  (window as unknown as Record<string, unknown>).__authStore = useAuthStore;
}
