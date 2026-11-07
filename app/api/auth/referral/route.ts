import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const reference = new URL(request.url).searchParams.get("reference")?.trim() ?? "";
  const headers = { "Cache-Control": "no-store, max-age=0" };
  if (!reference || reference.length > 64) {
    return NextResponse.json({ valid: false }, { headers });
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { valid: false, configured: false },
      { status: 503, headers },
    );
  }

  let result;
  try {
    result = await supabase.rpc("resolve_referral", {
      referral_reference: reference,
    });
  } catch {
    return NextResponse.json({ error: "Referral check failed." }, { status: 503, headers });
  }
  const { data, error } = result;
  if (error) {
    return NextResponse.json({ error: "Referral check failed." }, { status: 503, headers });
  }

  const referrer = data?.[0];
  return NextResponse.json(
    referrer ? { valid: true, username: referrer.username } : { valid: false },
    { headers },
  );
}
