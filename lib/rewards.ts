import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type EarningTask = {
  id: string;
  partner_name: string;
  title: string;
  description: string;
  reward_usd: number;
};

export type RewardLedgerEntry = {
  id: string;
  partner_name: string;
  amount_usd: number;
  status: "approved" | "reversed";
  created_at: string;
};

export type SurveyCashLedgerEntry = {
  id: string;
  amount_usd: number;
  created_at: string;
};

export type ReferralCashLedgerEntry = {
  id: string;
  description: string;
  amount_usd: number;
  created_at: string;
};

export type MemberReferralSummary = {
  totalInvited: number;
  successfulReferrals: number;
  pendingReferrals: number;
  earnedUsd: number;
};

type ReferralCashLedgerRow = Omit<ReferralCashLedgerEntry, "amount_usd"> & {
  amount_usd: number | string;
};

export async function getActiveEarningTasks() {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { tasks: null, error: "Earning tasks are not configured." };

  const { data, error } = await supabase
    .from("earning_tasks")
    .select("id, partner_name, title, description, reward_usd")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Could not load active partner earning tasks.", error);
    return {
      tasks: null,
      error: "Partner earning tasks are unavailable. Apply the rewards database migration to enable them.",
    };
  }
  return { tasks: data as EarningTask[], error: null };
}

export async function getMemberRewardHistory(limit = 50) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { entries: null, error: "Reward history is unavailable." };

  const { data, error } = await supabase
    .from("reward_ledger")
    .select("id, partner_name, amount_usd, status, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Could not load the member's reward ledger.", error);
    return {
      entries: null,
      error: "Reward history is unavailable. Apply the rewards database migration to enable it.",
    };
  }
  return { entries: data as RewardLedgerEntry[], error: null };
}

export async function getMemberSurveyRewardHistory(limit = 50) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { entries: null, error: "Survey reward history is unavailable." };

  const { data, error } = await supabase
    .from("survey_cash_ledger")
    .select("id, amount_usd, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Could not load the member's approved survey rewards.", error);
    return {
      entries: null,
      error: "Survey reward history is unavailable. Apply the points-and-surveys migration to enable it.",
    };
  }
  return {
    entries: (data ?? []).map((entry) => ({
      ...entry,
      amount_usd: Number(entry.amount_usd),
    })) as SurveyCashLedgerEntry[],
    error: null,
  };
}

export async function getMemberReferralCashHistory() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { entries: null, error: "Referral reward history is unavailable." };

  const { data, error } = await supabase.rpc("get_my_referral_cash_history");
  if (error) {
    console.error("Could not load the member's referral reward history.", error);
    return {
      entries: null,
      error: "Referral reward history is unavailable. Apply the referral welcome credits migration to enable it.",
    };
  }
  const entries = (data ?? []) as ReferralCashLedgerRow[];
  return {
    entries: entries.map((entry) => ({
      ...entry,
      amount_usd: Number(entry.amount_usd),
    })),
    error: null,
  };
}

export async function getMemberReferralSummary() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { summary: null, error: "Referral statistics are unavailable." };
  }

  const { data, error } = await supabase.rpc("get_my_referral_summary");
  if (error) {
    console.error("Could not load the member's referral summary.", error);
    return { summary: null, error: "Referral statistics are unavailable." };
  }

  const row = data?.[0];
  if (!row) {
    return { summary: null, error: "Referral statistics are unavailable." };
  }

  return {
    summary: {
      totalInvited: Number(row.total_invited),
      successfulReferrals: Number(row.successful_referrals),
      pendingReferrals: Number(row.pending_referrals),
      earnedUsd: Number(row.earned_usd),
    } satisfies MemberReferralSummary,
    error: null,
  };
}

export async function getMemberRewardSummary() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc("get_my_reward_summary");
  if (error) {
    console.error("Could not load the member's reward summary.", error);
    return null;
  }

  const summary = data?.[0];
  if (!summary) return { approvedUsd: 0, reversedUsd: 0, completedTasks: 0 };
  return {
    approvedUsd: Number(summary.approved_usd),
    reversedUsd: Number(summary.reversed_usd),
    completedTasks: Number(summary.completed_tasks),
  };
}

export async function getApprovedRewardTotals(userIds: string[]) {
  if (userIds.length === 0) return { totals: new Map<string, number>(), error: null };
  if (userIds.length > 100) {
    return { totals: new Map<string, number>(), error: "Too many users requested." };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return { totals: new Map<string, number>(), error: "Reward totals are unavailable." };
  }

  const { data, error } = await supabase.rpc("get_reward_totals_for_users", {
    p_user_ids: userIds,
  });
  if (error) {
    console.error("Could not load approved reward totals for users.", error);
    return { totals: new Map<string, number>(), error: "Reward totals are unavailable." };
  }

  return {
    totals: new Map(
      (data ?? []).map((row: { user_id: string; approved_usd: number | string }) => [
        row.user_id,
        Number(row.approved_usd),
      ]),
    ),
    error: null,
  };
}
