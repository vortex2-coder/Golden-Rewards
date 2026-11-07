import { NextResponse } from "next/server";
import { usernamePattern } from "@/lib/auth-validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const username = new URL(request.url).searchParams.get("username")?.trim().toLowerCase() ?? "";
  const headers = { "Cache-Control": "no-store, max-age=0" };

  if (!usernamePattern.test(username)) {
    return NextResponse.json({ available: false, valid: false }, { headers });
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { available: false, configured: false },
      { status: 503, headers },
    );
  }

  let result;
  try {
    result = await supabase.rpc("is_username_available", {
      requested_username: username,
    });
  } catch {
    return NextResponse.json({ error: "Availability check failed." }, { status: 503, headers });
  }
  const { data, error } = result;
  if (error) {
    return NextResponse.json({ error: "Availability check failed." }, { status: 503, headers });
  }

  return NextResponse.json({ available: data === true }, { headers });
}
