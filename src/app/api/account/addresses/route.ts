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

  const { data: addresses } = await supabase
    .from("addresses")
    .select("id, line1, line2, city, region, postal_code, country, is_default, is_billing")
    .order("created_at", { ascending: false });

  return NextResponse.json({ addresses: addresses ?? [] });
}
