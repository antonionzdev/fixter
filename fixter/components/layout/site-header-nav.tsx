"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { useUnreadCount } from "@/hooks/useUnreadCount";

type UserNavState = {
  username: string;
  avatarUrl: string | null;
  profileUrl: string;
};

const navLinkClass =
  "whitespace-nowrap px-3 py-2 text-sm font-medium text-[var(--color-gray-500)] transition-colors duration-200 hover:text-[var(--color-black)]";

const loginClass =
  "whitespace-nowrap rounded-full border border-[var(--color-gray-200)] px-4 py-2 text-sm font-medium text-[var(--color-gray-700)] transition-[color,border-color,background-color,transform] duration-200 hover:border-[var(--color-gray-300)] hover:bg-[var(--color-gray-50)] hover:text-[var(--color-black)] active:scale-[0.97]";

const ctaClass =
  "whitespace-nowrap rounded-full bg-[var(--color-brand-orange)] px-5 py-2.5 text-sm font-semibold text-white transition-[transform,background-color,box-shadow] duration-200 hover:bg-[#e8601f] hover:shadow-[0_4px_14px_rgb(255_107_43_/_0.30)] active:scale-[0.97]";

export function SiteHeaderNav() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userNav, setUserNav] = useState<UserNavState | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const unreadCount = useUnreadCount();

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    const supabase = getSupabase();

    async function loadProfile(sessionUser: {
      id: string;
      email?: string;
    }) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", sessionUser.id)
        .maybeSingle();

      const profileName =
        profile && typeof profile.username === "string" && profile.username
          ? profile.username
          : null;

      const displayName =
        profileName || sessionUser.email?.split("@")[0] || "Usuario";

      setUserNav({
        username: displayName,
        profileUrl: profileName
          ? `/profile/${encodeURIComponent(profileName)}`
          : "/dashboard",
        avatarUrl:
          profile && typeof profile.avatar_url === "string"
            ? profile.avatar_url
            : null,
      });
      setLoading(false);
    }

    async function loadUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setUserNav(null);
        setLoading(false);
        return;
      }

      await loadProfile(session.user);
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setUserNav(null);
        setLoading(false);
        return;
      }

      void loadProfile(session.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    setUserNav(null);
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-9 w-24 animate-pulse rounded-full bg-[var(--color-gray-100)]" />
        <div className="h-9 w-24 animate-pulse rounded-full bg-[var(--color-gray-100)]" />
      </div>
    );
  }

  if (!userNav) {
    return (
      <nav className="flex items-center gap-2">
        <Link
          href="/login"
          className={loginClass}
          style={{ transitionTimingFunction: "var(--ease-out)" }}
        >
          Iniciar sesión
        </Link>
        <Link
          href="/publish"
          className={ctaClass}
          style={{ transitionTimingFunction: "var(--ease-out)" }}
        >
          Publicar
        </Link>
      </nav>
    );
  }

  const initial = userNav.username.charAt(0).toUpperCase();

  return (
    <nav className="flex items-center gap-1 sm:gap-2 lg:gap-3">
      {/* Avatar + nombre — solo desktop (sm+) */}
      <Link
        href={userNav.profileUrl}
        className="hidden items-center gap-2.5 rounded-lg px-2 py-1.5 transition-[background-color] duration-200 hover:bg-[var(--color-gray-50)] sm:flex"
        style={{ transitionTimingFunction: "var(--ease-out)" }}
      >
        {userNav.avatarUrl ? (
          <div className="relative h-8 w-8 overflow-hidden rounded-full bg-[var(--color-gray-100)] ring-2 ring-white">
            <Image
              src={userNav.avatarUrl}
              alt={userNav.username}
              fill
              className="object-cover"
              sizes="32px"
              unoptimized
            />
          </div>
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-gray-100)] text-xs font-semibold text-[var(--color-gray-600)] ring-2 ring-white">
            {initial}
          </div>
        )}
        <span className="max-w-[90px] truncate text-sm font-medium text-[var(--color-gray-800)] lg:max-w-[130px]">
          {userNav.username}
        </span>
      </Link>

      <span className="hidden h-5 w-px bg-[var(--color-gray-200)] sm:block" aria-hidden />

      <Link href="/dashboard" className={`${navLinkClass} hidden sm:inline-flex`}
        style={{ transitionTimingFunction: "var(--ease-out)" }}>
        Mis anuncios
      </Link>

      <Link
        href="/messages"
        className={`${navLinkClass} relative hidden sm:inline-flex`}
        style={{ transitionTimingFunction: "var(--ease-out)" }}
      >
        Mensajes
        {unreadCount > 0 && (
          <span className="absolute right-0 top-0 flex h-4 min-w-4 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#FF6B2B] px-1 text-[9px] font-bold text-white leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Link>

      {/* CTA Publicar */}
      <Link
        href="/publish"
        className={ctaClass}
        style={{ transitionTimingFunction: "var(--ease-out)" }}
      >
        <span className="hidden sm:inline">Publicar anuncio</span>
        <span className="sm:hidden">Publicar</span>
      </Link>

      <button
        type="button"
        onClick={handleSignOut}
        className={`${navLinkClass} hidden lg:inline-flex`}
        style={{ transitionTimingFunction: "var(--ease-out)" }}
      >
        Salir
      </button>

      {/* Hamburger menu — solo móvil (< sm) */}
      <div className="relative sm:hidden" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-gray-600)] transition-[background-color,color] duration-200 hover:bg-[var(--color-gray-50)] hover:text-[var(--color-black)]"
          style={{ transitionTimingFunction: "var(--ease-out)" }}
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? (
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M4 4 L14 14 M14 4 L4 14" />
            </svg>
          ) : (
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M3 5 H15 M3 9 H15 M3 13 H15" />
            </svg>
          )}
        </button>

        {/* Dropdown menu */}
        {menuOpen && (
          <div className="dropdown-menu absolute right-0 top-[calc(100%+8px)] z-50 w-56 overflow-hidden rounded-xl border border-[var(--color-gray-100)] bg-white shadow-[0_8px_32px_rgb(0_0_0_/_0.10)]">
            {/* Perfil */}
            <Link
              href={userNav.profileUrl}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 transition-[background-color] duration-150 hover:bg-[var(--color-gray-50)]"
              style={{ transitionTimingFunction: "var(--ease-out)" }}
            >
              {userNav.avatarUrl ? (
                <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-[var(--color-gray-100)]">
                  <Image
                    src={userNav.avatarUrl}
                    alt={userNav.username}
                    fill
                    className="object-cover"
                    sizes="28px"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-gray-100)] text-xs font-semibold text-[var(--color-gray-600)]">
                  {initial}
                </div>
              )}
              <span className="truncate text-sm font-medium text-[var(--color-gray-800)]">
                {userNav.username}
              </span>
            </Link>

            <div className="mx-4 h-px bg-[var(--color-gray-100)]" />

            <Link
              href="/dashboard"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-2.5 text-sm text-[var(--color-gray-700)] transition-[background-color,color] duration-150 hover:bg-[var(--color-gray-50)] hover:text-[var(--color-black)]"
              style={{ transitionTimingFunction: "var(--ease-out)" }}
            >
              Mis anuncios
            </Link>
            <Link
              href="/messages"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--color-gray-700)] transition-[background-color,color] duration-150 hover:bg-[var(--color-gray-50)] hover:text-[var(--color-black)]"
              style={{ transitionTimingFunction: "var(--ease-out)" }}
            >
              Mensajes
              {unreadCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FF6B2B] px-1.5 text-[10px] font-bold text-white leading-none">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>

            <div className="mx-4 h-px bg-[var(--color-gray-100)]" />

            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                void handleSignOut();
              }}
              className="w-full px-4 py-2.5 text-left text-sm text-[var(--color-gray-500)] transition-[background-color,color] duration-150 hover:bg-[var(--color-gray-50)] hover:text-[var(--color-black)]"
              style={{ transitionTimingFunction: "var(--ease-out)" }}
            >
              Salir
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
