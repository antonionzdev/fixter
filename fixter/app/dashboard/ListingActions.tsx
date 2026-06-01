"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MarkAsSoldModal } from "@/components/dashboard/mark-as-sold-modal";
import { getSupabase } from "@/lib/supabase";

type ListingActionsProps = {
  listingId: string;
  listingTitle: string;
  status: string;
};

const actionClass =
  "w-full rounded-lg px-3 py-2 text-center text-xs font-medium transition sm:text-sm";

function formatListingError(message: string): string {
  if (message.toLowerCase().includes("row-level security")) {
    return `${message}\n\nEjecuta fixter/supabase/fix-listings-update-rls.sql en el SQL Editor de Supabase.`;
  }
  return message;
}

export function ListingActions({ listingId, listingTitle, status }: ListingActionsProps) {
  const router = useRouter();
  const [soldModalOpen, setSoldModalOpen] = useState(false);
  const [pending, setPending] = useState<"delete" | null>(null);

  async function getAuthenticatedUser() {
    const supabase = getSupabase();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      throw new Error("Tu sesión ha expirado. Vuelve a iniciar sesión.");
    }

    return { supabase, user };
  }

  async function handleDelete() {
    if (!confirm("¿Eliminar este anuncio? Esta acción no se puede deshacer.")) {
      return;
    }

    setPending("delete");
    try {
      const { supabase, user } = await getAuthenticatedUser();

      const { data, error } = await supabase
        .from("listings")
        .delete()
        .eq("id", listingId)
        .eq("seller_id", user.id)
        .select("id")
        .maybeSingle();

      if (error) {
        window.alert(formatListingError(error.message));
        return;
      }

      if (!data) {
        window.alert("No se pudo eliminar el anuncio. Comprueba que eres el vendedor.");
        return;
      }

      router.refresh();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Error al eliminar el anuncio.");
    } finally {
      setPending(null);
    }
  }

  const isBusy = pending !== null;

  return (
    <>
      <div className="flex flex-col gap-2">
        <Link
          href={`/listings/${listingId}/edit`}
          className={`${actionClass} border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50`}
        >
          Editar
        </Link>

        {status === "active" && (
          <button
            type="button"
            onClick={() => setSoldModalOpen(true)}
            disabled={isBusy}
            className={`${actionClass} border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60`}
          >
            Marcar como vendido
          </button>
        )}

        <button
          type="button"
          onClick={handleDelete}
          disabled={isBusy}
          className={`${actionClass} border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {pending === "delete" ? "Eliminando…" : "Eliminar"}
        </button>
      </div>

      <MarkAsSoldModal
        listingId={listingId}
        listingTitle={listingTitle}
        isOpen={soldModalOpen}
        onClose={() => setSoldModalOpen(false)}
        onSuccess={() => router.refresh()}
      />
    </>
  );
}
