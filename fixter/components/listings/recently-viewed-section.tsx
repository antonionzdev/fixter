"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { normalizeProfile } from "@/lib/profile-utils";
import { ProductCard } from "@/components/listings/product-card";
import type { ListingWithSeller } from "@/lib/types/listing";

const KEY = "fixter_recently_viewed";
const MAX_DISPLAY = 6;

const FIELDS =
  "id, seller_id, title, description, price, category, brand, model, condition, location, images, created_at";

type Props = {
  excludeId?: string;
};

export function RecentlyViewedSection({ excludeId }: Props) {
  // null = not yet resolved (first render / SSR), [] = resolved but empty
  const [listings, setListings] = useState<ListingWithSeller[] | null>(null);

  useEffect(() => {
    let ids: string[] = [];
    try {
      const stored = localStorage.getItem(KEY);
      ids = stored ? JSON.parse(stored) : [];
    } catch {
      setListings([]);
      return;
    }

    const filtered = (excludeId ? ids.filter((id) => id !== excludeId) : ids).slice(
      0,
      MAX_DISPLAY,
    );

    if (!filtered.length) {
      setListings([]);
      return;
    }

    const supabase = getSupabase();

    supabase
      .from("listings")
      .select(`${FIELDS}, profiles!seller_id(id, username, avatar_url, full_name, location)`)
      .in("id", filtered)
      .eq("status", "active")
      .then(({ data, error }) => {
        if (error || !data) {
          // Fallback: try without profile join
          supabase
            .from("listings")
            .select(FIELDS)
            .in("id", filtered)
            .eq("status", "active")
            .then(({ data: fbData }) => {
              const rows = (fbData ?? []) as (ListingWithSeller & { profiles?: unknown })[];
              setListings(toSorted(rows, filtered));
            });
          return;
        }

        const rows = data as unknown as (ListingWithSeller & { profiles?: unknown })[];
        setListings(toSorted(rows, filtered));
      });
  }, [excludeId]);

  if (!listings || listings.length === 0) return null;

  return (
    <>
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700">Vistos recientemente</h2>
        <div className="overflow-x-auto pb-2">
          <ul className="flex gap-3 sm:gap-4">
            {listings.map((listing) => (
              <li key={listing.id} className="w-48 shrink-0 sm:w-52">
                <ProductCard listing={listing} />
              </li>
            ))}
          </ul>
        </div>
      </section>
      <hr className="mb-8 border-gray-100" />
    </>
  );
}

function toSorted(
  rows: (ListingWithSeller & { profiles?: unknown })[],
  order: string[],
): ListingWithSeller[] {
  const mapped = rows.map((row) => ({
    ...row,
    images: Array.isArray(row.images) ? row.images : [],
    profiles: normalizeProfile(row.profiles),
  }));
  const byId = new Map(mapped.map((l) => [l.id, l]));
  return order.map((id) => byId.get(id)).filter(Boolean) as ListingWithSeller[];
}
