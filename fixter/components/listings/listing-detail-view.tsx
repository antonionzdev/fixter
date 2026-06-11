import Image from "next/image";
import Link from "next/link";
import { ContactSellerButton } from "@/components/listings/contact-seller-button";
import { MakeOfferButton } from "@/components/listings/make-offer-button";
import { ConditionBadge } from "@/components/listings/condition-badge";
import { ListingGallery } from "@/components/listings/listing-gallery";
import { RecentlyViewedTracker } from "@/components/listings/recently-viewed-tracker";
import { StarRating } from "@/components/profile/star-rating";
import { formatPrice, formatRelativeTime } from "@/lib/format";
import type { ListingDetailWithSeller } from "@/lib/types/listing";

type SellerStats = {
  avgRating: number;
  reviewCount: number;
  activeListingsCount: number;
};

type ListingDetailViewProps = {
  listing: ListingDetailWithSeller;
  sellerStats?: SellerStats;
  acceptedOfferAmount?: number | null;
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
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full ring-2 ring-zinc-100">
        <Image
          src={avatarUrl}
          alt={username}
          fill
          className="object-cover"
          sizes="64px"
          unoptimized
        />
      </div>
    );
  }

  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#FF6B2B] text-xl font-bold text-white">
      {initial}
    </div>
  );
}

export function ListingDetailView({ listing, sellerStats, acceptedOfferAmount }: ListingDetailViewProps) {
  const seller = listing.profiles;
  const sellerLocation = seller?.location || listing.location;
  const hasSpecs =
    listing.category || listing.brand || listing.model || listing.location;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[3fr_2fr] lg:gap-12">
      <RecentlyViewedTracker listingId={listing.id} />

      {/* Gallery — left, row 1 */}
      <div className="lg:col-start-1 lg:row-start-1">
        <ListingGallery images={listing.images} title={listing.title} />
      </div>

      {/* Sidebar — right, sticky, spans both rows */}
      <aside className="flex flex-col gap-5 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:sticky lg:top-8 lg:self-start">
        {/* Price + title + badge */}
        <div>
          {acceptedOfferAmount != null ? (
            <>
              <p className="text-sm text-zinc-400 line-through">
                Precio original: {formatPrice(listing.price)}
              </p>
              <p className="text-5xl font-black tracking-tight text-[#16A34A]">
                {formatPrice(acceptedOfferAmount)}
              </p>
              <p className="mt-1 text-sm text-green-600">Precio acordado contigo</p>
            </>
          ) : (
            <p className="text-5xl font-black tracking-tight text-zinc-950">
              {formatPrice(listing.price)}
            </p>
          )}
          <h1 className="mt-2 text-lg font-medium leading-snug text-zinc-700">
            {listing.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {listing.condition && (
              <ConditionBadge condition={listing.condition} />
            )}
            <span className="text-xs text-zinc-400">
              {formatRelativeTime(listing.created_at)}
            </span>
          </div>
        </div>

        {/* Seller card */}
        {seller ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-5">
            <Link
              href={`/profile/${encodeURIComponent(seller.username)}`}
              className="group flex items-center gap-3"
            >
              <SellerAvatar username={seller.username} avatarUrl={seller.avatar_url} />
              <div className="min-w-0">
                <p className="truncate font-bold text-zinc-900 group-hover:underline">
                  {seller.username}
                </p>
                {sellerLocation && (
                  <p className="truncate text-sm text-zinc-500">{sellerLocation}</p>
                )}
              </div>
            </Link>

            <hr className="my-4 border-zinc-100" />

            {/* Stats */}
            <div className="space-y-2">
              {sellerStats ? (
                sellerStats.reviewCount > 0 ? (
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <StarRating rating={sellerStats.avgRating} size="sm" />
                    <span className="text-sm font-semibold text-zinc-900">
                      {sellerStats.avgRating.toFixed(1)}
                    </span>
                    <span className="text-sm text-zinc-400">
                      ({sellerStats.reviewCount}{" "}
                      {sellerStats.reviewCount === 1 ? "valoración" : "valoraciones"})
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-400">Sin valoraciones aún</p>
                )
              ) : null}

              {sellerStats && (
                <p className="text-sm text-zinc-500">
                  <span className="font-semibold text-zinc-900">
                    {sellerStats.activeListingsCount}
                  </span>{" "}
                  {sellerStats.activeListingsCount === 1
                    ? "anuncio activo"
                    : "anuncios activos"}
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="mt-4 flex flex-col gap-2">
              <MakeOfferButton
                listingId={listing.id}
                sellerId={listing.seller_id}
                listingPrice={listing.price}
                acceptedOfferAmount={acceptedOfferAmount}
              />
              <ContactSellerButton
                listingId={listing.id}
                sellerId={listing.seller_id}
              />
              <Link
                href={`/profile/${encodeURIComponent(seller.username)}`}
                className="flex w-full items-center justify-center rounded-xl border border-zinc-200 py-3 text-sm font-medium text-zinc-500 transition-colors duration-150 hover:bg-zinc-50 hover:text-zinc-700"
              >
                Ver perfil
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <MakeOfferButton
              listingId={listing.id}
              sellerId={listing.seller_id}
              listingPrice={listing.price}
              acceptedOfferAmount={acceptedOfferAmount}
            />
            <ContactSellerButton
              listingId={listing.id}
              sellerId={listing.seller_id}
            />
          </div>
        )}
      </aside>

      {/* Description + details — left, row 2 */}
      <div className="space-y-8 lg:col-start-1 lg:row-start-2">
        {listing.description && (
          <section>
            <h2 className="mb-3 text-sm font-semibold text-zinc-900">Descripción</h2>
            <p className="whitespace-pre-wrap text-base leading-[1.8] text-zinc-700">
              {listing.description}
            </p>
          </section>
        )}

        {hasSpecs && (
          <section>
            <h2 className="mb-3 text-sm font-semibold text-zinc-900">Detalles</h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-3 rounded-xl bg-[#F9FAFB] px-4 py-4">
              {listing.category && (
                <>
                  <dt className="text-sm text-zinc-500">Categoría</dt>
                  <dd className="text-sm font-medium text-zinc-900">
                    {listing.category}
                  </dd>
                </>
              )}
              {listing.brand && (
                <>
                  <dt className="text-sm text-zinc-500">Marca</dt>
                  <dd className="text-sm font-medium text-zinc-900">
                    {listing.brand}
                  </dd>
                </>
              )}
              {listing.model && (
                <>
                  <dt className="text-sm text-zinc-500">Modelo</dt>
                  <dd className="text-sm font-medium text-zinc-900">
                    {listing.model}
                  </dd>
                </>
              )}
              {listing.location && (
                <>
                  <dt className="text-sm text-zinc-500">Ubicación</dt>
                  <dd className="text-sm font-medium text-zinc-900">
                    {listing.location}
                  </dd>
                </>
              )}
            </dl>
          </section>
        )}
      </div>
    </div>
  );
}
