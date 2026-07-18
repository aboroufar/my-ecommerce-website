"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const LABELS: Record<string, string> = { en: "EN", it: "IT" };

export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex items-center gap-1 text-xs font-medium">
      {routing.locales.map((loc, i) => (
        <span key={loc} className="flex items-center gap-1">
          {i > 0 && <span className="opacity-50">/</span>}
          <button
            type="button"
            onClick={() => router.replace(pathname, { locale: loc })}
            aria-current={loc === locale}
            className={
              loc === locale
                ? "underline underline-offset-2"
                : "opacity-70 transition-opacity hover:opacity-100"
            }
          >
            {LABELS[loc] ?? loc.toUpperCase()}
          </button>
        </span>
      ))}
    </div>
  );
}
