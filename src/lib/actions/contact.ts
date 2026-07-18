"use server";

import { z } from "zod";
import { getTranslations } from "next-intl/server";
import { sendContactMessageEmail } from "@/lib/email";

export async function sendContactMessage(
  formData: FormData
): Promise<{ ok: true } | { ok: false; error: string }> {
  const t = await getTranslations("contactForm");
  const contactSchema = z.object({
    name: z.string().min(1, t("nameRequired")),
    email: z.string().email(t("emailInvalid")),
    message: z.string().min(1, t("messageRequired")),
  });

  const parsed = contactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  try {
    await sendContactMessageEmail(parsed.data);
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: t("genericError"),
    };
  }
}
