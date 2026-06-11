"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { useOffers, OFFER_ERROR_MESSAGES } from "@/hooks/useOffers";
import { formatPrice } from "@/lib/format";

type Props = {
  listingId: string;
  sellerId: string;
  listingPrice: number;
  acceptedOfferAmount?: number | null;
};

type AuthState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "is-seller" }
  | { status: "accepted" }
  | { status: "ready"; userId: string };

export function MakeOfferButton({ listingId, sellerId, listingPrice, acceptedOfferAmount }: Props) {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>(() =>
    acceptedOfferAmount != null ? { status: "accepted" } : { status: "loading" },
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [offerAmount, setOfferAmount] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isCreatingConv, setIsCreatingConv] = useState(false);
  const [offerError, setOfferError] = useState<string | null>(null);
  const [dailyUsed, setDailyUsed] = useState(0);
  const [success, setSuccess] = useState(false);
  const [showBuyToast, setShowBuyToast] = useState(false);

  const { sendOffer, getDailyUsed } = useOffers();

  useEffect(() => {
    if (acceptedOfferAmount != null) return;
    const supabase = getSupabase();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        setAuthState({ status: "unauthenticated" });
        return;
      }
      if (user.id === sellerId) {
        setAuthState({ status: "is-seller" });
        return;
      }
      // Query via conversation_id to handle counter-offer role reversal:
      // accepted counter-offers have buyer_id = seller, so buyer_id-only queries miss them.
      const { data: conv } = await supabase
        .from("conversations")
        .select("id")
        .eq("listing_id", listingId)
        .eq("buyer_id", user.id)
        .maybeSingle();
      let accepted = false;
      if (conv) {
        const { data: offer } = await supabase
          .from("offers")
          .select("id")
          .eq("conversation_id", conv.id)
          .eq("status", "accepted")
          .limit(1)
          .maybeSingle();
        accepted = !!offer;
      }
      if (accepted) {
        setAuthState({ status: "accepted" });
      } else {
        setAuthState({ status: "ready", userId: user.id });
      }
    });
  }, [sellerId, listingId, acceptedOfferAmount]);

  async function handleClick() {
    if (authState.status === "unauthenticated") {
      router.push(`/login?redirect=/listings/${listingId}`);
      return;
    }
    if (authState.status !== "ready") return;

    setIsCreatingConv(true);
    setOfferError(null);

    const supabase = getSupabase();
    const { userId } = authState;

    // Find or create conversation
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("buyer_id", userId)
      .eq("listing_id", listingId)
      .maybeSingle();

    let convId: string | null = existing?.id ?? null;

    if (!convId) {
      const { data: created, error } = await supabase
        .from("conversations")
        .insert({ listing_id: listingId, buyer_id: userId, seller_id: sellerId })
        .select("id")
        .single();

      if (error) {
        if (error.code === "23505") {
          const { data: recovered } = await supabase
            .from("conversations")
            .select("id")
            .eq("buyer_id", userId)
            .eq("listing_id", listingId)
            .maybeSingle();
          convId = recovered?.id ?? null;
        }
      } else {
        convId = created?.id ?? null;
      }
    }

    if (!convId) {
      setOfferError("No se pudo iniciar la conversación. Inténtalo de nuevo.");
      setIsCreatingConv(false);
      return;
    }

    setConversationId(convId);
    const used = await getDailyUsed();
    setDailyUsed(used);
    setIsCreatingConv(false);
    setOfferAmount("");
    setModalOpen(true);
  }

  async function handleSend() {
    if (!conversationId || authState.status !== "ready") return;
    const amount = parseFloat(offerAmount.replace(",", "."));
    if (!amount || amount <= 0 || amount > listingPrice) return;

    setIsSending(true);
    setOfferError(null);

    const { error } = await sendOffer(conversationId, listingId, sellerId, amount);

    if (error) {
      setOfferError(OFFER_ERROR_MESSAGES[error]);
      setIsSending(false);
      return;
    }

    setIsSending(false);
    setModalOpen(false);
    setOfferAmount("");
    setSuccess(true);
  }

  if (authState.status === "loading" || authState.status === "is-seller") {
    return null;
  }

  if (authState.status === "accepted") {
    return (
      <>
        <button
          type="button"
          onClick={() => {
            setShowBuyToast(true);
            setTimeout(() => setShowBuyToast(false), 4000);
          }}
          className="flex h-[44px] w-full items-center justify-center rounded-xl bg-[#16A34A] text-sm font-semibold text-white transition-[opacity,transform] duration-200 hover:opacity-90 active:scale-[0.97]"
        >
          Comprar ahora
        </button>
        {showBuyToast && (
          <div className="rounded-lg bg-zinc-900 px-4 py-2.5 text-center text-xs text-white">
            Próximamente — el sistema de pagos estará disponible pronto
          </div>
        )}
      </>
    );
  }

  if (success) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-[#86EFAC] bg-[#F0FFF4] py-3 text-sm font-medium text-green-700">
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 8l4 4 6-7" />
        </svg>
        Oferta enviada
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isCreatingConv}
        className="flex h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-[#FF6B2B] text-sm font-semibold text-white transition-[opacity,transform] duration-200 hover:opacity-90 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isCreatingConv ? "Preparando…" : "Hacer oferta"}
      </button>

      {offerError && !modalOpen && (
        <p className="text-center text-xs text-red-600">{offerError}</p>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <div className="w-full max-w-sm rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl">
            <h2 className="text-base font-bold text-zinc-900">Hacer una oferta</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Precio original:{" "}
              <span className="font-semibold text-zinc-900">{formatPrice(listingPrice)}</span>
            </p>

            <div className="mt-4">
              <label className="block text-sm font-semibold text-zinc-900">Tu oferta (€)</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                max={listingPrice}
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
                placeholder={`Máx. ${formatPrice(listingPrice)}`}
                className="mt-1.5 w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-900"
                autoFocus
              />
            </div>

            {offerError && <p className="mt-2 text-xs text-red-600">{offerError}</p>}

            <p className="mt-2 text-xs text-[#999]">
              Te quedan {10 - dailyUsed} oferta{10 - dailyUsed !== 1 ? "s" : ""} hoy
            </p>

            <button
              type="button"
              disabled={isSending || !offerAmount}
              onClick={handleSend}
              className="mt-4 flex h-[44px] w-full items-center justify-center rounded-lg bg-zinc-950 text-sm font-bold text-white transition-[opacity] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSending ? "Enviando…" : "Enviar oferta"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
