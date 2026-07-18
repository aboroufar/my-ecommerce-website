import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("faqPage");
  return { title: t("title") };
}

export default async function FaqPage() {
  const t = await getTranslations("faqPage");

  const faqs: { question: string; answer: React.ReactNode }[] = [
    {
      question: t("q1Question"),
      answer: (
        <>
          {t("q1AnswerStart")}{" "}
          <Link href="/account/orders" className="text-foreground underline underline-offset-4">
            {t("q1AnswerLink")}
          </Link>{" "}
          {t("q1AnswerEnd")}
        </>
      ),
    },
    {
      question: t("q2Question"),
      answer: t("q2Answer"),
    },
    {
      question: t("q3Question"),
      answer: (
        <>
          {t("q3AnswerStart")}{" "}
          <Link href="/shipping" className="text-foreground underline underline-offset-4">
            {t("q3AnswerLink")}
          </Link>{" "}
          {t("q3AnswerEnd")}
        </>
      ),
    },
    {
      question: t("q4Question"),
      answer: t("q4Answer"),
    },
    {
      question: t("q5Question"),
      answer: t("q5Answer"),
    },
  ];

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
        {t("eyebrow")}
      </span>
      <h1 className="mt-2 font-display text-3xl font-bold text-foreground">
        {t("heading")}
      </h1>

      <div className="mt-10 divide-y divide-line border-t border-line">
        {faqs.map((faq) => (
          <details key={faq.question} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-foreground">
              {faq.question}
              <span className="shrink-0 text-muted transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted">
              {faq.answer}
            </p>
          </details>
        ))}
      </div>

      <p className="mt-10 text-sm text-muted">
        {t("closingText")}{" "}
        <a
          href="mailto:hello@storefront.example"
          className="text-foreground underline underline-offset-4"
        >
          {t("emailUs")}
        </a>{" "}
        {t("closingSuffix")}
      </p>
    </main>
  );
}
