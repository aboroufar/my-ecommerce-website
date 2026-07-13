import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateProduct, deleteProduct } from "@/lib/actions/products";
import { ProductForm } from "@/components/admin/ProductForm";
import type { ProductOptionsDefaults } from "@/components/admin/ProductOptionsManager";
import type { ProductHighlightsDefaults } from "@/components/admin/ProductHighlightsManager";
import type { HighlightIconKey } from "@/components/highlightIcons";
import type { ProductStatus } from "@/lib/supabase/types";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const supabase = createAdminClient();
  const [{ data: product }, { data: categories }, { data: tags }] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, name, slug, description, price_cents, compare_at_price_cents, sku, stock_qty, status, is_popular, product_images(url, sort_order), product_categories(category_id), product_option_types(id, name, sort_order, product_option_values(id, label, sort_order)), product_variants(id, price_cents, stock_qty, sku, weight_text, dimensions_text, product_variant_options(option_value_id)), product_highlights(id, label, icon, sort_order), product_tags(tag_id)"
      )
      .eq("id", id)
      .single(),
    supabase
      .from("categories")
      .select("id, name, parent_id")
      .order("name", { ascending: true }),
    supabase.from("tags").select("id, name").order("name", { ascending: true }),
  ]);

  if (!product) notFound();

  const image = [...product.product_images].sort(
    (a, b) => a.sort_order - b.sort_order
  )[0];
  const categoryIds = product.product_categories.map((pc) => pc.category_id);
  const tagIds = product.product_tags.map((pt) => pt.tag_id);

  // Translate the fetched option types/values/variants into the shape
  // ProductOptionsManager works with (value indexes rather than DB ids,
  // matching the format setProductOptions expects on save).
  const sortedTypes = [...product.product_option_types].sort(
    (a, b) => a.sort_order - b.sort_order
  );
  const valueIndexById = new Map<string, { typeIndex: number; valueIndex: number }>();
  const optionsDefaults: ProductOptionsDefaults = {
    optionTypes: sortedTypes.map((type, typeIndex) => {
      const sortedValues = [...type.product_option_values].sort(
        (a, b) => a.sort_order - b.sort_order
      );
      sortedValues.forEach((v, valueIndex) => {
        valueIndexById.set(v.id, { typeIndex, valueIndex });
      });
      return { name: type.name, values: sortedValues.map((v) => ({ label: v.label })) };
    }),
    variants: product.product_variants.map((variant) => {
      const positions = variant.product_variant_options
        .map((o) => valueIndexById.get(o.option_value_id))
        .filter((p): p is { typeIndex: number; valueIndex: number } => !!p)
        .sort((a, b) => a.typeIndex - b.typeIndex);
      return {
        valueIndexes: positions.map((p) => p.valueIndex),
        price: String(variant.price_cents / 100),
        stock_qty: String(variant.stock_qty),
        sku: variant.sku ?? "",
        weight_text: variant.weight_text ?? "",
        dimensions_text: variant.dimensions_text ?? "",
      };
    }),
  };

  const highlightsDefaults: ProductHighlightsDefaults = [...product.product_highlights]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((h) => ({ label: h.label, icon: h.icon as HighlightIconKey }));

  const updateWithId = updateProduct.bind(null, id);
  const deleteWithId = deleteProduct.bind(null, id);

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">
        Edit product
      </h1>
      <ProductForm
        action={updateWithId}
        error={error}
        submitLabel="Save changes"
        categories={categories ?? []}
        tags={tags ?? []}
        defaultValues={{
          name: product.name,
          slug: product.slug,
          description: product.description,
          price: product.price_cents / 100,
          compare_at_price: product.compare_at_price_cents
            ? product.compare_at_price_cents / 100
            : null,
          sku: product.sku,
          stock_qty: product.stock_qty,
          status: product.status as ProductStatus,
          is_popular: product.is_popular,
          image_url: image?.url ?? "",
          categoryIds,
          tagIds,
          options: optionsDefaults,
          highlights: highlightsDefaults,
        }}
        extraAction={
          <form action={deleteWithId}>
            <button
              type="submit"
              className="text-sm text-red-700 underline underline-offset-4 hover:text-red-800"
            >
              Delete product
            </button>
          </form>
        }
      />
    </div>
  );
}
