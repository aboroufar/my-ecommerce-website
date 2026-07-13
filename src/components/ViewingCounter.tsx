"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * "N people are currently viewing this item" -- a real count, driven by
 * Supabase Realtime Presence on a per-product channel. Each open tab on
 * this PDP tracks itself with a random per-tab key, and the displayed
 * count is the number of distinct presence keys currently synced on the
 * channel. Hidden entirely below 2 viewers (i.e. don't show "1 person
 * viewing" to the one person viewing it -- that's not useful social proof
 * and just reveals the mechanism).
 */
export function ViewingCounter({ productId }: { productId: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`viewing:${productId}`, {
      config: { presence: { key: crypto.randomUUID() } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setCount(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [productId]);

  if (count < 2) return null;

  return (
    <p className="mt-4 flex items-center gap-2 text-sm text-muted">
      <EyeIcon />
      {count} people are currently viewing this item
    </p>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
      <path
        d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
