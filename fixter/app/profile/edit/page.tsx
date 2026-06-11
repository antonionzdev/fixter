import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { createAuthServerSupabase } from "@/lib/supabase-server-auth";
import { createServiceSupabase } from "@/lib/supabase-service";
import ProfileEditForm from "@/components/profile/profile-edit-form";
import type { PublicProfile } from "@/lib/types/profile";

export const metadata: Metadata = {
  title: "Editar perfil — Fixter",
};

export default async function ProfileEditPage() {
  const supabase = await createAuthServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/profile/edit");
  }

  // phone es PII con SELECT revocado para el rol authenticated. El propietario
  // lee su propia fila (incluido phone) vía service_role, acotado a su user.id.
  const serviceSupabase = createServiceSupabase();
  const { data, error } = await serviceSupabase
    .from("profiles")
    .select("id, username, full_name, avatar_url, bio, location, phone, created_at")
    .eq("id", user.id)
    .single();

  if (error || !data) {
    redirect("/dashboard");
  }

  const profile: PublicProfile = {
    id: String(data.id),
    username: String(data.username ?? ""),
    full_name: typeof data.full_name === "string" ? data.full_name : null,
    avatar_url: typeof data.avatar_url === "string" ? data.avatar_url : null,
    bio: typeof data.bio === "string" ? data.bio : null,
    location: typeof data.location === "string" ? data.location : null,
    phone: typeof data.phone === "string" ? data.phone : null,
    created_at: String(data.created_at ?? new Date().toISOString()),
  };

  return (
    <div className="min-h-full bg-zinc-50 font-sans text-zinc-900">
      <SiteHeader />

      <main className="px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
                Editar perfil
              </h1>
              <p className="mt-1 text-sm text-zinc-500">
                Los cambios se mostrarán en tu perfil público.
              </p>
            </div>
            <Link
              href={`/profile/${encodeURIComponent(profile.username)}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
            >
              Ver mi perfil →
            </Link>
          </div>

          <ProfileEditForm profile={profile} />
        </div>
      </main>
    </div>
  );
}
