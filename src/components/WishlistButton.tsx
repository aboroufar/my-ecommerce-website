"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { useWishlist } from "./WishlistProvider";

/** Standalone heart toggle for the PDP -- same useWishlist hook as ProductCard's icon, sized for standing next to Add to cart rather than floating over a thumbnail. */
export function WishlistButton({ productId }: { productId: string }) {
  const t = useTranslations("wishlistButton");
  const wishlist = useWishlist();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const wishlisted = wishlist.ids.has(productId);

  async function handleToggle() {
    if (pending) return;
    setPending(true);
    const result = await wishlist.toggle(productId);
    setPending(false);
    if (!result.signedIn) {
      router.push("/account");
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={wishlisted ? t("removeFromWishlist") : t("addToWishlist")}
      aria-pressed={wishlisted}
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors ${
        wishlisted
          ? "border-accent bg-accent text-background"
          : "border-line bg-background text-foreground hover:border-accent hover:text-accent"
      }`}
    >
      <HeartIcon filled={wishlisted} />
    </button>
  );
}

function HeartIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-5 w-5"
    >
      <path
        d="M12 20s-7-4.4-9.5-8.8C1 8 2.5 4.5 6 4.5c2 0 3.5 1.2 4.5 2.8 1-1.6 2.5-2.8 4.5-2.8 3.5 0 5 3.5 3.5 6.7C19 15.6 12 20 12 20Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
