"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

type ListingGalleryProps = {
  images: string[];
  title: string;
};

function ChevronLeft() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export function ListingGallery({ images, title }: ListingGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const lbTouchStartX = useRef<number | null>(null);

  const hasImages = images.length > 0;
  const hasMultiple = images.length > 1;
  const activeImage = hasImages ? images[selectedIndex] : null;

  const prev = useCallback(() => {
    setSelectedIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  }, [images.length]);

  const next = useCallback(() => {
    setSelectedIndex((i) => (i === images.length - 1 ? 0 : i + 1));
  }, [images.length]);

  // Keyboard nav + Escape in lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "Escape") setLightboxOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, prev, next]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (!lightboxOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightboxOpen]);

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 50) return;
    dx < 0 ? next() : prev();
  }

  function onLbTouchStart(e: React.TouchEvent) {
    lbTouchStartX.current = e.touches[0].clientX;
  }
  function onLbTouchEnd(e: React.TouchEvent) {
    if (lbTouchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - lbTouchStartX.current;
    lbTouchStartX.current = null;
    if (Math.abs(dx) < 50) return;
    dx < 0 ? next() : prev();
  }

  return (
    <>
      <div>
        {/* Main image */}
        <div
          className="group relative aspect-[4/3] cursor-zoom-in select-none overflow-hidden rounded-2xl bg-[#111]"
          onTouchStart={hasMultiple ? onTouchStart : undefined}
          onTouchEnd={hasMultiple ? onTouchEnd : undefined}
          onClick={() => activeImage && setLightboxOpen(true)}
        >
          {activeImage ? (
            <div
              key={selectedIndex}
              className="absolute inset-0 animate-[gallery-fade-in_200ms_ease-out_both]"
            >
              <Image
                src={activeImage}
                alt={`${title} — imagen ${selectedIndex + 1}`}
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 60vw"
                priority
                unoptimized
              />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-zinc-500">
              Sin imágenes
            </div>
          )}

          {hasMultiple && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-[opacity,transform] duration-150 active:scale-95 md:opacity-0 md:group-hover:opacity-100"
                aria-label="Foto anterior"
              >
                <ChevronLeft />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-[opacity,transform] duration-150 active:scale-95 md:opacity-0 md:group-hover:opacity-100"
                aria-label="Foto siguiente"
              >
                <ChevronRight />
              </button>

              {/* Dot indicators */}
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                {images.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full bg-white transition-all duration-200 ${
                      i === selectedIndex ? "w-4 opacity-100" : "w-1.5 opacity-40"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Thumbnail strip */}
        {hasMultiple && (
          <ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {images.map((url, index) => (
              <li key={url}>
                <button
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-[opacity,border-color] duration-200 ease-out active:scale-[0.97] ${
                    index === selectedIndex
                      ? "border-[#FF6B2B]"
                      : "border-transparent opacity-50 hover:opacity-80"
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

      {/* Lightbox */}
      {lightboxOpen && activeImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
          onClick={(e) => {
            if (e.target === e.currentTarget) setLightboxOpen(false);
          }}
          onTouchStart={hasMultiple ? onLbTouchStart : undefined}
          onTouchEnd={hasMultiple ? onLbTouchEnd : undefined}
        >
          {/* Close button */}
          <button
            type="button"
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            onClick={() => setLightboxOpen(false)}
            aria-label="Cerrar"
          >
            <CloseIcon />
          </button>

          {/* Full-size image */}
          <div className="relative h-full w-full">
            <Image
              src={activeImage}
              alt={`${title} — imagen ${selectedIndex + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
              unoptimized
            />
          </div>

          {/* Lightbox arrows */}
          {hasMultiple && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                className="absolute left-4 top-1/2 z-10 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                aria-label="Foto anterior"
              >
                <ChevronLeft />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                className="absolute right-4 top-1/2 z-10 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                aria-label="Foto siguiente"
              >
                <ChevronRight />
              </button>
            </>
          )}

          {/* Counter */}
          {hasMultiple && (
            <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-white">
              {selectedIndex + 1} / {images.length}
            </div>
          )}
        </div>
      )}
    </>
  );
}
