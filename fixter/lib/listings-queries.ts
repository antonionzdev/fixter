import { normalizeProfile } from "@/lib/profile-utils";
import { createServerSupabase } from "@/lib/supabase-server";
import type { ListingRow, ListingWithSeller } from "@/lib/types/listing";

const LISTING_FIELDS = `
  id,
  seller_id,
  title,
  description,
  price,
  category,
  brand,
  model,
  location,
  images,
  created_at
`;

function mapListingRows(
  rows: (ListingRow & { profiles?: unknown })[],
): ListingWithSeller[] {
  return rows.map((row) => ({
    ...row,
    images: Array.isArray(row.images) ? row.images : [],
    profiles: normalizeProfile(row.profiles),
  }));
}

export async function getLatestListings(
  limit = 12,
): Promise<ListingWithSeller[]> {
  const supabase = createServerSupabase();

  const withProfiles = await supabase
    .from("listings")
    .select(`${LISTING_FIELDS}, profiles (*)`)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!withProfiles.error && withProfiles.data) {
    return mapListingRows(withProfiles.data);
  }

  if (withProfiles.error) {
    console.warn("[getLatestListings] profiles join:", withProfiles.error.message);
  }

  const { data, error } = await supabase
    .from("listings")
    .select(LISTING_FIELDS)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getLatestListings]", error.message);
    return [];
  }

  return mapListingRows(data ?? []);
}
