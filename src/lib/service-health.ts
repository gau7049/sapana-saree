import { withTimeout } from "@/lib/api/timeout";
import { createLogger } from "@/lib/logger";

const logger = createLogger("service-health");

export type ServiceHealth = "ok" | "error" | "not_configured";

/**
 * Live health checks for the admin Settings page. A "Connected" badge used to
 * mean only "the env var exists" — it showed green while the Brevo key was
 * actually invalid (401), hiding a launch blocker. These ping the real APIs.
 */
export async function checkBrevoHealth(): Promise<ServiceHealth> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey || !process.env.BREVO_FROM_EMAIL) return "not_configured";

  try {
    const res = await withTimeout(
      fetch("https://api.brevo.com/v3/account", {
        headers: { "api-key": apiKey, Accept: "application/json" },
        cache: "no-store",
      })
    );
    if (!res.ok) {
      logger.error("Brevo health check failed", { status: res.status });
      return "error";
    }
    return "ok";
  } catch (err) {
    logger.error("Brevo health check errored", {
      error: err instanceof Error ? err.message : "Unknown error",
    });
    return "error";
  }
}

export async function checkCloudinaryHealth(): Promise<ServiceHealth> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return "not_configured";

  try {
    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
    const res = await withTimeout(
      fetch(`https://api.cloudinary.com/v1_1/${cloudName}/ping`, {
        headers: { Authorization: `Basic ${auth}` },
        cache: "no-store",
      })
    );
    if (!res.ok) {
      logger.error("Cloudinary health check failed", { status: res.status });
      return "error";
    }
    return "ok";
  } catch (err) {
    logger.error("Cloudinary health check errored", {
      error: err instanceof Error ? err.message : "Unknown error",
    });
    return "error";
  }
}
