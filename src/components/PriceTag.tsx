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
      className={`inline-flex items-center gap-1.5 bg-accent px-3 py-1 text-sm font-medium text-background shadow-sm ${className}`}
      style={{
        clipPath:
          "polygon(10px 0, 100% 0, 100% 100%, 10px 100%, 0 50%)",
        paddingLeft: "16px",
      }}
    >
      <span
        aria-hidden
        className="h-1 w-1 rounded-full bg-background/70"
      />
      {formatPrice(cents, currency)}
    </span>
  );
}
