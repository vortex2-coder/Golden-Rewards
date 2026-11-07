import "server-only";

import { isAuthSessionMissingError } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";

export type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export async function createSupabaseServerClient(rememberMe = true) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, {
            ...options,
            maxAge: rememberMe ? 60 * 60 * 24 * 30 : undefined,
          });
        }
      },
    },
  });
}

export async function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (configuredUrl) {
    const parsedUrl = new URL(configuredUrl);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new Error("NEXT_PUBLIC_SITE_URL must use HTTP or HTTPS.");
    }
    return parsedUrl.origin;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_SITE_URL must be configured before production auth is enabled.");
  }

  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host?.startsWith("localhost") || host?.startsWith("127.0.0.1") ? "http" : "https");

  if (host) return `${protocol}://${host}`;
  return "http://localhost:3000";
}

export type MemberProfile = {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  country: string;
  country_iso_code: string;
  country_dial_code: string;
  phone_number: string;
  phone_number_e164: string;
  referral_code: string;
  referred_by_user_id: string | null;
  email_confirmed_at: string | null;
  account_status: "active" | "suspended";
  created_at: string;
  updated_at: string;
};

export async function getCurrentMember() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { configured: false as const, user: null, profile: null };

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) {
    if (isAuthSessionMissingError(userError)) {
      return { configured: true as const, user: null, profile: null };
    }
    throw new Error("Could not validate the current account session.");
  }
  if (!userData.user) {
    return { configured: true as const, user: null, profile: null };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "id, first_name, last_name, username, email, country, country_iso_code, country_dial_code, phone_number, phone_number_e164, referral_code, referred_by_user_id, email_confirmed_at, account_status, created_at, updated_at",
    )
    .eq("id", userData.user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error("Could not load the current account profile.");
  }
  if (!profile) {
    return { configured: true as const, user: userData.user, profile: null };
  }

  return {
    configured: true as const,
    user: userData.user,
    profile: profile as MemberProfile,
  };
}
