"use server";

import { revalidatePath } from "next/cache";
import { getCurrentMember } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type AdSenseSettingsActionState = {
  error?: string;
  success?: string;
};

export async function saveAdSenseSettings(
  _previousState: AdSenseSettingsActionState,
  formData: FormData,
): Promise<AdSenseSettingsActionState> {
  const member = await getCurrentMember();
  if (
    !member.configured ||
    !member.user ||
    !member.profile ||
    member.profile.account_status !== "active" ||
    member.user.app_metadata?.role !== "admin"
  ) {
    return { error: "You are not authorized to update advertising settings." };
  }

  const enabled = formData.get("enabled") === "on";
  const clientId = String(formData.get("clientId") ?? "").trim();
  const slotId = String(formData.get("slotId") ?? "").trim();
  const rewardText = String(formData.get("rewardUsd") ?? "").trim();
  const rewardUsd = Number(rewardText);

  if (clientId && !/^ca-pub-\d{16}$/.test(clientId)) {
    return { error: "Enter a valid AdSense publisher ID (ca-pub- followed by 16 digits)." };
  }
  if (slotId && !/^\d{1,20}$/.test(slotId)) {
    return { error: "Enter a valid numeric AdSense ad slot ID." };
  }
  if (enabled && (!clientId || !slotId)) {
    return { error: "Enter both the publisher ID and ad slot ID before enabling the ad." };
  }
  if (
    !/^\d{1,8}(?:\.\d{1,2})?$/.test(rewardText) ||
    !Number.isFinite(rewardUsd) ||
    rewardUsd <= 0
  ) {
    return {
      error: "Enter a partner reward amount greater than zero with no more than two decimal places.",
    };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return { error: "The server-side Supabase service key is not configured." };
  }

  const { error } = await supabase.rpc("save_admin_ad_and_reward_settings", {
    p_enabled: enabled,
    p_client_id: clientId,
    p_slot_id: slotId,
    p_reward_usd: rewardUsd,
  });

  if (error) {
    console.error("Could not save AdSense and partner reward settings.", error);
    return {
      error: "Could not save ad and reward settings. Confirm the default partner reward migration has been applied.",
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/ads");
  revalidatePath("/earn");
  return { success: "Ad and default partner reward settings saved." };
}
