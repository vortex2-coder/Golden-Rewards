import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type AdSenseSettings = {
  enabled: boolean;
  clientId: string;
  slotId: string;
};

export async function getAdSenseSettings(): Promise<AdSenseSettings | null> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("adsense_settings")
    .select("enabled, client_id, slot_id")
    .eq("setting_key", "global")
    .maybeSingle();

  if (error) {
    throw new Error("Could not load Google AdSense settings from Supabase.");
  }
  if (!data) {
    throw new Error("The Google AdSense settings row is missing from Supabase.");
  }

  return {
    enabled: data.enabled,
    clientId: data.client_id,
    slotId: data.slot_id,
  };
}
