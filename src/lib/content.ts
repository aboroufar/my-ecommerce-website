import { createPublicClient } from "@/lib/supabase/public";

/**
 * Every editable string on the site, keyed by "section.field". Defaults
 * here match the seed data in the site_content migration and are used as
 * a fallback if a key is missing or the query fails, so a bad/empty
 * content table can never take the homepage down.
 */
const defaults = {
  "hero.headline": "Considered goods, elevated.",
  "hero.subheadline": "Made with restraint. Built to last.",
  "hero.cta_primary_label": "Shop all",
  "hero.cta_secondary_label": "Find your routine",
  "closing.headline": "Your routine, simplified.",
  "closing.subheadline": "Three steps. Real results.",
  "closing.cta_label": "Build your routine",
  "footer.about_text":
    "Small-batch essentials, formulated with restraint and made to be used — not just displayed.",
} as const;

export type SiteContentKey = keyof typeof defaults;
export type SiteContent = Record<SiteContentKey, string>;

export async function getSiteContent(): Promise<SiteContent> {
  const supabase = createPublicClient();
  const { data } = await supabase.from("site_content").select("key, value");

  const content = { ...defaults } as SiteContent;
  for (const row of data ?? []) {
    if (row.key in content) {
      content[row.key as SiteContentKey] = row.value;
    }
  }
  return content;
}

export const siteContentKeys = Object.keys(defaults) as SiteContentKey[];
export const siteContentDefaults = defaults;
