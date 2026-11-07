"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../../lib/supabase/server";

export type AuthFormState = {
  error?: string;
  message?: string;
};

function getText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function signIn(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = getText(formData, "email");
  const password = getText(formData, "password");
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { error: "Account sign-in is not configured. Add the Supabase environment settings first." };
  }

  if (!email || !password) {
    return { error: "Enter your email address and password." };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Sign-in failed. Check your details and try again." };
  }

  const requestedPath = getText(formData, "next");
  redirect(requestedPath === "/admin" ? "/admin" : "/");
}

export async function signUp(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const displayName = getText(formData, "displayName");
  const email = getText(formData, "email");
  const password = getText(formData, "password");
  const referralCode = getText(formData, "referralCode").toUpperCase();
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { error: "Account registration is not configured. Add the Supabase environment settings first." };
  }

  if (displayName.length < 2 || displayName.length > 40) {
    return { error: "Your name must be between 2 and 40 characters." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address." };
  }

  if (password.length < 8) {
    return { error: "Use a password with at least 8 characters." };
  }

  if (referralCode && !/^[A-Z0-9]{10}$/.test(referralCode)) {
    return { error: "That referral code is not valid." };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
        referral_code: referralCode || null,
      },
    },
  });

  if (error) {
    return { error: "Registration failed. Check the details or try signing in." };
  }

  if (!data.session) {
    return { message: "Check your email to confirm your account, then sign in." };
  }

  redirect("/");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/login");
  }

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(`Could not sign out: ${error.message}`);
  }

  redirect("/login");
}
