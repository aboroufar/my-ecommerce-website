import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ContactForm } from "@/components/ContactForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("contactPage");
  return { title: t("title") };
}

export default async function ContactPage() {
  const t = await getTranslations("contactPage");
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-16 sm:px-16">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
            {t("heading")}
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
            {t("body")}
          </p>
        </div>

        <div className="rounded-lg bg-surface p-6 sm:p-8">
          <ContactForm />
        </div>
      </div>
    </main>
  );
}
