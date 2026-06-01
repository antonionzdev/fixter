import { normalizeProfile } from "@/lib/profile-utils";
import { createServerSupabase } from "@/lib/supabase-server";
import type {
  ListingDetailProfile,
  ListingDetailWithSeller,
  ListingFilters,
  ListingRow,
  ListingWithSeller,
} from "@/lib/types/listing";

/** Join explícito: listings.seller_id → profiles.id */
const PROFILE_JOIN = "profiles!seller_id";

const LISTING_FIELDS = `
  id,
  seller_id,
  title,
  description,
  price,
  category,
  brand,
  model,
  condition,
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

function applyFilters(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  filters: ListingFilters,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  if (filters.search) {
    const safe = filters.search.replace(/[,()]/g, "");
    if (safe) {
      query = query.or(
        `title.ilike.%${safe}%,description.ilike.%${safe}%`,
      );
    }
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

type PaginatedListings = {
  listings: ListingWithSeller[];
  nextCursor: string | null;
};

export async function getLatestListings(
  limit = 24,
  filters: ListingFilters = {},
  cursor?: string,
): Promise<PaginatedListings> {
  const supabase = createServerSupabase();

  let withProfilesQuery = supabase
    .from("listings")
    .select(`${LISTING_FIELDS}, ${PROFILE_JOIN} (*)`)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (cursor) withProfilesQuery = withProfilesQuery.lt("created_at", cursor);
  withProfilesQuery = applyFilters(withProfilesQuery, filters);
  const withProfiles = await withProfilesQuery;

  if (!withProfiles.error && withProfiles.data) {
    const listings = mapListingRows(withProfiles.data);
    const last = listings.at(-1);
    return {
      listings,
      nextCursor: listings.length === limit ? (last?.created_at ?? null) : null,
    };
  }

  if (withProfiles.error) {
    console.warn("[getLatestListings] profiles join:", withProfiles.error.message);
  }

  let fallbackQuery = supabase
    .from("listings")
    .select(LISTING_FIELDS)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (cursor) fallbackQuery = fallbackQuery.lt("created_at", cursor);
  fallbackQuery = applyFilters(fallbackQuery, filters);
  const { data, error } = await fallbackQuery;

  if (error) {
    console.error("[getLatestListings]", error.message);
    return { listings: [], nextCursor: null };
  }

  const listings = mapListingRows(data ?? []);
  const last = listings.at(-1);
  return {
    listings,
    nextCursor: listings.length === limit ? (last?.created_at ?? null) : null,
  };
}

function mapListingDetail(
  row: Record<string, unknown>,
): ListingDetailWithSeller {
  const rawProfile = normalizeProfile(row.profiles);
  let profiles: ListingDetailProfile | null = null;

  if (rawProfile) {
    profiles = {
      username:
        (typeof rawProfile.username === "string" && rawProfile.username) ||
        (typeof rawProfile.full_name === "string" && rawProfile.full_name) ||
        (typeof rawProfile.name === "string" && rawProfile.name) ||
        "Vendedor",
      avatar_url:
        typeof rawProfile.avatar_url === "string" ? rawProfile.avatar_url : null,
      location:
        typeof rawProfile.location === "string" ? rawProfile.location : "",
      created_at:
        typeof rawProfile.created_at === "string" ? rawProfile.created_at : "",
    };
  }

  return {
    id: String(row.id),
    seller_id: String(row.seller_id ?? ""),
    title: String(row.title ?? ""),
    description: String(row.description ?? ""),
    price: Number(row.price ?? 0),
    category: String(row.category ?? ""),
    brand: String(row.brand ?? ""),
    model: String(row.model ?? ""),
    condition: String(row.condition ?? ""),
    location: String(row.location ?? ""),
    images: Array.isArray(row.images) ? (row.images as string[]) : [],
    specs: (row.specs && typeof row.specs === 'object') ? row.specs as Record<string, string> : null,
    status: String(row.status ?? "active"),
    created_at: String(row.created_at ?? new Date().toISOString()),
    profiles,
  };
}

export async function getListingById(
  id: string,
): Promise<ListingDetailWithSeller | null> {
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from("listings")
    .select(
      `
      *,
      ${PROFILE_JOIN} (
        username,
        avatar_url,
        location,
        created_at
      )
    `,
    )
    .eq("id", id)
    .single();

  if (!error && data) {
    return mapListingDetail(data as Record<string, unknown>);
  }

  if (error) {
    console.warn("[getListingById] profiles join:", error.message);

    const { data: listingOnly, error: listingError } = await supabase
      .from("listings")
      .select("*")
      .eq("id", id)
      .single();

    if (listingError || !listingOnly) {
      return null;
    }

    return mapListingDetail(listingOnly as Record<string, unknown>);
  }

  return null;
}
