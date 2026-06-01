import type { SupabaseClient, User } from "@supabase/supabase-js";

async function insertProfile(
  supabase: SupabaseClient,
  userId: string,
  metadata?: { username?: string; full_name?: string },
  fallbackName?: string,
): Promise<void> {
  const name = fallbackName?.trim() || "Usuario";

  const profileRow: Record<string, string> = { id: userId };

  if (metadata?.username?.trim()) {
    profileRow.username = metadata.username.trim();
  }

  if (metadata?.full_name?.trim()) {
    profileRow.full_name = metadata.full_name.trim();
  }

  const candidates: Record<string, string>[] = [
    profileRow,
    { id: userId, username: name },
    { id: userId, full_name: name },
    { id: userId },
  ];

  for (const row of candidates) {
    const { error } = await supabase.from("profiles").insert(row);

    if (!error) {
      return;
    }

    if (error.code === "23505") {
      return;
    }

    const isColumnError =
      error.message.includes("column") ||
      error.message.includes("Could not find");

    if (isColumnError) {
      continue;
    }

    throw new Error(error.message || "No se pudo crear el perfil de usuario.");
  }
}

/**
 * Garantiza que exista una fila en `profiles` para el usuario.
 * Requiere: profiles.id = auth.users.id (patrón estándar de Supabase).
 * listings.seller_id → profiles.id
 */
export async function ensureUserProfile(
  supabase: SupabaseClient,
  user: Pick<User, "id" | "email" | "user_metadata">,
): Promise<void> {
  const { data: existing, error: selectError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (selectError) {
    throw new Error(
      selectError.message || "No se pudo comprobar el perfil de usuario.",
    );
  }

  if (existing) {
    return;
  }

  const metadata = user.user_metadata as
    | { username?: string; full_name?: string }
    | undefined;

  const displayName =
    metadata?.full_name?.trim() || user.email?.split("@")[0] || "Usuario";

  await insertProfile(supabase, user.id, metadata, displayName);
}

export async function ensureUserProfileById(
  supabase: SupabaseClient,
  userId: string,
  metadata?: { username?: string; full_name?: string },
): Promise<void> {
  const { data: existing, error: selectError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (selectError) {
    throw new Error(
      selectError.message || "No se pudo comprobar el perfil de usuario.",
    );
  }

  if (existing) {
    return;
  }

  await insertProfile(supabase, userId, metadata, metadata?.full_name?.trim());
}
