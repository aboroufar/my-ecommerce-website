"use server";

import { z } from "zod";
import { sendContactMessageEmail } from "@/lib/email";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email address"),
  message: z.string().min(1, "Message is required"),
});

export async function sendContactMessage(
  formData: FormData
): Promise<{ ok: true } | { ok: false; error: string }> {
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
      error: "Something went wrong sending your message. Please try again.",
    };
  }
}
