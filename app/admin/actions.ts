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

  if (clientId && !/^ca-pub-\d{16}$/.test(clientId)) {
    return { error: "Enter a valid AdSense publisher ID (ca-pub- followed by 16 digits)." };
  }
  if (slotId && !/^\d{1,20}$/.test(slotId)) {
    return { error: "Enter a valid numeric AdSense ad slot ID." };
  }
  if (enabled && (!clientId || !slotId)) {
    return { error: "Enter both the publisher ID and ad slot ID before enabling the ad." };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return { error: "The server-side Supabase service key is not configured." };
  }

  const { error } = await supabase
    .from("adsense_settings")
    .upsert(
      {
        setting_key: "global",
        enabled,
        client_id: clientId,
        slot_id: slotId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "setting_key" },
    );

  if (error) {
    console.error("Could not save Google AdSense settings.", error);
    return {
      error: "Could not save AdSense settings. Confirm the latest Supabase migration has been applied.",
    };
  }

  revalidatePath("/admin");
  revalidatePath("/earn");
  return { success: "Google AdSense settings saved." };
}
