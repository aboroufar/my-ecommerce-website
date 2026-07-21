import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateDiscountCode } from "@/lib/actions/discounts";
import { DiscountForm } from "@/components/admin/DiscountForm";
import type { DiscountConfig, DiscountType } from "@/lib/discounts";

export const dynamic = "force-dynamic";

export default async function EditDiscountPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = createAdminClient();

  const [{ data: discount }, { data: categories }, { data: products }, { data: segments }] =
    await Promise.all([
      supabase
        .from("discount_codes")
        .select("id, code, discount_type, config, active, expires_at")
        .eq("id", id)
        .single(),
      supabase.from("categories").select("id, name").order("name", { ascending: true }),
      supabase.from("products").select("id, name, sku").order("name", { ascending: true }),
      supabase.from("client_segments").select("id, name").order("name", { ascending: true }),
    ]);

  if (!discount) notFound();

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Edit discount</h1>

      {error && (
        <p className="mt-6 max-w-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-8">
        <DiscountForm
          discountType={discount.discount_type as DiscountType}
          categories={categories ?? []}
          products={products ?? []}
          segments={segments ?? []}
          initialValues={{
            code: discount.code,
            active: discount.active,
            expires_at: discount.expires_at,
            config: discount.config as unknown as DiscountConfig,
          }}
          action={updateDiscountCode.bind(null, id)}
        />
      </div>
    </div>
  );
}
