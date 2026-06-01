import Image from "next/image";
import type { PublicProfile, ReviewSummary } from "@/lib/types/profile";
import { formatMemberSince } from "@/lib/format";
import { StarRating } from "@/components/profile/star-rating";

type ProfileHeaderProps = {
  profile: PublicProfile;
  activeListingsCount: number;
  reviews: ReviewSummary;
};

export function ProfileHeader({
  profile,
  activeListingsCount,
  reviews,
}: ProfileHeaderProps) {
  const initial = profile.username.charAt(0).toUpperCase();
  const displayName = profile.full_name || profile.username;

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white px-6 py-8 shadow-sm sm:px-8 sm:py-10">
      <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:text-left">
        {/* Avatar */}
        {profile.avatar_url ? (
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full ring-4 ring-zinc-100 sm:h-32 sm:w-32">
            <Image
              src={profile.avatar_url}
              alt={profile.username}
              fill
              className="object-cover"
              sizes="128px"
              unoptimized
            />
          </div>
        ) : (
          <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-3xl font-bold text-zinc-500 ring-4 ring-zinc-50 sm:h-32 sm:w-32">
            {initial}
          </div>
        )}

        {/* Info */}
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
              {displayName}
            </h1>
            {profile.full_name && (
              <p className="mt-0.5 text-sm text-zinc-400">@{profile.username}</p>
            )}
          </div>

          {profile.bio && (
            <p className="text-sm leading-relaxed text-zinc-600 sm:text-base">
              {profile.bio}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-zinc-500 sm:justify-start">
            {profile.location && (
              <>
                <span className="flex items-center gap-1">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                    <circle cx="12" cy="9" r="2.5" />
                  </svg>
                  {profile.location}
                </span>
                <span aria-hidden="true" className="text-zinc-300">·</span>
              </>
            )}
            <span>Miembro desde {formatMemberSince(profile.created_at)}</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
            <StarRating rating={reviews.avg} count={reviews.count} />
            <span className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-700">
              {activeListingsCount}{" "}
              {activeListingsCount === 1 ? "anuncio activo" : "anuncios activos"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
