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
      <article className="flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-sm transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <Link
          href={`/listings/${listingId}`}
          className="relative block aspect-[4/3] overflow-hidden bg-gradient-to-br from-zinc-100 to-zinc-200"
        >
          {listingImage ? (
            <Image
              src={listingImage}
              alt={listingTitle}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-zinc-400">
              Sin foto
            </div>
          )}
          <span className="absolute left-2 top-2 rounded bg-[#3B82F6] px-2 py-0.5 text-[11px] font-medium text-white">
            Comprado
          </span>
        </Link>

        <div className="flex flex-1 flex-col px-3 pb-0 pt-3">
          <Link
            href={`/listings/${listingId}`}
            className="line-clamp-2 text-[14px] font-semibold leading-snug text-zinc-900 hover:underline"
          >
            {listingTitle}
          </Link>
          <Link
            href={`/profile/${sellerUsername}`}
            className="mt-1 text-xs text-zinc-500 hover:underline"
          >
            @{sellerUsername}
          </Link>

          {review && (
            <div className="mt-2 space-y-1">
              <StarRating rating={review.rating} size="sm" />
              {review.comment && (
                <p className="line-clamp-2 text-xs text-zinc-500">{review.comment}</p>
              )}
            </div>
          )}
        </div>

        <div className="mt-3 border-t border-[#F0F0F0] px-3 pb-3 pt-3">
          <div className="flex flex-col gap-2">
            <Link
              href={`/listings/${listingId}`}
              className="flex w-full items-center justify-center rounded-[6px] border border-zinc-200 px-3 py-2 text-[13px] font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
            >
              Ver anuncio
            </Link>
            {!review && (
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="w-full rounded-[6px] bg-zinc-950 px-3 py-2 text-[13px] font-semibold text-white transition-[opacity] hover:opacity-90"
              >
                Valorar vendedor
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
