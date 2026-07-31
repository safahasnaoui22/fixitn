import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
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
  const buffer = Buffer.from(await file.arrayBuffer());
  const b64 = buffer.toString("base64");
  const dataUri = `data:${file.type};base64,${b64}`;
  const isVideo = file.type.startsWith("video/");

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: `fixitn/${folder}`,
    resource_type: isVideo ? "video" : "auto",
    // keep original format for identity docs
    ...(folder === "cin" || folder === "diplome"
      ? { format: "jpg", quality: "auto:best" }
      : {}),
  });

  return { url: result.secure_url, publicId: result.public_id };
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
    // never throw on delete — DB record already gone
  }
}