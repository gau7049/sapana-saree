import { isSupabaseConfigured } from "@/lib/supabase/helpers";
import { getLocalUser } from "@/actions/auth";
import { apiSuccess, apiError } from "@/lib/api/response";
import { withTimeout } from "@/lib/api/timeout";
import { common, auth as authMsg, images as imgMsg } from "@/lib/messages";
import { createLogger } from "@/lib/logger";
import { HTTP_STATUS, ADMIN_ROLES } from "@/lib/constants";

const logger = createLogger("api:images:upload");

export async function POST(request: Request) {
  const requestId = request.headers.get("x-request-id") ?? "unknown";
  const isConfigured = isSupabaseConfigured();

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && !origin.includes(host)) {
    return apiError(common.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
  }

  try {
    if (isConfigured) {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return apiError(common.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profile || !ADMIN_ROLES.includes(profile.role as typeof ADMIN_ROLES[number])) {
        return apiError(common.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
      }
    } else {
      const localUser = await getLocalUser();
      if (!localUser || localUser.role !== "admin") {
        return apiError(authMsg.LOGIN_ADMIN_REQUIRED, HTTP_STATUS.UNAUTHORIZED);
      }
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const productId = formData.get("product_id") as string;

    if (!file || !productId) {
      return apiError(common.MISSING_FILE_OR_PRODUCT, HTTP_STATUS.BAD_REQUEST);
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return apiError(common.INVALID_FILE_TYPE, HTTP_STATUS.BAD_REQUEST);
    }

    if (file.size > 5 * 1024 * 1024) {
      return apiError(common.FILE_TOO_LARGE, HTTP_STATUS.BAD_REQUEST);
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const useCloudinary = cloudName && apiKey && apiSecret;

    let imageUrl: string;
    let publicId: string;
    let width = 800;
    let height = 1067;

    if (useCloudinary) {
      const timestamp = Math.floor(Date.now() / 1000);
      const folder = "sapana-saree/products";
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
      width = cloudinaryData.width;
      height = cloudinaryData.height;
    } else {
      const { writeFile } = await import("fs/promises");
      const { join } = await import("path");

      const ext = file.name.split(".").pop() ?? "jpg";
      const fileName = `${productId}-${Date.now()}.${ext}`;
      const filePath = join(process.cwd(), "public", "uploads", "products", fileName);

      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filePath, buffer);

      imageUrl = `/uploads/products/${fileName}`;
      publicId = `local/${fileName}`;
    }

    if (isConfigured) {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();

      const { count: existingCount } = await supabase
        .from("product_images")
        .select("id", { count: "exact", head: true })
        .eq("product_id", productId);

      const { data: image, error: dbError } = await supabase
        .from("product_images")
        .insert({
          product_id: productId,
          url: imageUrl,
          public_id: publicId,
          alt_text: file.name.replace(/\.[^.]+$/, ""),
          width,
          height,
          sort_order: 0,
          is_primary: existingCount === 0,
        })
        .select()
        .single();

      if (dbError) {
        logger.error("Failed to save image record", { requestId, error: dbError.message });
        return apiError(dbError.message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
      }

      logger.info("Image uploaded", { requestId, productId });
      return apiSuccess(imgMsg.UPLOADED, image);
    } else {
      const { readLocalImages, saveLocalImages } = await import("@/lib/local-storage");
      const images = await readLocalImages();

      const existingForProduct = images.filter((img) => img.product_id === productId);

      const image = {
        id: `img-${Date.now()}`,
        product_id: productId,
        url: imageUrl,
        public_id: publicId,
        alt_text: file.name.replace(/\.[^.]+$/, ""),
        width,
        height,
        sort_order: existingForProduct.length,
        is_primary: existingForProduct.length === 0,
        created_at: new Date().toISOString(),
      };

      images.push(image);
      await saveLocalImages(images);

      logger.info("Image uploaded (local)", { requestId, productId });
      return apiSuccess(imgMsg.UPLOADED, image);
    }
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
