import { headers } from "next/headers";
import { SITE_URL } from "@/lib/constants";

/**
 * Resolves the current deployment's origin from the incoming request's Host
 * header, falling back to NEXT_PUBLIC_SITE_URL.
 *
 * NEXT_PUBLIC_* vars are inlined at build time — on platforms like Render,
 * adding/changing the env var doesn't take effect until the next build, so a
 * stale build can keep baking in "http://localhost:3000". Reading the actual
 * request host sidesteps that for server-generated links (email verification,
 * password reset) regardless of when the env var was set.
 */
export async function getServerSiteUrl(): Promise<string> {
  try {
    const headersList = await headers();
    const host = headersList.get("x-forwarded-host") ?? headersList.get("host");
    if (!host) return SITE_URL;

    const proto =
      headersList.get("x-forwarded-proto") ??
      (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");

    return `${proto}://${host}`;
  } catch {
    return SITE_URL;
  }
}
