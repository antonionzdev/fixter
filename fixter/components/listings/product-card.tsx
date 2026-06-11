import Image from "next/image";
import Link from "next/link";
import { getSellerDisplayName } from "@/lib/profile-utils";
import { formatPrice, formatRelativeTime } from "@/lib/format";
import { ConditionBadge } from "@/components/listings/condition-badge";
import type { ListingWithSeller } from "@/lib/types/listing";

type ProductCardProps = {
  listing: ListingWithSeller;
};

export function ProductCard({ listing }: ProductCardProps) {
  const imageUrl = listing.images?.[0];
  const sellerName = getSellerDisplayName(listing.profiles);
  const conditionLabel = listing.condition?.replace(/_/g, " ") ?? null;

  return (
    <Link href={`/listings/${listing.id}`} className="group block">
      <article
        className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-gray-200)] bg-white transition-[transform,box-shadow] duration-200 hover:-translate-y-[3px] hover:shadow-[var(--shadow-hover)]"
        style={{
          boxShadow: "var(--shadow-card)",
          transitionTimingFunction: "var(--ease-out)",
        }}
      >
        {/* Imagen */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-t-[var(--radius-lg)] bg-[var(--color-gray-100)]">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={listing.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              style={{ transitionTimingFunction: "var(--ease-out)" }}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <svg
                width="36"
                height="36"
                viewBox="0 0 36 36"
                fill="none"
                aria-hidden="true"
                className="text-[var(--color-gray-300)]"
              >
                <rect x="3" y="7" width="30" height="22" rx="3" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="12" cy="15" r="3.5" stroke="currentColor" strokeWidth="1.5" />
                <path
                  d="M3 25 L11 17 L18 24 L23 19 L33 26"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="p-3 sm:p-3.5">
          {/* Precio — elemento más importante */}
          <p className="text-[1.0625rem] font-bold tracking-tight text-[var(--color-black)]">
            {formatPrice(listing.price)}
          </p>

          {/* Título */}
          <h3 className="mt-0.5 line-clamp-2 text-sm leading-snug text-[var(--color-gray-700)]">
            {listing.title}
          </h3>

          {/* Modelo + condición */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {listing.model && (
              <span className="text-xs text-[var(--color-gray-400)]">{listing.model}</span>
            )}
            {conditionLabel && <ConditionBadge condition={conditionLabel} />}
          </div>

          {/* Vendedor · ubicación | tiempo relativo */}
          <div className="mt-2.5 flex items-end justify-between gap-2">
            <span className="min-w-0 truncate text-xs text-[var(--color-gray-400)]">
              {sellerName}
              {listing.location ? ` · ${listing.location}` : ""}
            </span>
            <span className="shrink-0 text-xs text-[var(--color-gray-400)]">
              {formatRelativeTime(listing.created_at)}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
