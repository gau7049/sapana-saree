import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiSuccess, apiError } from "@/lib/api/response";
import { isSameOrigin } from "@/lib/api/origin-check";
import { common, auth as authMsg, images as imgMsg } from "@/lib/messages";
import { createLogger } from "@/lib/logger";
import { saveUploadedImage } from "@/lib/upload-image";
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

  if (!isSameOrigin(request)) {
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

    const uploaded = await saveUploadedImage(file, "sapana-saree/site");

    const previous = await currentSettings();

    const admin = createAdminClient();
    const { error: updateError } = await admin
      .from("site_settings")
      .update({
        hero_image_url: uploaded.url,
        hero_image_public_id: uploaded.publicId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);

    if (updateError) {
      // DB write failed after the file was stored — remove the orphan.
      await cleanupImageFile(uploaded.publicId).catch(() => {});
      logger.error("Failed to persist hero image", { requestId, error: updateError.message });
      return apiError(imgMsg.UPLOAD_FAILED(updateError.message), HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    if (previous?.hero_image_public_id) {
      await cleanupImageFile(previous.hero_image_public_id).catch(() => {});
    }

    revalidateTag("site-settings", "max");
    logger.info("Hero image uploaded", { requestId });
    return apiSuccess(imgMsg.UPLOADED, { url: uploaded.url });
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

  if (!isSameOrigin(request)) {
    return apiError(common.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
  }

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
