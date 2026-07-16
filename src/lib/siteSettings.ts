import { createPublicClient } from "@/lib/supabase/public";

export interface SiteSettings {
  site_name: string;
  site_logo_url: string;
  header_email: string;
  header_phone: string;
  header_address: string;
  categories_menu_label: string;
  reviews_enabled: boolean;
  help_page_enabled: boolean;
  social_facebook_url: string;
  social_twitter_url: string;
  social_linkedin_url: string;
  social_instagram_url: string;
  shipping_flat_rate_cents: number;
  free_shipping_threshold_cents: number;
}

const defaults: SiteSettings = {
  site_name: "Storefront",
  site_logo_url: "",
  header_email: "hello@storefront.example",
  header_phone: "",
  header_address: "",
  categories_menu_label: "Categories",
  reviews_enabled: true,
  help_page_enabled: true,
  social_facebook_url: "",
  social_twitter_url: "",
  social_linkedin_url: "",
  social_instagram_url: "",
  shipping_flat_rate_cents: 590,
  free_shipping_threshold_cents: 7500,
};

/**
 * Fetches the singleton site_settings row. Falls back to hardcoded
 * defaults (rather than throwing) if Supabase isn't configured yet, the
 * request fails, or the row is somehow missing -- the header/footer must
 * never break because this table is empty.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select(
        "site_name, site_logo_url, header_email, header_phone, header_address, categories_menu_label, reviews_enabled, help_page_enabled, social_facebook_url, social_twitter_url, social_linkedin_url, social_instagram_url, shipping_flat_rate_cents, free_shipping_threshold_cents"
      )
      .eq("id", true)
      .maybeSingle();

    if (error || !data) {
      if (error) console.error("getSiteSettings error:", error.message);
      return defaults;
    }

    return data;
  } catch (err) {
    console.error("getSiteSettings failed (Supabase not configured?):", err);
    return defaults;
  }
}
