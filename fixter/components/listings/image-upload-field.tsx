"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { MAX_LISTING_IMAGES } from "@/lib/constants/categories";

type ImageUploadFieldProps = {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
  error?: string | null;
};

export function ImageUploadField({
  files,
  onChange,
  disabled = false,
  error,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  function handleFileChange(fileList: FileList | null) {
    if (!fileList?.length) return;
    const incoming = Array.from(fileList);
    const merged = [...files, ...incoming].slice(0, MAX_LISTING_IMAGES);
    onChange(merged);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function removeFile(index: number) {
    onChange(files.filter((_, i) => i !== index));
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-zinc-700">
        Imágenes <span className="text-red-500">*</span>
      </label>
      <p className="mb-3 text-xs text-zinc-500">
        Mínimo 1 imagen. Máximo {MAX_LISTING_IMAGES}. Hasta 5 MB cada una.
      </p>

      <div className="flex flex-wrap gap-3">
        {previews.map((src, index) => (
          <div
            key={src}
            className="relative h-24 w-24 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100"
          >
            <Image
              src={src}
              alt={`Vista previa ${index + 1}`}
              fill
              className="object-cover"
              unoptimized
            />
            <button
              type="button"
              disabled={disabled}
              onClick={() => removeFile(index)}
              className="absolute right-1 top-1 rounded-md bg-black/60 px-1.5 py-0.5 text-xs text-white hover:bg-black/80 disabled:opacity-50"
              aria-label={`Eliminar imagen ${index + 1}`}
            >
              ×
            </button>
          </div>
        ))}

        {files.length < MAX_LISTING_IMAGES && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="flex h-24 w-24 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 text-xs text-zinc-500 transition hover:border-zinc-400 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="text-2xl leading-none text-zinc-400">+</span>
            <span className="mt-1">Añadir</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        disabled={disabled}
        onChange={(e) => handleFileChange(e.target.files)}
      />

      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
