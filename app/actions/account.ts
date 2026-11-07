"use server";

import { revalidatePath } from "next/cache";
import type { AuthFormState } from "./auth";
import { createSupabaseServerClient, getCurrentUser } from "../../lib/supabase/server";

function getValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getText(formData: FormData, key: string) {
  return getValue(formData, key).trim();
}

export async function updateDisplayName(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const displayName = getText(formData, "displayName");
  const auth = await getCurrentUser();
  const supabase = await createSupabaseServerClient();

  if (!auth.user || !supabase) {
    return { error: "Sign in before updating your profile." };
  }

  if (displayName.length < 2 || displayName.length > 40) {
    return { error: "Your name must be between 2 and 40 characters." };
  }

  const { data: updatedProfile, error } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", auth.user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: `Could not update your profile: ${error.message}` };
  }

  if (!updatedProfile) {
    return { error: "Your profile could not be found. Contact support before trying again." };
  }

  const { error: metadataError } = await supabase.auth.updateUser({
    data: { display_name: displayName },
  });

  if (metadataError) {
    return {
      error: `Your profile was saved, but the greeting could not be refreshed: ${metadataError.message}`,
    };
  }

  revalidatePath("/", "layout");
  return { message: "Your profile has been updated." };
}

export async function updatePassword(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const currentPassword = getValue(formData, "currentPassword");
  const newPassword = getValue(formData, "newPassword");
  const confirmPassword = getValue(formData, "confirmPassword");
  const auth = await getCurrentUser();
  const supabase = await createSupabaseServerClient();

  if (!auth.user?.email || !supabase) {
    return { error: "Sign in before changing your password." };
  }

  if (!currentPassword || newPassword.length < 8) {
    return { error: "Enter your current password and a new password with at least 8 characters." };
  }

  if (newPassword !== confirmPassword) {
    return { error: "The new passwords do not match." };
  }

  const { error: verificationError } = await supabase.auth.signInWithPassword({
    email: auth.user.email,
    password: currentPassword,
  });

  if (verificationError) {
    return { error: "Your current password could not be verified." };
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    return { error: `Could not update your password: ${error.message}` };
  }

  revalidatePath("/me", "page");
  return { message: "Your password has been updated." };
}
