import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("aboutPage");
  return { title: t("title") };
}

export default async function AboutPage() {
  const t = await getTranslations("aboutPage");

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
        {t("eyebrow")}
      </span>
      <h1 className="mt-2 font-display text-3xl font-bold text-foreground">
        {t("heading")}
      </h1>

      <div className="mt-6 border border-dashed border-line bg-surface px-4 py-3">
        <p className="text-xs text-muted">
          {t("placeholderNotice")}
        </p>
      </div>

      <div className="mt-10 space-y-3 text-sm leading-relaxed text-muted">
        <p>
          {t("body")}
        </p>
      </div>
    </main>
  );
}
