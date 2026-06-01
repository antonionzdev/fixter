"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { StarRating } from "@/components/profile/star-rating";
import { ReviewFormModal } from "@/components/dashboard/review-form-modal";

type PurchaseCardProps = {
  listingId: string;
  listingTitle: string;
  listingImage: string | null;
  sellerId: string;
  sellerUsername: string;
  initialReview: { rating: number; comment: string | null } | null;
};

export function PurchaseCard({
  listingId,
  listingTitle,
  listingImage,
  sellerId,
  sellerUsername,
  initialReview,
}: PurchaseCardProps) {
  const [review, setReview] = useState(initialReview);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <article className="flex h-full flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white transition-shadow hover:shadow-md">
        <Link href={`/listings/${listingId}`} className="block">
          <div className="relative aspect-[4/3] bg-gradient-to-br from-zinc-100 to-zinc-200">
            {listingImage ? (
              <Image
                src={listingImage}
                alt={listingTitle}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                unoptimized
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-zinc-400">
                Sin foto
              </div>
            )}
            <span className="absolute left-3 top-3 rounded-full bg-zinc-900/80 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
              Comprado
            </span>
          </div>
        </Link>

        <div className="flex flex-1 flex-col p-4">
          <Link
            href={`/listings/${listingId}`}
            className="line-clamp-2 text-sm font-medium text-zinc-900 hover:underline"
          >
            {listingTitle}
          </Link>
          <Link
            href={`/profile/${sellerUsername}`}
            className="mt-1 text-xs text-zinc-500 hover:underline"
          >
            @{sellerUsername}
          </Link>

          <div className="mt-auto pt-4">
            {review ? (
              <div className="space-y-1.5">
                <StarRating rating={review.rating} size="sm" />
                {review.comment && (
                  <p className="line-clamp-2 text-xs text-zinc-500">{review.comment}</p>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="w-full rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs font-medium text-amber-800 transition hover:bg-amber-100 sm:text-sm"
              >
                Valorar compra
              </button>
            )}
          </div>
        </div>
      </article>

      <ReviewFormModal
        listingId={listingId}
        reviewedId={sellerId}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={(newReview) => {
          setReview(newReview);
          setModalOpen(false);
        }}
      />
    </>
  );
}
