"use client";

import { useRouter } from "next/navigation";

interface SiteHeaderSearchProps {
  id?: string;
}

export function SiteHeaderSearch({ id = "header-search" }: SiteHeaderSearchProps) {
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const search = formData.get("search")?.toString().trim();
    if (search) {
      router.push(`/?search=${encodeURIComponent(search)}`);
    } else {
      router.push(`/`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-lg">
      <label htmlFor={id} className="sr-only">
        Buscar piezas
      </label>
      <span
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-gray-400)]"
        aria-hidden="true"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 15 15"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="6.5" cy="6.5" r="4.5" />
          <path d="M10 10 L13.5 13.5" />
        </svg>
      </span>
      <input
        id={id}
        name="search"
        type="search"
        placeholder="Busca piezas, modelos, marcas…"
        className="w-full rounded-full border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] py-2.5 pl-10 pr-4 text-sm text-[var(--color-gray-900)] placeholder:text-[var(--color-gray-400)] outline-none transition-[border-color,background-color,box-shadow] duration-200 hover:border-[var(--color-gray-300)] focus:border-[var(--color-brand-orange)] focus:bg-[var(--color-white)] focus:shadow-[0_0_0_3px_rgb(255_107_43_/_0.12)]"
        style={{ transitionTimingFunction: "var(--ease-out)" }}
      />
    </form>
  );
}
