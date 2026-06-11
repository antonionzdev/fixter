"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MarkAsSoldModal } from "@/components/dashboard/mark-as-sold-modal";
import { ReviewFormModal } from "@/components/dashboard/review-form-modal";
import { getSupabase } from "@/lib/supabase";

type ListingActionsProps = {
  listingId: string;
  listingTitle: string;
  status: string;
};


export function ListingActions({ listingId, listingTitle, status }: ListingActionsProps) {
  const router = useRouter();
  const [soldModalOpen, setSoldModalOpen] = useState(false);
  const [pending, setPending] = useState<"delete" | null>(null);
  const [sellerReviewOpen, setSellerReviewOpen] = useState(false);
  const [confirmedBuyer, setConfirmedBuyer] = useState<{
    id: string;
    username: string;
  } | null>(null);

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
        window.alert("No se pudo eliminar el anuncio. Inténtalo de nuevo.");
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
        <div className="flex gap-2">
          <Link
            href={`/listings/${listingId}/edit`}
            className="flex-1 rounded-[6px] border border-zinc-900 px-3 py-2 text-center text-[13px] font-medium text-zinc-900 transition-colors hover:bg-zinc-50"
          >
            Editar
          </Link>
          {status === "active" && (
            <button
              type="button"
              onClick={() => setSoldModalOpen(true)}
              disabled={isBusy}
              className="flex-1 rounded-[6px] bg-zinc-950 px-3 py-2 text-center text-[13px] font-medium text-white transition-[opacity] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Marcar como vendido
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleDelete}
          disabled={isBusy}
          className="w-full rounded-[6px] px-3 py-2 text-center text-[13px] font-medium text-[#EF4444] transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending === "delete" ? "Eliminando…" : "Eliminar"}
        </button>
      </div>

      <MarkAsSoldModal
        listingId={listingId}
        listingTitle={listingTitle}
        isOpen={soldModalOpen}
        onClose={() => setSoldModalOpen(false)}
        onSuccess={(buyerId, buyerUsername) => {
          router.refresh();
          if (buyerId && buyerUsername) {
            setConfirmedBuyer({ id: buyerId, username: buyerUsername });
            setSellerReviewOpen(true);
          }
        }}
      />

      {sellerReviewOpen && confirmedBuyer && (
        <ReviewFormModal
          listingId={listingId}
          reviewedId={confirmedBuyer.id}
          reviewedUsername={confirmedBuyer.username}
          subtitle="Cuéntanos cómo fue la experiencia con este comprador"
          commentPlaceholder="¿Fue puntual? ¿Se comunicó bien? ¿Recomendarías vender a esta persona?"
          skippable
          isOpen={sellerReviewOpen}
          onClose={() => setSellerReviewOpen(false)}
          onSuccess={() => setSellerReviewOpen(false)}
        />
      )}
    </>
  );
}
