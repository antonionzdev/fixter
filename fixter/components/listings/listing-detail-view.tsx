import Image from "next/image";
import Link from "next/link";
import { ContactSellerButton } from "@/components/listings/contact-seller-button";
import { ConditionBadge } from "@/components/listings/condition-badge";
import { ListingGallery } from "@/components/listings/listing-gallery";
import { RecentlyViewedTracker } from "@/components/listings/recently-viewed-tracker";
import { formatPrice, formatRelativeTime } from "@/lib/format";
import type { ListingDetailWithSeller } from "@/lib/types/listing";

type ListingDetailViewProps = {
  listing: ListingDetailWithSeller;
};

function SellerAvatar({
  username,
  avatarUrl,
}: {
  username: string;
  avatarUrl: string | null;
}) {
  const initial = username.charAt(0).toUpperCase();

  if (avatarUrl) {
    return (
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-zinc-100">
        <Image
          src={avatarUrl}
          alt={username}
          fill
          className="object-cover"
          sizes="48px"
          unoptimized
        />
      </div>
    );
  }

  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-sm font-semibold text-zinc-600">
      {initial}
    </div>
  );
}

export function ListingDetailView({ listing }: ListingDetailViewProps) {
  const seller = listing.profiles;
  const sellerLocation = seller?.location || listing.location;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 lg:gap-8">
      <RecentlyViewedTracker listingId={listing.id} />
      {/* Galería — primero en mobile y desktop (col izq) */}
      <div className="lg:col-span-3">
        <ListingGallery images={listing.images} title={listing.title} />
      </div>

      {/* Sidebar — precio, título, vendedor (2º en mobile, col der en desktop) */}
      <aside className="flex flex-col gap-5 lg:col-span-2 lg:col-start-4 lg:row-start-1">
        <div>
          <p className="text-3xl font-bold tracking-tight text-zinc-900">
            {formatPrice(listing.price)}
          </p>
          <h1 className="mt-2 text-xl font-semibold leading-snug text-zinc-900 sm:text-2xl">
            {listing.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {listing.condition && (
              <ConditionBadge condition={listing.condition} />
            )}
            <span className="text-xs text-zinc-500">
              {formatRelativeTime(listing.created_at)}
            </span>
          </div>
        </div>

        {seller && (
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
              Vendedor
            </p>
            <div className="flex items-center gap-3">
              <Link
                href={`/profile/${encodeURIComponent(seller.username)}`}
                className="shrink-0 transition-opacity hover:opacity-80"
              >
                <SellerAvatar
                  username={seller.username}
                  avatarUrl={seller.avatar_url}
                />
              </Link>
              <div className="min-w-0">
                <Link
                  href={`/profile/${encodeURIComponent(seller.username)}`}
                  className="truncate font-medium text-zinc-900 hover:underline"
                >
                  {seller.username}
                </Link>
                {sellerLocation && (
                  <p className="truncate text-sm text-zinc-500">
                    {sellerLocation}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <ContactSellerButton listingId={listing.id} sellerId={listing.seller_id} />
      </aside>

      {/* Descripción + detalles — 3º en mobile, col izq debajo de galería */}
      <div className="space-y-6 lg:col-span-3 lg:row-start-2">
        {listing.description && (
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Descripción
            </h2>
            <p className="mt-3 whitespace-pre-wrap text-base leading-relaxed text-zinc-700">
              {listing.description}
            </p>
          </section>
        )}

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Detalles
          </h2>
          <dl className="mt-3 divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
            {listing.category && (
              <div className="flex justify-between gap-4 px-4 py-3">
                <dt className="text-sm text-zinc-500">Categoría</dt>
                <dd className="text-sm font-medium text-zinc-900">
                  {listing.category}
                </dd>
              </div>
            )}
            {listing.brand && (
              <div className="flex justify-between gap-4 px-4 py-3">
                <dt className="text-sm text-zinc-500">Marca</dt>
                <dd className="text-sm font-medium text-zinc-900">
                  {listing.brand}
                </dd>
              </div>
            )}
            {listing.model && (
              <div className="flex justify-between gap-4 px-4 py-3">
                <dt className="text-sm text-zinc-500">Modelo</dt>
                <dd className="text-sm font-medium text-zinc-900">
                  {listing.model}
                </dd>
              </div>
            )}
            {listing.location && (
              <div className="flex justify-between gap-4 px-4 py-3">
                <dt className="text-sm text-zinc-500">Ubicación</dt>
                <dd className="text-sm font-medium text-zinc-900">
                  {listing.location}
                </dd>
              </div>
            )}
          </dl>
        </section>
      </div>
    </div>
  );
}
