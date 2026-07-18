import { getTranslations, getLocale } from "next-intl/server";
import { getReviewSummary, type ProductDetail } from "@/lib/products";
import { formatDate } from "@/lib/format";
import { StarRating } from "./StarRating";
import { ReviewForm } from "./ReviewForm";

export async function ReviewsTabContent({ product }: { product: ProductDetail }) {
  const { count } = getReviewSummary(product.product_reviews);
  const [t, locale] = await Promise.all([
    getTranslations("reviewsTab"),
    getLocale(),
  ]);

  return (
    <div className="space-y-8">
      {count > 0 && (
        <div>
          <h3 className="font-display text-lg font-bold text-foreground">
            {t("heading", { count, product: product.name })}
          </h3>
          <ul className="mt-4 space-y-6">
            {product.product_reviews.map((review) => (
              <li key={review.id}>
                <StarRating rating={review.rating} />
                <p className="mt-1 text-xs text-muted">
                  {formatDate(review.created_at, locale)}
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
