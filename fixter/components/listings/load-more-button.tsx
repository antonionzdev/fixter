"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { normalizeProfile } from "@/lib/profile-utils";
import { ProductCard } from "@/components/listings/product-card";
import type { ListingFilters, ListingWithSeller } from "@/lib/types/listing";

const PAGE_SIZE = 24;

const FIELDS =
  "id, seller_id, title, description, price, category, brand, model, condition, location, images, created_at";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyFilters(query: any, filters: ListingFilters): any {
  if (filters.search) {
    const safe = filters.search.replace(/[,()]/g, "");
    if (safe) query = query.or(`title.ilike.%${safe}%,description.ilike.%${safe}%`);
  }
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.model)    query = query.eq("model", filters.model);
  if (filters.condition) query = query.eq("condition", filters.condition);
  if (filters.price_min != null) query = query.gte("price", filters.price_min);
  if (filters.price_max != null) query = query.lte("price", filters.price_max);
  if (filters.specs && Object.keys(filters.specs).length > 0) {
    query = query.contains("specs", filters.specs);
  }
  return query;
}

function mapRows(rows: unknown[]): ListingWithSeller[] {
  return (rows as (ListingWithSeller & { profiles?: unknown })[]).map((row) => ({
    ...row,
    images: Array.isArray(row.images) ? row.images : [],
    profiles: normalizeProfile(row.profiles),
  }));
}

type Props = {
  initialListings: ListingWithSeller[];
  initialCursor: string | null;
  filters: ListingFilters;
};

export function LoadMoreButton({ initialListings, initialCursor, filters }: Props) {
  const [allListings, setAllListings] = useState<ListingWithSeller[]>(initialListings);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [isLoading, setIsLoading] = useState(false);

  async function loadMore() {
    if (!cursor || isLoading) return;
    setIsLoading(true);

    const supabase = getSupabase();

    let query = supabase
      .from("listings")
      .select(`${FIELDS}, profiles!seller_id(id, username, avatar_url, full_name, location)`)
      .eq("status", "active")
      .lt("created_at", cursor)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    query = applyFilters(query, filters);
    const { data, error } = await query;

    let rows: unknown[] = data ?? [];

    if (error) {
      // Fallback: query without profile join
      let fallback = supabase
        .from("listings")
        .select(FIELDS)
        .eq("status", "active")
        .lt("created_at", cursor)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);

      fallback = applyFilters(fallback, filters);
      const { data: fbData } = await fallback;
      rows = fbData ?? [];
    }

    const newListings = mapRows(rows);
    setAllListings((prev) => [...prev, ...newListings]);

    const last = newListings.at(-1);
    setCursor(newListings.length === PAGE_SIZE ? (last?.created_at ?? null) : null);
    setIsLoading(false);
  }

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-4 lg:grid-cols-4 lg:gap-4">
        {allListings.map((listing) => (
          <li key={listing.id}>
            <ProductCard listing={listing} />
          </li>
        ))}
      </ul>

      {cursor && (
        <div className="mt-10 flex justify-center">
          <button
            onClick={loadMore}
            disabled={isLoading}
            className="rounded-xl border border-zinc-200 bg-white px-6 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Cargando…" : "Cargar más anuncios"}
          </button>
        </div>
      )}
    </>
  );
}
