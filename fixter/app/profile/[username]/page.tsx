import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarketplaceListingCard } from "@/components/listings/marketplace-listing-card";
import { SiteHeader } from "@/components/layout/site-header";
import { createAuthServerSupabase } from "@/lib/supabase-server-auth";
import {
  getActiveListingsBySellerId,
  getProfileByUsername,
  getReviewSummary,
  getReviewsByProfileId,
} from "@/lib/profile-queries";
import ProfilePageClient from "@/components/profile/profile-page-client";
import { ReviewsList } from "@/components/profile/reviews-list";

const fetchProfile = cache(getProfileByUsername);

type ProfilePageProps = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  const profile = await fetchProfile(decodeURIComponent(username));

  if (!profile) return { title: "Perfil no encontrado — Fixter" };

  const displayName = profile.full_name || profile.username;
  return {
    title: `${displayName} — Fixter`,
    description:
      profile.bio?.slice(0, 160) ??
      `Anuncios de ${profile.username} en Fixter`,
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username: rawUsername } = await params;
  const username = decodeURIComponent(rawUsername);

  // Auth check and profile fetch run in parallel
  const [authResult, profile] = await Promise.all([
    createAuthServerSupabase().then((sb) => sb.auth.getUser()),
    fetchProfile(username),
  ]);

  if (!profile) notFound();

  // profiles.id === auth.users.id by FK — compare directly
  const isOwner = authResult.data.user?.id === profile.id;

  // Listings, review summary and review items run in parallel once we have the profile ID
  const [listings, reviewSummary, reviewItems] = await Promise.all([
    getActiveListingsBySellerId(profile.id),
    getReviewSummary(profile.id),
    getReviewsByProfileId(profile.id),
  ]);

  return (
    <div className="min-h-full bg-zinc-50 font-sans text-zinc-900">
      <SiteHeader />

      <main className="px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl">
          {/*
            Listing cards are Server Components pre-rendered here and passed
            as children — ProfilePageClient receives them as opaque ReactNode.
          */}
          <ProfilePageClient
            initialProfile={profile}
            isOwner={isOwner}
            reviews={reviewSummary}
            activeListingsCount={listings.length}
            reviewsSection={<ReviewsList reviews={reviewItems} />}
          >
            {listings.map((listing) => (
              <li key={listing.id}>
                <MarketplaceListingCard listing={listing} />
              </li>
            ))}
          </ProfilePageClient>
        </div>
      </main>
    </div>
  );
}
