import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/ProductCard";

export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("wishlist_items")
    .select(
      "product_id, products(id, name, slug, description, price_cents, compare_at_price_cents, currency, stock_qty, is_popular, product_images(url, alt_text, sort_order), product_categories(categories(name, slug, parent_id)))"
    )
    .order("created_at", { ascending: false });

  const products = (data ?? [])
    .map((row) => row.products)
    .filter((p): p is NonNullable<typeof p> => p !== null);

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Wishlist</h1>

      {products.length === 0 ? (
        <p className="mt-6 text-sm text-muted">
          Nothing saved yet. Tap the heart on any product to add it here.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
