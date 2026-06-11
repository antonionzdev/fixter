type ConditionBadgeProps = {
  condition: string;
};

const CONDITION_STYLES: Record<string, string> = {
  nuevo: "bg-[var(--color-brand-orange)] text-white border-[var(--color-brand-orange)]",
  "como nuevo": "bg-blue-100 text-blue-800 border-blue-200",
  bueno: "bg-yellow-100 text-yellow-800 border-yellow-200",
  aceptable: "bg-orange-100 text-orange-800 border-orange-200",
};

function normalizeCondition(condition: string): string {
  return condition.trim().toLowerCase().replace(/_/g, " ");
}

export function ConditionBadge({ condition }: ConditionBadgeProps) {
  const normalized = normalizeCondition(condition);
  const label = normalized || "Sin especificar";
  const styles =
    CONDITION_STYLES[normalized] ??
    "bg-zinc-100 text-zinc-700 border-zinc-200";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${styles}`}
    >
      {label}
    </span>
  );
}
