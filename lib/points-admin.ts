import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type AdminPointsSettings = {
  enabled: boolean;
  max_points_per_day: number;
  max_rewarded_ads_per_day: number;
  survey_unlock_points: number;
  survey_access_hours: number;
};

export type AdminPointsCampaign = {
  id: string;
  partner_name: string;
  title: string;
  description: string;
  destination_url: string;
  tracking_parameter: string;
  points_reward: number;
  allowed_countries: string[];
  is_active: boolean;
};

export type AdminSurveyCategory = {
  id: string;
  name: string;
  min_cash_usd: number;
  max_cash_usd: number | null;
};

export type AdminSurvey = {
  id: string;
  category_id: string | null;
  title: string;
  description: string;
  questions: string[];
  reward_usd: number;
  is_published: boolean;
};

export type AdminSurveySubmission = {
  id: string;
  survey_id: string;
  user_id: string;
  answers: string[];
  status: "pending" | "approved" | "rejected";
  created_at: string;
  review_note: string;
  survey_title: string;
  reward_usd: number;
  username: string;
  email: string;
  survey_questions: string[];
};

export type AdminAuditEntry = {
  id: number;
  actor_user_id: string;
  event_type: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
};

export async function getPointsAdminData() {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return { data: null, error: "The server-side Supabase service key is missing." };
  }

  const [settingsResult, campaignsResult, categoriesResult, surveysResult, submissionsResult, auditResult] =
    await Promise.all([
      supabase.from("points_settings")
        .select("enabled, max_points_per_day, max_rewarded_ads_per_day, survey_unlock_points, survey_access_hours")
        .eq("setting_key", "global").maybeSingle(),
      supabase.from("points_campaigns")
        .select("id, partner_name, title, description, destination_url, tracking_parameter, points_reward, allowed_countries, is_active")
        .order("created_at", { ascending: false }),
      supabase.from("survey_categories")
        .select("id, name, min_cash_usd, max_cash_usd")
        .order("min_cash_usd", { ascending: true }),
      supabase.from("surveys")
        .select("id, category_id, title, description, questions, reward_usd, is_published")
        .order("created_at", { ascending: false }),
      supabase.from("survey_submissions")
        .select("id, survey_id, user_id, answers, status, created_at, review_note")
        .order("created_at", { ascending: false }).limit(100),
      supabase.from("admin_audit_log")
        .select("id, actor_user_id, event_type, entity_type, entity_id, details, created_at")
        .order("created_at", { ascending: false }).limit(30),
    ]);

  const results = [
    settingsResult.error,
    campaignsResult.error,
    categoriesResult.error,
    surveysResult.error,
    submissionsResult.error,
    auditResult.error,
  ];
  const failure = results.find(Boolean);
  if (failure) {
    console.error("Could not load the points and survey administration data.", failure);
    return {
      data: null,
      error: "Points and surveys are not initialized. Apply the points-and-surveys database migration first.",
    };
  }

  const surveyById = new Map((surveysResult.data ?? []).map((survey) => [survey.id, survey]));
  const userIds = [...new Set((submissionsResult.data ?? []).map((submission) => submission.user_id))];
  const profileResult = userIds.length
    ? await supabase.from("profiles").select("id, username, email").in("id", userIds)
    : { data: [], error: null };
  if (profileResult.error) {
    console.error("Could not load survey submitter details.", profileResult.error);
    return { data: null, error: "Survey submission details are unavailable." };
  }
  const profilesById = new Map((profileResult.data ?? []).map((profile) => [profile.id, profile]));

  return {
    data: {
      settings: (settingsResult.data ?? {
        enabled: false,
        max_points_per_day: 0,
        max_rewarded_ads_per_day: 0,
        survey_unlock_points: 0,
        survey_access_hours: 0,
      }) as AdminPointsSettings,
      campaigns: (campaignsResult.data ?? []).map((campaign) => ({
        ...campaign,
        points_reward: Number(campaign.points_reward),
        allowed_countries: campaign.allowed_countries as string[],
      })) as AdminPointsCampaign[],
      categories: (categoriesResult.data ?? []).map((category) => ({
        ...category,
        min_cash_usd: Number(category.min_cash_usd),
        max_cash_usd: category.max_cash_usd === null ? null : Number(category.max_cash_usd),
      })) as AdminSurveyCategory[],
      surveys: (surveysResult.data ?? []).map((survey) => ({
        ...survey,
        questions: survey.questions as string[],
        reward_usd: Number(survey.reward_usd),
      })) as AdminSurvey[],
      submissions: (submissionsResult.data ?? []).map((submission) => {
        const survey = surveyById.get(submission.survey_id);
        const profile = profilesById.get(submission.user_id);
        return {
          ...submission,
          answers: submission.answers as string[],
          status: submission.status as AdminSurveySubmission["status"],
          survey_title: survey?.title ?? "Survey unavailable",
          reward_usd: Number(survey?.reward_usd ?? 0),
          username: profile?.username ?? "member",
          email: profile?.email ?? "",
          survey_questions: (survey?.questions ?? []) as string[],
        };
      }) as AdminSurveySubmission[],
      audit: (auditResult.data ?? []) as AdminAuditEntry[],
    },
    error: null,
  };
}