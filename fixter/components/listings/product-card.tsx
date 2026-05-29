import Image from "next/image";
import { getSellerDisplayName } from "@/lib/profile-utils";
import type { ListingWithSeller } from "@/lib/types/listing";

type ProductCardProps = {
  listing: ListingWithSeller;
};

export function ProductCard({ listing }: ProductCardProps) {
  const imageUrl = listing.images?.[0];
  const sellerName = getSellerDisplayName(listing.profiles);

  return (
    <article className="group overflow-hidden rounded-xl border border-zinc-200 bg-white transition-shadow hover:shadow-md">
      <div className="relative aspect-[4/3] bg-gradient-to-br from-zinc-100 to-zinc-200">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={listing.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 33vw"
            unoptimized
          />
        ) : null}
      </div>
      <div className="p-4">
        <h3 className="line-clamp-2 text-sm font-medium text-zinc-900">
          {listing.title}
        </h3>
        <p className="mt-2 text-lg font-semibold text-zinc-900">
          {listing.price} €
        </p>
        {listing.location && (
          <p className="mt-1 text-xs text-zinc-500">{listing.location}</p>
        )}
        <p className="mt-0.5 truncate text-xs text-zinc-400">{sellerName}</p>
      </div>
    </article>
  );
}
