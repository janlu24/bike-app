"use client";

import { compressImage } from "@/lib/compressImage";
import { cn } from "@/lib/utils";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ImageUploaderProps {
  initialUrl?: string | null;
}

export function ImageUploader({ initialUrl }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(initialUrl ?? null);
  const [removed, setRemoved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  async function handleFile(file: File | undefined) {
    setError(null);
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    if (!file) {
      setPreview(initialUrl ?? null);
      return;
    }

    const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
    if (!allowed.has(file.type)) {
      setError("Nur JPEG, PNG, WebP oder AVIF erlaubt.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setIsCompressing(true);
    try {
      const compressed = await compressImage(file);

      if (compressed.size > 5 * 1024 * 1024) {
        setError("Das Bild ist zu groß (max. 5 MB nach Kompression).");
        if (inputRef.current) inputRef.current.value = "";
        return;
      }

      if (inputRef.current) {
        const dt = new DataTransfer();
        dt.items.add(compressed);
        inputRef.current.files = dt.files;
      }

      const url = URL.createObjectURL(compressed);
      objectUrlRef.current = url;
      setPreview(url);
      setRemoved(false);
    } catch {
      setError("Upload fehlgeschlagen. Bitte versuche es erneut.");
      if (inputRef.current) inputRef.current.value = "";
    } finally {
      setIsCompressing(false);
    }
  }

  function clearImage() {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    if (inputRef.current) inputRef.current.value = "";
    setPreview(null);
    setRemoved(true);
  }

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-cockpit-muted">
        Bild
      </p>

      <div
        className={cn(
          "relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-md border bg-cockpit-surface",
          preview && !isCompressing ? "border-petrol-700" : "border-dashed border-cockpit-border"
        )}
      >
        {isCompressing ? (
          <div className="flex flex-col items-center gap-2 text-cockpit-muted">
            <Loader2 size={22} className="animate-spin" aria-hidden />
            <span className="text-[11px] uppercase tracking-widest">Komprimiere …</span>
          </div>
        ) : preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Vorschau"
              className="h-full w-full object-cover"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-cockpit-surface/60 via-petrol-950/20 to-transparent"
            />
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 text-cockpit-muted">
            <ImagePlus size={22} strokeWidth={1.5} aria-hidden />
            <span className="text-[11px] uppercase tracking-widest">
              Kein Bild ausgewählt
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label
          className={cn(
            "inline-flex items-center gap-2 rounded-md border border-cockpit-border px-3 py-1.5 text-xs text-cockpit-muted transition-colors",
            isCompressing
              ? "cursor-not-allowed opacity-50"
              : "cursor-pointer hover:border-petrol-600 hover:text-petrol-300"
          )}
        >
          {isCompressing ? (
            <Loader2 size={13} className="animate-spin" aria-hidden />
          ) : (
            <ImagePlus size={13} strokeWidth={1.75} aria-hidden />
          )}
          {isCompressing ? "Komprimiere …" : preview ? "Bild ersetzen" : "Bild auswählen"}
          <input
            ref={inputRef}
            type="file"
            name="image"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={(e) => handleFile(e.target.files?.[0])}
            className="hidden"
            disabled={isCompressing}
          />
        </label>

        {preview && !isCompressing && (
          <button
            type="button"
            onClick={clearImage}
            className="inline-flex items-center gap-1.5 rounded-md border border-cockpit-border px-3 py-1.5 text-xs text-cockpit-muted transition-colors hover:border-red-700 hover:text-red-400"
          >
            <Trash2 size={13} strokeWidth={1.75} aria-hidden />
            Entfernen
          </button>
        )}

        {!isCompressing && (
          <p className="text-[11px] text-cockpit-muted">
            JPEG · PNG · WebP · AVIF · max. 5 MB
          </p>
        )}
      </div>

      <input
        type="checkbox"
        name="remove_image"
        checked={removed && !preview}
        readOnly
        className="hidden"
      />

      {error && (
        <p role="alert" className="text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
