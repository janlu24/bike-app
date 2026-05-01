"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Camera, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface AvatarUploaderProps {
  initialUrl?: string | null;
  username: string;
  error?: string;
}

export function AvatarUploader({ initialUrl, username, error }: AvatarUploaderProps) {
  const [preview, setPreview] = useState<string | null>(initialUrl ?? null);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  function handleFile(file: File | undefined) {
    setLocalError(null);
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    if (!file) {
      setPreview(initialUrl ?? null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setLocalError("Bild ist größer als 5 MB.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
    if (!allowed.has(file.type)) {
      setLocalError("Nur JPEG, PNG, WebP oder AVIF erlaubt.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setPreview(url);
  }

  const displayError = error ?? localError;
  const initials = username.slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <Avatar className="h-24 w-24 border-2 border-cockpit-border">
          {preview ? (
            <AvatarImage src={preview} alt={`Profilbild von ${username}`} />
          ) : null}
          <AvatarFallback className="bg-petrol-950 text-petrol-300 text-lg font-semibold">
            {initials || <User size={32} strokeWidth={1.5} aria-hidden />}
          </AvatarFallback>
        </Avatar>

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
          <input
            ref={inputRef}
            id="avatar-upload"
            type="file"
            name="avatar"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={(e) => handleFile(e.target.files?.[0])}
            className="hidden"
          />
        </label>
      </div>

      <p className="text-[11px] text-cockpit-muted">JPEG · PNG · WebP · AVIF · max. 5 MB</p>

      {displayError && (
        <p role="alert" className="text-xs text-red-400">
          {displayError}
        </p>
      )}
    </div>
  );
}
