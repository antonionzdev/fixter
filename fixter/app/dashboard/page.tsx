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

function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
      <svg
        className="h-12 w-12 text-zinc-300"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20 7l-8-4-8 4m16 0v10l-8 4m0-10L4 7m8 10V7m0 10l8-4"
        />
      </svg>
      <p className="mt-4 text-base font-medium text-zinc-900">{title}</p>
      <p className="mt-2 text-sm text-zinc-500">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

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

  const [listingsResult, rawPurchasesResult] = await Promise.all([
    supabase
      .from("listings")
      .select("id, seller_id, title, description, price, category, brand, model, condition, location, images, status, created_at")
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

  const tabClass = (t: string) =>
    `rounded-lg px-5 py-2 text-sm font-medium transition-colors duration-150 ${
      activeTab === t ? "bg-zinc-950 text-white" : "text-zinc-600 hover:text-zinc-900"
    }`;

  return (
    <div className="min-h-full bg-[#F5F5F5] font-sans text-zinc-900">
      <SiteHeader />

      {/* Page header */}
      <div className="border-b border-[#EEEEEE] bg-white shadow-sm">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-[28px] font-bold leading-tight text-zinc-900">
                Mis anuncios
              </h1>
              <p className="mt-1 text-sm text-zinc-500">
                {activeListings.length}{" "}
                {activeListings.length === 1 ? "anuncio activo" : "anuncios activos"}
              </p>
            </div>
            <Link
              href="/publish"
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition-[opacity,transform] duration-200 hover:opacity-90 active:scale-[0.97]"
            >
              Publicar nuevo anuncio
            </Link>
          </div>
        </div>
      </div>

      <main className="px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-6xl">
          {/* Tabs */}
          <div className="inline-flex items-center gap-1 rounded-[10px] bg-white p-1 shadow-sm">
            <Link href="/dashboard?tab=active" className={tabClass("active")}>
              Activos ({activeListings.length})
            </Link>
            <Link href="/dashboard?tab=sold" className={tabClass("sold")}>
              Vendidos ({soldListings.length})
            </Link>
            <Link href="/dashboard?tab=purchases" className={tabClass("purchases")}>
              Compras ({purchases.length})
            </Link>
          </div>

          {/* Content */}
          {activeTab === "purchases" ? (
            purchases.length === 0 ? (
              <EmptyState
                title="Todavía no has comprado ningún artículo"
                description="Cuando un vendedor confirme tu compra aparecerá aquí."
              />
            ) : (
              <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 lg:gap-6">
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
            <EmptyState
              title="Todavía no has publicado ningún anuncio"
              description="Publica tu primera pieza y empieza a vender en Fixter."
              action={
                <Link
                  href="/publish"
                  className="inline-flex rounded-lg bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition-[opacity] hover:opacity-90"
                >
                  Publicar tu primer anuncio
                </Link>
              }
            />
          ) : visibleListings.length === 0 ? (
            <EmptyState
              title={
                activeTab === "sold"
                  ? "No tienes anuncios vendidos todavía"
                  : "No tienes anuncios activos"
              }
              description={
                activeTab === "sold"
                  ? "Los anuncios que marques como vendidos aparecerán aquí."
                  : "Revisa la pestaña Vendidos para ver los que ya cerraste."
              }
            />
          ) : (
            <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 lg:gap-6">
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
