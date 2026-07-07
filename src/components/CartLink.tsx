"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";

export function CartLink() {
  const { itemCount } = useCart();

  return (
    <Link
      href="/cart"
      className="relative flex items-center gap-1.5 transition-colors hover:text-foreground"
    >
      Cart
      {itemCount > 0 && (
        <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-medium text-background">
          {itemCount}
        </span>
      )}
    </Link>
  );
}
