import { createProduct } from "@/lib/actions/products";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">New product</h1>
      <ProductForm
        action={createProduct}
        error={error}
        submitLabel="Create product"
      />
    </div>
  );
}
