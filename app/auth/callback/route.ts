import { NextResponse } from "next/server";
import { safeNextPath } from "@/lib/auth-validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = safeNextPath(requestUrl.searchParams.get("next"));

  const supabase = await createSupabaseServerClient();
  if (!supabase || !code) {
    return NextResponse.redirect(new URL("/login?message=link-invalid", requestUrl.origin));
  }

  let exchangeResult;
  try {
    exchangeResult = await supabase.auth.exchangeCodeForSession(code);
  } catch {
    return NextResponse.redirect(new URL("/login?message=link-invalid", requestUrl.origin));
  }
  const { error } = exchangeResult;
  if (error) {
    return NextResponse.redirect(new URL("/login?message=link-invalid", requestUrl.origin));
  }

  return NextResponse.redirect(new URL(nextPath, requestUrl.origin));
}
