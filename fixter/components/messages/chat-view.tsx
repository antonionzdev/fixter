"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { getSupabase } from "@/lib/supabase";
import { formatRelativeTime, formatPrice } from "@/lib/format";
import { useOffers, OFFER_ERROR_MESSAGES } from "@/hooks/useOffers";
import { OfferCard } from "@/components/chat/OfferCard";
import type { MessageRow, OfferRow, ConversationParticipant } from "@/lib/types/messaging";

const SUGGESTED_PHRASES = [
  "¡Hola! ¿Sigue disponible?",
  "¿Negocias el precio?",
  "¿Puedes enviar?",
  "¿Tienes más fotos?",
  "¿Cuál es el estado real?",
];

function SendArrowIcon() {
  return (
    <svg
      className="h-4 w-4 translate-x-px"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
      />
    </svg>
  );
}

type ChatItem =
  | { type: "message"; data: MessageRow }
  | { type: "offer"; data: OfferRow };

type ChatViewProps = {
  conversationId: string;
  currentUserId: string;
  isBuyer: boolean;
  otherUser: ConversationParticipant;
  listing: {
    id: string;
    title: string;
    first_image: string | null;
    price: number;
  };
  initialMessages: MessageRow[];
};

export function ChatView({
  conversationId,
  currentUserId,
  isBuyer,
  otherUser,
  listing,
  initialMessages,
}: ChatViewProps) {
  const [messages, setMessages] = useState<MessageRow[]>(initialMessages);
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // Offer modal state
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerError, setOfferError] = useState<string | null>(null);
  const [isSendingOffer, setIsSendingOffer] = useState(false);
  const [dailyOfferUsed, setDailyOfferUsed] = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);
  const offerActions = useOffers();
  const otherInitial = otherUser.username.charAt(0).toUpperCase();

  // Accepted offer for the current buyer (used in header price + passed to OfferCard)
  const acceptedOffer = useMemo(() => {
    if (!isBuyer) return null;
    return offers.find((o) => o.status === "accepted" && o.buyer_id === currentUserId) ?? null;
  }, [offers, isBuyer, currentUserId]);

  // Merged and sorted list of messages + offers
  const chatItems = useMemo((): ChatItem[] => {
    const items: ChatItem[] = [
      ...messages.map((m): ChatItem => ({ type: "message", data: m })),
      ...offers.map((o): ChatItem => ({ type: "offer", data: o })),
    ];
    return items.sort(
      (a, b) => new Date(a.data.created_at).getTime() - new Date(b.data.created_at).getTime(),
    );
  }, [messages, offers]);

  // Scroll instantáneo al montar
  useEffect(() => {
    bottomRef.current?.scrollIntoView();
  }, []);

  // Scroll suave cuando llegan mensajes u ofertas nuevas
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatItems]);

  // Cargar ofertas existentes
  useEffect(() => {
    const supabase = getSupabase();
    supabase
      .from("offers")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setOffers(data as OfferRow[]);
      });
  }, [conversationId]);

  // Realtime — mensajes INSERT/UPDATE + ofertas INSERT/UPDATE
  useEffect(() => {
    const supabase = getSupabase();

    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on<MessageRow>(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
          if (payload.new.sender_id !== currentUserId) {
            supabase
              .from("messages")
              .update({ read_at: new Date().toISOString() })
              .eq("id", payload.new.id)
              .then(() => {});
          }
        },
      )
      .on<MessageRow>(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === payload.new.id ? { ...m, ...payload.new } : m)),
          );
        },
      )
      .on<OfferRow>(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "offers",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setOffers((prev) => [...prev, payload.new]);
        },
      )
      .on<OfferRow>(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "offers",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setOffers((prev) =>
            prev.map((o) => (o.id === payload.new.id ? { ...o, ...payload.new } : o)),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId]);

  const handleSend = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const body = inputText.trim();
      if (!body || isSending) return;

      setSendError(null);
      setIsSending(true);
      setInputText("");

      const supabase = getSupabase();
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        body,
      });

      if (error) {
        setSendError("No se pudo enviar el mensaje. Inténtalo de nuevo.");
        setInputText(body);
      }

      setIsSending(false);
    },
    [inputText, isSending, conversationId, currentUserId],
  );

  async function handleOpenOfferModal() {
    const used = await offerActions.getDailyUsed();
    setDailyOfferUsed(used);
    setOfferAmount("");
    setOfferError(null);
    setOfferModalOpen(true);
  }

  async function handleSendOffer() {
    const amount = parseFloat(offerAmount.replace(",", "."));
    if (!amount || amount <= 0 || amount > listing.price) return;

    setIsSendingOffer(true);
    setOfferError(null);

    const { error } = await offerActions.sendOffer(
      conversationId,
      listing.id,
      otherUser.id, // otherUser is always seller when isBuyer=true
      amount,
    );

    if (error) {
      setOfferError(OFFER_ERROR_MESSAGES[error]);
      setIsSendingOffer(false);
      return;
    }

    setIsSendingOffer(false);
    setOfferModalOpen(false);
    setOfferAmount("");
  }

  async function handleAcceptOffer(offerId: string) {
    const { error } = await offerActions.acceptOffer(offerId);
    if (error) setSendError(OFFER_ERROR_MESSAGES[error]);
  }

  async function handleRejectOffer(offerId: string) {
    const { error } = await offerActions.rejectOffer(offerId);
    if (error) setSendError(OFFER_ERROR_MESSAGES[error]);
  }

  async function handleCounterOffer(offerId: string, counterAmount: number) {
    const originalOffer = offers.find((o) => o.id === offerId);
    if (!originalOffer) return;
    const { error } = await offerActions.counterOffer(offerId, counterAmount, originalOffer);
    if (error) setSendError(OFFER_ERROR_MESSAGES[error]);
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* ── Cabecera del chat ── */}
      <div className="shrink-0 border-b border-[#EEEEEE] bg-white px-4" style={{ height: "72px" }}>
        <div className="flex h-full items-center gap-3">
          {/* Back arrow — mobile only */}
          <Link
            href="/messages"
            className="flex shrink-0 items-center text-zinc-500 transition hover:text-zinc-900 md:hidden"
            aria-label="Volver a mensajes"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>

          {/* LEFT ZONE — seller profile */}
          <div className="flex items-center gap-[10px]">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#FF6B2B]">
              {otherUser.avatar_url ? (
                <Image
                  src={otherUser.avatar_url}
                  alt={otherUser.username}
                  fill
                  className="object-cover"
                  sizes="40px"
                  unoptimized
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-sm font-bold text-white">
                  {otherInitial}
                </span>
              )}
            </div>
            <div>
              <p className="text-[14px] font-semibold text-zinc-900">@{otherUser.username}</p>
              {otherUser.location && (
                <p className="hidden text-[12px] text-zinc-400 sm:block">{otherUser.location}</p>
              )}
            </div>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* RIGHT ZONE — listing */}
          <div className="flex items-center gap-3">
            {/* Title + price — hidden on mobile */}
            <div className="hidden flex-col items-end sm:flex" style={{ maxWidth: "180px" }}>
              <p className="w-full truncate text-right text-[13px] font-semibold text-zinc-900">
                {listing.title}
              </p>
              {acceptedOffer ? (
                <>
                  <p className="text-[10px] text-green-600">Tu precio</p>
                  <p className="text-[15px] font-bold text-[#16A34A]">
                    {formatPrice(acceptedOffer.amount)}
                  </p>
                </>
              ) : (
                <p className="text-[15px] font-bold text-zinc-900">
                  {formatPrice(listing.price)}
                </p>
              )}
            </div>

            {/* Listing image */}
            <Link href={`/listings/${listing.id}`} className="shrink-0">
              {listing.first_image ? (
                <div className="relative h-14 w-14 overflow-hidden rounded-lg border border-[#EEEEEE]">
                  <Image
                    src={listing.first_image}
                    fill
                    className="object-cover"
                    alt={listing.title}
                    sizes="56px"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-[#EEEEEE] bg-zinc-50">
                  <svg className="h-5 w-5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 7l-8-4-8 4m16 0v10l-8 4m0-10L4 7m8 10V7" />
                  </svg>
                </div>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* ── Zona de mensajes ── */}
      <div className="flex-1 overflow-y-auto bg-[#F7F7F7] px-4 py-4 sm:px-5">
        {chatItems.length === 0 ? (
          <p className="py-12 text-center text-sm text-[#999]">
            Aún no hay mensajes. ¡Empieza la conversación!
          </p>
        ) : (
          <ul className="flex flex-col">
            {chatItems.map((item, index) => {
              const prev = chatItems[index - 1];
              const next = chatItems[index + 1];

              if (item.type === "offer") {
                const topSpacing = index === 0 ? "" : "mt-3";
                return (
                  <li key={item.data.id} className={`flex justify-center ${topSpacing}`}>
                    <OfferCard
                      offer={item.data}
                      currentUserId={currentUserId}
                      originalPrice={listing.price}
                      listingId={listing.id}
                      onAccept={handleAcceptOffer}
                      onReject={handleRejectOffer}
                      onCounter={handleCounterOffer}
                    />
                  </li>
                );
              }

              // Message item
              const msg = item.data;
              const isOwn = msg.sender_id === currentUserId;
              const prevIsDifferentSender =
                !prev ||
                prev.type === "offer" ||
                (prev.type === "message" && prev.data.sender_id !== msg.sender_id);
              const startsNewGroup = prevIsDifferentSender;
              const showAvatar =
                !isOwn &&
                (!next ||
                  next.type === "offer" ||
                  (next.type === "message" && next.data.sender_id !== msg.sender_id));
              const topSpacing = index === 0 ? "" : startsNewGroup ? "mt-3" : "mt-1";

              return (
                <li
                  key={msg.id}
                  className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"} ${topSpacing}`}
                >
                  {!isOwn && (
                    <div className="h-7 w-7 shrink-0">
                      {showAvatar && (
                        <div className="relative h-7 w-7 overflow-hidden rounded-full bg-[#FF6B2B]">
                          {otherUser.avatar_url ? (
                            <Image
                              src={otherUser.avatar_url}
                              alt={otherUser.username}
                              fill
                              className="object-cover"
                              sizes="28px"
                              unoptimized
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-xs font-bold text-white">
                              {otherInitial}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div
                    className={`flex max-w-[65%] flex-col ${isOwn ? "items-end" : "items-start"}`}
                  >
                    <div
                      style={{
                        borderRadius: isOwn ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                      }}
                      className={`px-[14px] py-[10px] text-sm leading-relaxed ${
                        isOwn
                          ? "bg-[#111111] text-white"
                          : "border border-[#EEEEEE] bg-white text-zinc-900"
                      }`}
                    >
                      {msg.offer_amount !== null && (
                        <p
                          className={`mb-1 text-xs font-semibold ${
                            isOwn ? "text-zinc-400" : "text-zinc-500"
                          }`}
                        >
                          Oferta:{" "}
                          {msg.offer_amount.toLocaleString("es-ES", {
                            style: "currency",
                            currency: "EUR",
                          })}
                        </p>
                      )}
                      <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                    </div>

                    <div
                      className={`mt-0.5 flex items-center gap-1 ${
                        isOwn ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      <time dateTime={msg.created_at} className="px-0.5 text-[11px] text-[#999]">
                        {formatRelativeTime(msg.created_at)}
                      </time>
                      {isOwn && (
                        <span
                          className={`inline-flex items-center leading-none ${
                            msg.read_at ? "text-[#FF6B2B]" : "text-[#999]"
                          }`}
                          aria-label={msg.read_at ? "Leído" : "Enviado"}
                        >
                          {msg.read_at ? (
                            <svg className="h-3.5 w-3.5" viewBox="0 0 20 12" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M1 6l4 4 7-8" />
                              <path d="M7 6l4 4 7-8" />
                            </svg>
                          ) : (
                            <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M1 6l4 4 6-8" />
                            </svg>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input de envío ── */}
      <div className="shrink-0 border-t border-[#EEEEEE] bg-white px-4 py-3 sm:px-5">
        {chatItems.length === 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {SUGGESTED_PHRASES.map((phrase) => (
              <button
                key={phrase}
                type="button"
                onClick={() => setInputText(phrase)}
                className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100"
              >
                {phrase}
              </button>
            ))}
          </div>
        )}

        {sendError && <p className="mb-2 text-xs text-red-600">{sendError}</p>}

        <form onSubmit={handleSend} className="flex items-center gap-2">
          {/* Botón "Hacer oferta" — solo visible para el comprador */}
          {isBuyer && (
            <button
              type="button"
              onClick={handleOpenOfferModal}
              aria-label="Hacer oferta"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-200 text-[#FF6B2B] transition-colors hover:bg-zinc-50"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
            </button>
          )}

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Escribe un mensaje..."
            maxLength={4000}
            disabled={isSending}
            className="min-w-0 flex-1 rounded-[24px] border border-zinc-200 bg-zinc-50 px-5 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition-colors duration-150 focus:border-zinc-900 focus:bg-white disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isSending || !inputText.trim()}
            aria-label="Enviar"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-white transition-[background-color] duration-150 hover:bg-[#333] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSending ? <SpinnerIcon /> : <SendArrowIcon />}
          </button>
        </form>
      </div>

      {/* ── Modal de oferta ── */}
      {offerModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOfferModalOpen(false);
          }}
        >
          <div className="w-full max-w-sm rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl">
            <h2 className="text-base font-bold text-zinc-900">Hacer una oferta</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Precio original:{" "}
              <span className="font-semibold text-zinc-900">{formatPrice(listing.price)}</span>
            </p>

            <div className="mt-4">
              <label className="block text-sm font-semibold text-zinc-900">Tu oferta (€)</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                max={listing.price}
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
                placeholder={`Máx. ${formatPrice(listing.price)}`}
                className="mt-1.5 w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-900"
                autoFocus
              />
            </div>

            {offerError && <p className="mt-2 text-xs text-red-600">{offerError}</p>}

            <p className="mt-2 text-xs text-[#999]">
              Te quedan {10 - dailyOfferUsed} oferta
              {10 - dailyOfferUsed !== 1 ? "s" : ""} hoy
            </p>

            <button
              type="button"
              disabled={isSendingOffer || !offerAmount}
              onClick={handleSendOffer}
              className="mt-4 flex h-[44px] w-full items-center justify-center rounded-lg bg-zinc-950 text-sm font-bold text-white transition-[opacity] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSendingOffer ? "Enviando…" : "Enviar oferta"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
