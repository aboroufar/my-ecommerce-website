import { createCategory } from "@/lib/actions/categories";
import { CategoryEditView } from "@/components/admin/CategoryEditView";

export default async function NewCategoryPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">New category</h1>
      <div className="mt-8">
        <CategoryEditView action={createCategory} error={error} submitLabel="Create category" />
      </div>
    </div>
  );
}
