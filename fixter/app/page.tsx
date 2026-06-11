import Link from "next/link";
import { Suspense } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import SearchFilters from "@/components/listings/search-filters";
import { LoadMoreButton } from "@/components/listings/load-more-button";
import { RecentlyViewedSection } from "@/components/listings/recently-viewed-section";
import { getLatestListings } from "@/lib/listings-queries";
import type { ListingFilters } from "@/lib/types/listing";

interface HomeProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function getString(v: string | string[] | undefined): string {
  return typeof v === "string" ? v : "";
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;

  const specsEntries: Record<string, string> = {};
  Object.entries(params).forEach(([key, val]) => {
    if (key.startsWith("specs_") && typeof val === "string" && val) {
      specsEntries[key.slice("specs_".length)] = val;
    }
  });

  const filters: ListingFilters = {
    search:    getString(params.search)    || undefined,
    category:  getString(params.category)  || undefined,
    model:     getString(params.model)     || undefined,
    condition: getString(params.condition) || undefined,
    price_min: params.price_min ? Number(params.price_min) : undefined,
    price_max: params.price_max ? Number(params.price_max) : undefined,
    specs:     Object.keys(specsEntries).length ? specsEntries : undefined,
  };

  const hasActiveFilters = Object.values(filters).some((v) =>
    v !== undefined && (typeof v !== "object" || Object.keys(v).length > 0),
  );

  const { listings, nextCursor } = await getLatestListings(24, filters);

  return (
    <div className="min-h-full bg-white font-sans text-gray-600">
      <SiteHeader />

      <main>
        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <section className="border-b border-gray-100 bg-white px-4 py-12 sm:px-6 sm:py-16 md:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-3xl font-bold tracking-tight text-[#111111] sm:text-4xl md:text-5xl">
              Compra y vende piezas de móvil
            </h1>
            <p className="mt-3 text-base text-gray-600 sm:mt-4 sm:text-lg">
              El marketplace especializado en reparación de smartphones
            </p>
          </div>
        </section>

        {/* ── Listings ──────────────────────────────────────────────────── */}
        <section className="px-4 py-10 sm:px-6 sm:py-12">
          <div className="mx-auto max-w-7xl">

            {/* Vistos recientemente — spanning full width */}
            <RecentlyViewedSection />

            {/* Layout: sidebar en desktop, apilado en móvil */}
            <div className="flex gap-8 lg:gap-10">

              {/* ── Sidebar filtros — solo desktop ─────────────────────── */}
              <aside className="hidden w-52 shrink-0 lg:block xl:w-56">
                <div className="sticky top-20 max-h-[calc(100dvh-5.5rem)] overflow-y-auto pr-1">
                  <p className="mb-3 text-sm font-semibold text-[var(--color-gray-900)]">Filtros</p>
                  <Suspense fallback={null}>
                    <SearchFilters initialFilters={filters} />
                  </Suspense>
                </div>
              </aside>

              {/* ── Contenido principal ────────────────────────────────── */}
              <div className="min-w-0 flex-1">
                <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-xl font-semibold tracking-tight text-[#111111]">
                    {hasActiveFilters ? "Resultados" : "Últimos anuncios"}
                  </h2>
                </div>

                {/* Filtros móvil (drawer) — ocultos en desktop */}
                <div className="mb-4 lg:hidden">
                  <Suspense fallback={null}>
                    <SearchFilters initialFilters={filters} />
                  </Suspense>
                </div>

                {listings.length === 0 ? (
                  <p className="mt-4 rounded-xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500">
                    {hasActiveFilters ? (
                      <>No hay anuncios que coincidan con tu búsqueda.</>
                    ) : (
                      <>
                        Aún no hay anuncios publicados.{" "}
                        <Link
                          href="/publish"
                          className="font-medium text-[#111111] underline-offset-2 hover:underline"
                        >
                          Sé el primero en publicar
                        </Link>
                      </>
                    )}
                  </p>
                ) : (
                  <LoadMoreButton
                    key={JSON.stringify(filters)}
                    initialListings={listings}
                    initialCursor={nextCursor}
                    filters={filters}
                  />
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
