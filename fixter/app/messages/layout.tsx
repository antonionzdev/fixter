import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { createAuthServerSupabase } from "@/lib/supabase-server-auth";
import { MessagesShell } from "@/components/messages/messages-shell";
import type { ConversationSummary } from "@/components/messages/messages-shell";

type RawConvRow = {
  id: string;
  buyer_id: string;
  seller_id: string;
  last_message_at: string | null;
  listing: { title: string; images: string[] | null } | null;
  buyer: { username: string; avatar_url: string | null } | null;
  seller: { username: string; avatar_url: string | null } | null;
};

type RawMessage = {
  conversation_id: string;
  body: string;
  sender_id: string;
  read_at: string | null;
};

export default async function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createAuthServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/messages");
  }

  const { data: rawConvs } = await supabase
    .from("conversations")
    .select(
      `id, buyer_id, seller_id, last_message_at,
       listing:listings(title, images),
       buyer:profiles!buyer_id(username, avatar_url),
       seller:profiles!seller_id(username, avatar_url)`,
    )
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  const rawConversations = (rawConvs ?? []) as unknown as RawConvRow[];
  const conversationIds = rawConversations.map((c) => c.id);

  let allMessages: RawMessage[] = [];
  if (conversationIds.length > 0) {
    const { data: msgs } = await supabase
      .from("messages")
      .select("conversation_id, body, sender_id, read_at")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: false })
      .limit(500);
    allMessages = (msgs ?? []) as RawMessage[];
  }

  const lastMessageByConv = new Map<string, RawMessage>();
  const unreadCountByConv = new Map<string, number>();
  for (const msg of allMessages) {
    if (!lastMessageByConv.has(msg.conversation_id)) {
      lastMessageByConv.set(msg.conversation_id, msg);
    }
    if (msg.read_at === null && msg.sender_id !== user.id) {
      unreadCountByConv.set(
        msg.conversation_id,
        (unreadCountByConv.get(msg.conversation_id) ?? 0) + 1,
      );
    }
  }

  const conversations: ConversationSummary[] = rawConversations.map((conv) => {
    const isBuyer = conv.buyer_id === user.id;
    const other = isBuyer ? conv.seller : conv.buyer;
    const lastMsg = lastMessageByConv.get(conv.id);
    return {
      id: conv.id,
      otherUser: {
        username: other?.username ?? "Usuario",
        avatar_url: other?.avatar_url ?? null,
      },
      listingTitle: conv.listing?.title ?? "Anuncio eliminado",
      firstImage: conv.listing?.images?.[0] ?? null,
      lastMessageBody: lastMsg?.body ?? null,
      lastMessageAt: conv.last_message_at,
      unreadCount: unreadCountByConv.get(conv.id) ?? 0,
    };
  });

  return (
    <div className="flex h-dvh flex-col overflow-hidden font-sans text-zinc-900">
      <div className="shrink-0">
        <SiteHeader />
      </div>
      <MessagesShell conversations={conversations}>{children}</MessagesShell>
    </div>
  );
}
