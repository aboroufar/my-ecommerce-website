import { createAdminClient } from "@/lib/supabase/admin";
import { BrandsManager } from "@/components/admin/BrandsManager";

export const dynamic = "force-dynamic";

export default async function AdminBrandsPage() {
  const supabase = createAdminClient();
  const { data: brands } = await supabase
    .from("brands")
    .select("id, name, logo_url, link_url, sort_order")
    .order("sort_order", { ascending: true });

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Brands</h1>
      <p className="mt-2 max-w-lg text-sm text-muted">
        Brands shown in the homepage brand bar. The bar is hidden entirely
        until at least one brand is added.
      </p>

      <div className="mt-8">
        <BrandsManager brands={brands ?? []} />
      </div>
    </div>
  );
}
