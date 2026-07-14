"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SocialIconLink } from "./SocialIconLink";

export function BlogShareRow({ title }: { title: string }) {
  const pathname = usePathname();
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const encodedUrl = encodeURIComponent(`${origin}${pathname}`);
  const encodedTitle = encodeURIComponent(title);

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-semibold text-foreground">Share:</span>
      <SocialIconLink
        platform="facebook"
        label="Share on Facebook"
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
      />
      <SocialIconLink
        platform="twitter"
        label="Share on Twitter"
        href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
      />
      <SocialIconLink
        platform="linkedin"
        label="Share on LinkedIn"
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
      />
    </div>
  );
}
