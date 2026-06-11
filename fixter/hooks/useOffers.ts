"use client";

import { getSupabase } from "@/lib/supabase";
import type { OfferRow } from "@/lib/types/messaging";

export type OfferError = "DAILY_LIMIT_REACHED" | "ACTIVE_OFFER_EXISTS" | "UNKNOWN";

export const OFFER_ERROR_MESSAGES: Record<OfferError, string> = {
  DAILY_LIMIT_REACHED: "Has alcanzado el límite de 10 ofertas diarias",
  ACTIVE_OFFER_EXISTS: "Ya tienes una oferta pendiente en este chat",
  UNKNOWN: "No se pudo procesar la oferta. Inténtalo de nuevo.",
};

function parseError(error: { message?: string } | null): OfferError {
  const msg = error?.message ?? "";
  if (msg.includes("DAILY_LIMIT_REACHED")) return "DAILY_LIMIT_REACHED";
  if (msg.includes("ACTIVE_OFFER_EXISTS")) return "ACTIVE_OFFER_EXISTS";
  return "UNKNOWN";
}

export function useOffers() {
  const supabase = getSupabase();

  async function sendOffer(
    conversationId: string,
    listingId: string,
    sellerId: string,
    amount: number,
  ): Promise<{ error: OfferError | null }> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "UNKNOWN" };

    const { error } = await supabase.from("offers").insert({
      conversation_id: conversationId,
      listing_id: listingId,
      buyer_id: user.id,
      seller_id: sellerId,
      amount,
    });

    return { error: error ? parseError(error) : null };
  }

  async function acceptOffer(offerId: string): Promise<{ error: OfferError | null }> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "UNKNOWN" };

    const { error } = await supabase
      .from("offers")
      .update({ status: "accepted" })
      .eq("id", offerId)
      .eq("seller_id", user.id);

    return { error: error ? parseError(error) : null };
  }

  async function rejectOffer(offerId: string): Promise<{ error: OfferError | null }> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "UNKNOWN" };

    const { error } = await supabase
      .from("offers")
      .update({ status: "rejected" })
      .eq("id", offerId)
      .eq("seller_id", user.id);

    return { error: error ? parseError(error) : null };
  }

  async function counterOffer(
    offerId: string,
    counterAmount: number,
    originalOffer: OfferRow,
  ): Promise<{ error: OfferError | null }> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "UNKNOWN" };

    // Only the seller of the original offer can counter it
    if (user.id !== originalOffer.seller_id) return { error: "UNKNOWN" };

    if (!counterAmount || counterAmount <= 0) return { error: "UNKNOWN" };

    const { error: updateError } = await supabase
      .from("offers")
      .update({ status: "countered", counter_amount: counterAmount })
      .eq("id", offerId)
      .eq("seller_id", user.id);

    if (updateError) return { error: parseError(updateError) };

    // New offer with reversed roles — original seller becomes buyer of counter
    const { error: insertError } = await supabase.from("offers").insert({
      conversation_id: originalOffer.conversation_id,
      listing_id: originalOffer.listing_id,
      buyer_id: originalOffer.seller_id,
      seller_id: originalOffer.buyer_id,
      amount: counterAmount,
    });

    return { error: insertError ? parseError(insertError) : null };
  }

  async function getActiveOffer(conversationId: string): Promise<OfferRow | null> {
    const { data } = await supabase
      .from("offers")
      .select("*")
      .eq("conversation_id", conversationId)
      .eq("status", "pending")
      .maybeSingle();

    return data as OfferRow | null;
  }

  async function getDailyUsed(): Promise<number> {
    const { data } = await supabase.rpc("get_daily_offer_count");
    return data ?? 0;
  }

  return { sendOffer, acceptOffer, rejectOffer, counterOffer, getActiveOffer, getDailyUsed };
}
