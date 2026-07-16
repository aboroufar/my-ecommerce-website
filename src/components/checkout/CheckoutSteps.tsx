import Link from "next/link";

const STEPS = [
  { key: "address", label: "Address", href: "/checkout/address" },
  { key: "payment", label: "Payment", href: "/checkout/payment" },
  { key: "review", label: "Review", href: "/checkout/review" },
] as const;

export function CheckoutSteps({
  current,
}: {
  current: "address" | "payment" | "review";
}) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);

  return (
    <nav className="flex items-center gap-2 text-sm">
      {STEPS.map((step, i) => {
        const isCurrent = step.key === current;
        const isDone = i < currentIndex;
        return (
          <div key={step.key} className="flex items-center gap-2">
            {i > 0 && <span className="text-muted">—</span>}
            {isDone ? (
              <Link
                href={step.href}
                className="text-foreground underline underline-offset-4 hover:text-accent"
              >
                {i + 1} {step.label}
              </Link>
            ) : (
              <span
                className={
                  isCurrent
                    ? "font-medium text-foreground"
                    : "text-muted"
                }
              >
                {i + 1} {step.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
