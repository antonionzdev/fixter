import Link from "next/link";

export default function ConversationNotFound() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-zinc-50 px-4 text-center">
      <h1 className="text-2xl font-semibold text-zinc-900">
        Conversación no encontrada
      </h1>
      <p className="mt-2 text-sm text-zinc-500">
        Esta conversación no existe o no tienes acceso a ella.
      </p>
      <Link
        href="/messages"
        className="mt-6 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
      >
        Volver a mensajes
      </Link>
    </div>
  );
}
