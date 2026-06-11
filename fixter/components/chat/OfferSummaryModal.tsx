"use client";

import { useEffect } from "react";
import { formatPrice } from "@/lib/format";
import type { OfferRow } from "@/lib/types/messaging";

type Props = {
  offer: Pick<OfferRow, "amount" | "status" | "counter_amount" | "buyer_id" | "seller_id">;
  currentUserId: string;
  originalPrice: number;
  onClose: () => void;
  onBuyNow: () => void;
};

const STATUS_BADGE: Record<OfferRow["status"], { label: string; className: string }> = {
  pending: { label: "Pendiente", className: "bg-zinc-100 text-zinc-600" },
  accepted: { label: "Aceptada", className: "bg-green-100 text-green-700" },
  rejected: { label: "Rechazada", className: "bg-red-100 text-red-600" },
  countered: { label: "Contraoferta recibida", className: "bg-orange-100 text-orange-700" },
};

export function OfferSummaryModal({ offer, currentUserId, originalPrice, onClose, onBuyNow }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const isBuyer = currentUserId === offer.buyer_id;
  const isSeller = currentUserId === offer.seller_id;
  const badge = STATUS_BADGE[offer.status];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <h2 className="text-base font-bold text-zinc-900">Resumen de oferta</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="space-y-3 px-6 py-5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500">Precio original</span>
            <span className="text-zinc-400">{formatPrice(originalPrice)}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500">
              {isSeller && offer.status === "accepted" ? "Oferta aceptada" : "Tu oferta"}
            </span>
            <span className="font-bold text-zinc-900">{formatPrice(offer.amount)}</span>
          </div>

          <hr className="border-zinc-100" />

          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500">Estado</span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}>
              {badge.label}
            </span>
          </div>

          {offer.counter_amount != null && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">Contraoferta del vendedor</span>
              <span className="font-bold text-[#FF6B2B]">
                {formatPrice(offer.counter_amount)}
              </span>
            </div>
          )}

          {offer.status === "accepted" && isBuyer && (
            <>
              <hr className="border-zinc-100" />
              <p className="text-center text-sm text-green-600">
                El vendedor ha aceptado tu oferta
              </p>
              <button
                type="button"
                onClick={onBuyNow}
                className="flex w-full items-center justify-center rounded-lg bg-[#16A34A] py-3 text-sm font-bold text-white transition-[opacity,transform] duration-200 hover:opacity-90 active:scale-[0.97]"
              >
                Comprar ahora
              </button>
            </>
          )}

          {offer.status === "accepted" && isSeller && (
            <>
              <hr className="border-zinc-100" />
              <p className="text-center text-sm text-zinc-500">Has aceptado esta oferta. El comprador puede completar la compra ahora.</p>
            </>
          )}

          {isSeller && offer.status === "pending" && (
            <p className="text-center text-sm text-zinc-500">Oferta pendiente de tu respuesta</p>
          )}
          {isSeller && offer.status === "rejected" && (
            <p className="text-center text-sm text-zinc-500">Rechazaste esta oferta</p>
          )}
          {isSeller && offer.status === "countered" && (
            <p className="text-center text-sm text-orange-600">Enviaste una contraoferta</p>
          )}
        </div>
      </div>
    </div>
  );
}
