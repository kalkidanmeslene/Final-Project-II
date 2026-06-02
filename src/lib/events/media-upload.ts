import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { env } from "@/lib/env";

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const ALLOWED = ["image/jpeg", "image/png", "image/webp"] as const;

export function validateEventMediaFile(file: File): { ok: true } | { ok: false; message: string } {
  if (!ALLOWED.includes(file.type as (typeof ALLOWED)[number])) {
    return { ok: false, message: "Only JPEG, PNG, or WebP images are allowed." };
  }
  if (file.size > env.EVENT_UPLOAD_MAX_BYTES) {
    return {
      ok: false,
      message: `File must be smaller than ${Math.round(env.EVENT_UPLOAD_MAX_BYTES / 1024 / 1024)}MB.`,
    };
  }
  return { ok: true };
}

export async function saveEventMediaFile(eventId: string, file: File, subdir: "banner" | "gallery") {
  const validation = validateEventMediaFile(file);
  if (!validation.ok) throw new Error(validation.message);

  const ext = MIME_TO_EXT[file.type] ?? ".jpg";
  const dir = path.join(process.cwd(), "public", "uploads", "events", eventId, subdir);
  await mkdir(dir, { recursive: true });

  const filename = `${randomUUID()}${ext}`;
  const absolutePath = path.join(dir, filename);
  await writeFile(absolutePath, Buffer.from(await file.arrayBuffer()));

  return `/uploads/events/${eventId}/${subdir}/${filename}`;
}

export async function deleteEventMediaFile(publicUrl: string | null | undefined) {
  if (!publicUrl?.startsWith("/uploads/events/")) return;
  const absolutePath = path.join(process.cwd(), "public", publicUrl.replace(/^\//, ""));
  try {
    await unlink(absolutePath);
  } catch {
    // ignore
  }
}
