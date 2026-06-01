"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";

type UserNavState = {
  username: string;
  avatarUrl: string | null;
  profileUrl: string;
};

const navLinkClass =
  "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-[#111111]";

export function SiteHeaderNav() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userNav, setUserNav] = useState<UserNavState | null>(null);

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
      <div className="flex items-center gap-3">
        <div className="h-9 w-16 animate-pulse rounded-lg bg-gray-100" />
        <div className="h-9 w-20 animate-pulse rounded-lg bg-gray-100" />
      </div>
    );
  }

  if (!userNav) {
    return (
      <nav className="flex items-center gap-3 sm:gap-5">
        <Link href="/login" className={navLinkClass}>
          Iniciar sesión
        </Link>
        <Link
          href="/register"
          className="whitespace-nowrap rounded-lg bg-[#111111] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#333333]"
        >
          Registrarse
        </Link>
      </nav>
    );
  }

  const initial = userNav.username.charAt(0).toUpperCase();

  return (
    <nav className="flex items-center gap-2 sm:gap-4 lg:gap-6">
      <Link
        href={userNav.profileUrl}
        className="hidden items-center gap-2.5 rounded-lg px-2 py-1.5 transition hover:bg-gray-50 sm:flex"
      >
        {userNav.avatarUrl ? (
          <div className="relative h-9 w-9 overflow-hidden rounded-full bg-gray-100 ring-2 ring-white">
            <Image
              src={userNav.avatarUrl}
              alt={userNav.username}
              fill
              className="object-cover"
              sizes="36px"
              unoptimized
            />
          </div>
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-600 ring-2 ring-white">
            {initial}
          </div>
        )}
        <span className="max-w-[100px] truncate text-sm font-medium text-[#111111] lg:max-w-[140px]">
          {userNav.username}
        </span>
      </Link>

      <span className="hidden h-6 w-px bg-gray-200 sm:block" aria-hidden />

      <Link href="/dashboard" className={`${navLinkClass} hidden sm:inline-flex`}>
        Mis anuncios
      </Link>

      <Link href="/messages" className={`${navLinkClass} hidden sm:inline-flex`}>
        Mensajes
      </Link>

      <Link
        href="/publish"
        className="whitespace-nowrap rounded-lg bg-[#FF6B2B] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#FF8C57]"
      >
        <span className="hidden sm:inline">Publicar anuncio</span>
        <span className="sm:hidden">Publicar</span>
      </Link>

      <button type="button" onClick={handleSignOut} className={navLinkClass}>
        <span className="hidden lg:inline">Cerrar sesión</span>
        <span className="lg:hidden">Salir</span>
      </button>
    </nav>
  );
}
