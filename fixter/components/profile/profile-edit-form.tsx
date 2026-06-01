"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import type { PublicProfile } from "@/lib/types/profile";

const inputCls =
  "mt-1.5 block w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100";

const labelCls = "text-sm font-medium text-zinc-700";

type ProfileEditFormProps = {
  profile: PublicProfile;
};

export default function ProfileEditForm({ profile }: ProfileEditFormProps) {
  const router = useRouter();
  const supabase = getSupabase();

  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [location, setLocation] = useState(profile.location ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarObjectUrl, setAvatarObjectUrl] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const displayAvatar = avatarObjectUrl ?? profile.avatar_url;
  const initial = profile.username.charAt(0).toUpperCase();

  useEffect(() => {
    return () => {
      if (avatarObjectUrl) URL.revokeObjectURL(avatarObjectUrl);
    };
  }, [avatarObjectUrl]);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (avatarObjectUrl) URL.revokeObjectURL(avatarObjectUrl);
    setAvatarFile(file);
    setAvatarObjectUrl(URL.createObjectURL(file));
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    if (submitting) return;
    setSubmitting(true);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setFormError("Tu sesión ha expirado. Vuelve a iniciar sesión.");
      setSubmitting(false);
      return;
    }

    // Upload new avatar if selected
    let newAvatarUrl: string | null = profile.avatar_url;

    if (avatarFile) {
      const ext = avatarFile.name.split(".").pop() ?? "jpg";
      const uploadPath = `${user.id}/avatar-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(uploadPath, avatarFile, { cacheControl: "3600", upsert: false });

      if (uploadError) {
        setFormError("Error al subir la foto de perfil. Inténtalo de nuevo.");
        setSubmitting(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(uploadPath);
      newAvatarUrl = urlData.publicUrl;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim() || null,
        bio: bio.trim() || null,
        location: location.trim() || null,
        phone: phone.trim() || null,
        avatar_url: newAvatarUrl,
      })
      .eq("id", user.id);

    if (updateError) {
      setFormError("No se pudieron guardar los cambios. Inténtalo de nuevo.");
      setSubmitting(false);
      return;
    }

    router.push(`/profile/${encodeURIComponent(profile.username)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* ── AVATAR ───────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-base font-semibold text-zinc-900">Foto de perfil</h2>
        <p className="mt-0.5 text-sm text-zinc-500">
          Sube una imagen cuadrada para mejores resultados. Formatos JPG, PNG o WEBP.
        </p>

        <div className="mt-5 flex flex-col items-center gap-4 sm:flex-row sm:items-center">
          {/* Avatar preview */}
          <div className="relative">
            {displayAvatar ? (
              <div className="relative h-24 w-24 overflow-hidden rounded-full ring-4 ring-zinc-100">
                <Image
                  src={displayAvatar}
                  alt={profile.username}
                  fill
                  className="object-cover"
                  sizes="96px"
                  unoptimized
                />
              </div>
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-zinc-100 text-2xl font-bold text-zinc-500 ring-4 ring-zinc-50">
                {initial}
              </div>
            )}
          </div>

          {/* File picker */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="edit-avatar"
              className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
            >
              {avatarFile ? "Cambiar foto" : "Subir foto"}
              <input
                id="edit-avatar"
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="sr-only"
              />
            </label>
            {avatarFile && (
              <p className="text-xs text-zinc-400">{avatarFile.name}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── INFORMACIÓN PERSONAL ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="mb-5 text-base font-semibold text-zinc-900">
          Información personal
        </h2>

        <div className="space-y-5">
          {/* Username (readonly) */}
          <div>
            <label className={labelCls}>Nombre de usuario</label>
            <div className="mt-1.5 flex items-center rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-400">
              @{profile.username}
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              El nombre de usuario no se puede cambiar por el momento.
            </p>
          </div>

          {/* Full name */}
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
            />
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="edit-bio" className={labelCls}>
              Biografía
            </label>
            <textarea
              id="edit-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Cuéntanos un poco sobre ti o tu actividad"
              className={inputCls}
            />
          </div>

          {/* Location */}
          <div>
            <label htmlFor="edit-location" className={labelCls}>
              Localidad
            </label>
            <input
              id="edit-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ciudad o provincia"
              className={inputCls}
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="edit-phone" className={labelCls}>
              Teléfono{" "}
              <span className="font-normal text-zinc-400">(opcional)</span>
            </label>
            <input
              id="edit-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+34 600 000 000"
              className={inputCls}
            />
          </div>
        </div>
      </div>

      {/* ── ERROR ────────────────────────────────────────────────────────── */}
      {formError && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {formError}
        </div>
      )}

      {/* ── ACTIONS ──────────────────────────────────────────────────────── */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-zinc-200 bg-white px-6 py-3 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
