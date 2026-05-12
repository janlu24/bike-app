"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { compressImage } from "@/lib/compressImage";
import { cn } from "@/lib/utils";
import { Camera, Check, Loader2, User, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";

interface AvatarUploaderProps {
  initialUrl?: string | null;
  username: string;
  error?: string;
}

async function getCroppedBlob(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Bild konnte nicht geladen werden"));
    img.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas nicht verfügbar");

  ctx.drawImage(
    img,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Crop fehlgeschlagen")),
      "image/jpeg",
      0.95
    );
  });
}

export function AvatarUploader({ initialUrl, username, error }: AvatarUploaderProps) {
  const [preview, setPreview] = useState<string | null>(initialUrl ?? null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const cropUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      if (cropUrlRef.current) URL.revokeObjectURL(cropUrlRef.current);
    };
  }, []);

  function handleFile(file: File | undefined) {
    setLocalError(null);
    if (!file) {
      setPreview(initialUrl ?? null);
      return;
    }

    const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
    if (!allowed.has(file.type)) {
      setLocalError("Nur JPEG, PNG, WebP oder AVIF erlaubt.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    if (cropUrlRef.current) URL.revokeObjectURL(cropUrlRef.current);
    const src = URL.createObjectURL(file);
    cropUrlRef.current = src;

    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setCropSrc(src);
  }

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  function handleCancel() {
    if (cropUrlRef.current) {
      URL.revokeObjectURL(cropUrlRef.current);
      cropUrlRef.current = null;
    }
    setCropSrc(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleConfirm() {
    if (!cropSrc || !croppedAreaPixels) return;

    const srcToProcess = cropSrc;
    setCropSrc(null);
    setIsCompressing(true);
    setLocalError(null);

    try {
      const blob = await getCroppedBlob(srcToProcess, croppedAreaPixels);
      URL.revokeObjectURL(srcToProcess);
      cropUrlRef.current = null;

      const rawFile = new File([blob], "avatar.jpg", { type: "image/jpeg" });
      const compressed = await compressImage(rawFile);

      if (compressed.size > 5 * 1024 * 1024) {
        setLocalError("Das Bild ist zu groß (max. 5 MB nach Kompression).");
        if (inputRef.current) inputRef.current.value = "";
        return;
      }

      if (inputRef.current) {
        const dt = new DataTransfer();
        dt.items.add(compressed);
        inputRef.current.files = dt.files;
      }

      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      const previewUrl = URL.createObjectURL(compressed);
      previewUrlRef.current = previewUrl;
      setPreview(previewUrl);
    } catch {
      URL.revokeObjectURL(srcToProcess);
      cropUrlRef.current = null;
      setLocalError("Upload fehlgeschlagen. Bitte versuche es erneut.");
      if (inputRef.current) inputRef.current.value = "";
    } finally {
      setIsCompressing(false);
    }
  }

  const displayError = error ?? localError;
  const initials = username.slice(0, 2).toUpperCase();

  return (
    <>
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <Avatar className="h-24 w-24 border-2 border-cockpit-border">
            {preview ? (
              <AvatarImage
                src={preview}
                alt={`Profilbild von ${username}`}
                className="object-cover"
              />
            ) : null}
            <AvatarFallback className="bg-petrol-950 text-petrol-300 text-lg font-semibold">
              {initials || <User size={32} strokeWidth={1.5} aria-hidden />}
            </AvatarFallback>
          </Avatar>

          <input
            ref={inputRef}
            id="avatar-upload"
            type="file"
            name="avatar"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={(e) => handleFile(e.target.files?.[0])}
            className="hidden"
            disabled={isCompressing}
          />

          {isCompressing ? (
            <div
              aria-hidden
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-cockpit-border bg-cockpit-surface"
            >
              <Loader2 size={14} className="animate-spin text-petrol-400" />
            </div>
          ) : (
            <label
              htmlFor="avatar-upload"
              className={cn(
                "absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center",
                "rounded-full border border-cockpit-border bg-cockpit-surface text-cockpit-muted",
                "transition-colors hover:border-petrol-600 hover:text-petrol-300"
              )}
              aria-label="Profilbild ändern"
            >
              <Camera size={14} strokeWidth={1.75} aria-hidden />
            </label>
          )}
        </div>

        <p className="text-[11px] text-cockpit-muted">
          {isCompressing ? "Komprimiere …" : "JPEG · PNG · WebP · AVIF · max. 5 MB"}
        </p>

        {displayError && (
          <p role="alert" className="text-xs text-red-400">
            {displayError}
          </p>
        )}
      </div>

      {cropSrc && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Bildausschnitt wählen"
          className="fixed inset-0 z-50 flex flex-col bg-petrol-950/95 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between border-b border-cockpit-border px-4 py-3">
            <h2 className="text-sm font-medium tracking-wide text-cockpit-text">
              Bildausschnitt wählen
            </h2>
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-md p-1 text-cockpit-muted transition-colors hover:text-cockpit-text"
              aria-label="Abbrechen"
            >
              <X size={18} strokeWidth={1.75} aria-hidden />
            </button>
          </div>

          <div className="relative flex-1">
            <Cropper
              image={cropSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              style={{
                containerStyle: { background: "transparent" },
                cropAreaStyle: {
                  border: "2px solid rgb(20 184 166)",
                  boxShadow: "0 0 0 9999px rgba(2, 26, 32, 0.75)",
                },
              }}
            />
          </div>

          <div className="flex items-center gap-3 border-t border-cockpit-border px-4 py-3">
            <span className="shrink-0 text-[11px] uppercase tracking-widest text-cockpit-muted">
              Zoom
            </span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-petrol-500"
              aria-label="Zoom"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-cockpit-border px-4 py-3">
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center gap-2 rounded-md border border-cockpit-border px-4 py-2 text-sm text-cockpit-muted transition-colors hover:border-petrol-700 hover:text-cockpit-text"
            >
              <X size={15} strokeWidth={1.75} aria-hidden />
              Abbrechen
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="inline-flex items-center gap-2 rounded-md border border-petrol-700 bg-petrol-600 px-4 py-2 text-sm font-medium text-white shadow-cockpit transition-colors hover:bg-petrol-500"
            >
              <Check size={15} strokeWidth={2} aria-hidden />
              Ausschnitt wählen
            </button>
          </div>
        </div>
      )}
    </>
  );
}
