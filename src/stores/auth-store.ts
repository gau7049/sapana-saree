"use client";

import { create } from "zustand";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { ADMIN_ROLES } from "@/lib/constants";

async function fetchIsAdmin(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  return !!data && ADMIN_ROLES.includes(data.role as (typeof ADMIN_ROLES)[number]);
}

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  /** Whether the signed-in user's profile role is admin/super_admin. */
  isAdmin: boolean;
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
  isAdmin: false,

  init: () => {
    if (get().initialized) return;
    set({ initialized: true });

    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data }) => {
      const isAdmin = data.user ? await fetchIsAdmin(supabase, data.user.id) : false;
      set({ user: data.user, loading: false, isAdmin });
    });

    supabase.auth.onAuthStateChange(async (_event, session) => {
      const sessionUser = session?.user ?? null;
      const isAdmin = sessionUser ? await fetchIsAdmin(supabase, sessionUser.id) : false;
      set({ user: sessionUser, loading: false, isAdmin });
    });
  },

  refresh: async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    const isAdmin = data.user ? await fetchIsAdmin(supabase, data.user.id) : false;
    set({ user: data.user, loading: false, isAdmin });
    return data.user;
  },

  syncFromSession: async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    const sessionUser = data.session?.user ?? null;
    // Only write on change to avoid pointless re-renders on every navigation.
    if (sessionUser?.id !== get().user?.id) {
      const isAdmin = sessionUser ? await fetchIsAdmin(supabase, sessionUser.id) : false;
      set({ user: sessionUser, loading: false, isAdmin });
    }
  },

  clear: () => set({ user: null, loading: false, isAdmin: false }),
}));

// Dev-only debugging handle; stripped from production bundles.
if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
  (window as unknown as Record<string, unknown>).__authStore = useAuthStore;
}
