"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentMember } from "@/lib/supabase/server";

export type AdminPointsActionState = {
  error?: string;
  success?: string;
};

function value(formData: FormData, key: string) {
  const field = formData.get(key);
  return typeof field === "string" ? field.trim() : "";
}

async function getAdminActorId() {
  const member = await getCurrentMember();
  if (
    !member.configured ||
    !member.user ||
    !member.profile ||
    member.profile.account_status !== "active" ||
    member.user.app_metadata?.role !== "admin"
  ) return null;
  return member.user.id;
}

function getInteger(formData: FormData, key: string, maximum = 100000000) {
  const text = value(formData, key);
  if (!/^\d+$/.test(text)) return null;
  const parsed = Number(text);
  return Number.isSafeInteger(parsed) && parsed > 0 && parsed <= maximum ? parsed : null;
}

function getUsd(formData: FormData, key: string) {
  const text = value(formData, key);
  if (!/^\d{1,8}(?:\.\d{1,2})?$/.test(text)) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export async function savePointsSettings(
  _previous: AdminPointsActionState,
  formData: FormData,
): Promise<AdminPointsActionState> {
  const actorId = await getAdminActorId();
  if (!actorId) return { error: "You are not authorized to update Golden Points settings." };

  const enabled = formData.get("enabled") === "on";
  const maxPoints = getInteger(formData, "maxPointsPerDay");
  const maxAds = getInteger(formData, "maxRewardedAdsPerDay");
  const unlockPoints = getInteger(formData, "surveyUnlockPoints");
  const accessHours = getInteger(formData, "surveyAccessHours", 8760);
  if (!maxPoints || !maxAds || !unlockPoints || !accessHours) {
    return { error: "Enter positive whole-number limits, unlock points, and access hours." };
  }
  if (enabled && (process.env.POINTS_POSTBACK_SECRET?.length ?? 0) < 32) {
    return { error: "Configure a server-only POINTS_POSTBACK_SECRET of at least 32 characters before enabling point campaigns." };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) return { error: "The server-side Supabase service key is not configured." };
  const { error } = await supabase.rpc("save_points_settings", {
    p_actor_id: actorId,
    p_enabled: enabled,
    p_max_points_per_day: maxPoints,
    p_max_rewarded_ads_per_day: maxAds,
    p_survey_unlock_points: unlockPoints,
    p_survey_access_hours: accessHours,
  });
  if (error) {
    console.error("Could not save Golden Points settings.", error);
    return { error: "Could not save settings. Confirm the points-and-surveys migration is applied." };
  }
  revalidatePath("/admin/ads");
  revalidatePath("/earn");
  return { success: "Golden Points settings saved." };
}

export async function savePointsCampaign(
  _previous: AdminPointsActionState,
  formData: FormData,
): Promise<AdminPointsActionState> {
  const actorId = await getAdminActorId();
  if (!actorId) return { error: "You are not authorized to manage point campaigns." };

  const id = value(formData, "campaignId");
  const partnerName = value(formData, "partnerName");
  const title = value(formData, "title");
  const description = value(formData, "description");
  const destinationUrl = value(formData, "destinationUrl");
  const trackingParameter = value(formData, "trackingParameter") || "subid";
  const reward = getInteger(formData, "pointsReward");
  const isActive = formData.get("isActive") === "on";
  const countriesText = value(formData, "allowedCountries");
  const countries = countriesText
    ? [...new Set(countriesText.split(",").map((country) => country.trim().toUpperCase()))]
    : [];
  if (id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return { error: "Invalid campaign ID." };
  }
  if (partnerName.length < 2 || partnerName.length > 80 || title.length < 3 || title.length > 120 || description.length > 500) {
    return { error: "Check partner name, title, and description lengths." };
  }
  let destination: URL;
  try {
    destination = new URL(destinationUrl);
  } catch {
    return { error: "Enter a valid partner campaign URL." };
  }
  if (destination.protocol !== "https:" || destination.username || destination.password) {
    return { error: "Campaign links must use HTTPS and cannot include embedded credentials." };
  }
  if (!/^[A-Za-z][A-Za-z0-9_]{0,39}$/.test(trackingParameter) || !reward) {
    return { error: "Enter a valid tracking parameter and positive whole-number points award." };
  }
  if (countries.length > 250 || countries.some((country) => !/^[A-Z]{2}$/.test(country))) {
    return { error: "Country availability must be a comma-separated list of ISO two-letter country codes." };
  }
  if (isActive && (process.env.POINTS_POSTBACK_SECRET?.length ?? 0) < 32) {
    return { error: "Configure POINTS_POSTBACK_SECRET before activating a campaign." };
  }
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { error: "The server-side Supabase service key is not configured." };
  const { error } = await supabase.rpc("save_points_campaign", {
    p_actor_id: actorId,
    p_campaign_id: id || null,
    p_partner_name: partnerName,
    p_title: title,
    p_description: description,
    p_destination_url: destination.toString(),
    p_tracking_parameter: trackingParameter,
    p_points_reward: reward,
    p_allowed_countries: countries,
    p_is_active: isActive,
  });
  if (error) {
    console.error("Could not save the point-reward campaign.", error);
    return { error: error.message.includes("points settings")
      ? "Save and enable points settings before activating a campaign."
      : "Could not save the campaign. Check its fields and confirm the migration is applied." };
  }
  revalidatePath("/admin/ads");
  revalidatePath("/earn");
  return { success: id ? "Points campaign updated." : "Points campaign created." };
}

export async function saveSurveyCategory(
  _previous: AdminPointsActionState,
  formData: FormData,
): Promise<AdminPointsActionState> {
  const actorId = await getAdminActorId();
  if (!actorId) return { error: "You are not authorized to manage survey categories." };
  const categoryId = value(formData, "categoryId");
  const name = value(formData, "name");
  const minimum = Number(value(formData, "minCashUsd"));
  const maxText = value(formData, "maxCashUsd");
  const maximum = maxText ? Number(maxText) : null;
  if (categoryId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(categoryId)) {
    return { error: "Invalid category." };
  }
  if (name.length < 2 || name.length > 80 ||
      !/^\d{1,8}(?:\.\d{1,2})?$/.test(value(formData, "minCashUsd")) ||
      !Number.isFinite(minimum) || minimum < 0 ||
      (maxText && (!/^\d{1,8}(?:\.\d{1,2})?$/.test(maxText) ||
        !Number.isFinite(maximum) || (maximum !== null && maximum <= minimum)))) {
    return { error: "Enter a category name and valid non-overlapping Cash Balance range." };
  }
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { error: "The server-side Supabase service key is not configured." };
  const { error } = await supabase.rpc("save_cash_survey_category", {
    p_actor_id: actorId,
    p_category_id: categoryId || null,
    p_name: name,
    p_min_cash_usd: minimum,
    p_max_cash_usd: maximum,
  });
  if (error) {
    console.error("Could not save the survey category.", error);
    return { error: error.message.includes("cannot overlap")
      ? "Cash Balance ranges may not overlap."
      : "Could not save the category. Check the name and balance range." };
  }
  revalidatePath("/admin/users");
  revalidatePath("/earn");
  return { success: categoryId ? "Survey category updated." : "Survey category created." };
}

export async function saveSurvey(
  _previous: AdminPointsActionState,
  formData: FormData,
): Promise<AdminPointsActionState> {
  const actorId = await getAdminActorId();
  if (!actorId) return { error: "You are not authorized to manage surveys." };
  const surveyId = value(formData, "surveyId");
  const categoryId = value(formData, "categoryId");
  const title = value(formData, "title");
  const description = value(formData, "description");
  const rewardUsd = getUsd(formData, "rewardUsd");
  const questions = value(formData, "questions")
    .split(/\r?\n/)
    .map((question) => question.trim())
    .filter(Boolean);
  if (surveyId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(surveyId)) {
    return { error: "Invalid survey." };
  }
  if (categoryId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(categoryId)) {
    return { error: "Select a valid survey category." };
  }
  if (title.length < 3 || title.length > 120 || description.length > 1000 ||
      !rewardUsd || questions.length < 1 || questions.length > 30 ||
      questions.some((question) => question.length < 3 || question.length > 500)) {
    return { error: "Enter a title, valid USD reward, and 1–30 questions (3–500 characters each)." };
  }
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { error: "The server-side Supabase service key is not configured." };
  const { error } = await supabase.rpc("save_admin_survey", {
    p_actor_id: actorId,
    p_survey_id: surveyId || null,
    p_category_id: categoryId || null,
    p_title: title,
    p_description: description,
    p_questions: questions,
    p_reward_usd: rewardUsd,
    p_is_published: formData.get("isPublished") === "on",
  });
  if (error) {
    console.error("Could not save survey.", error);
    return { error: "Could not save the survey. Confirm its category exists and the migration is applied." };
  }
  revalidatePath("/admin/users");
  revalidatePath("/earn");
  return { success: surveyId ? "Survey updated." : "Survey created." };
}

export async function reviewSurveySubmission(
  _previous: AdminPointsActionState,
  formData: FormData,
): Promise<AdminPointsActionState> {
  const actorId = await getAdminActorId();
  if (!actorId) return { error: "You are not authorized to review surveys." };
  const submissionId = value(formData, "submissionId");
  const decision = value(formData, "decision");
  const note = value(formData, "note");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(submissionId) ||
      !["approved", "rejected"].includes(decision) || note.length > 500) {
    return { error: "Invalid survey review." };
  }
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { error: "The server-side Supabase service key is not configured." };
  const { error } = await supabase.rpc("review_survey_submission", {
    p_actor_id: actorId,
    p_submission_id: submissionId,
    p_decision: decision,
    p_note: note,
  });
  if (error) {
    console.error("Could not review survey submission.", error);
    return { error: "Could not review this submission. It may have already been reviewed." };
  }
  revalidatePath("/admin/users");
  revalidatePath("/wallet");
  revalidatePath("/earn");
  return { success: decision === "approved" ? "Response approved and Cash Balance credited." : "Response rejected." };
}
