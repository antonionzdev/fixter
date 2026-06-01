"use client";

import { useRouter } from "next/navigation";

interface SiteHeaderSearchProps {
  id: string;
  className: string;
}

export function SiteHeaderSearch({ id, className }: SiteHeaderSearchProps) {
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
    <form onSubmit={handleSubmit} className="w-full">
      <label htmlFor={id} className="sr-only">
        Buscar piezas
      </label>
      <input
        id={id}
        name="search"
        type="search"
        placeholder="Busca piezas, modelos, marcas…"
        className={className}
      />
    </form>
  );
}
