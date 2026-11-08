"use server";

import { revalidatePath } from "next/cache";
import { getCurrentMember } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type EarningTaskActionState = {
  error?: string;
  success?: string;
};

function readFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function saveEarningTask(
  _previousState: EarningTaskActionState,
  formData: FormData,
): Promise<EarningTaskActionState> {
  const member = await getCurrentMember();
  if (
    !member.configured ||
    !member.user ||
    !member.profile ||
    member.profile.account_status !== "active" ||
    member.user.app_metadata?.role !== "admin"
  ) {
    return { error: "You are not authorized to update earning tasks." };
  }

  const taskId = readFormValue(formData, "taskId");
  const partnerName = readFormValue(formData, "partnerName");
  const title = readFormValue(formData, "title");
  const description = readFormValue(formData, "description");
  const destinationUrl = readFormValue(formData, "destinationUrl");
  const trackingParameter = readFormValue(formData, "trackingParameter") || "subid";
  const rewardText = readFormValue(formData, "rewardUsd");
  const rewardUsd = Number(rewardText);
  const isActive = formData.get("isActive") === "on";

  if (taskId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(taskId)) {
    return { error: "Invalid earning task." };
  }
  if (partnerName.length < 2 || partnerName.length > 80) {
    return { error: "Partner name must be between 2 and 80 characters." };
  }
  if (title.length < 3 || title.length > 120 || description.length > 500) {
    return { error: "Enter a task title up to 120 characters and description up to 500 characters." };
  }
  let destination: URL;
  try {
    destination = new URL(destinationUrl);
  } catch {
    return { error: "Enter a valid partner offer URL." };
  }
  if (destination.protocol !== "https:" || destination.username || destination.password) {
    return { error: "Partner offer URLs must use HTTPS and cannot include embedded credentials." };
  }
  if (
    !/^\d{1,8}(?:\.\d{1,2})?$/.test(rewardText) ||
    !Number.isFinite(rewardUsd) ||
    rewardUsd <= 0
  ) {
    return { error: "Enter a USD reward greater than zero with no more than two decimal places." };
  }
  if (!/^[A-Za-z][A-Za-z0-9_]{0,39}$/.test(trackingParameter)) {
    return { error: "Tracking parameter must start with a letter and contain only letters, numbers, or underscores." };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return { error: "The server-side Supabase service key is not configured." };
  }

  const values = {
    partner_name: partnerName,
    title,
    description,
    destination_url: destination.toString(),
    reward_usd: rewardUsd,
    tracking_parameter: trackingParameter,
    is_active: isActive,
    updated_at: new Date().toISOString(),
  };

  const result = taskId
    ? await supabase.from("earning_tasks").update(values).eq("id", taskId).select("id").maybeSingle()
    : await supabase.from("earning_tasks").insert(values).select("id").single();

  if (result.error) {
    console.error("Could not save an earning task.", result.error);
    return {
      error: "Could not save the earning task. Confirm the partner rewards migration has been applied.",
    };
  }
  if (!result.data) return { error: "The earning task could not be found." };

  revalidatePath("/admin/ads");
  revalidatePath("/earn");
  revalidatePath("/admin/users");
  return { success: taskId ? "Earning task updated." : "Earning task created." };
}
