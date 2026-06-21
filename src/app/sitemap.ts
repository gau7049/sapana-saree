import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const [productsRes, categoriesRes] = await Promise.all([
    supabase
      .from("products")
      .select("slug, updated_at")
      .eq("status", "published")
      .order("updated_at", { ascending: false }),
    supabase
      .from("categories")
      .select("slug, updated_at")
      .eq("is_active", true),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/sarees`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/categories`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  const productPages: MetadataRoute.Sitemap = (productsRes.data ?? []).map((p) => ({
    url: `${SITE_URL}/sarees/${p.slug}`,
    lastModified: new Date(p.updated_at),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const categoryPages: MetadataRoute.Sitemap = (categoriesRes.data ?? []).map((c) => ({
    url: `${SITE_URL}/categories/${c.slug}`,
    lastModified: new Date(c.updated_at),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...categoryPages, ...productPages];
}
