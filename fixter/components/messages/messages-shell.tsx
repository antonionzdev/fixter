"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatRelativeTime } from "@/lib/format";

export type ConversationSummary = {
  id: string;
  otherUser: { username: string; avatar_url: string | null };
  listingTitle: string;
  firstImage: string | null;
  lastMessageBody: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
};

type MessagesShellProps = {
  conversations: ConversationSummary[];
  children: React.ReactNode;
};

export function MessagesShell({ conversations, children }: MessagesShellProps) {
  const pathname = usePathname();
  // /messages → list; /messages/[id] → chat
  const isInChat = pathname !== "/messages";
  const activeConvId = isInChat ? (pathname.split("/")[2] ?? null) : null;

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* ── Sidebar ── */}
      <aside
        className={[
          "flex-col overflow-y-auto border-r border-zinc-200 bg-white",
          "w-full md:w-80 md:shrink-0",
          isInChat ? "hidden md:flex" : "flex",
        ].join(" ")}
      >
        <div className="shrink-0 border-b border-zinc-100 px-4 py-3">
          <h1 className="text-base font-semibold text-zinc-900">Mensajes</h1>
        </div>

        {conversations.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-12 text-center">
            <svg
              className="h-8 w-8 text-zinc-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="text-sm text-zinc-500">Sin conversaciones aún</p>
            <Link
              href="/"
              className="mt-1 text-xs text-[#FF6B2B] transition hover:underline"
            >
              Ver anuncios
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {conversations.map((conv) => {
              const isActive = conv.id === activeConvId;
              return (
                <li key={conv.id}>
                  <Link
                    href={`/messages/${conv.id}`}
                    className={[
                      "flex items-center gap-3 px-4 py-3.5 transition-colors",
                      isActive
                        ? "bg-zinc-100"
                        : "hover:bg-zinc-50",
                    ].join(" ")}
                  >
                    {/* Avatar del otro usuario */}
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-zinc-200">
                      {conv.otherUser.avatar_url ? (
                        <Image
                          src={conv.otherUser.avatar_url}
                          alt={conv.otherUser.username}
                          fill
                          className="object-cover"
                          sizes="40px"
                          unoptimized
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-zinc-600">
                          {conv.otherUser.username.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Texto */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-1">
                        <p
                          className={`truncate text-sm ${
                            conv.unreadCount > 0
                              ? "font-semibold text-zinc-900"
                              : "font-medium text-zinc-700"
                          }`}
                        >
                          {conv.otherUser.username}
                        </p>
                        {conv.lastMessageAt && (
                          <span className="shrink-0 text-xs text-zinc-400">
                            {formatRelativeTime(conv.lastMessageAt)}
                          </span>
                        )}
                      </div>

                      <p className="truncate text-xs text-zinc-500">
                        {conv.listingTitle}
                      </p>

                      <p
                        className={`mt-0.5 truncate text-xs ${
                          conv.unreadCount > 0
                            ? "font-medium text-zinc-900"
                            : "text-zinc-400"
                        }`}
                      >
                        {conv.lastMessageBody ?? "Sin mensajes aún"}
                      </p>
                    </div>

                    {/* Badge no leídos */}
                    {conv.unreadCount > 0 && (
                      <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#FF6B2B] px-1.5 text-xs font-semibold text-white">
                        {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </aside>

      {/* ── Panel derecho ── */}
      <main
        className={[
          "flex-1 flex flex-col overflow-hidden bg-zinc-50",
          isInChat ? "flex" : "hidden md:flex",
        ].join(" ")}
      >
        {children}
      </main>
    </div>
  );
}
