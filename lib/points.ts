import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PointsSummary = {
  balance: number;
  earnedToday: number;
  adsCompletedToday: number;
  unlockCost: number;
  accessHours: number;
  accessUntil: string | null;
  accessActive: boolean;
  cashBalanceUsd: number;
  surveyCategory: string | null;
};

export type PointsCampaign = {
  id: string;
  partner_name: string;
  title: string;
  description: string;
  points_reward: number;
};

export type AvailableSurvey = {
  id: string;
  title: string;
  description: string;
  questions: string[];
  reward_usd: number;
  category_name: string | null;
};

type AvailableSurveyRow = {
  id: string;
  title: string;
  description: string;
  questions: string[];
  reward_usd: number | string;
  category_name: string | null;
};

export type PointsLedgerEntry = {
  id: string;
  points_delta: number;
  reason: "campaign_reward" | "survey_unlock";
  partner_name: string | null;
  created_at: string;
};

export async function getMemberPointsSummary() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { summary: null, error: "Golden Points are not configured." };
  }
  const { data, error } = await supabase.rpc("get_my_points_summary");
  if (error) {
    console.error("Could not load the member's Golden Points summary.", error);
    return {
      summary: null,
      error: "Golden Points and surveys are not available until the points-and-surveys migration is applied.",
    };
  }
  const row = data?.[0];
  if (!row) return { summary: null, error: "Golden Points summary is unavailable." };
  return {
    summary: {
      balance: Number(row.points_balance),
      earnedToday: Number(row.points_earned_today),
      adsCompletedToday: Number(row.ads_completed_today),
      unlockCost: Number(row.unlock_cost),
      accessHours: Number(row.access_hours),
      accessUntil: row.access_until,
      accessActive: Boolean(
        row.access_until && new Date(row.access_until).getTime() > Date.now(),
      ),
      cashBalanceUsd: Number(row.cash_balance_usd),
      surveyCategory: row.survey_category,
    } satisfies PointsSummary,
    error: null,
  };
}

export async function getAvailablePointsCampaigns(countryCode: string) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { campaigns: null, error: "Reward campaigns are unavailable." };
  const { data, error } = await supabase
    .from("points_campaigns")
    .select("id, partner_name, title, description, points_reward, allowed_countries")
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Could not load Golden Points campaigns.", error);
    return {
      campaigns: null,
      error: "Reward campaigns are unavailable until the points-and-surveys migration is applied.",
    };
  }
  const normalizedCountry = countryCode.toUpperCase();
  const campaigns = (data ?? [])
    .filter((campaign) => {
      const countries = campaign.allowed_countries as string[];
      return countries.length === 0 || countries.includes(normalizedCountry);
    })
    .map((campaign) => ({
      id: campaign.id,
      partner_name: campaign.partner_name,
      title: campaign.title,
      description: campaign.description,
      points_reward: Number(campaign.points_reward),
    })) as PointsCampaign[];
  return { campaigns, error: null };
}

export async function getAvailableSurveys() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { surveys: null, error: "Survey access is unavailable." };
  const { data, error } = await supabase.rpc("get_available_surveys");
  if (error) {
    console.error("Could not load eligible surveys.", error);
    return { surveys: null, error: "Eligible surveys could not be loaded." };
  }
  return {
    surveys: ((data ?? []) as AvailableSurveyRow[]).map((survey) => ({
      id: survey.id,
      title: survey.title,
      description: survey.description,
      questions: survey.questions,
      reward_usd: Number(survey.reward_usd),
      category_name: survey.category_name,
    })),
    error: null,
  };
}

export async function getMemberPointsHistory(limit = 50) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { entries: null, error: "Golden Points history is unavailable." };
  const { data, error } = await supabase
    .from("points_ledger")
    .select("id, points_delta, reason, partner_name, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("Could not load Golden Points history.", error);
    return { entries: null, error: "Golden Points history is unavailable." };
  }
  return {
    entries: (data ?? []).map((entry) => ({
      ...entry,
      points_delta: Number(entry.points_delta),
      reason: entry.reason as PointsLedgerEntry["reason"],
    })) as PointsLedgerEntry[],
    error: null,
  };
}