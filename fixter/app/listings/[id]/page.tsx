import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ListingDetailView } from "@/components/listings/listing-detail-view";
import { SiteHeader } from "@/components/layout/site-header";
import { getListingById } from "@/lib/listings-queries";

const fetchListing = cache(getListingById);

type ListingPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: ListingPageProps): Promise<Metadata> {
  const { id } = await params;
  const listing = await fetchListing(id);

  if (!listing) {
    return { title: "Anuncio no encontrado — Fixter" };
  }

  return {
    title: `${listing.title} — Fixter`,
    description: listing.description.slice(0, 160) || listing.title,
  };
}

export default async function ListingPage({ params }: ListingPageProps) {
  const { id } = await params;
  const listing = await fetchListing(id);

  if (!listing) {
    notFound();
  }

  return (
    <div className="min-h-full bg-zinc-50 font-sans text-zinc-900">
      <SiteHeader />

      <main className="px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/"
            className="mb-6 inline-flex items-center text-sm text-zinc-500 transition hover:text-zinc-900"
          >
            ← Volver al inicio
          </Link>

          <ListingDetailView listing={listing} />

          {/* Especificaciones técnicas */}
          {listing.specs && Object.keys(listing.specs).length > 0 && (
            <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-zinc-900">
                Especificaciones técnicas
              </h2>
              <dl className="mt-4 divide-y divide-zinc-100">
                {Object.entries(listing.specs).map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-4 py-2.5 text-sm">
                    <dt className="text-zinc-500">
                      {key.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())}
                    </dt>
                    <dd className="font-medium text-zinc-900">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
