import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateProduct, deleteProduct } from "@/lib/actions/products";
import { ProductForm } from "@/components/admin/ProductForm";
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
  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, name, slug, description, price_cents, compare_at_price_cents, sku, stock_qty, status, product_images(url, sort_order), product_categories(category_id)"
      )
      .eq("id", id)
      .single(),
    supabase
      .from("categories")
      .select("id, name, parent_id")
      .order("name", { ascending: true }),
  ]);

  if (!product) notFound();

  const image = [...product.product_images].sort(
    (a, b) => a.sort_order - b.sort_order
  )[0];
  const categoryIds = product.product_categories.map((pc) => pc.category_id);

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
          image_url: image?.url ?? "",
          categoryIds,
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
