import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File;
  const productId = formData.get("product_id") as string;

  if (!file || !productId) {
    return NextResponse.json({ error: "Missing file or product_id" }, { status: 400 });
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
  }

  try {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "Cloudinary not configured" },
        { status: 500 }
      );
    }

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

    const cloudinaryRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: uploadForm }
    );

    if (!cloudinaryRes.ok) {
      const err = await cloudinaryRes.text();
      return NextResponse.json({ error: `Upload failed: ${err}` }, { status: 500 });
    }

    const cloudinaryData = await cloudinaryRes.json();

    const { data: imageCount } = await supabase
      .from("product_images")
      .select("id", { count: "exact", head: true })
      .eq("product_id", productId);

    const { data: image, error: dbError } = await supabase
      .from("product_images")
      .insert({
        product_id: productId,
        url: cloudinaryData.secure_url,
        public_id: cloudinaryData.public_id,
        alt_text: file.name.replace(/\.[^.]+$/, ""),
        width: cloudinaryData.width,
        height: cloudinaryData.height,
        sort_order: imageCount ? 0 : 0,
        is_primary: !imageCount,
      })
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ image });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}
