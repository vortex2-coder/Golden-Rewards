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
  if ((process.env.POINTS_POSTBACK_SECRET?.length ?? 0) < 32) {
    return new NextResponse("Partner-confirmed points are not configured.", { status: 503 });
  }

  const formData = await request.formData();
  const campaignValue = formData.get("campaign");
  const campaignId = typeof campaignValue === "string" ? campaignValue : "";
  if (!uuidPattern.test(campaignId)) {
    return new NextResponse("Invalid campaign.", { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) return new NextResponse("Campaigns are unavailable.", { status: 503 });
  const [{ data: settings, error: settingsError }, { data: campaign, error: campaignError }] =
    await Promise.all([
      supabase.from("points_settings").select("enabled").eq("setting_key", "global").maybeSingle(),
      supabase
        .from("points_campaigns")
        .select("id, partner_name, destination_url, tracking_parameter, points_reward, allowed_countries")
        .eq("id", campaignId)
        .eq("is_active", true)
        .maybeSingle(),
    ]);

  if (settingsError || campaignError) {
    console.error("Could not verify the points campaign before redirect.", settingsError ?? campaignError);
    return new NextResponse("Campaign could not be verified.", { status: 500 });
  }
  if (!settings?.enabled || !campaign) {
    return new NextResponse("This campaign is unavailable.", { status: 404 });
  }
  const allowedCountries = campaign.allowed_countries as string[];
  if (allowedCountries.length && !allowedCountries.includes(member.profile.country_iso_code.toUpperCase())) {
    return new NextResponse("This campaign is not available in your country.", { status: 403 });
  }
  const destination = new URL(campaign.destination_url);
  if (destination.protocol !== "https:") {
    return new NextResponse("This campaign has an invalid destination.", { status: 500 });
  }

  const { data: click, error: clickError } = await supabase
    .from("points_clicks")
    .insert({
      user_id: member.user.id,
      campaign_id: campaign.id,
      partner_name: campaign.partner_name,
      points_reward: campaign.points_reward,
    })
    .select("id")
    .single();
  if (clickError || !click) {
    console.error("Could not record the member's points campaign click.", clickError);
    return new NextResponse("Could not start this campaign.", { status: 500 });
  }

  destination.searchParams.set(campaign.tracking_parameter, click.id);
  return NextResponse.redirect(destination, 302);
}