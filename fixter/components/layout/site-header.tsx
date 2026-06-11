import Image from "next/image";
import Link from "next/link";
import { SiteHeaderNav } from "./site-header-nav";
import { SiteHeaderSearch } from "./site-header-search";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-[var(--color-gray-100)] bg-[var(--color-white)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center gap-4 lg:gap-6">
          {/* Logo */}
          <Link href="/" className="shrink-0 transition-opacity duration-200 hover:opacity-70">
            <Image
              src="/Logo_Fixter_Completo.svg"
              alt="Fixter"
              width={71}
              height={32}
              priority
              unoptimized
              className="hidden md:block"
            />
            <Image
              src="/Logo_Fixter_Simbolo.svg"
              alt="Fixter"
              width={33}
              height={32}
              priority
              unoptimized
              className="block md:hidden"
            />
          </Link>

          {/* Search — centrada en desktop */}
          <div className="hidden min-w-0 flex-1 items-center justify-center md:flex">
            <SiteHeaderSearch />
          </div>

          {/* Nav */}
          <div className="ml-auto shrink-0 md:ml-0">
            <SiteHeaderNav />
          </div>
        </div>

        {/* Search row en móvil */}
        <div className="pb-3 md:hidden">
          <SiteHeaderSearch id="header-search-mobile" />
        </div>
      </div>
    </header>
  );
}
