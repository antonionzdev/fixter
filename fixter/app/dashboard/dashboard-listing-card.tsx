import Image from "next/image";
import Link from "next/link";
import { ListingActions } from "@/app/dashboard/ListingActions";
import { formatPrice, formatRelativeTime } from "@/lib/format";
import type { SellerListing } from "@/lib/types/listing";

type DashboardListingCardProps = {
  listing: SellerListing;
};

const CONDITION_LABELS: Record<string, string> = {
  nuevo: "Nuevo",
  como_nuevo: "Como nuevo",
  bueno: "Bueno",
  aceptable: "Aceptable",
};

export function DashboardListingCard({ listing }: DashboardListingCardProps) {
  const imageUrl = listing.images?.[0];
  const isSold = listing.status === "sold";
  const conditionLabel = listing.condition
    ? (CONDITION_LABELS[listing.condition] ?? listing.condition)
    : null;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-sm transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {/* Photo */}
      <Link
        href={`/listings/${listing.id}`}
        className="relative block aspect-[4/3] overflow-hidden bg-gradient-to-br from-zinc-100 to-zinc-200"
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={listing.title}
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

        {/* Sold overlay */}
        {isSold && <div className="absolute inset-0 bg-zinc-900/30" />}

        {/* Badge */}
        {isSold ? (
          <span className="absolute left-2 top-2 rounded bg-[#16A34A] px-2 py-0.5 text-[11px] font-medium text-white">
            Vendido
          </span>
        ) : conditionLabel ? (
          <span className="absolute right-2 top-2 rounded bg-zinc-900/70 px-2 py-0.5 text-[11px] font-medium text-white">
            {conditionLabel}
          </span>
        ) : null}
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col px-3 pb-0 pt-3">
        <Link
          href={`/listings/${listing.id}`}
          className="line-clamp-2 text-[14px] font-semibold leading-snug text-zinc-900 hover:underline"
        >
          {listing.title}
        </Link>
        <p className="mt-1.5 text-[18px] font-bold text-zinc-900">
          {formatPrice(listing.price)}
        </p>
        <p className="mt-0.5 text-[12px] text-zinc-400">
          {listing.category ? `${listing.category} · ` : ""}
          {formatRelativeTime(listing.created_at)}
        </p>
      </div>

      {/* Actions */}
      <div className="mt-3 border-t border-[#F0F0F0] px-3 pb-3 pt-3">
        {isSold ? (
          <Link
            href={`/listings/${listing.id}`}
            className="flex w-full items-center justify-center rounded-[6px] border border-zinc-200 px-3 py-2 text-[13px] font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
          >
            Ver anuncio
          </Link>
        ) : (
          <ListingActions
            listingId={listing.id}
            listingTitle={listing.title}
            status={listing.status}
          />
        )}
      </div>
    </article>
  );
}
