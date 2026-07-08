import { formatPrice } from "@/lib/format";

export function PriceTag({
  cents,
  currency,
  className = "",
}: {
  cents: number;
  currency: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center bg-background/90 px-3 py-1.5 text-sm font-medium text-foreground backdrop-blur-sm ${className}`}
    >
      {formatPrice(cents, currency)}
    </span>
  );
}
