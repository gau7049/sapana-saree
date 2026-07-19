import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createStaticClient } from "@/lib/supabase/static";
import type { SiteSettings } from "@/types";
import { CACHE_TTL } from "@/lib/constants";

async function fetchSiteSettings(): Promise<SiteSettings | null> {
  const supabase = createStaticClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) return null;
  return data as SiteSettings;
}

export const getSiteSettings = cache(
  unstable_cache(fetchSiteSettings, ["site-settings"], {
    tags: ["site-settings"],
    revalidate: CACHE_TTL,
  })
);
