import { revalidateTag, revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guard";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { common, auth as authMsg, images as imgMsg } from "@/lib/messages";
import { createLogger } from "@/lib/logger";
import { saveUploadedImage } from "@/lib/upload-image";
import { cleanupImageFile } from "@/lib/cloudinary";
import { HTTP_STATUS, MAX_IMAGE_SIZE_BYTES, ALLOWED_IMAGE_TYPES } from "@/lib/constants";

const logger = createLogger("api:categories:image");

// The homepage showcase and /categories both render through the cached
// "categories" tag — bust it (plus the pages) after any image change.
function revalidateCategoryCaches() {
  revalidateTag("categories", "max");
  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  revalidatePath("/");
}

export async function POST(request: Request) {
  const requestId = request.headers.get("x-request-id") ?? "unknown";

  // Same-origin check — Route Handlers don't get Next's automatic Server
  // Action CSRF protection.
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
    const categoryId = formData.get("category_id") as string;

    if (!file || !categoryId) {
      return apiError(common.MISSING_REQUIRED_FIELDS, HTTP_STATUS.BAD_REQUEST);
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
      return apiError(common.INVALID_FILE_TYPE, HTTP_STATUS.BAD_REQUEST);
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return apiError(common.FILE_TOO_LARGE, HTTP_STATUS.BAD_REQUEST);
    }

    const supabase = await createClient();
    const { data: category } = await supabase
      .from("categories")
      .select("image_public_id")
      .eq("id", categoryId)
      .maybeSingle();

    if (!category) return apiError(common.NOT_FOUND, HTTP_STATUS.NOT_FOUND);

    const uploaded = await saveUploadedImage(file, "sapana-saree/categories");

    const { error: updateError } = await supabase
      .from("categories")
      .update({ image_url: uploaded.url, image_public_id: uploaded.publicId })
      .eq("id", categoryId);

    if (updateError) {
      // DB write failed after the file was stored — remove the orphan.
      await cleanupImageFile(uploaded.publicId).catch(() => {});
      logger.error("Failed to persist category image", { requestId, error: updateError.message });
      return apiError(imgMsg.UPLOAD_FAILED(updateError.message), HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    // Bundled stock defaults have no public_id — only uploaded files need cleanup.
    if (category.image_public_id) {
      await cleanupImageFile(category.image_public_id).catch(() => {});
    }

    revalidateCategoryCaches();
    logger.info("Category image uploaded", { requestId, categoryId });
    return apiSuccess(imgMsg.UPLOADED, { url: uploaded.url });
  } catch (err) {
    logger.error("Category image upload error", {
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

  const categoryId = new URL(request.url).searchParams.get("category_id");
  if (!categoryId) return apiError(common.MISSING_REQUIRED_FIELDS, HTTP_STATUS.BAD_REQUEST);

  const supabase = await createClient();
  const { data: category } = await supabase
    .from("categories")
    .select("image_public_id")
    .eq("id", categoryId)
    .maybeSingle();

  if (!category) return apiError(common.NOT_FOUND, HTTP_STATUS.NOT_FOUND);

  const { error } = await supabase
    .from("categories")
    .update({ image_url: null, image_public_id: null })
    .eq("id", categoryId);

  if (error) {
    logger.error("Failed to clear category image", { requestId, error: error.message });
    return apiError(common.SOMETHING_WENT_WRONG, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }

  if (category.image_public_id) {
    await cleanupImageFile(category.image_public_id).catch(() => {});
  }

  revalidateCategoryCaches();
  return apiSuccess(imgMsg.DELETED);
}
