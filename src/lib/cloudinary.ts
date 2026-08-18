import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key:    process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export type UploadFolder =
  | "cin"
  | "diplome"
  | "avatars"
  | "portfolio/images"
  | "portfolio/videos";

export async function uploadFile(
  file: File,
  folder: UploadFolder
): Promise<{ url: string; publicId: string }> {
  // Validate env vars early with a clear error
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    throw new Error(
      "Cloudinary environment variables are not set. " +
      "Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to .env"
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const b64 = buffer.toString("base64");

  // Determine resource type
  const isPdf = file.type === "application/pdf";
  const isVideo = file.type.startsWith("video/");

  // PDFs must use "raw" resource type on Cloudinary
  const resourceType = isPdf ? "raw" : isVideo ? "video" : "auto";

  // Build data URI
  const dataUri = `data:${file.type};base64,${b64}`;

  try {
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: `fixitn/${folder}`,
      resource_type: resourceType as "raw" | "video" | "auto",
      // For identity docs, keep original quality
      ...(folder === "cin" || folder === "diplome"
        ? { quality: "auto:best" }
        : {}),
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[Cloudinary] Upload failed for folder=${folder}:`, message);
    throw new Error(`Cloudinary upload failed: ${message}`);
  }
}

export async function deleteFile(
  publicId: string,
  isVideo = false
): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: isVideo ? "video" : "image",
    });
  } catch {
    // Never throw on delete — DB record already gone
  }
}