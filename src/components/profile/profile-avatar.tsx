"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function ProfileAvatar({
  name,
  imageUrl,
  onUpload,
  uploading,
  editable = true,
}: {
  name: string;
  imageUrl: string | null;
  onUpload?: (file: File) => void;
  uploading?: boolean;
  editable?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const isBlob = imageUrl?.startsWith("blob:");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLocalError(null);
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setLocalError("Use JPEG, PNG, or WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setLocalError("Image must be under 5MB.");
      return;
    }
    onUpload?.(file);
    e.target.value = "";
  }

  return (
    <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
      <div
        className={cn(
          "relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-200 bg-zinc-100 text-xl font-semibold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900",
          uploading && "opacity-60",
        )}
        aria-busy={uploading}
      >
        {imageUrl ? (
          isBlob ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <Image src={imageUrl} alt={`${name} profile photo`} fill className="object-cover" sizes="96px" />
          )
        ) : (
          <span aria-hidden="true">{initials(name)}</span>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Spinner label="Uploading photo" />
          </div>
        )}
      </div>
      {editable && onUpload && (
        <div className="space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            id="avatar-upload"
            onChange={handleChange}
            disabled={uploading}
          />
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            aria-controls="avatar-upload"
          >
            {uploading ? "Uploading..." : "Change photo"}
          </Button>
          <p className="text-xs text-zinc-500">JPEG, PNG, or WebP. Max 5MB.</p>
          {localError && (
            <p role="alert" className="text-sm text-red-600">
              {localError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
