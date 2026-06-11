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
  const isInChat = pathname !== "/messages";
  const activeConvId = isInChat ? (pathname.split("/")[2] ?? null) : null;

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* ── Sidebar ── */}
      <aside
        className={[
          "flex-col overflow-y-auto border-r border-[#EEEEEE] bg-white",
          "w-full md:w-[340px] md:shrink-0",
          isInChat ? "hidden md:flex" : "flex",
        ].join(" ")}
      >
        <div className="shrink-0 border-b border-[#EEEEEE] px-4 py-4">
          <h1 className="text-base font-bold text-zinc-900">Mensajes</h1>
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
          <ul>
            {conversations.map((conv) => {
              const isActive = conv.id === activeConvId;
              const initial = conv.otherUser.username.charAt(0).toUpperCase();

              return (
                <li key={conv.id}>
                  <Link
                    href={`/messages/${conv.id}`}
                    className={[
                      "flex items-start gap-3 py-4 border-b border-[#F0F0F0] border-l-[3px] pl-[13px] pr-4 transition-colors",
                      isActive
                        ? "bg-[#F5F5F5] border-l-[#FF6B2B]"
                        : "border-l-transparent hover:bg-[#FAFAFA]",
                    ].join(" ")}
                  >
                    {/* Avatar */}
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#FF6B2B]">
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
                        <span className="flex h-full w-full items-center justify-center text-sm font-bold text-white">
                          {initial}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      {/* Top row: name + timestamp/badge */}
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-zinc-900">
                          {conv.otherUser.username}
                        </p>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          {conv.lastMessageAt && (
                            <span className="text-xs text-[#999]">
                              {formatRelativeTime(conv.lastMessageAt)}
                            </span>
                          )}
                          {conv.unreadCount > 0 && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FF6B2B] px-1.5 text-[11px] font-bold text-white leading-none">
                              {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Listing title */}
                      <p className="mt-0.5 truncate text-xs text-zinc-500">
                        {conv.listingTitle}
                      </p>

                      {/* Last message */}
                      <p
                        className={`mt-0.5 truncate text-xs ${
                          conv.unreadCount > 0
                            ? "font-medium text-zinc-700"
                            : "text-[#999]"
                        }`}
                      >
                        {conv.lastMessageBody ?? "Sin mensajes aún"}
                      </p>
                    </div>
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
          "flex-1 flex flex-col overflow-hidden bg-[#F7F7F7]",
          isInChat ? "flex" : "hidden md:flex",
        ].join(" ")}
      >
        {children}
      </main>
    </div>
  );
}
