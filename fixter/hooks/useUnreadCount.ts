"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";

/**
 * Returns the total unread message count for the authenticated user across
 * all their conversations. Subscribes to Realtime INSERT and UPDATE events
 * so the count stays live without polling.
 *
 * Extracted into its own hook to facilitate future migration to push
 * notifications — callers only consume the count, not the implementation.
 */
export function useUnreadCount(): number {
  const [userId, setUserId] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  // Track auth state
  useEffect(() => {
    const supabase = getSupabase();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch unread count and subscribe to changes
  useEffect(() => {
    if (!userId) {
      setCount(0);
      return;
    }

    const supabase = getSupabase();

    async function fetchCount() {
      const { data: convs } = await supabase
        .from("conversations")
        .select("id")
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);

      if (!convs?.length) {
        setCount(0);
        return;
      }

      const ids = convs.map((c: { id: string }) => c.id);
      const { count: unread } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .in("conversation_id", ids)
        .is("read_at", null)
        .neq("sender_id", userId);

      setCount(unread ?? 0);
    }

    void fetchCount();

    const channel = supabase
      .channel(`unread-count:${userId}`)
      .on(
        "postgres_changes",
        // Filter by sender_id to only fire on messages sent TO this user.
        // The re-fetch already returns the correct count via RLS; this prevents
        // triggering re-fetches on messages the user sent themselves.
        { event: "INSERT", schema: "public", table: "messages", filter: `sender_id=neq.${userId}` },
        () => { void fetchCount(); },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `sender_id=neq.${userId}` },
        () => { void fetchCount(); },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return count;
}
