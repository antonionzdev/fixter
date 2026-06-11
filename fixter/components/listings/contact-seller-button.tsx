"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

type Props = {
  listingId: string;
  sellerId: string;
};

type AuthState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "is-seller" }
  | { status: "ready"; userId: string };

export function ContactSellerButton({ listingId, sellerId }: Props) {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>({ status: "loading" });
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSupabase()
      .auth.getUser()
      .then(({ data: { user } }) => {
        if (!user) {
          setAuthState({ status: "unauthenticated" });
        } else if (user.id === sellerId) {
          setAuthState({ status: "is-seller" });
        } else {
          setAuthState({ status: "ready", userId: user.id });
        }
      });
  }, [sellerId]);

  async function handleContact() {
    if (authState.status !== "ready") return;

    setIsCreating(true);
    setError(null);

    const supabase = getSupabase();
    const { userId } = authState;

    const { data: existing, error: selectError } = await supabase
      .from("conversations")
      .select("id")
      .eq("buyer_id", userId)
      .eq("listing_id", listingId)
      .maybeSingle();

    if (selectError) {
      setError("No se pudo comprobar el estado de la conversación. Inténtalo de nuevo.");
      setIsCreating(false);
      return;
    }

    if (existing) {
      router.push(`/messages/${existing.id}`);
      return;
    }

    const { data: created, error: insertError } = await supabase
      .from("conversations")
      .insert({ listing_id: listingId, buyer_id: userId, seller_id: sellerId })
      .select("id")
      .single();

    if (insertError) {
      // Código 23505 = unique_violation: otra pestaña ya creó la conversación.
      // Recuperamos la existente en lugar de mostrar un error.
      if (insertError.code === "23505") {
        const { data: recovered } = await supabase
          .from("conversations")
          .select("id")
          .eq("buyer_id", userId)
          .eq("listing_id", listingId)
          .maybeSingle();
        if (recovered) {
          router.push(`/messages/${recovered.id}`);
          return;
        }
      }
      setError("No se pudo iniciar la conversación. Inténtalo de nuevo.");
      setIsCreating(false);
      return;
    }

    router.push(`/messages/${created.id}`);
  }

  if (authState.status === "loading") {
    return <div className="h-[56px] w-full animate-pulse rounded-xl bg-zinc-100" />;
  }

  if (authState.status === "is-seller") {
    return null;
  }

  if (authState.status === "unauthenticated") {
    return (
      <button
        type="button"
        onClick={() => router.push(`/login?redirect=/listings/${listingId}`)}
        className="w-full rounded-xl bg-zinc-950 py-4 text-base font-semibold text-white transition-[opacity,transform] duration-200 ease-out hover:opacity-90 active:scale-[0.97]"
      >
        Contactar con el vendedor
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleContact}
        disabled={isCreating}
        className="w-full rounded-xl bg-zinc-950 py-4 text-base font-semibold text-white transition-[opacity,transform] duration-200 ease-out hover:opacity-90 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isCreating ? "Iniciando conversación…" : "Contactar con el vendedor"}
      </button>
      {error && <p className="text-center text-xs text-red-600">{error}</p>}
    </div>
  );
}
