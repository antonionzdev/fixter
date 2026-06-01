import Link from "next/link";
import { SiteHeaderNav } from "./site-header-nav";
import { SiteHeaderSearch } from "./site-header-search";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-gray-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-14 items-center gap-4 sm:h-16 lg:gap-8">
          <Link
            href="/"
            className="shrink-0 text-lg font-bold tracking-tight text-[#111111] sm:text-xl"
          >
            Fixter
          </Link>

          <div className="hidden min-w-0 flex-1 md:block">
            <SiteHeaderSearch
              id="header-search"
              className="w-full max-w-xl rounded-full border border-transparent bg-[#F5F5F4] px-4 py-2.5 text-sm text-[#111111] placeholder:text-gray-400 outline-none transition focus:border-gray-200 focus:bg-white focus:ring-2 focus:ring-[#FF6B2B]/20 lg:mx-auto lg:block"
            />
          </div>

          <div className="ml-auto shrink-0">
            <SiteHeaderNav />
          </div>
        </div>

        <div className="pb-3 md:hidden">
          <SiteHeaderSearch
            id="header-search-mobile"
            className="w-full rounded-full border border-transparent bg-[#F5F5F4] px-4 py-2.5 text-sm text-[#111111] placeholder:text-gray-400 outline-none transition focus:border-gray-200 focus:bg-white focus:ring-2 focus:ring-[#FF6B2B]/20"
          />
        </div>
      </div>
    </header>
  );
}
