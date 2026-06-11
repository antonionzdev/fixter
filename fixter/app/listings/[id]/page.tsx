import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ListingDetailView } from "@/components/listings/listing-detail-view";
import { SiteHeader } from "@/components/layout/site-header";
import { getListingById } from "@/lib/listings-queries";
import { getReviewSummary } from "@/lib/profile-queries";
import { createServerSupabase } from "@/lib/supabase-server";
import { createAuthServerSupabase } from "@/lib/supabase-server-auth";

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

  const authSupabase = await createAuthServerSupabase();
  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  const supabase = createServerSupabase();
  const [reviewSummary, { count: activeCount }] = await Promise.all([
    getReviewSummary(listing.seller_id),
    supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("seller_id", listing.seller_id)
      .eq("status", "active"),
  ]);

  // Only buyers need the accepted-offer price. Skip for the listing's own seller.
  let acceptedOfferAmount: number | null = null;
  if (user && user.id !== listing.seller_id) {
    // Find the conversation where this user is the original buyer.
    // conversations.buyer_id is NEVER inverted (unlike offers.buyer_id which swaps
    // on counter-offers), so this reliably identifies the buyer regardless of
    // how many counter-offer rounds happened.
    const { data: conv } = await authSupabase
      .from("conversations")
      .select("id")
      .eq("listing_id", listing.id)
      .eq("buyer_id", user.id)
      .maybeSingle();

    if (conv) {
      // Fetch any accepted offer in that conversation.
      // Using conversation_id handles role reversal: when a seller counters,
      // the new offer row has buyer_id = seller and seller_id = buyer,
      // so buyer_id-only queries miss accepted counter-offers.
      const { data: offerData } = await authSupabase
        .from("offers")
        .select("amount")
        .eq("conversation_id", conv.id)
        .eq("status", "accepted")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      acceptedOfferAmount = offerData?.amount ?? null;
    }
  }

  const sellerStats = {
    avgRating: reviewSummary.avg,
    reviewCount: reviewSummary.count,
    activeListingsCount: activeCount ?? 0,
  };

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

          <ListingDetailView listing={listing} sellerStats={sellerStats} acceptedOfferAmount={acceptedOfferAmount} />

          {/* Especificaciones técnicas */}
          {listing.specs && Object.keys(listing.specs).length > 0 && (
            <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-zinc-900">
                Especificaciones técnicas
              </h2>
              <dl className="mt-4 divide-y divide-zinc-100">
                {Object.entries(listing.specs).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between gap-4 py-2.5 text-sm"
                  >
                    <dt className="capitalize text-zinc-500">
                      {key.replace(/_/g, " ")}
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
