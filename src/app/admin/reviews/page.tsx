import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { approveReview, rejectReview, deleteReview } from "@/lib/actions/reviews";

// Admins need to see newly-submitted reviews immediately, not a cached view.
export const dynamic = "force-dynamic";

const STATUS_TABS = ["pending", "approved", "rejected", "all"] as const;
type StatusTab = (typeof STATUS_TABS)[number];

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeTab: StatusTab = STATUS_TABS.includes(status as StatusTab)
    ? (status as StatusTab)
    : "pending";

  const supabase = createAdminClient();
  let query = supabase
    .from("product_reviews")
    .select("id, reviewer_name, reviewer_email, rating, body, status, created_at, products(name, slug)")
    .order("created_at", { ascending: false });

  if (activeTab !== "all") {
    query = query.eq("status", activeTab);
  }

  const { data: reviews } = await query;

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Reviews</h1>

      <div className="mt-6 flex gap-4 border-b border-line text-sm">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab}
            href={tab === "pending" ? "/admin/reviews" : `/admin/reviews?status=${tab}`}
            className={`-mb-px border-b-2 pb-2 capitalize transition-colors ${
              activeTab === tab
                ? "border-foreground text-foreground"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {tab}
          </Link>
        ))}
      </div>

      {!reviews || reviews.length === 0 ? (
        <p className="mt-10 text-sm text-muted">No {activeTab === "all" ? "" : activeTab} reviews.</p>
      ) : (
        <ul className="mt-8 divide-y divide-line">
          {reviews.map((review) => (
            <li key={review.id} className="flex items-start justify-between gap-6 py-5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-foreground">{review.reviewer_name}</span>
                  <span className="text-muted">{review.reviewer_email}</span>
                  <span className="text-muted">·</span>
                  <span className="text-muted">{review.rating} / 5</span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {review.products?.name ?? "Unknown product"} —{" "}
                  {new Date(review.created_at).toLocaleDateString()}
                </p>
                <p className="mt-2 text-sm text-foreground">{review.body}</p>
              </div>

              <div className="flex shrink-0 items-center gap-3 text-xs">
                {review.status !== "approved" && (
                  <form action={approveReview.bind(null, review.id)}>
                    <button type="submit" className="text-accent underline underline-offset-4 hover:opacity-80">
                      Approve
                    </button>
                  </form>
                )}
                {review.status !== "rejected" && (
                  <form action={rejectReview.bind(null, review.id)}>
                    <button type="submit" className="text-muted underline underline-offset-4 hover:text-foreground">
                      Reject
                    </button>
                  </form>
                )}
                <form action={deleteReview.bind(null, review.id)}>
                  <button type="submit" className="text-red-700 underline underline-offset-4 hover:text-red-800">
                    Delete
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
