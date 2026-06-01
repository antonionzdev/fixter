import type { Metadata } from "next";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { createAuthServerSupabase } from "@/lib/supabase-server-auth";
import { getListingById } from "@/lib/listings-queries";
import EditListingForm from "@/components/listings/edit-listing-form";

type EditPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: EditPageProps): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing) return { title: "Anuncio no encontrado — Fixter" };
  return { title: `Editar: ${listing.title} — Fixter` };
}

export default async function EditListingPage({ params }: EditPageProps) {
  const { id } = await params;

  const supabase = await createAuthServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/listings/${id}/edit`);
  }

  const listing = await getListingById(id);

  if (!listing) {
    notFound();
  }

  if (listing.seller_id !== user.id) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-full bg-zinc-50 font-sans text-zinc-900">
      <SiteHeader />

      <main className="px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-2xl">
          <Link
            href={`/listings/${id}`}
            className="mb-6 inline-flex items-center text-sm text-zinc-500 transition hover:text-zinc-900"
          >
            ← Volver al anuncio
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
              Editar anuncio
            </h1>
            <p className="mt-2 text-sm text-zinc-500 sm:text-base">
              Modifica los datos de tu anuncio. Los campos marcados con{" "}
              <span className="text-rose-500">*</span> son obligatorios.
            </p>
          </div>

          <EditListingForm listing={listing} />
        </div>
      </main>
    </div>
  );
}
