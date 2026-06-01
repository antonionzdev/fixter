import Image from "next/image";
import Link from "next/link";
import { ListingActions } from "@/app/dashboard/ListingActions";
import { formatPrice, formatRelativeTime } from "@/lib/format";
import type { SellerListing } from "@/lib/types/listing";

type DashboardListingCardProps = {
  listing: SellerListing;
};

export function DashboardListingCard({ listing }: DashboardListingCardProps) {
  const imageUrl = listing.images?.[0];

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white transition-shadow hover:shadow-md">
      <Link href={`/listings/${listing.id}`} className="block">
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
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-zinc-400">
              Sin foto
            </div>
          )}
          {listing.status === "sold" && (
            <span className="absolute left-3 top-3 rounded-full bg-zinc-900/80 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
              Vendido
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link
          href={`/listings/${listing.id}`}
          className="line-clamp-2 text-sm font-medium text-zinc-900 hover:underline"
        >
          {listing.title}
        </Link>
        <p className="mt-2 text-lg font-semibold text-zinc-900">
          {formatPrice(listing.price)}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-zinc-500">
          {listing.category && <span>{listing.category}</span>}
          {listing.category && <span aria-hidden>·</span>}
          <span>{formatRelativeTime(listing.created_at)}</span>
        </div>

        <div className="mt-auto pt-4">
          <ListingActions listingId={listing.id} listingTitle={listing.title} status={listing.status} />
        </div>
      </div>
    </article>
  );
}
