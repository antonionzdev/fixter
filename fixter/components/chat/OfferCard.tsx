"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice, formatRelativeTime } from "@/lib/format";
import { OfferSummaryModal } from "@/components/chat/OfferSummaryModal";
import type { OfferRow } from "@/lib/types/messaging";

type OfferCardProps = {
  offer: OfferRow;
  currentUserId: string;
  originalPrice: number;
  listingId: string;
  onAccept: (offerId: string) => Promise<void>;
  onReject: (offerId: string) => Promise<void>;
  onCounter: (offerId: string, counterAmount: number) => Promise<void>;
};

export function OfferCard({
  offer,
  currentUserId,
  originalPrice,
  listingId,
  onAccept,
  onReject,
  onCounter,
}: OfferCardProps) {
  const [counterOpen, setCounterOpen] = useState(false);
  const [counterValue, setCounterValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const router = useRouter();

  const isSeller = offer.seller_id === currentUserId;

  async function handleAccept() {
    setIsLoading(true);
    await onAccept(offer.id);
    setIsLoading(false);
  }

  async function handleReject() {
    setIsLoading(true);
    await onReject(offer.id);
    setIsLoading(false);
  }

  async function handleCounter() {
    const amount = parseFloat(counterValue.replace(",", "."));
    if (!amount || amount <= 0) return;
    setIsLoading(true);
    await onCounter(offer.id, amount);
    setIsLoading(false);
    setCounterOpen(false);
    setCounterValue("");
  }

  function handleBuyNow() {
    setSummaryOpen(false);
    router.push(`/checkout/${listingId}`);
  }

  let card: React.ReactNode;

  if (offer.status === "accepted") {
    card = (
      <div className="w-full max-w-[320px] rounded-2xl border border-[#86EFAC] bg-[#F0FFF4] px-5 py-4 text-center">
        <div className="flex justify-center">
          <svg className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 10l4 4 8-8" />
          </svg>
        </div>
        <p className="mt-1 text-sm font-bold text-green-700">Oferta aceptada</p>
        <p className="mt-1 text-2xl font-black text-green-800">{formatPrice(offer.amount)}</p>
        <p className="mt-1 text-[11px] text-green-600">{formatRelativeTime(offer.updated_at)}</p>
      </div>
    );
  } else if (offer.status === "rejected") {
    card = (
      <div className="w-full max-w-[320px] rounded-2xl border border-zinc-200 bg-[#F5F5F5] px-5 py-4 text-center">
        <p className="text-sm font-bold text-zinc-500">Oferta rechazada</p>
        <p className="mt-1 text-2xl font-black text-zinc-400">{formatPrice(offer.amount)}</p>
        <p className="mt-1 text-[11px] text-zinc-400">{formatRelativeTime(offer.updated_at)}</p>
      </div>
    );
  } else if (offer.status === "countered") {
    card = (
      <div className="w-full max-w-[320px] rounded-2xl border border-orange-200 bg-[#FFF5F0] px-5 py-4 text-center">
        <span className="inline-block rounded-full bg-[#FF6B2B]/10 px-2.5 py-0.5 text-xs font-semibold text-[#FF6B2B]">Contraoferta</span>
        <p className="mt-1.5 text-sm text-zinc-600">El vendedor ha propuesto</p>
        <p className="mt-1 text-2xl font-black text-zinc-900">
          {formatPrice(offer.counter_amount ?? offer.amount)}
        </p>
        <p className="mt-1 text-[11px] text-zinc-400">{formatRelativeTime(offer.updated_at)}</p>
      </div>
    );
  } else {
    // PENDING
    card = (
      <div className="w-full max-w-[320px] rounded-2xl border border-[#EEEEEE] bg-white p-5 shadow-sm">
        <div className="flex flex-col items-center">
          <p className="text-sm font-bold text-zinc-900">
            {isSeller ? "Nueva oferta" : "Oferta enviada"}
          </p>
          <p className="mt-2 text-3xl font-black tracking-tight text-zinc-950">
            {formatPrice(offer.amount)}
          </p>
          <p className="mt-0.5 text-[11px] text-[#999]">{formatRelativeTime(offer.created_at)}</p>
        </div>

        {isSeller && !counterOpen && (
          <div className="mt-4 flex flex-col gap-2">
            <div className="flex gap-2">
              <button
                type="button"
                disabled={isLoading}
                onClick={handleAccept}
                className="flex-1 rounded-lg bg-zinc-950 py-2.5 text-sm font-semibold text-white transition-[opacity] hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Aceptar
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={handleReject}
                className="flex-1 rounded-lg border border-zinc-900 py-2.5 text-sm font-semibold text-zinc-900 transition-[background-color] hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Rechazar
              </button>
            </div>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => setCounterOpen(true)}
              className="w-full rounded-lg bg-[#FF6B2B] py-2.5 text-sm font-semibold text-white transition-[opacity] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Contraofertar
            </button>
          </div>
        )}

        {isSeller && counterOpen && (
          <div className="mt-4">
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Tu contraoferta (€)"
              value={counterValue}
              onChange={(e) => setCounterValue(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-900"
              autoFocus
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                disabled={isLoading || !counterValue}
                onClick={handleCounter}
                className="flex-1 rounded-lg bg-[#FF6B2B] py-2.5 text-sm font-semibold text-white transition-[opacity] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isLoading ? "Enviando…" : "Enviar contraoferta"}
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => {
                  setCounterOpen(false);
                  setCounterValue("");
                }}
                className="rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-500 hover:bg-zinc-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {!isSeller && (
          <p className="mt-3 text-center text-xs text-[#999]">
            Esperando respuesta del vendedor…
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      {card}

      <button
        type="button"
        onClick={() => setSummaryOpen(true)}
        className="rounded-lg bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white transition-[opacity] duration-200 hover:opacity-90 active:scale-[0.97]"
      >
        Ver resumen de oferta
      </button>

      {summaryOpen && (
        <OfferSummaryModal
          offer={offer}
          currentUserId={currentUserId}
          originalPrice={originalPrice}
          onClose={() => setSummaryOpen(false)}
          onBuyNow={handleBuyNow}
        />
      )}
    </div>
  );
}
