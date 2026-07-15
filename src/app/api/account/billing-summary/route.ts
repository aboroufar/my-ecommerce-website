import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const [{ data: customer }, { data: address }] = await Promise.all([
    supabase.from("customers").select("name").eq("id", user.id).maybeSingle(),
    supabase
      .from("addresses")
      .select("line1, line2, city, region, postal_code, country")
      .eq("customer_id", user.id)
      .eq("is_billing", true)
      .maybeSingle(),
  ]);

  return NextResponse.json({
    name: customer?.name ?? null,
    address: address ?? null,
  });
}
