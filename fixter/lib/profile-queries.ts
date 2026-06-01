import { createServerSupabase } from "@/lib/supabase-server";
import type { SellerListing } from "@/lib/types/listing";
import type { PublicProfile, ReviewSummary } from "@/lib/types/profile";
import type { ReviewWithDetails } from "@/lib/types/reviews";

function mapProfile(row: Record<string, unknown>): PublicProfile {
  return {
    id: String(row.id),
    username: String(row.username ?? ""),
    full_name: typeof row.full_name === "string" ? row.full_name : null,
    avatar_url: typeof row.avatar_url === "string" ? row.avatar_url : null,
    bio: typeof row.bio === "string" ? row.bio : null,
    location: typeof row.location === "string" ? row.location : null,
    phone: typeof row.phone === "string" ? row.phone : null,
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

function mapSellerListing(row: Record<string, unknown>): SellerListing {
  return {
    id: String(row.id),
    seller_id: String(row.seller_id),
    title: String(row.title ?? ""),
    description:
      typeof row.description === "string" ? row.description : null,
    price: Number(row.price ?? 0),
    category: typeof row.category === "string" ? row.category : null,
    brand: typeof row.brand === "string" ? row.brand : null,
    model: typeof row.model === "string" ? row.model : null,
    condition: typeof row.condition === "string" ? row.condition : null,
    location: typeof row.location === "string" ? row.location : null,
    images: Array.isArray(row.images) ? (row.images as string[]) : [],
    status: String(row.status ?? "active"),
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

export async function getProfileByUsername(
  username: string,
): Promise<PublicProfile | null> {
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (error || !data) {
    return null;
  }

  return mapProfile(data as Record<string, unknown>);
}

export async function getActiveListingsBySellerId(
  sellerId: string,
): Promise<SellerListing[]> {
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("seller_id", sellerId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getActiveListingsBySellerId]", error.message);
    return [];
  }

  return (data ?? []).map((row) =>
    mapSellerListing(row as Record<string, unknown>),
  );
}

type RawReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer: { username: string; avatar_url: string | null } | null;
  listing: { title: string } | null;
};

export async function getReviewsByProfileId(
  profileId: string,
): Promise<ReviewWithDetails[]> {
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from("reviews")
    .select(
      "id, rating, comment, created_at, reviewer:profiles!reviewer_id(username, avatar_url), listing:listings!listing_id(title)",
    )
    .eq("reviewed_id", profileId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("[getReviewsByProfileId]", error.message);
    return [];
  }

  return ((data ?? []) as unknown as RawReviewRow[]).map((row) => ({
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    created_at: row.created_at,
    reviewer_username: row.reviewer?.username ?? "Usuario",
    reviewer_avatar_url: row.reviewer?.avatar_url ?? null,
    listing_title: row.listing?.title ?? "Anuncio eliminado",
  }));
}

export async function getReviewSummary(
  profileId: string,
): Promise<ReviewSummary> {
  const supabase = createServerSupabase();

  const { data } = await supabase
    .from("reviews")
    .select("rating")
    .eq("reviewed_id", profileId);

  if (!data || data.length === 0) return { avg: 0, count: 0 };

  const sum = data.reduce((acc, r) => acc + Number(r.rating), 0);
  return {
    avg: Math.round((sum / data.length) * 10) / 10,
    count: data.length,
  };
}
