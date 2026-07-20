import { revalidateTag, revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guard";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { isSameOrigin } from "@/lib/api/origin-check";
import { common, auth as authMsg, images as imgMsg } from "@/lib/messages";
import { createLogger } from "@/lib/logger";
import { saveUploadedImage } from "@/lib/upload-image";
import { cleanupImageFile } from "@/lib/cloudinary";
import {
  HTTP_STATUS,
  MAX_IMAGE_SIZE_BYTES,
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGES_PER_PRODUCT,
} from "@/lib/constants";

const logger = createLogger("api:images:upload");

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
    const productId = formData.get("product_id") as string;

    if (!file || !productId) {
      return apiError(common.MISSING_FILE_OR_PRODUCT, HTTP_STATUS.BAD_REQUEST);
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
      return apiError(common.INVALID_FILE_TYPE, HTTP_STATUS.BAD_REQUEST);
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return apiError(common.FILE_TOO_LARGE, HTTP_STATUS.BAD_REQUEST);
    }

    const supabase = await createClient();
    const { count: existingCount } = await supabase
      .from("product_images")
      .select("id", { count: "exact", head: true })
      .eq("product_id", productId);

    if ((existingCount ?? 0) >= MAX_IMAGES_PER_PRODUCT) {
      return apiError(
        imgMsg.TOO_MANY_IMAGES(MAX_IMAGES_PER_PRODUCT),
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Cloudinary when configured; otherwise the helper falls back to local
    // disk so upload still works in a bare dev environment.
    const uploaded = await saveUploadedImage(file, "sapana-saree/products");

    const { data: image, error: insertError } = await supabase
      .from("product_images")
      .insert({
        product_id: productId,
        url: uploaded.url,
        public_id: uploaded.publicId,
        alt_text: file.name.replace(/\.[^.]+$/, ""),
        width: uploaded.width,
        height: uploaded.height,
        // New images append to the end; the very first image uploaded for a
        // product is automatically the primary (card) image.
        sort_order: existingCount ?? 0,
        is_primary: (existingCount ?? 0) === 0,
      })
      .select()
      .single();

    if (insertError) {
      // DB write failed after the file was stored — remove the orphan.
      await cleanupImageFile(uploaded.publicId).catch(() => {});
      logger.error("Failed to persist image metadata", { requestId, error: insertError.message });
      return apiError(imgMsg.UPLOAD_FAILED(insertError.message), HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    // Route handlers can't call updateTag; revalidateTag with the "max" profile
    // is the documented equivalent here. Keeps homepage featured cards fresh.
    revalidateTag("featured-products", "max");
    revalidatePath("/sarees");
    revalidatePath("/");

    logger.info("Image uploaded", { requestId, productId });
    return apiSuccess(imgMsg.UPLOADED, image);
  } catch (err) {
    logger.error("Image upload error", {
      requestId,
      error: err instanceof Error ? err.message : "Unknown error",
    });
    return apiError(
      err instanceof Error ? err.message : common.SOMETHING_WENT_WRONG,
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}
