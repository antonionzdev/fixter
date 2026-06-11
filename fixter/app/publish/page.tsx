import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createAuthServerSupabase } from "@/lib/supabase-server-auth";
import PublishForm from "@/components/listings/publish-form";

export const metadata: Metadata = {
  title: "Publicar anuncio — Fixter",
  description:
    "Publica piezas y recambios para iPhone en Fixter. Llega a compradores especializados en reparación de móviles.",
};

export default async function PublishPage() {
  const supabase = await createAuthServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-[#F5F5F5] px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            Publicar anuncio
          </h1>
          <p className="mt-2 text-sm text-zinc-500 sm:text-base">
            Completa los datos de tu pieza o recambio. Los campos marcados con{" "}
            <span className="text-[#FF6B2B]">*</span> son obligatorios.
          </p>
        </div>

        <PublishForm />
      </div>
    </main>
  );
}
