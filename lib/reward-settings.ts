import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function getDefaultPartnerRewardUsd(): Promise<number | null> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("reward_settings")
    .select("default_reward_usd")
    .eq("setting_key", "global")
    .maybeSingle();

  if (error) {
    console.error("Could not load the default partner reward amount.", error);
    return null;
  }
  return data?.default_reward_usd === null || !data
    ? null
    : Number(data.default_reward_usd);
}
