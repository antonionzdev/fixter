import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { ProductCard } from "@/components/listings/product-card";
import { getLatestListings } from "@/lib/listings-queries";

export default async function Home() {
  const listings = await getLatestListings();

  return (
    <div className="min-h-full bg-zinc-50 font-sans text-zinc-900">
      <SiteHeader />

      <main>
        <section className="border-b border-zinc-200 bg-white px-4 py-12 sm:px-6 sm:py-16 md:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl md:text-5xl">
              Compra y vende piezas de móvil
            </h1>
            <p className="mt-3 text-base text-zinc-500 sm:mt-4 sm:text-lg">
              El marketplace especializado en reparación de smartphones
            </p>
            <div className="mt-8 sm:mt-10" role="search">
              <label htmlFor="search" className="sr-only">
                Buscar piezas
              </label>
              <input
                id="search"
                type="search"
                name="q"
                placeholder="Busca piezas, modelos, marcas..."
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-base text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-900/10 sm:py-3.5"
              />
            </div>
          </div>
        </section>

        <section className="px-4 py-10 sm:px-6 sm:py-12">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-lg font-semibold tracking-tight text-zinc-900 sm:text-xl">
              Últimos anuncios
            </h2>

            {listings.length === 0 ? (
              <p className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center text-sm text-zinc-500">
                Aún no hay anuncios publicados.{" "}
                <Link
                  href="/publish"
                  className="font-medium text-zinc-900 underline-offset-2 hover:underline"
                >
                  Sé el primero en publicar
                </Link>
              </p>
            ) : (
              <ul className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-5 lg:gap-6">
                {listings.map((listing) => (
                  <li key={listing.id}>
                    <ProductCard listing={listing} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
