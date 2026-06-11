import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { createAuthServerSupabase } from "@/lib/supabase-server-auth";
import { ChatView } from "@/components/messages/chat-view";
import type { MessageRow, ConversationParticipant } from "@/lib/types/messaging";

export const metadata: Metadata = {
  title: "Conversación — Fixter",
};

type PageProps = {
  params: Promise<{ conversationId: string }>;
};

type RawConversation = {
  id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  listing: {
    id: string;
    title: string;
    images: string[] | null;
    price: number;
  } | null;
  buyer: {
    id: string;
    username: string;
    avatar_url: string | null;
    location: string | null;
  } | null;
  seller: {
    id: string;
    username: string;
    avatar_url: string | null;
    location: string | null;
  } | null;
};

export default async function ConversationPage({ params }: PageProps) {
  const { conversationId } = await params;

  const supabase = await createAuthServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/messages/${conversationId}`);
  }

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_REGEX.test(conversationId)) notFound();

  const { data: rawConv } = await supabase
    .from("conversations")
    .select(
      `id, buyer_id, seller_id, created_at,
       listing:listings(id, title, images, price),
       buyer:profiles!buyer_id(id, username, avatar_url, location),
       seller:profiles!seller_id(id, username, avatar_url, location)`,
    )
    .eq("id", conversationId)
    .maybeSingle();

  const conv = rawConv as unknown as RawConversation | null;

  if (
    !conv ||
    !conv.listing ||
    !conv.buyer ||
    !conv.seller ||
    (conv.buyer_id !== user.id && conv.seller_id !== user.id)
  ) {
    notFound();
  }

  const { data: rawMessages } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, body, offer_amount, read_at, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  const initialMessages: MessageRow[] = (rawMessages ?? []) as MessageRow[];

  // Marcar como leídos los mensajes del otro usuario ya existentes
  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", user.id)
    .is("read_at", null);

  const isBuyer = conv.buyer_id === user.id;
  const otherUser: ConversationParticipant = isBuyer
    ? { id: conv.seller.id, username: conv.seller.username, avatar_url: conv.seller.avatar_url, location: conv.seller.location }
    : { id: conv.buyer.id, username: conv.buyer.username, avatar_url: conv.buyer.avatar_url, location: conv.buyer.location };

  const listing = {
    id: conv.listing.id,
    title: conv.listing.title,
    first_image: conv.listing.images?.[0] ?? null,
    price: conv.listing.price,
  };

  return (
    <ChatView
      conversationId={conversationId}
      currentUserId={user.id}
      isBuyer={isBuyer}
      otherUser={otherUser}
      listing={listing}
      initialMessages={initialMessages}
    />
  );
}
