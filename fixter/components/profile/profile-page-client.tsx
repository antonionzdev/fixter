"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { StarRating } from "@/components/profile/star-rating";
import { formatMemberSince } from "@/lib/format";
import type { PublicProfile, ReviewSummary } from "@/lib/types/profile";

// ---------------------------------------------------------------------------
// Styles (mirror publish-form / edit-listing-form)
// ---------------------------------------------------------------------------
const inputCls =
  "mt-1.5 block w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100";

const labelCls = "block text-sm font-medium text-zinc-700";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Props = {
  initialProfile: PublicProfile;
  isOwner: boolean;
  reviews: ReviewSummary;
  activeListingsCount: number;
  children: React.ReactNode;
  reviewsSection: React.ReactNode;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function ProfilePageClient({
  initialProfile,
  isOwner,
  reviews,
  activeListingsCount,
  children,
  reviewsSection,
}: Props) {
  const supabase = getSupabase();

  // Reactive copy of the profile — updated optimistically after save or avatar change
  const [profile, setProfile] = useState(initialProfile);
  const [isEditing, setIsEditing] = useState(false);

  // Edit form fields — populated when entering edit mode
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [editLocation, setEditLocation] = useState("");

  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [error, setError] = useState("");

  const avatarInputRef = useRef<HTMLInputElement>(null);

  // ── Helpers ────────────────────────────────────────────────────────────────

  function enterEditMode() {
    setFullName(profile.full_name ?? "");
    setBio(profile.bio ?? "");
    setEditLocation(profile.location ?? "");
    setError("");
    setIsEditing(true);
  }

  function cancelEdit() {
    setIsEditing(false);
    setError("");
  }

  // ── Avatar upload (immediate — independent of edit mode) ──────────────────

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (avatarInputRef.current) avatarInputRef.current.value = "";

    setAvatarUploading(true);
    setError("");

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setError("Tu sesión ha expirado. Recarga la página.");
      setAvatarUploading(false);
      return;
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const uploadPath = `${user.id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(uploadPath, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      setError("Error al subir la foto. Inténtalo de nuevo.");
      setAvatarUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(uploadPath);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: urlData.publicUrl })
      .eq("id", user.id);

    if (updateError) {
      setError("La foto se subió pero no se pudo guardar. Inténtalo de nuevo.");
      setAvatarUploading(false);
      return;
    }

    setProfile((prev) => ({ ...prev, avatar_url: urlData.publicUrl }));
    setAvatarUploading(false);
  }

  // ── Save text fields ───────────────────────────────────────────────────────

  async function handleSave() {
    setError("");
    setSaving(true);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setError("Tu sesión ha expirado. Recarga la página.");
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim() || null,
        bio: bio.trim() || null,
        location: editLocation.trim() || null,
      })
      .eq("id", user.id);

    if (updateError) {
      setError("No se pudieron guardar los cambios. Inténtalo de nuevo.");
      setSaving(false);
      return;
    }

    setProfile((prev) => ({
      ...prev,
      full_name: fullName.trim() || null,
      bio: bio.trim() || null,
      location: editLocation.trim() || null,
    }));
    setIsEditing(false);
    setSaving(false);
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const initial = profile.username.charAt(0).toUpperCase();
  const displayName = profile.full_name || profile.username;

  // ── Avatar section (shared between view and edit modes) ───────────────────

  const avatarSection = (
    <div className="group relative shrink-0">
      {/* Image / initials */}
      <div className="relative h-28 w-28 overflow-hidden rounded-full ring-4 ring-zinc-100 sm:h-32 sm:w-32">
        {profile.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt={profile.username}
            fill
            className="object-cover"
            sizes="128px"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-100 text-3xl font-bold text-zinc-500">
            {initial}
          </div>
        )}
      </div>

      {/* Camera overlay — owner only */}
      {isOwner && (
        <label
          htmlFor="owner-avatar-input"
          className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100"
          title="Cambiar foto de perfil"
        >
          {avatarUploading ? (
            <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          )}
        </label>
      )}

      {isOwner && (
        <input
          id="owner-avatar-input"
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          className="sr-only"
        />
      )}
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-10">

      {/* ── PROFILE CARD ──────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-zinc-200 bg-white px-6 py-8 shadow-sm sm:px-8 sm:py-10">
        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:text-left">

          {avatarSection}

          <div className="min-w-0 flex-1">
            {isEditing ? (

              /* ── EDIT MODE ────────────────────────────────────────────── */
              <div className="space-y-4 text-left">
                <div>
                  <label htmlFor="edit-fullname" className={labelCls}>
                    Nombre completo
                  </label>
                  <input
                    id="edit-fullname"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Tu nombre real o el de tu negocio"
                    className={inputCls}
                    autoFocus
                  />
                </div>

                <div>
                  <label htmlFor="edit-bio" className={labelCls}>
                    Biografía
                  </label>
                  <textarea
                    id="edit-bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    placeholder="Cuéntanos sobre ti o tu actividad"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label htmlFor="edit-location" className={labelCls}>
                    Localidad
                  </label>
                  <input
                    id="edit-location"
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    placeholder="Ciudad o provincia"
                    className={inputCls}
                  />
                </div>

                {error && (
                  <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? "Guardando…" : "Guardar cambios"}
                  </button>
                </div>
              </div>

            ) : (

              /* ── VIEW MODE ────────────────────────────────────────────── */
              <div className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
                      {displayName}
                    </h1>
                    {profile.full_name && (
                      <p className="mt-0.5 text-sm text-zinc-400">
                        @{profile.username}
                      </p>
                    )}
                  </div>

                  {/* Edit button — owner only */}
                  {isOwner && (
                    <button
                      type="button"
                      onClick={enterEditMode}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Editar perfil
                    </button>
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
                        <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
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

                {error && (
                  <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── LISTINGS SECTION ──────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900 sm:text-xl">
          Anuncios de {displayName}
        </h2>

        {activeListingsCount === 0 ? (
          <p className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center text-sm text-zinc-500">
            {isOwner
              ? "Todavía no has publicado ningún anuncio."
              : "Este vendedor no tiene anuncios activos."}
          </p>
        ) : (
          <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
            {children}
          </ul>
        )}
      </section>

      {/* ── REVIEWS SECTION ───────────────────────────────────────────────── */}
      {reviewsSection}
    </div>
  );
}
