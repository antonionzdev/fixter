"use client";

import Image from "next/image";
import { useState } from "react";

type ListingGalleryProps = {
  images: string[];
  title: string;
};

export function ListingGallery({ images, title }: ListingGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const hasImages = images.length > 0;
  const activeImage = hasImages ? images[selectedIndex] : null;

  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-100 to-zinc-200">
        {activeImage ? (
          <Image
            src={activeImage}
            alt={`${title} — imagen ${selectedIndex + 1}`}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 60vw"
            priority
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-zinc-400">
            Sin imágenes
          </div>
        )}
      </div>

      {images.length > 1 && (
        <ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((url, index) => (
            <li key={url}>
              <button
                type="button"
                onClick={() => setSelectedIndex(index)}
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                  index === selectedIndex
                    ? "border-zinc-900"
                    : "border-transparent opacity-70 hover:opacity-100"
                }`}
                aria-label={`Ver imagen ${index + 1}`}
                aria-current={index === selectedIndex}
              >
                <Image
                  src={url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="64px"
                  unoptimized
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
