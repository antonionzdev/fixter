"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";

type Buyer = {
  id: string;
  username: string;
  avatar_url: string | null;
};

type MarkAsSoldModalProps = {
  listingId: string;
  listingTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (confirmedBuyerId: string | null, buyerUsername: string | null) => void;
};

export function MarkAsSoldModal({
  listingId,
  listingTitle,
  isOpen,
  onClose,
  onSuccess,
}: MarkAsSoldModalProps) {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loadingBuyers, setLoadingBuyers] = useState(false);
  const [selectedBuyerId, setSelectedBuyerId] = useState<string | "outside" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedBuyerId(null);
    setError(null);
    loadBuyers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, listingId]);

  async function loadBuyers() {
    setLoadingBuyers(true);
    try {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("Tu sesión ha expirado. Vuelve a iniciar sesión."); return; }
      const { data, error: queryError } = await supabase
        .from("conversations")
        .select("buyer_id, buyer:profiles!buyer_id(username, avatar_url)")
        .eq("listing_id", listingId)
        .eq("seller_id", user.id);

      if (queryError) throw queryError;

      type RawRow = {
        buyer_id: string;
        buyer: { username: string; avatar_url: string | null } | null;
      };

      setBuyers(
        ((data ?? []) as unknown as RawRow[]).map((row) => ({
          id: row.buyer_id,
          username: row.buyer?.username ?? "Usuario desconocido",
          avatar_url: row.buyer?.avatar_url ?? null,
        })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar los compradores.");
    } finally {
      setLoadingBuyers(false);
    }
  }

  async function handleConfirm() {
    if (selectedBuyerId === null) {
      setError("Selecciona una opción antes de confirmar.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const supabase = getSupabase();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("Tu sesión ha expirado. Vuelve a iniciar sesión.");
      }

      const confirmedBuyerId = selectedBuyerId === "outside" ? null : selectedBuyerId;
      const selectedBuyer = confirmedBuyerId
        ? buyers.find((b) => b.id === confirmedBuyerId) ?? null
        : null;

      const { data, error: updateError } = await supabase
        .from("listings")
        .update({ status: "sold", confirmed_buyer_id: confirmedBuyerId })
        .eq("id", listingId)
        .eq("seller_id", user.id)
        .select("id")
        .maybeSingle();

      if (updateError) throw updateError;
      if (!data) throw new Error("No se pudo actualizar el anuncio. Comprueba que eres el vendedor.");

      onSuccess(confirmedBuyerId, selectedBuyer?.username ?? null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al confirmar la venta.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative z-10 max-h-[90dvh] w-full overflow-y-auto rounded-t-2xl bg-white sm:max-w-md sm:rounded-2xl">
        <div className="px-5 pb-6 pt-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-zinc-900">Confirmar venta</h2>
              <p className="mt-0.5 truncate text-sm text-zinc-500">{listingTitle}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="shrink-0 rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>

          <p className="mt-4 text-sm text-zinc-600">
            ¿A quién le vendiste este artículo? El comprador confirmado podrá dejar una
            valoración.
          </p>

          {/* Buyer list */}
          <div className="mt-4 space-y-2">
            {loadingBuyers ? (
              <p className="py-6 text-center text-sm text-zinc-500">Cargando compradores…</p>
            ) : buyers.length === 0 ? (
              <p className="py-6 text-center text-sm text-zinc-500">
                Nadie ha contactado por este anuncio todavía.
              </p>
            ) : (
              buyers.map((buyer) => (
                <BuyerOption
                  key={buyer.id}
                  selected={selectedBuyerId === buyer.id}
                  onSelect={() => setSelectedBuyerId(buyer.id)}
                >
                  <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-zinc-200">
                    {buyer.avatar_url ? (
                      <Image
                        src={buyer.avatar_url}
                        alt={buyer.username}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center text-xs font-medium text-zinc-500">
                        {buyer.username[0]?.toUpperCase() ?? "?"}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-zinc-900">{buyer.username}</span>
                </BuyerOption>
              ))
            )}

            {/* Outside Fixter option */}
            <BuyerOption
              selected={selectedBuyerId === "outside"}
              onSelect={() => setSelectedBuyerId("outside")}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100">
                <svg
                  className="h-4 w-4 text-zinc-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-900">Vendido fuera de Fixter</p>
                <p className="text-xs text-zinc-500">No se habilitará la opción de valorar</p>
              </div>
            </BuyerOption>
          </div>

          {error && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          {/* Actions */}
          <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={selectedBuyerId === null || submitting}
              className="flex-1 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
            >
              {submitting ? "Confirmando…" : "Confirmar venta"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 sm:flex-none"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BuyerOption({
  selected,
  onSelect,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
        selected
          ? "border-zinc-900 bg-zinc-50"
          : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
      }`}
    >
      {children}
      <span className="ml-auto shrink-0">
        <span
          className={`block h-4 w-4 rounded-full border-2 transition ${
            selected ? "border-zinc-900 bg-zinc-900" : "border-zinc-300 bg-white"
          }`}
        />
      </span>
    </button>
  );
}
