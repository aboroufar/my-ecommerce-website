import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createDiscountCode } from "@/lib/actions/discounts";
import { DiscountForm } from "@/components/admin/DiscountForm";
import type { DiscountType } from "@/lib/discounts";

const VALID_TYPES = ["amount_off_products", "buy_x_get_y", "amount_off_order", "free_shipping"];

export const dynamic = "force-dynamic";

export default async function NewDiscountPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; error?: string }>;
}) {
  const { type, error } = await searchParams;
  if (!type || !VALID_TYPES.includes(type)) notFound();

  const supabase = createAdminClient();
  const [{ data: categories }, { data: products }, { data: segments }, { data: tags }] =
    await Promise.all([
      supabase.from("categories").select("id, name").order("name", { ascending: true }),
      supabase.from("products").select("id, name, sku").order("name", { ascending: true }),
      supabase.from("client_segments").select("id, name").order("name", { ascending: true }),
      supabase.from("tags").select("id, name").order("name", { ascending: true }),
    ]);

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Create discount</h1>

      {error && (
        <p className="mt-6 max-w-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-8">
        <DiscountForm
          discountType={type as DiscountType}
          categories={categories ?? []}
          products={products ?? []}
          segments={segments ?? []}
          tags={tags ?? []}
          action={createDiscountCode}
        />
      </div>
    </div>
  );
}
