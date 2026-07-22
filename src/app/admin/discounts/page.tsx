import { createAdminClient } from "@/lib/supabase/admin";
import { DiscountCodesManager } from "@/components/admin/DiscountCodesManager";

export const dynamic = "force-dynamic";

export default async function AdminDiscountsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = createAdminClient();

  const { data: codes } = await supabase
    .from("discount_codes")
    .select("id, code, discount_type, config, active, expires_at, discount_label_links(discount_labels(name))")
    .order("created_at", { ascending: false });

  const rows = (codes ?? []).map((c) => ({
    ...c,
    tags: c.discount_label_links.map((dl) => dl.discount_labels?.name).filter((n): n is string => !!n),
  }));

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Discounts</h1>
      <p className="mt-2 max-w-lg text-sm text-muted">
        Percentage or fixed-amount discounts, buy-X-get-Y offers, and free
        shipping -- redeemed by code on the cart page or applied
        automatically when a client is eligible.
      </p>

      {error && (
        <p className="mt-6 max-w-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-8">
        <DiscountCodesManager codes={rows} />
      </div>
    </div>
  );
}
