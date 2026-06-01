"use client";

import { useEffect } from "react";

const KEY = "fixter_recently_viewed";
const MAX = 8;

export function RecentlyViewedTracker({ listingId }: { listingId: string }) {
  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY);
      const ids: string[] = stored ? JSON.parse(stored) : [];
      const updated = [listingId, ...ids.filter((id) => id !== listingId)].slice(0, MAX);
      localStorage.setItem(KEY, JSON.stringify(updated));
    } catch {
      // localStorage no disponible (modo privado, etc.)
    }
  }, [listingId]);

  return null;
}
