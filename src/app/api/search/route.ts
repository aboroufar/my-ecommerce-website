import { NextResponse } from "next/server";
import { searchProducts } from "@/lib/products";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const products = q.trim() ? await searchProducts(q) : [];

  return NextResponse.json({
    products: products.slice(0, 6).map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price_cents: product.price_cents,
      compare_at_price_cents: product.compare_at_price_cents,
      currency: product.currency,
      imageUrl: product.product_images[0]?.url ?? null,
    })),
    total: products.length,
  });
}
