import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiSuccess, apiError } from "@/lib/api/response";
import { withTimeout } from "@/lib/api/timeout";
import { common, auth as authMsg, images as imgMsg } from "@/lib/messages";
import { createLogger } from "@/lib/logger";
import { cleanupImageFile } from "@/lib/cloudinary";
import { HTTP_STATUS, MAX_IMAGE_SIZE_BYTES, ALLOWED_IMAGE_TYPES } from "@/lib/constants";
import type { SiteSettings } from "@/types";

const logger = createLogger("api:site-settings:hero-image");

async function currentSettings() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("site_settings")
    .select("hero_image_public_id")
    .eq("id", 1)
    .single();
  return data as Pick<SiteSettings, "hero_image_public_id"> | null;
}

export async function POST(request: Request) {
  const requestId = request.headers.get("x-request-id") ?? "unknown";

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && !origin.includes(host)) {
    return apiError(common.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
  }

  try {
    try {
      await requireAdmin();
    } catch {
      return apiError(authMsg.LOGIN_ADMIN_REQUIRED, HTTP_STATUS.UNAUTHORIZED);
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return apiError(common.MISSING_REQUIRED_FIELDS, HTTP_STATUS.BAD_REQUEST);
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
      return apiError(common.INVALID_FILE_TYPE, HTTP_STATUS.BAD_REQUEST);
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return apiError(common.FILE_TOO_LARGE, HTTP_STATUS.BAD_REQUEST);
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const useCloudinary = cloudName && apiKey && apiSecret;

    let imageUrl: string;
    let publicId: string;

    if (useCloudinary) {
      const timestamp = Math.floor(Date.now() / 1000);
      const folder = "sapana-saree/site";
      const paramsToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;

      const { createHash } = await import("crypto");
      const signature = createHash("sha1").update(paramsToSign).digest("hex");

      const uploadForm = new FormData();
      uploadForm.append("file", file);
      uploadForm.append("api_key", apiKey);
      uploadForm.append("timestamp", timestamp.toString());
      uploadForm.append("signature", signature);
      uploadForm.append("folder", folder);

      const cloudinaryRes = await withTimeout(
        fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: "POST",
          body: uploadForm,
        })
      );

      if (!cloudinaryRes.ok) {
        const err = await cloudinaryRes.text();
        logger.error("Cloudinary upload failed", { requestId, error: err });
        return apiError(imgMsg.UPLOAD_FAILED(err), HTTP_STATUS.INTERNAL_SERVER_ERROR);
      }

      const cloudinaryData = await cloudinaryRes.json();
      imageUrl = cloudinaryData.secure_url;
      publicId = cloudinaryData.public_id;
    } else {
      const { writeFile } = await import("fs/promises");
      const { join } = await import("path");

      const ext = file.name.split(".").pop() ?? "jpg";
      // Reuses the products upload folder (and the "local/" publicId
      // convention cleanupImageFile already knows how to unlink) rather than
      // introducing a second local-storage path just for this dev fallback.
      const fileName = `hero-${Date.now()}.${ext}`;
      const filePath = join(process.cwd(), "public", "uploads", "products", fileName);

      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filePath, buffer);

      imageUrl = `/uploads/products/${fileName}`;
      publicId = `local/${fileName}`;
    }

    const previous = await currentSettings();

    const admin = createAdminClient();
    const { error: updateError } = await admin
      .from("site_settings")
      .update({
        hero_image_url: imageUrl,
        hero_image_public_id: publicId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);

    if (updateError) {
      logger.error("Failed to persist hero image", { requestId, error: updateError.message });
      return apiError(imgMsg.UPLOAD_FAILED(updateError.message), HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    if (previous?.hero_image_public_id) {
      await cleanupImageFile(previous.hero_image_public_id).catch(() => {});
    }

    revalidateTag("site-settings", "max");
    logger.info("Hero image uploaded", { requestId, useCloudinary });
    return apiSuccess(imgMsg.UPLOADED, { url: imageUrl });
  } catch (err) {
    logger.error("Hero image upload error", {
      requestId,
      error: err instanceof Error ? err.message : "Unknown error",
    });
    return apiError(
      err instanceof Error ? err.message : common.SOMETHING_WENT_WRONG,
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

export async function DELETE(request: Request) {
  const requestId = request.headers.get("x-request-id") ?? "unknown";

  try {
    await requireAdmin();
  } catch {
    return apiError(authMsg.LOGIN_ADMIN_REQUIRED, HTTP_STATUS.UNAUTHORIZED);
  }

  const previous = await currentSettings();

  const admin = createAdminClient();
  const { error } = await admin
    .from("site_settings")
    .update({
      hero_image_url: null,
      hero_image_public_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) {
    logger.error("Failed to clear hero image", { requestId, error: error.message });
    return apiError(common.SOMETHING_WENT_WRONG, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }

  if (previous?.hero_image_public_id) {
    await cleanupImageFile(previous.hero_image_public_id).catch(() => {});
  }

  revalidateTag("site-settings", "max");
  return apiSuccess(imgMsg.DELETED);
}
