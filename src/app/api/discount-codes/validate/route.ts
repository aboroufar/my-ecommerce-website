import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const requestSchema = z.object({
  code: z.string().min(1),
  subtotalCents: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  const parsed = requestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ valid: false, error: "Invalid request." }, { status: 400 });
  }
  const { code, subtotalCents } = parsed.data;

  const supabase = createAdminClient();
  const { data: discount } = await supabase
    .from("discount_codes")
    .select("code, type, value, active, expires_at")
    .eq("code", code.trim().toUpperCase())
    .maybeSingle();

  if (!discount || !discount.active) {
    return NextResponse.json({ valid: false, error: "This code isn't valid." });
  }

  if (discount.expires_at && new Date(discount.expires_at) < new Date()) {
    return NextResponse.json({ valid: false, error: "This code has expired." });
  }

  const discountCents =
    discount.type === "percent"
      ? Math.round((subtotalCents * discount.value) / 100)
      : Math.min(discount.value, subtotalCents);

  return NextResponse.json({ valid: true, code: discount.code, discountCents });
}
