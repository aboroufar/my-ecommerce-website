"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

export function GenderDropdown({ activeGender }: { activeGender?: string }) {
  const t = useTranslations("shopSidebar");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("gender", value);
    else params.delete("gender");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="mt-8">
      <h2 className="font-display text-base font-bold text-foreground">{t("gender")}</h2>
      <div className="relative mt-3">
        <select
          value={activeGender ?? ""}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full appearance-none rounded-lg border border-line bg-surface px-4 py-2.5 pr-9 text-sm text-foreground focus:border-foreground focus:outline-none"
        >
          <option value="">{t("allGenders")}</option>
          <option value="women">{t("genderWomen")}</option>
          <option value="men">{t("genderMen")}</option>
          <option value="unisex">{t("genderUnisex")}</option>
        </select>
        <ChevronIcon />
      </div>
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-muted"
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
