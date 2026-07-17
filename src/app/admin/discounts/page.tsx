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
    .select("id, code, type, value, active, expires_at")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Discount codes</h1>
      <p className="mt-2 max-w-lg text-sm text-muted">
        Codes shoppers can redeem on the payment page for a percentage or
        fixed amount off their subtotal.
      </p>

      {error && (
        <p className="mt-6 max-w-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-8">
        <DiscountCodesManager codes={codes ?? []} />
      </div>
    </div>
  );
}
