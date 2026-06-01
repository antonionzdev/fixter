"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { getSupabase } from "@/lib/supabase";
import { formatRelativeTime } from "@/lib/format";
import type { MessageRow, ConversationParticipant } from "@/lib/types/messaging";

const SUGGESTED_PHRASES = [
  "¡Hola! ¿Sigue disponible?",
  "¿Negocias el precio?",
  "¿Puedes enviar?",
  "¿Tienes más fotos?",
  "¿Cuál es el estado real?",
];

type ChatViewProps = {
  conversationId: string;
  currentUserId: string;
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
  otherUser,
  listing,
  initialMessages,
}: ChatViewProps) {
  const [messages, setMessages] = useState<MessageRow[]>(initialMessages);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  // Scroll instantáneo al montar (sin animación para no saltar)
  useEffect(() => {
    bottomRef.current?.scrollIntoView();
  }, []);

  // Scroll suave cuando llegan mensajes nuevos
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Suscripción Realtime
  useEffect(() => {
    const supabase = getSupabase();

    const channel = supabase
      .channel(`messages:${conversationId}`)
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
          // Marcar como leído si el remitente no soy yo
          if (payload.new.sender_id !== currentUserId) {
            supabase
              .from("messages")
              .update({ read_at: new Date().toISOString() })
              .eq("id", payload.new.id)
              .then(() => {});
          }
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

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* ── Cabecera del chat ── */}
      <div className="shrink-0 border-b border-zinc-200 bg-white px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          {/* Botón volver — solo visible en móvil (sidebar oculto en chat) */}
          <Link
            href="/messages"
            className="flex shrink-0 items-center gap-1 text-sm text-zinc-500 transition hover:text-zinc-900 md:hidden"
            aria-label="Volver a mensajes"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>

          {/* Avatar del otro usuario */}
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-zinc-200">
            {otherUser.avatar_url ? (
              <Image
                src={otherUser.avatar_url}
                alt={otherUser.username}
                fill
                className="object-cover"
                sizes="32px"
                unoptimized
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-zinc-600">
                {otherUser.username.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-x-1.5 text-sm">
              <span className="font-semibold text-zinc-900">
                @{otherUser.username}
              </span>
              <span className="text-zinc-300">·</span>
              <Link
                href={`/listings/${listing.id}`}
                className="truncate text-zinc-500 transition hover:text-zinc-900 hover:underline"
              >
                {listing.title}
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* ── Zona de mensajes ── */}
      <div className="flex-1 overflow-y-auto bg-zinc-50 px-4 py-4 sm:px-5">
        {messages.length === 0 ? (
          <p className="py-12 text-center text-sm text-zinc-400">
            Aún no hay mensajes. ¡Empieza la conversación!
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {messages.map((msg) => {
              const isOwn = msg.sender_id === currentUserId;
              return (
                <li
                  key={msg.id}
                  className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
                >
                  {/* Avatar del otro (solo mensajes ajenos) */}
                  {!isOwn && (
                    <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-zinc-200">
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
                        <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-zinc-600">
                          {otherUser.username.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                  )}

                  <div
                    className={`flex max-w-[75%] flex-col gap-1 ${isOwn ? "items-end" : "items-start"}`}
                  >
                    {/* Burbuja */}
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        isOwn
                          ? "rounded-br-sm bg-zinc-900 text-white"
                          : "rounded-bl-sm border border-zinc-200 bg-white text-zinc-900"
                      }`}
                    >
                      {msg.offer_amount !== null && (
                        <p
                          className={`mb-1 text-xs font-semibold uppercase tracking-wide ${
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

                    {/* Timestamp */}
                    <time dateTime={msg.created_at} className="px-1 text-xs text-zinc-400">
                      {formatRelativeTime(msg.created_at)}
                    </time>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input de envío ── */}
      <div className="shrink-0 border-t border-zinc-200 bg-white px-4 py-3 sm:px-5">
        {/* Frases sugeridas — solo cuando no hay mensajes */}
        {messages.length === 0 && (
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
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Escribe un mensaje..."
            maxLength={4000}
            disabled={isSending}
            className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-zinc-300 focus:bg-white focus:ring-2 focus:ring-zinc-900/10 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isSending || !inputText.trim()}
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSending ? (
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                />
              </svg>
            ) : (
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            )}
            <span className="hidden sm:inline">Enviar</span>
          </button>
        </form>
      </div>
    </div>
  );
}
