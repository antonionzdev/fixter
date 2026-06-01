import Image from "next/image";
import Link from "next/link";
import { getSellerDisplayName } from "@/lib/profile-utils";
import type { ListingWithSeller } from "@/lib/types/listing";

type ProductCardProps = {
  listing: ListingWithSeller;
};

export function ProductCard({ listing }: ProductCardProps) {
  const imageUrl = listing.images?.[0];
  const sellerName = getSellerDisplayName(listing.profiles);

  return (
    <Link href={`/listings/${listing.id}`} className="block">
      <article className="group overflow-hidden rounded-xl border border-gray-100 bg-white transition hover:shadow-md">
      <div className="relative aspect-[4/3] bg-[#F5F5F4]">
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
        {listing.condition && (
          <span className="mb-2 inline-block rounded-full bg-[#FFF0E8] px-2 py-0.5 text-xs font-medium text-[#CC4A0A]">
            {listing.condition.replace(/_/g, " ")}
          </span>
        )}
        <h3 className="line-clamp-2 text-sm font-medium text-[#111111]">
          {listing.title}
        </h3>
        <p className="mt-2 text-lg font-bold text-[#111111]">
          {listing.price} €
        </p>
        {listing.location && (
          <p className="mt-1 text-xs text-gray-400">{listing.location}</p>
        )}
        <p className="mt-0.5 truncate text-xs text-gray-400">{sellerName}</p>
      </div>
    </article>
    </Link>
  );
}
