import { createAdminClient } from "@/lib/supabase/admin";
import { PackageProfilesManager } from "@/components/admin/PackageProfilesManager";

export const dynamic = "force-dynamic";

export default async function AdminPackagesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = createAdminClient();
  const { data: profiles } = await supabase
    .from("package_profiles")
    .select("id, name, package_type, length_cm, width_cm, height_cm, empty_weight_grams")
    .order("name", { ascending: true });

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Packages</h1>
      <p className="mt-2 max-w-lg text-sm text-muted">
        Reusable shipping package profiles -- pick one from a product&apos;s
        Shipping card instead of retyping the same box dimensions on every
        product.
      </p>

      {error && (
        <p className="mt-6 max-w-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-8">
        <PackageProfilesManager profiles={profiles ?? []} />
      </div>
    </div>
  );
}
