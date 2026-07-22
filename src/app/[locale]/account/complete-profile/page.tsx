import { getTranslations } from "next-intl/server";
import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { completeProfile } from "@/lib/actions/clients";
import { CompleteProfileAddressFields } from "@/components/account/CompleteProfileAddressFields";

export const dynamic = "force-dynamic";

export default async function CompleteProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const [user, t] = await Promise.all([getSessionUser(), getTranslations("account")]);

  const GENDER_LABELS: Record<string, string> = {
    male: t("genderMale"),
    female: t("genderFemale"),
    other: t("genderOther"),
    prefer_not_to_say: t("genderPreferNotToSay"),
  };

  let client: { name: string | null; phone: string | null } | null = null;
  if (user) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("clients")
      .select("name, phone")
      .eq("id", user.id)
      .single();
    client = data;
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="font-display text-2xl text-foreground">{t("completeProfileTitle")}</h1>
      <p className="mt-2 text-sm text-muted">{t("completeProfileIntro")}</p>

      {error && (
        <p className="mt-6 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form action={completeProfile} className="mt-8 flex flex-col gap-8">
        <section className="flex flex-col gap-3">
          <input
            name="name"
            required
            defaultValue={client?.name ?? ""}
            placeholder={t("fullNamePlaceholder")}
            className="border border-line bg-transparent px-3 py-2 text-sm"
          />
          <input
            name="phone"
            type="tel"
            required
            defaultValue={client?.phone ?? ""}
            placeholder={t("phonePlaceholder")}
            className="border border-line bg-transparent px-3 py-2 text-sm"
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted">{t("dateOfBirth")}</span>
            <input
              name="date_of_birth"
              type="date"
              required
              className="border border-line bg-transparent px-3 py-2 text-sm text-foreground"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted">{t("gender")}</span>
            <select
              name="gender"
              required
              defaultValue=""
              className="border border-line bg-transparent px-3 py-2 text-sm text-foreground"
            >
              <option value="" disabled>
                {t("selectPlaceholder")}
              </option>
              {Object.entries(GENDER_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section>
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
            {t("addBillingAddress")}
          </h2>
          <div className="mt-3">
            <CompleteProfileAddressFields
              countryLabel={t("countryItaly")}
              countryValue="IT"
              line1Placeholder={t("addressLine1Placeholder")}
              line2Placeholder={t("addressLine2Placeholder")}
              cityPlaceholder={t("cityPlaceholder")}
              regionPlaceholder={t("stateRegionPlaceholder")}
              postalCodePlaceholder={t("postalCodePlaceholder")}
            />
          </div>
        </section>

        <section>
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
            {t("marketingPreferences")}
          </h2>
          <p className="mt-2 text-sm text-muted">{t("marketingConsentNotice")}</p>
          <div className="mt-3 flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" name="email_marketing_consent" />
              {t("marketingEmail")}
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" name="sms_marketing_consent" />
              {t("marketingSms")}
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" name="whatsapp_marketing_consent" />
              {t("marketingWhatsapp")}
            </label>
          </div>
        </section>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            className="bg-accent px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            {t("finish")}
          </button>
          <a
            href="/account"
            className="text-xs text-muted underline underline-offset-4 hover:text-foreground"
          >
            {t("skipForNow")}
          </a>
        </div>
      </form>
    </div>
  );
}
