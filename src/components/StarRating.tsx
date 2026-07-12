export function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const dimension = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <StarIcon key={i} filled={i < rating} className={dimension} />
      ))}
    </div>
  );
}

function StarIcon({ filled, className }: { filled: boolean; className: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`${className} ${filled ? "fill-accent text-accent" : "fill-none text-line"}`}
      stroke="currentColor"
      strokeWidth="1"
    >
      <path d="m10 1.5 2.6 5.6 6 .7-4.4 4.2 1.1 6-5.3-3-5.3 3 1.1-6-4.4-4.2 6-.7Z" strokeLinejoin="round" />
    </svg>
  );
}
