import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
        Welcome
      </span>
      <h1 className="font-display text-4xl text-foreground sm:text-5xl">
        Considered goods, plainly made.
      </h1>
      <p className="max-w-md text-sm text-muted">
        Placeholder homepage copy — swap this out once you&apos;ve decided on
        real brand messaging.
      </p>
      <Link
        href="/products"
        className="mt-2 bg-accent px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
      >
        Shop all
      </Link>
    </main>
  );
}
