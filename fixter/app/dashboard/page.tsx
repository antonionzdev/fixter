import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardListingCard } from "@/app/dashboard/dashboard-listing-card";
import { PurchaseCard } from "@/components/dashboard/purchase-card";
import { SiteHeader } from "@/components/layout/site-header";
import { createAuthServerSupabase } from "@/lib/supabase-server-auth";
import type { SellerListing } from "@/lib/types/listing";

export const metadata: Metadata = {
  title: "Mis anuncios — Fixter",
  description: "Gestiona tus anuncios publicados en Fixter",
};

type DashboardPageProps = {
  searchParams: Promise<{ tab?: string }>;
};

type RawPurchaseRow = {
  id: string;
  title: string;
  images: string[] | null;
  seller_id: string;
  seller: { username: string; avatar_url: string | null } | null;
};

type PurchaseItem = {
  id: string;
  title: string;
  image: string | null;
  sellerId: string;
  sellerUsername: string;
  review: { rating: number; comment: string | null } | null;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { tab } = await searchParams;
  const activeTab = tab === "sold" ? "sold" : tab === "purchases" ? "purchases" : "active";

  const supabase = await createAuthServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/dashboard");
  }

  // Parallel: seller listings + purchases as buyer
  const [listingsResult, rawPurchasesResult] = await Promise.all([
    supabase
      .from("listings")
      .select("*")
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("listings")
      .select(
        "id, title, images, seller_id, seller:profiles!seller_id(username, avatar_url)",
      )
      .eq("confirmed_buyer_id", user.id)
      .eq("status", "sold")
      .order("created_at", { ascending: false }),
  ]);

  if (listingsResult.error) {
    console.error("[dashboard] listings", listingsResult.error.message);
  }
  if (rawPurchasesResult.error) {
    console.error("[dashboard] purchases", rawPurchasesResult.error.message);
  }

  const allListings: SellerListing[] = (listingsResult.data ?? []).map((row) => ({
    ...row,
    images: Array.isArray(row.images) ? row.images : [],
  }));

  const rawPurchases = (rawPurchasesResult.data ?? []) as unknown as RawPurchaseRow[];
  const purchaseIds = rawPurchases.map((p) => p.id);

  // Get existing reviews for these purchases (sequential — depends on purchaseIds)
  const reviewsByListing = new Map<string, { rating: number; comment: string | null }>();
  if (purchaseIds.length > 0) {
    const { data: myReviews } = await supabase
      .from("reviews")
      .select("listing_id, rating, comment")
      .eq("reviewer_id", user.id)
      .in("listing_id", purchaseIds);

    for (const r of myReviews ?? []) {
      reviewsByListing.set(r.listing_id, { rating: r.rating, comment: r.comment });
    }
  }

  const purchases: PurchaseItem[] = rawPurchases.map((p) => ({
    id: p.id,
    title: p.title,
    image: Array.isArray(p.images) && p.images.length > 0 ? (p.images[0] ?? null) : null,
    sellerId: p.seller_id,
    sellerUsername: p.seller?.username ?? "Vendedor",
    review: reviewsByListing.get(p.id) ?? null,
  }));

  const activeListings = allListings.filter((l) => l.status === "active");
  const soldListings = allListings.filter((l) => l.status === "sold");
  const visibleListings = activeTab === "sold" ? soldListings : activeListings;

  return (
    <div className="min-h-full bg-zinc-50 font-sans text-zinc-900">
      <SiteHeader />

      <main className="px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
                Mis anuncios
              </h1>
              <p className="mt-1 text-sm text-zinc-500">
                {activeListings.length}{" "}
                {activeListings.length === 1 ? "anuncio activo" : "anuncios activos"}
              </p>
            </div>
            <Link
              href="/publish"
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
            >
              Publicar nuevo anuncio
            </Link>
          </div>

          {/* Tabs */}
          <div className="mt-8 flex gap-1 rounded-xl border border-zinc-200 bg-white p-1">
            <Link
              href="/dashboard?tab=active"
              className={`flex-1 rounded-lg px-4 py-2.5 text-center text-sm font-medium transition ${
                activeTab === "active"
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
              }`}
            >
              Activos ({activeListings.length})
            </Link>
            <Link
              href="/dashboard?tab=sold"
              className={`flex-1 rounded-lg px-4 py-2.5 text-center text-sm font-medium transition ${
                activeTab === "sold"
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
              }`}
            >
              Vendidos ({soldListings.length})
            </Link>
            <Link
              href="/dashboard?tab=purchases"
              className={`flex-1 rounded-lg px-4 py-2.5 text-center text-sm font-medium transition ${
                activeTab === "purchases"
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
              }`}
            >
              Compras ({purchases.length})
            </Link>
          </div>

          {/* Content */}
          {activeTab === "purchases" ? (
            purchases.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
                <p className="text-base font-medium text-zinc-900">
                  Todavía no has comprado ningún artículo en Fixter
                </p>
                <p className="mt-2 text-sm text-zinc-500">
                  Cuando un vendedor confirme tu compra aparecerá aquí.
                </p>
              </div>
            ) : (
              <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
                {purchases.map((p) => (
                  <li key={p.id}>
                    <PurchaseCard
                      listingId={p.id}
                      listingTitle={p.title}
                      listingImage={p.image}
                      sellerId={p.sellerId}
                      sellerUsername={p.sellerUsername}
                      initialReview={p.review}
                    />
                  </li>
                ))}
              </ul>
            )
          ) : allListings.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
              <p className="text-base font-medium text-zinc-900">
                Todavía no has publicado ningún anuncio
              </p>
              <p className="mt-2 text-sm text-zinc-500">
                Publica tu primera pieza y empieza a vender en Fixter.
              </p>
              <Link
                href="/publish"
                className="mt-6 inline-flex rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
              >
                Publicar anuncio
              </Link>
            </div>
          ) : visibleListings.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
              <p className="text-sm text-zinc-500">
                {activeTab === "sold"
                  ? "No tienes anuncios vendidos todavía."
                  : "No tienes anuncios activos. Revisa la pestaña Vendidos."}
              </p>
            </div>
          ) : (
            <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
              {visibleListings.map((listing) => (
                <li key={listing.id}>
                  <DashboardListingCard listing={listing} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
