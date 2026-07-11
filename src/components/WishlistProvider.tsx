"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { toggleWishlistItem } from "@/lib/actions/wishlist";

interface WishlistContextValue {
  ids: Set<string>;
  loaded: boolean;
  toggle: (productId: string) => Promise<{ signedIn: boolean }>;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

/**
 * Fetches the signed-in customer's wishlist product ids client-side (not
 * server-side in the page) so pages using ProductCard can stay statically
 * generated -- a server-side cookies() read would force them dynamic on
 * every request, the same trap AGENTS.md flags for the header.
 */
export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function loadWishlist(userId: string | undefined) {
      if (!userId) {
        setIds(new Set());
        setLoaded(true);
        return;
      }
      const { data } = await supabase
        .from("wishlist_items")
        .select("product_id")
        .eq("customer_id", userId);
      setIds(new Set((data ?? []).map((row) => row.product_id)));
      setLoaded(true);
    }

    supabase.auth.getUser().then(({ data }) => loadWishlist(data.user?.id));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      loadWishlist(session?.user?.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = useMemo<WishlistContextValue>(
    () => ({
      ids,
      loaded,
      toggle: async (productId: string) => {
        const result = await toggleWishlistItem(productId);
        if (!result.signedIn) return { signedIn: false };
        setIds((prev) => {
          const next = new Set(prev);
          if (result.inWishlist) next.add(productId);
          else next.delete(productId);
          return next;
        });
        return { signedIn: true };
      },
    }),
    [ids, loaded]
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within a WishlistProvider");
  return ctx;
}
