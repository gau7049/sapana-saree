import { createHash } from "crypto";
import { withTimeout } from "@/lib/api/timeout";

export interface UploadedImage {
  url: string;
  publicId: string;
  width: number;
  height: number;
}

/**
 * Stores an uploaded image and returns where it landed — Cloudinary when
 * credentials are configured, otherwise local disk under
 * public/uploads/products (the "local/" publicId convention that
 * cleanupImageFile in lib/cloudinary.ts knows how to delete).
 *
 * Shared by the product, category, and hero-image upload routes so the
 * signed-upload logic lives in one place. Throws on upload failure — callers
 * translate that into their own API error response.
 */
export async function saveUploadedImage(
  file: File,
  folder: string
): Promise<UploadedImage> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (cloudName && apiKey && apiSecret) {
    // Cloudinary's signed-upload scheme: sign the params (alphabetical,
    // excluding file/api_key) plus the secret, so requests can't be forged.
    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = createHash("sha1").update(paramsToSign).digest("hex");

    const uploadForm = new FormData();
    uploadForm.append("file", file);
    uploadForm.append("api_key", apiKey);
    uploadForm.append("timestamp", timestamp.toString());
    uploadForm.append("signature", signature);
    uploadForm.append("folder", folder);

    const res = await withTimeout(
      fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: uploadForm,
      })
    );

    if (!res.ok) {
      throw new Error(await res.text());
    }

    const data = await res.json();
    return {
      url: data.secure_url,
      publicId: data.public_id,
      width: data.width,
      height: data.height,
    };
  }

  // Dev fallback: no Cloudinary credentials — write to local disk so uploads
  // still work in a bare environment. Dimensions are a nominal 3:4 default
  // since nothing measures the file locally.
  const { writeFile } = await import("fs/promises");
  const { join } = await import("path");

  // Extension comes from the validated MIME type, never the client-supplied
  // filename — otherwise a renamed upload (e.g. "x.html") would land as an
  // executable-in-the-browser file under the public/ static path, a stored
  // XSS vector. Callers already reject any file.type outside this map.
  const EXT_BY_MIME: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  const ext = EXT_BY_MIME[file.type] ?? "jpg";
  const fileName = `${folder.split("/").pop()}-${Date.now()}.${ext}`;
  await writeFile(
    join(process.cwd(), "public", "uploads", "products", fileName),
    Buffer.from(await file.arrayBuffer())
  );

  return {
    url: `/uploads/products/${fileName}`,
    publicId: `local/${fileName}`,
    width: 800,
    height: 1067,
  };
}
