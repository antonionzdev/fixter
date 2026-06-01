import Link from "next/link";

export default function ListingNotFound() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-zinc-50 px-4 text-center">
      <h1 className="text-2xl font-semibold text-zinc-900">
        Anuncio no encontrado
      </h1>
      <p className="mt-2 text-sm text-zinc-500">
        El anuncio que buscas no existe o ha sido eliminado.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
