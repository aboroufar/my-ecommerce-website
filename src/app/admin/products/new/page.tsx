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
  const [{ data: categories }, { data: tags }, { data: brands }, { data: packageProfilesRaw }] =
    await Promise.all([
      supabase.from("categories").select("id, name").order("name", { ascending: true }),
      supabase.from("tags").select("id, name").order("name", { ascending: true }),
      supabase.from("brands").select("id, name").order("name", { ascending: true }),
      supabase
        .from("package_profiles")
        .select("id, name, length_cm, width_cm, height_cm, item_weight_grams")
        .order("name", { ascending: true }),
    ]);

  const packageProfiles = (packageProfilesRaw ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    lengthCm: p.length_cm,
    widthCm: p.width_cm,
    heightCm: p.height_cm,
    itemWeightGrams: p.item_weight_grams,
  }));

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">New product</h1>
      <ProductForm
        action={createProduct}
        error={error}
        submitLabel="Create product"
        categories={categories ?? []}
        tags={tags ?? []}
        brands={brands ?? []}
        packageProfiles={packageProfiles}
      />
    </div>
  );
}
