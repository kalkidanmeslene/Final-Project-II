import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { env } from "@/lib/env";
import { ALLOWED_IMAGE_EXTENSIONS, ALLOWED_IMAGE_TYPES } from "./profile.schemas";

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export function getUploadDir() {
  return path.join(process.cwd(), "public", "uploads", "avatars");
}

export function validateAvatarFile(file: File): { ok: true } | { ok: false; message: string } {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    return { ok: false, message: "Only JPEG, PNG, or WebP images are allowed." };
  }
  if (file.size > env.PROFILE_UPLOAD_MAX_BYTES) {
    return { ok: false, message: `Image must be smaller than ${Math.round(env.PROFILE_UPLOAD_MAX_BYTES / 1024 / 1024)}MB.` };
  }
  const ext = MIME_TO_EXT[file.type];
  if (!ext || !ALLOWED_IMAGE_EXTENSIONS.includes(ext as (typeof ALLOWED_IMAGE_EXTENSIONS)[number])) {
    return { ok: false, message: "Invalid file extension." };
  }
  return { ok: true };
}

export async function saveAvatarFile(userId: string, file: File): Promise<{ publicUrl: string; absolutePath: string }> {
  const validation = validateAvatarFile(file);
  if (!validation.ok) throw new Error(validation.message);

  const ext = MIME_TO_EXT[file.type]!;
  const dir = path.join(getUploadDir(), userId);
  await mkdir(dir, { recursive: true });

  const filename = `${randomUUID()}${ext}`;
  const absolutePath = path.join(dir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absolutePath, buffer);

  const publicUrl = `/uploads/avatars/${userId}/${filename}`;
  return { publicUrl, absolutePath };
}

export async function deleteAvatarFile(publicUrl: string | null | undefined) {
  if (!publicUrl || !publicUrl.startsWith("/uploads/avatars/")) return;
  const relative = publicUrl.replace(/^\//, "");
  const absolutePath = path.join(process.cwd(), "public", relative);
  try {
    await unlink(absolutePath);
  } catch {
    // ignore missing files
  }
}
