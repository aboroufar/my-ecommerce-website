"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { SocialIconLink } from "./SocialIconLink";

export function BlogShareRow({ title }: { title: string }) {
  const t = useTranslations("blogShareRow");
  const pathname = usePathname();
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const encodedUrl = encodeURIComponent(`${origin}${pathname}`);
  const encodedTitle = encodeURIComponent(title);

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-semibold text-foreground">{t("share")}</span>
      <SocialIconLink
        platform="facebook"
        label={t("shareFacebook")}
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
      />
      <SocialIconLink
        platform="twitter"
        label={t("shareTwitter")}
        href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
      />
      <SocialIconLink
        platform="linkedin"
        label={t("shareLinkedin")}
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
      />
    </div>
  );
}
