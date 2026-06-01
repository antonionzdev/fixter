import Image from "next/image";
import Link from "next/link";
import { ConditionBadge } from "@/components/listings/condition-badge";
import { formatPrice } from "@/lib/format";
import type { SellerListing } from "@/lib/types/listing";

type MarketplaceListingCardProps = {
  listing: Pick<
    SellerListing,
    "id" | "title" | "price" | "condition" | "images"
  >;
};

export function MarketplaceListingCard({
  listing,
}: MarketplaceListingCardProps) {
  const imageUrl = listing.images?.[0];

  return (
    <Link href={`/listings/${listing.id}`} className="block h-full">
      <article className="group h-full overflow-hidden rounded-xl border border-zinc-200 bg-white transition-shadow hover:shadow-md">
        <div className="relative aspect-[4/3] bg-gradient-to-br from-zinc-100 to-zinc-200">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={listing.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              unoptimized
            />
          ) : null}
        </div>
        <div className="p-4">
          <h3 className="line-clamp-2 text-sm font-medium text-zinc-900">
            {listing.title}
          </h3>
          <p className="mt-2 text-lg font-semibold text-zinc-900">
            {formatPrice(listing.price)}
          </p>
          {listing.condition && (
            <div className="mt-2">
              <ConditionBadge condition={listing.condition} />
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
