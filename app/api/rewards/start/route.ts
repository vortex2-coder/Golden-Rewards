import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentMember } from "@/lib/supabase/server";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  const member = await getCurrentMember();
  if (
    !member.configured ||
    !member.user ||
    !member.profile ||
    member.profile.account_status !== "active" ||
    member.user.app_metadata?.role === "admin"
  ) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (!process.env.REWARDS_POSTBACK_SECRET) {
    return new NextResponse("Partner rewards are not configured.", { status: 503 });
  }

  const formData = await request.formData();
  const taskValue = formData.get("task");
  const taskId = typeof taskValue === "string" ? taskValue : null;
  if (!taskId || !uuidPattern.test(taskId)) {
    return new NextResponse("Invalid earning task.", { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return new NextResponse("Earning tasks are unavailable.", { status: 503 });
  }

  const { data: task, error: taskError } = await supabase
    .from("earning_tasks")
    .select("id, partner_name, destination_url, tracking_parameter, reward_usd")
    .eq("id", taskId)
    .eq("is_active", true)
    .maybeSingle();

  if (taskError) {
    console.error("Could not load the requested earning task.", taskError);
    return new NextResponse("Could not load this earning task.", { status: 500 });
  }
  if (!task) return new NextResponse("This earning task is unavailable.", { status: 404 });

  const destination = new URL(task.destination_url);
  if (destination.protocol !== "https:") {
    return new NextResponse("This earning task has an invalid destination.", { status: 500 });
  }

  const { data: click, error: clickError } = await supabase
    .from("reward_clicks")
    .insert({
      user_id: member.user.id,
      task_id: task.id,
      partner_name: task.partner_name,
      reward_usd: task.reward_usd,
    })
    .select("id")
    .single();

  if (clickError || !click) {
    console.error("Could not record the earning-task click.", clickError);
    return new NextResponse("Could not start this earning task.", { status: 500 });
  }

  destination.searchParams.set(task.tracking_parameter, click.id);
  return NextResponse.redirect(destination, 302);
}
