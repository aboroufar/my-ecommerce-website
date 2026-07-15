import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getHelpCategories } from "@/lib/help";
import { getSiteSettings } from "@/lib/siteSettings";
import { HelpIcon } from "@/components/helpIcons";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Help — Storefront",
};

export default async function HelpPage() {
  const [settings, categories] = await Promise.all([
    getSiteSettings(),
    getHelpCategories(),
  ]);

  if (!settings.help_page_enabled) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
      <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
        Help
      </span>
      <h1 className="mt-2 font-display text-3xl font-bold text-foreground">
        How can we help?
      </h1>

      {categories.length === 0 ? (
        <p className="mt-10 text-sm text-muted">
          Nothing here yet -- check back soon.
        </p>
      ) : (
        <div className="mt-10 divide-y divide-line border-t border-b border-line">
          {categories.map((category) => (
            <details key={category.id} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-accent">
                    <HelpIcon icon={category.icon} />
                  </span>
                  <div>
                    <span className="font-display text-base font-bold text-foreground">
                      {category.title}
                    </span>
                    {category.description && (
                      <p className="mt-0.5 text-xs text-muted">
                        {category.description}
                      </p>
                    )}
                  </div>
                </div>
                <ChevronIcon className="h-5 w-5 shrink-0 text-muted transition-transform group-open:rotate-180" />
              </summary>

              {category.topics.length > 0 && (
                <div className="mt-4 space-y-1 pl-8">
                  {category.topics.map((topic) => (
                    <details key={topic.id} className="group/topic border-t border-line py-3 first:border-t-0">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                        <span className="text-sm text-foreground">{topic.title}</span>
                        <ChevronIcon className="h-4 w-4 shrink-0 text-muted transition-transform group-open/topic:rotate-180" />
                      </summary>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted">
                        {topic.body_html}
                      </p>
                    </details>
                  ))}
                </div>
              )}
            </details>
          ))}
        </div>
      )}
    </main>
  );
}

function ChevronIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
