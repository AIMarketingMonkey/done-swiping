"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { toast } from "sonner";
import {
  Upload,
  X,
  Star,
  Loader2,
  ImagePlus,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PhotoEntry {
  /** Browser-side preview URL (object URL) */
  preview: string;
  /** Original File, present until uploaded */
  file: File;
  /** Server-assigned URL after upload */
  uploadedUrl?: string;
  uploading: boolean;
  error?: string;
}

const MAX_PHOTOS = 6;

// ── Component ─────────────────────────────────────────────────────────────────

export default function PhotosPage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [isContinuing, setIsContinuing] = useState(false);

  // ── Dropzone ────────────────────────────────────────────────────────────────

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const remaining = MAX_PHOTOS - photos.length;
      const filesToAdd = acceptedFiles.slice(0, remaining);

      if (filesToAdd.length === 0) {
        toast.error(`You can only upload up to ${MAX_PHOTOS} photos.`);
        return;
      }
      if (acceptedFiles.length > remaining) {
        toast.warning(
          `Only ${remaining} slot${remaining !== 1 ? "s" : ""} left — added the first ${filesToAdd.length}.`
        );
      }

      // Add entries in "uploading" state
      const newEntries: PhotoEntry[] = filesToAdd.map((file) => ({
        preview: URL.createObjectURL(file),
        file,
        uploading: true,
      }));

      setPhotos((prev) => [...prev, ...newEntries]);

      // Upload each file
      for (let i = 0; i < newEntries.length; i++) {
        const entry = newEntries[i];
        const globalIndex = photos.length + i;

        try {
          const formData = new FormData();
          formData.append("photo", entry.file);
          formData.append("index", String(globalIndex));

          const res = await fetch("/api/profile/photos", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body?.error ?? `Upload failed (${res.status})`);
          }

          const { url } = await res.json();

          setPhotos((prev) =>
            prev.map((p) =>
              p.preview === entry.preview
                ? { ...p, uploading: false, uploadedUrl: url }
                : p
            )
          );
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Upload failed";
          toast.error(`Photo ${globalIndex + 1}: ${message}`);
          setPhotos((prev) =>
            prev.map((p) =>
              p.preview === entry.preview
                ? { ...p, uploading: false, error: message }
                : p
            )
          );
        }
      }
    },
    [photos.length]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp", ".heic"] },
    maxSize: 10 * 1024 * 1024, // 10 MB per file
    disabled: photos.length >= MAX_PHOTOS,
    onDropRejected: (rejections) => {
      for (const r of rejections) {
        if (r.errors.some((e) => e.code === "file-too-large")) {
          toast.error(`${r.file.name} is too large (max 10 MB).`);
        } else {
          toast.error(`${r.file.name} couldn't be added.`);
        }
      }
    },
  });

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function removePhoto(preview: string) {
    setPhotos((prev) => {
      const entry = prev.find((p) => p.preview === preview);
      if (entry) URL.revokeObjectURL(entry.preview);
      return prev.filter((p) => p.preview !== preview);
    });
  }

  const isAnyUploading = photos.some((p) => p.uploading);
  const hasAnyFailed = photos.some((p) => p.error);

  async function handleContinue() {
    setIsContinuing(true);
    // If there are failed uploads, warn but allow continuing
    if (hasAnyFailed) {
      toast.warning(
        "Some photos failed to upload and won't appear on your profile. You can add them later."
      );
    }
    router.push("/preferences");
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const slots = Array.from({ length: MAX_PHOTOS });

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up pt-2">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-bold mb-1"
          style={{ color: "oklch(0.18 0.04 270)" }}
        >
          Add your photos
        </h1>
        <p className="text-sm" style={{ color: "oklch(0.55 0.02 50)" }}>
          Profiles with 3+ photos get 4× more connections. Your first photo
          is your main photo.
        </p>
      </div>

      {/* Photo grid */}
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
        aria-label="Photo slots"
      >
        {slots.map((_, idx) => {
          const entry = photos[idx];
          const isFirst = idx === 0;

          if (entry) {
            return (
              <div
                key={entry.preview}
                className="relative aspect-square rounded-2xl overflow-hidden"
                style={{
                  boxShadow: "0 2px 8px oklch(0.18 0.04 270 / 0.12)",
                  border: isFirst
                    ? "2px solid oklch(0.6 0.16 22)"
                    : "2px solid transparent",
                }}
              >
                <Image
                  src={entry.preview}
                  alt={`Photo ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 480px) 33vw, 150px"
                />

                {/* Primary badge */}
                {isFirst && (
                  <div
                    className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                    style={{ background: "oklch(0.6 0.16 22)" }}
                  >
                    <Star className="w-2.5 h-2.5 fill-white" aria-hidden="true" />
                    Main
                  </div>
                )}

                {/* Uploading overlay */}
                {entry.uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Loader2
                      className="w-6 h-6 text-white animate-spin"
                      aria-label="Uploading…"
                    />
                  </div>
                )}

                {/* Error overlay */}
                {entry.error && !entry.uploading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 px-2 text-center">
                    <p className="text-[10px] text-white font-medium leading-tight">
                      Upload failed
                    </p>
                  </div>
                )}

                {/* Remove button */}
                {!entry.uploading && (
                  <button
                    type="button"
                    onClick={() => removePhoto(entry.preview)}
                    aria-label={`Remove photo ${idx + 1}`}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-white transition-opacity hover:opacity-80"
                    style={{ background: "oklch(0.18 0.04 270 / 0.75)" }}
                  >
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            );
          }

          // Empty slot — show dropzone only on the first empty slot
          const isNextSlot = idx === photos.length;

          if (isNextSlot) {
            return (
              <div
                key={`slot-${idx}`}
                {...getRootProps()}
                className={cn(
                  "aspect-square rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all",
                  isDragActive && "scale-[0.97]"
                )}
                style={{
                  border: isDragActive
                    ? "2px dashed oklch(0.6 0.16 22)"
                    : "2px dashed oklch(0.85 0.02 50)",
                  background: isDragActive
                    ? "oklch(0.97 0.02 30)"
                    : "oklch(0.98 0.006 60)",
                }}
                aria-label={
                  idx === 0 ? "Add your main photo" : `Add photo ${idx + 1}`
                }
              >
                <input {...getInputProps()} />
                <ImagePlus
                  className="w-6 h-6 mb-1"
                  style={{ color: "oklch(0.6 0.16 22)" }}
                  aria-hidden="true"
                />
                {idx === 0 && (
                  <span
                    className="text-[10px] font-semibold"
                    style={{ color: "oklch(0.6 0.16 22)" }}
                  >
                    Main photo
                  </span>
                )}
              </div>
            );
          }

          // Inactive empty slot
          return (
            <div
              key={`slot-${idx}`}
              className="aspect-square rounded-2xl"
              style={{
                border: "2px dashed oklch(0.9 0.01 50)",
                background: "oklch(0.97 0.004 60)",
              }}
              aria-hidden="true"
            />
          );
        })}
      </div>

      {/* Drag-to-add hint when no photos yet */}
      {photos.length === 0 && (
        <div
          {...getRootProps()}
          className={cn(
            "rounded-2xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-all",
            isDragActive && "scale-[0.98]"
          )}
          style={{
            border: isDragActive
              ? "2px dashed oklch(0.6 0.16 22)"
              : "2px dashed oklch(0.85 0.02 50)",
            background: isDragActive ? "oklch(0.97 0.02 30)" : "oklch(1 0 0)",
          }}
          aria-label="Drag and drop photos here, or click to browse"
        >
          <input {...getInputProps()} />
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: "oklch(0.97 0.02 30)" }}
          >
            <Upload
              className="w-7 h-7"
              style={{ color: "oklch(0.6 0.16 22)" }}
              aria-hidden="true"
            />
          </div>
          <div className="text-center">
            <p
              className="text-sm font-semibold mb-0.5"
              style={{ color: "oklch(0.18 0.04 270)" }}
            >
              Drag photos here
            </p>
            <p
              className="text-xs"
              style={{ color: "oklch(0.55 0.02 50)" }}
            >
              or tap to choose from your camera roll
            </p>
          </div>
          <p
            className="text-[11px]"
            style={{ color: "oklch(0.65 0.02 50)" }}
          >
            JPG, PNG, WEBP up to 10 MB each
          </p>
        </div>
      )}

      {/* Upload count */}
      {photos.length > 0 && (
        <p
          className="text-xs text-center"
          style={{ color: "oklch(0.55 0.02 50)" }}
        >
          {photos.length} of {MAX_PHOTOS} photos added
          {photos.length < MAX_PHOTOS &&
            ` — tap an empty slot to add ${MAX_PHOTOS - photos.length} more`}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3 mt-auto pt-2">
        <Button
          size="lg"
          disabled={isAnyUploading || isContinuing}
          onClick={handleContinue}
          className="w-full h-14 rounded-2xl font-semibold text-base gap-2"
          style={{
            background: "oklch(0.6 0.16 22)",
            boxShadow: "0 4px 20px oklch(0.6 0.16 22 / 0.35)",
            opacity: photos.length === 0 ? 0.75 : 1,
          }}
        >
          {isContinuing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              Saving…
            </>
          ) : isAnyUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              Uploading…
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </>
          )}
        </Button>

        <button
          type="button"
          onClick={() => router.push("/preferences")}
          className="text-sm font-medium text-center py-1 transition-colors hover:underline"
          style={{ color: "oklch(0.55 0.02 50)" }}
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
