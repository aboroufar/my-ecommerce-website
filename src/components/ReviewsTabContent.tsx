import { getReviewSummary, type ProductDetail } from "@/lib/products";
import { StarRating } from "./StarRating";
import { ReviewForm } from "./ReviewForm";

export function ReviewsTabContent({ product }: { product: ProductDetail }) {
  const { count } = getReviewSummary(product.product_reviews);

  return (
    <div className="space-y-8">
      {count > 0 && (
        <div>
          <h3 className="font-display text-lg font-bold text-foreground">
            {count} review{count === 1 ? "" : "s"} for {product.name}
          </h3>
          <ul className="mt-4 space-y-6">
            {product.product_reviews.map((review) => (
              <li key={review.id}>
                <StarRating rating={review.rating} />
                <p className="mt-1 text-xs text-muted">
                  {new Date(review.created_at).toLocaleDateString()}
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {review.reviewer_name}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{review.body}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ReviewForm productId={product.id} />
    </div>
  );
}
