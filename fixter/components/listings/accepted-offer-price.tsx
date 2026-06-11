"use client";

import { useState, useEffect } from "react";
import { getSupabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/format";

type Props = {
  listingId: string;
  originalPrice: number;
};

type State =
  | { status: "loading" }
  | { status: "no-offer" }
  | { status: "accepted"; amount: number };

export function AcceptedOfferPrice({ listingId, originalPrice }: Props) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    const supabase = getSupabase();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setState({ status: "no-offer" });
        return;
      }
      supabase
        .from("offers")
        .select("amount")
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .eq("listing_id", listingId)
        .eq("status", "accepted")
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          setState(data ? { status: "accepted", amount: data.amount } : { status: "no-offer" });
        });
    });
  }, [listingId]);

  if (state.status === "loading") {
    return <div className="h-[52px] w-48 animate-pulse rounded-lg bg-zinc-100" />;
  }

  if (state.status === "no-offer") {
    return (
      <p className="text-5xl font-black tracking-tight text-zinc-950">
        {formatPrice(originalPrice)}
      </p>
    );
  }

  return (
    <>
      <p className="text-sm text-zinc-400 line-through">
        Precio original: {formatPrice(originalPrice)}
      </p>
      <p className="text-5xl font-black tracking-tight text-[#16A34A]">
        {formatPrice(state.amount)}
      </p>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-green-600">
        <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 8l4 4 6-7" />
        </svg>
        Tu precio acordado
      </p>
    </>
  );
}
