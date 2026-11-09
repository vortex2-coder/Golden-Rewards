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

export type SurveyCategoryProgress = {
  currentCategory: string | null;
  nextCategory: string | null;
  nextCategoryCashUsd: number | null;
  progressPercent: number | null;
};

export type MemberSurveyActivity = {
  id: string;
  title: string;
  status: "pending" | "approved" | "rejected";
  review_note: string;
  created_at: string;
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

export async function getSurveyCategoryProgress(cashBalanceUsd: number) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return { progress: null, error: "Survey category progress is unavailable." };
  }

  const { data, error } = await supabase
    .from("survey_categories")
    .select("name, min_cash_usd, max_cash_usd")
    .order("min_cash_usd", { ascending: true });

  if (error) {
    console.error("Could not load survey category progress.", error);
    return { progress: null, error: "Survey category progress is unavailable." };
  }

  const categories = (data ?? []).map((category) => ({
    name: category.name,
    minCashUsd: Number(category.min_cash_usd),
    maxCashUsd:
      category.max_cash_usd === null ? null : Number(category.max_cash_usd),
  }));
  const current = categories.find(
    (category) =>
      category.minCashUsd <= cashBalanceUsd &&
      (category.maxCashUsd === null ||
        cashBalanceUsd < category.maxCashUsd),
  );
  const next = categories.find(
    (category) => category.minCashUsd > cashBalanceUsd,
  );

  let progressPercent: number | null = null;
  if (current?.maxCashUsd === null && current) {
    progressPercent = 100;
  } else if (current && next) {
    progressPercent = Math.min(
      100,
      Math.max(
        0,
        ((cashBalanceUsd - current.minCashUsd) /
          (next.minCashUsd - current.minCashUsd)) *
          100,
      ),
    );
  } else if (current?.maxCashUsd !== null && current) {
    progressPercent = Math.min(
      100,
      Math.max(
        0,
        ((cashBalanceUsd - current.minCashUsd) /
          (current.maxCashUsd - current.minCashUsd)) *
          100,
      ),
    );
  } else if (next) {
    const previous = [...categories]
      .reverse()
      .find(
        (category) =>
          category.maxCashUsd !== null &&
          category.maxCashUsd <= cashBalanceUsd,
      );
    const start = previous?.maxCashUsd ?? 0;
    progressPercent =
      next.minCashUsd > start
        ? Math.min(
            100,
            Math.max(
              0,
              ((cashBalanceUsd - start) / (next.minCashUsd - start)) * 100,
            ),
          )
        : 0;
  }

  return {
    progress: {
      currentCategory: current?.name ?? null,
      nextCategory: next?.name ?? null,
      nextCategoryCashUsd: next?.minCashUsd ?? null,
      progressPercent,
    } satisfies SurveyCategoryProgress,
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

export async function getMemberSurveyActivity(userId: string, limit = 5) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { entries: null, error: "Survey activity is unavailable." };
  }

  const { data, error } = await supabase
    .from("survey_submissions")
    .select("id, survey_id, status, review_note, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Could not load the member's survey activity.", error);
    return { entries: null, error: "Survey activity is unavailable." };
  }

  const submissions = data ?? [];
  if (submissions.length === 0) return { entries: [], error: null };

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return { entries: null, error: "Survey activity details are unavailable." };
  }

  const surveyIds = [...new Set(submissions.map((submission) => submission.survey_id))];
  const surveysResult = await admin
    .from("surveys")
    .select("id, title")
    .in("id", surveyIds);

  if (surveysResult.error) {
    console.error("Could not load titles for the member's survey activity.", surveysResult.error);
    return { entries: null, error: "Survey activity details are unavailable." };
  }

  const titles = new Map(
    (surveysResult.data ?? []).map((survey) => [survey.id, survey.title]),
  );

  return {
    entries: submissions.map((submission) => ({
      id: submission.id,
      title: titles.get(submission.survey_id) ?? "Survey unavailable",
      status: submission.status as MemberSurveyActivity["status"],
      review_note: submission.review_note,
      created_at: submission.created_at,
    })) satisfies MemberSurveyActivity[],
    error: null,
  };
}