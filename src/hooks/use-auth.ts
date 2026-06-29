"use client";

import { useEffect, useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/helpers";
import type { User } from "@supabase/supabase-js";

function getLocalUserFromCookie(): Partial<User> | null {
  try {
    const cookies = document.cookie.split(";").reduce((acc, c) => {
      const [key, ...val] = c.trim().split("=");
      acc[key] = decodeURIComponent(val.join("="));
      return acc;
    }, {} as Record<string, string>);

    const session = cookies["local-auth-session"];
    if (!session) return null;

    const parsed = JSON.parse(session);
    return {
      id: parsed.id,
      email: parsed.email,
      user_metadata: { full_name: "Admin", role: parsed.role },
    } as Partial<User>;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      const localUser = getLocalUserFromCookie();
      setUser(localUser as User | null);
      setLoading(false);
      return;
    }

    let subscription: { unsubscribe: () => void } | null = null;

    import("@/lib/supabase/client").then(({ createClient }) => {
      const supabase = createClient();

      supabase.auth.getUser().then(({ data: { user } }) => {
        setUser(user);
        setLoading(false);
      });

      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      });
      subscription = data.subscription;
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return { user, loading };
}
