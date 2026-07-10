import { createProduct } from "@/lib/actions/products";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = createAdminClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, parent_id")
    .order("name", { ascending: true });

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">New product</h1>
      <ProductForm
        action={createProduct}
        error={error}
        submitLabel="Create product"
        categories={categories ?? []}
      />
    </div>
  );
}
