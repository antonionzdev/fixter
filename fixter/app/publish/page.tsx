import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/site-header";
import { PublishForm } from "@/components/listings/publish-form";

export const metadata: Metadata = {
  title: "Publicar anuncio — Fixter",
  description: "Publica piezas y recambios para smartphones en Fixter",
};

export default function PublishPage() {
  return (
    <div className="min-h-full bg-zinc-50 font-sans text-zinc-900">
      <SiteHeader />

      <main className="px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            Publicar anuncio
          </h1>
          <p className="mt-2 text-sm text-zinc-500 sm:text-base">
            Completa los datos de tu pieza o recambio. Los campos con * son
            obligatorios.
          </p>

          <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
            <PublishForm />
          </div>
        </div>
      </main>
    </div>
  );
}
