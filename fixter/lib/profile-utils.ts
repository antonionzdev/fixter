export function getSellerDisplayName(
  profile: Record<string, unknown> | null | undefined,
): string {
  if (!profile) {
    return "Vendedor";
  }

  const keys = ["full_name", "name", "username", "display_name"];

  for (const key of keys) {
    const value = profile[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "Vendedor";
}

export function normalizeProfile(
  profiles: unknown,
): Record<string, unknown> | null {
  if (!profiles) return null;
  if (Array.isArray(profiles)) {
    return (profiles[0] as Record<string, unknown>) ?? null;
  }
  return profiles as Record<string, unknown>;
}
