import Image from "next/image";
import { StarRating } from "@/components/profile/star-rating";
import { formatRelativeTime } from "@/lib/format";
import type { ReviewWithDetails } from "@/lib/types/reviews";

type ReviewsListProps = {
  reviews: ReviewWithDetails[];
};

export function ReviewsList({ reviews }: ReviewsListProps) {
  const avg =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return (
    <section>
      <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
        Valoraciones recibidas
      </h2>

      {reviews.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center text-sm text-zinc-500">
          Aún sin valoraciones.
        </p>
      ) : (
        <>
          {/* Summary */}
          <div className="mt-5 flex items-center gap-5 rounded-xl bg-zinc-50 px-5 py-4">
            <p className="text-5xl font-black tracking-tight text-zinc-950">
              {avg.toFixed(1)}
            </p>
            <div>
              <StarRating rating={avg} size="md" />
              <p className="mt-1 text-sm text-zinc-500">
                {reviews.length}{" "}
                {reviews.length === 1 ? "valoración" : "valoraciones"}
              </p>
            </div>
          </div>

          {/* List */}
          <ul className="mt-4 space-y-3">
            {reviews.map((review) => (
              <li
                key={review.id}
                className="rounded-xl border border-zinc-100 bg-white p-5"
              >
                <div className="flex items-start gap-4">
                  {/* Reviewer avatar */}
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-zinc-200">
                    {review.reviewer_avatar_url ? (
                      <Image
                        src={review.reviewer_avatar_url}
                        alt={review.reviewer_username}
                        fill
                        className="object-cover"
                        sizes="40px"
                        unoptimized
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center text-sm font-semibold text-zinc-500">
                        {review.reviewer_username[0]?.toUpperCase() ?? "?"}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
                      <span className="text-sm font-semibold text-zinc-900">
                        @{review.reviewer_username}
                      </span>
                      <span className="text-xs text-zinc-400">
                        {formatRelativeTime(review.created_at)}
                      </span>
                    </div>

                    <div className="mt-1.5">
                      <StarRating rating={review.rating} size="sm" />
                    </div>

                    <p className="mt-1 text-xs text-zinc-400">
                      Compró:{" "}
                      <span className="text-zinc-500">{review.listing_title}</span>
                    </p>

                    {review.comment && (
                      <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                        {review.comment}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
