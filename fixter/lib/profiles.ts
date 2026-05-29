import type { SupabaseClient, User } from "@supabase/supabase-js";

async function insertProfile(
  supabase: SupabaseClient,
  userId: string,
  displayName?: string,
): Promise<void> {
  const row: Record<string, string> = { id: userId };
  if (displayName) {
    row.full_name = displayName;
  }

  const { error: insertError } = await supabase.from("profiles").insert(row);

  if (!insertError) {
    return;
  }

  if (insertError.message.includes("full_name") && displayName) {
    const { error: minimalError } = await supabase
      .from("profiles")
      .insert({ id: userId });

    if (!minimalError || minimalError.code === "23505") {
      return;
    }

    throw new Error(
      minimalError.message || "No se pudo crear el perfil de usuario.",
    );
  }

  if (insertError.code === "23505") {
    return;
  }

  throw new Error(
    insertError.message || "No se pudo crear el perfil de usuario.",
  );
}

/**
 * Garantiza que exista una fila en `profiles` para el usuario.
 * listings.seller_id tiene FK → profiles.id
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

  const displayName =
    (user.user_metadata?.full_name as string | undefined)?.trim() ||
    user.email?.split("@")[0] ||
    "Usuario";

  await insertProfile(supabase, user.id, displayName);
}

export async function ensureUserProfileById(
  supabase: SupabaseClient,
  userId: string,
  metadata?: { full_name?: string },
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

  await insertProfile(supabase, userId, metadata?.full_name?.trim());
}
