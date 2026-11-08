"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, getCurrentMember } from "@/lib/supabase/server";

export type SurveyActionState = {
  error?: string;
  success?: string;
};

async function getEligibleMember() {
  const member = await getCurrentMember();
  if (
    !member.configured ||
    !member.user ||
    !member.profile ||
    member.profile.account_status !== "active" ||
    member.user.app_metadata?.role === "admin"
  ) return null;
  return member;
}

export async function unlockSurveyAccess(
  _previous: SurveyActionState,
  _formData: FormData,
): Promise<SurveyActionState> {
  void _previous;
  void _formData;
  const member = await getEligibleMember();
  if (!member) return { error: "Sign in as an active member to unlock surveys." };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "Survey access is unavailable." };

  const { data, error } = await supabase.rpc("unlock_my_surveys");
  if (error) {
    console.error("Could not unlock surveys with Golden Points.", error);
    return { error: error.message.includes("Not enough Golden Points")
      ? "You do not have enough Golden Points."
      : "Could not unlock surveys. Check your points and try again." };
  }
  revalidatePath("/earn");
  revalidatePath("/wallet");
  return { success: `Survey access is unlocked until ${new Date(data).toLocaleString()}.` };
}

export async function submitSurveyResponse(
  _previous: SurveyActionState,
  formData: FormData,
): Promise<SurveyActionState> {
  void _previous;
  const member = await getEligibleMember();
  if (!member) return { error: "Sign in as an active member to submit a survey." };
  const surveyIdValue = formData.get("surveyId");
  const surveyId = typeof surveyIdValue === "string" ? surveyIdValue : "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(surveyId)) {
    return { error: "Invalid survey." };
  }
  const answers: string[] = [];
  for (let index = 0; index < 30; index += 1) {
    const answer = formData.get(`answer_${index}`);
    if (answer === null) break;
    if (typeof answer !== "string" || answer.trim().length > 2000) {
      return { error: "Survey answers must be text with no more than 2,000 characters each." };
    }
    answers.push(answer.trim());
  }
  if (answers.length === 0 || answers.some((answer) => answer.length === 0)) {
    return { error: "Please answer every survey question." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "Survey submission is unavailable." };
  const { error } = await supabase.rpc("submit_survey_response", {
    p_survey_id: surveyId,
    p_answers: answers,
  });
  if (error) {
    console.error("Could not submit survey answers.", error);
    return { error: "Could not submit this survey. It may have expired or already been submitted." };
  }
  revalidatePath("/earn");
  revalidatePath("/admin/users");
  return { success: "Survey submitted for administrator review. Cash reward is pending approval." };
}