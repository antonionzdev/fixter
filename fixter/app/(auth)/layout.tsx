import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-full flex-col bg-zinc-50 font-sans text-zinc-900">
      <header className="border-b border-zinc-200 bg-white px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight sm:text-xl"
        >
          Fixter
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
