"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getPasswordError, getValidPhoneNumber, isValidEmail, isValidPersonName, usernamePattern } from "@/lib/auth-validation";
import { phoneCountries } from "@/lib/countries";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient, getSiteUrl } from "@/lib/supabase/server";

export type AuthFormState = {
  error?: string;
  success?: string;
};

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function unavailableMessage() {
  return "Account services are not configured yet. Ask the site owner to finish Supabase setup.";
}

export async function signUpAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const firstName = readString(formData, "firstName");
  const lastName = readString(formData, "lastName");
  const username = readString(formData, "username").toLowerCase();
  const email = readString(formData, "email").toLowerCase();
  const countryCode = readString(formData, "countryIsoCode").toUpperCase();
  const countryName = readString(formData, "countryName");
  const phoneNumberNational = readString(formData, "phoneNumberNational");
  const referralReference = readString(formData, "referralReference");
  const password = typeof formData.get("password") === "string" ? String(formData.get("password")) : "";
  const confirmPassword = typeof formData.get("confirmPassword") === "string" ? String(formData.get("confirmPassword")) : "";

  if (!isValidPersonName(firstName) || !isValidPersonName(lastName)) {
    return { error: "Enter a valid first name and surname using letters, spaces, apostrophes, or hyphens." };
  }
  if (!usernamePattern.test(username)) {
    return { error: "Username must be 3–30 characters and use only letters, numbers, or underscores." };
  }
  if (referralReference.length > 64) {
    return { error: "Referral code or username must be 64 characters or fewer." };
  }
  if (!isValidEmail(email)) return { error: "Enter a valid email address." };
  const country = phoneCountries.find((option) => option.code === countryCode);
  if (!country || country.name !== countryName) return { error: "Choose a valid country." };

  const phone = getValidPhoneNumber(phoneNumberNational, countryCode);
  if (!phone) return { error: "Enter a valid phone number for the selected country." };

  const passwordError = getPasswordError(password);
  if (passwordError) return { error: `Password is not secure enough. ${passwordError}` };
  if (password !== confirmPassword) return { error: "The passwords do not match." };
  if (formData.get("acceptedTerms") !== "on") {
    return { error: "You must agree to the Terms and Conditions and Privacy Policy." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: unavailableMessage() };

  let usernameCheck;
  try {
    usernameCheck = await supabase.rpc("is_username_available", {
      requested_username: username,
    });
  } catch {
    return { error: "A network error interrupted username verification. Please try again." };
  }
  const { data: usernameAvailable, error: usernameError } = usernameCheck;
  if (usernameError) {
    return { error: "Could not check username availability. Please try again." };
  }
  if (!usernameAvailable) return { error: "That username is already taken." };

  let referralMatches: { username: string }[] = [];
  let referralError: string | null = null;
  if (referralReference) {
    try {
      const referralCheck = await supabase.rpc("resolve_referral", {
        referral_reference: referralReference,
      });
      referralMatches = referralCheck.data ?? [];
      referralError = referralCheck.error?.message ?? null;
    } catch {
      return { error: "A network error interrupted referral verification. Please try again." };
    }
  }
  if (referralError) {
    return { error: "Could not validate that referral. Please try again." };
  }
  if (referralReference && (!referralMatches || referralMatches.length === 0)) {
    return { error: "That referral code or username was not found." };
  }

  const admin = createSupabaseAdminClient();
  if (admin) {
    let duplicateChecks;
    try {
      duplicateChecks = await Promise.all([
        admin
          .from("profiles")
          .select("id")
          .eq("phone_number_e164", phone.number)
          .maybeSingle(),
        admin
          .from("profiles")
          .select("id")
          .eq("email", email)
          .maybeSingle(),
      ]);
    } catch {
      return { error: "A network error interrupted account detail verification. Please try again." };
    }
    const [{ data: existingPhone, error: phoneCheckError }, { data: existingEmail, error: emailCheckError }] = duplicateChecks;
    if (phoneCheckError || emailCheckError) return { error: "Could not verify those account details. Please try again." };
    if (existingPhone || existingEmail) {
      return { error: "That email address or phone number may already be registered." };
    }
  }

  const siteUrl = await getSiteUrl();
  let signupResult;
  try {
    signupResult = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback?next=%2F`,
        data: {
          first_name: firstName,
          last_name: lastName,
          username,
          country: country.name,
          country_iso_code: countryCode,
          country_dial_code: `+${phone.countryCallingCode}`,
          phone_number: phone.formatNational(),
          phone_number_e164: phone.number,
          referral_reference: referralReference || null,
        },
      },
    });
  } catch {
    return { error: "A network error interrupted account creation. Please try again." };
  }
  const { data, error } = signupResult;

  if (error) {
    return { error: "We could not create the account. Check your details or try signing in." };
  }
  if (data.user?.identities?.length === 0) {
    return { error: "We could not create the account. Check your details or try signing in." };
  }
  if (data.session) redirect("/");

  return {
    success: "Your account has been created. Check your inbox for the verification email before signing in.",
  };
}

export async function loginAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const identifier = readString(formData, "identifier").toLowerCase();
  const password = typeof formData.get("password") === "string" ? String(formData.get("password")) : "";
  const rememberMe = formData.get("rememberMe") === "on";

  if (!identifier || !password) return { error: "Enter your username or email and password." };

  const supabase = await createSupabaseServerClient(rememberMe);
  if (!supabase) return { error: unavailableMessage() };

  let email = identifier;
  if (!isValidEmail(identifier)) {
    const admin = createSupabaseAdminClient();
    if (!admin) return { error: "Username sign-in is not configured. Contact the site owner." };

    let lookup;
    try {
      lookup = await admin
        .from("profiles")
        .select("email")
        .eq("username", identifier)
        .maybeSingle();
    } catch {
      return { error: "A network error interrupted sign-in. Please try again." };
    }
    const { data: profile, error: lookupError } = lookup;
    if (lookupError || !profile?.email) {
      return { error: "The username/email or password is incorrect." };
    }
    email = profile.email;
  }

  let login;
  try {
    login = await supabase.auth.signInWithPassword({ email, password });
  } catch {
    return { error: "A network error interrupted sign-in. Please try again." };
  }
  const { data, error } = login;
  if (error?.code === "email_not_confirmed") {
    return { error: "Verify your email address using the link we sent before signing in." };
  }
  if (error || !data.user) return { error: "The username/email or password is incorrect." };

  let profileResult;
  try {
    profileResult = await supabase
      .from("profiles")
      .select("account_status")
      .eq("id", data.user.id)
      .maybeSingle();
  } catch {
    await supabase.auth.signOut();
    return { error: "A network error prevented us from loading your account. Please try again." };
  }
  const { data: profile, error: profileError } = profileResult;

  if (profileError || !profile) {
    await supabase.auth.signOut();
    return { error: "Your account could not be loaded. Please contact support." };
  }
  if (profile.account_status === "suspended") {
    await supabase.auth.signOut();
    return { error: "This account is currently suspended. Contact support for assistance." };
  }

  const cookieStore = await cookies();
  cookieStore.set("gr_remember", rememberMe ? "true" : "false", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    ...(rememberMe ? { maxAge: 60 * 60 * 24 * 30 } : {}),
  });

  redirect("/");
}

export async function requestPasswordResetAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = readString(formData, "email").toLowerCase();
  if (!isValidEmail(email)) return { error: "Enter a valid email address." };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: unavailableMessage() };

  const siteUrl = await getSiteUrl();
  let resetResult;
  try {
    resetResult = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/callback?next=%2Freset-password`,
    });
  } catch {
    return { error: "A network error interrupted password recovery. Please try again." };
  }
  const { error } = resetResult;
  if (error) return { error: "We could not send a reset email. Please try again later." };

  return {
    success: "If an account exists for that email, a password reset link will be sent shortly.",
  };
}

export async function updatePasswordAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const password = typeof formData.get("password") === "string" ? String(formData.get("password")) : "";
  const confirmPassword = typeof formData.get("confirmPassword") === "string" ? String(formData.get("confirmPassword")) : "";
  const passwordError = getPasswordError(password);
  if (passwordError) return { error: `Password is not secure enough. ${passwordError}` };
  if (password !== confirmPassword) return { error: "The passwords do not match." };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: unavailableMessage() };
  let userResult;
  try {
    userResult = await supabase.auth.getUser();
  } catch {
    return { error: "A network error prevented password verification. Request a new reset link and try again." };
  }
  const { data: userData } = userResult;
  if (!userData.user) return { error: "This reset link is invalid or has expired. Request a new one." };

  let updateResult;
  try {
    updateResult = await supabase.auth.updateUser({ password });
  } catch {
    return { error: "A network error interrupted the password update. Please try again." };
  }
  const { error } = updateResult;
  if (error) return { error: "Could not update your password. Request a new reset link and try again." };

  redirect("/");
}

export async function updateProfileAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const firstName = readString(formData, "firstName");
  const lastName = readString(formData, "lastName");
  if (!isValidPersonName(firstName) || !isValidPersonName(lastName)) {
    return { error: "Enter a valid first name and surname." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: unavailableMessage() };

  let userResult;
  try {
    userResult = await supabase.auth.getUser();
  } catch {
    return { error: "A network error interrupted profile editing. Please try again." };
  }
  if (!userResult.data.user) return { error: "Sign in again before editing your profile." };

  let profileResult;
  try {
    profileResult = await supabase
      .from("profiles")
      .update({ first_name: firstName, last_name: lastName })
      .eq("id", userResult.data.user.id)
      .select("id")
      .maybeSingle();
  } catch {
    return { error: "A network error interrupted profile editing. Please try again." };
  }
  if (profileResult.error || !profileResult.data) {
    return { error: "Could not update your profile. Please try again." };
  }

  return { success: "Your profile has been updated." };
}

export async function signOutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("gr_remember");
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error("Unable to sign out. Please try again.");
  }
  redirect("/login");
}
