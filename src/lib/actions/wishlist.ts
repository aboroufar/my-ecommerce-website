"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Toggles a product's wishlist membership for the signed-in customer and
 * returns the resulting state, so the client can update the heart icon
 * immediately without a full page navigation. Silently no-ops (returns
 * false) if the caller isn't signed in -- the UI is responsible for
 * routing to sign-in when that happens.
 */
export async function toggleWishlistItem(
  productId: string
): Promise<{ inWishlist: boolean; signedIn: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { inWishlist: false, signedIn: false };

  const { data: existing } = await supabase
    .from("wishlist_items")
    .select("id")
    .eq("client_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    await supabase.from("wishlist_items").delete().eq("id", existing.id);
    revalidatePath("/account/wishlist");
    return { inWishlist: false, signedIn: true };
  }

  // RLS requires client_id = auth.uid(), which also means this insert
  // simply fails for anyone trying to write another client's wishlist.
  await supabase
    .from("wishlist_items")
    .insert({ client_id: user.id, product_id: productId });
  revalidatePath("/account/wishlist");
  return { inWishlist: true, signedIn: true };
}
