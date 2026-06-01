"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabase";

const RATING_LABELS: Record<number, string> = {
  1: "Muy malo",
  2: "Malo",
  3: "Normal",
  4: "Bueno",
  5: "Excelente",
};

type ReviewFormModalProps = {
  listingId: string;
  reviewedId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (review: { rating: number; comment: string | null }) => void;
};

export function ReviewFormModal({
  listingId,
  reviewedId,
  isOpen,
  onClose,
  onSuccess,
}: ReviewFormModalProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    if (submitting) return;
    setRating(0);
    setHovered(0);
    setComment("");
    setError(null);
    onClose();
  }

  async function handleSubmit() {
    if (rating < 1 || rating > 5) {
      setError("Selecciona una puntuación entre 1 y 5 estrellas.");
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

      const trimmedComment = comment.trim() || null;

      const { error: insertError } = await supabase.from("reviews").insert({
        listing_id: listingId,
        reviewer_id: user.id,
        reviewed_id: reviewedId,
        rating,
        comment: trimmedComment,
      });

      if (insertError) throw insertError;

      onSuccess({ rating, comment: trimmedComment });
      setRating(0);
      setHovered(0);
      setComment("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar la valoración.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  const activeRating = hovered || rating;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />

      <div className="relative z-10 w-full rounded-t-2xl bg-white sm:max-w-md sm:rounded-2xl">
        <div className="px-5 pb-6 pt-5">
          {/* Header */}
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-zinc-900">Valorar compra</h2>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Cerrar"
              className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>

          {/* Stars */}
          <div className="mt-5">
            <p className="text-sm font-medium text-zinc-700">¿Cómo fue tu experiencia?</p>
            <div className="mt-3 flex items-center gap-3">
              <div
                className="flex gap-1"
                onMouseLeave={() => setHovered(0)}
                role="group"
                aria-label="Puntuación"
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHovered(star)}
                    aria-label={`${star} ${star === 1 ? "estrella" : "estrellas"}`}
                    className="transition-transform hover:scale-110 focus:outline-none"
                  >
                    <svg
                      width={36}
                      height={36}
                      viewBox="0 0 24 24"
                      aria-hidden
                    >
                      <polygon
                        points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
                        fill={star <= activeRating ? "#fbbf24" : "#d4d4d8"}
                        className="transition-colors"
                      />
                    </svg>
                  </button>
                ))}
              </div>
              {activeRating > 0 && (
                <span className="text-sm font-medium text-zinc-700">
                  {RATING_LABELS[activeRating]}
                </span>
              )}
            </div>
          </div>

          {/* Comment */}
          <div className="mt-5">
            <label
              htmlFor="review-comment"
              className="text-sm font-medium text-zinc-700"
            >
              Comentario{" "}
              <span className="font-normal text-zinc-400">(opcional)</span>
            </label>
            <textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="Describe tu experiencia con el vendedor…"
              className="mt-2 w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:outline-none"
            />
            <p className="mt-1 text-right text-xs text-zinc-400">
              {comment.length}/1000
            </p>
          </div>

          {error && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={rating === 0 || submitting}
              className="flex-1 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
            >
              {submitting ? "Enviando…" : "Enviar valoración"}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
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
