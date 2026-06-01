"use client";

import { useId } from "react";

type StarRatingProps = {
  rating: number;
  count?: number;
  size?: "sm" | "md";
};

export function StarRating({ rating, count, size = "md" }: StarRatingProps) {
  const baseId = useId();
  const px = size === "sm" ? 14 : 18;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5" aria-label={`${rating} de 5 estrellas`}>
        {[1, 2, 3, 4, 5].map((star) => {
          const fill = Math.min(1, Math.max(0, rating - star + 1));
          const pct = Math.round(fill * 100);
          const gradId = `${baseId}-s${star}`;
          return (
            <svg
              key={star}
              width={px}
              height={px}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id={gradId} x1="0" x2="1" y1="0" y2="0">
                  <stop offset={`${pct}%`} stopColor="#fbbf24" />
                  <stop offset={`${pct}%`} stopColor="#d4d4d8" />
                </linearGradient>
              </defs>
              <polygon
                points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
                fill={`url(#${gradId})`}
              />
            </svg>
          );
        })}
      </div>
      {count !== undefined && (
        <span
          className={`text-zinc-500 ${size === "sm" ? "text-xs" : "text-sm"}`}
        >
          {count === 0
            ? "Sin valoraciones"
            : `${rating.toFixed(1)} (${count} ${count === 1 ? "reseña" : "reseñas"})`}
        </span>
      )}
    </div>
  );
}
