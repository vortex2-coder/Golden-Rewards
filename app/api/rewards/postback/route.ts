import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type PartnerPostback = {
  click_id?: unknown;
  event_id?: unknown;
  transaction_id?: unknown;
  partner_name?: unknown;
};

function isBoundedString(value: unknown, maximum: number): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= maximum;
}

export async function POST(request: NextRequest) {
  const secret = process.env.REWARDS_POSTBACK_SECRET;
  if (!secret || secret.length < 32) {
    return NextResponse.json({ error: "Partner rewards are not configured." }, { status: 503 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 8192) {
    return NextResponse.json({ error: "Request is too large." }, { status: 413 });
  }

  const rawBody = await request.text();
  if (Buffer.byteLength(rawBody, "utf8") > 8192) {
    return NextResponse.json({ error: "Request is too large." }, { status: 413 });
  }

  const suppliedSignature = request.headers.get("x-rewards-signature") ?? "";
  const expectedSignature = `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;
  const suppliedBuffer = Buffer.from(suppliedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (
    suppliedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(suppliedBuffer, expectedBuffer)
  ) {
    return NextResponse.json({ error: "Invalid partner signature." }, { status: 401 });
  }

  let event: PartnerPostback;
  try {
    event = JSON.parse(rawBody) as PartnerPostback;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  if (
    typeof event.click_id !== "string" ||
    !uuidPattern.test(event.click_id) ||
    !isBoundedString(event.event_id, 160) ||
    !isBoundedString(event.transaction_id, 160) ||
    !isBoundedString(event.partner_name, 80) ||
    event.partner_name.trim().length < 2
  ) {
    return NextResponse.json({ error: "Missing or invalid partner event fields." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Reward processing is unavailable." }, { status: 503 });
  }

  const { data, error } = await supabase.rpc("process_partner_reward", {
    p_click_id: event.click_id,
    p_provider_event_id: event.event_id,
    p_provider_transaction_id: event.transaction_id,
    p_partner_name: event.partner_name.trim(),
  });

  if (error) {
    console.error("Could not process the signed partner reward callback.", error);
    return NextResponse.json({ error: "Could not process this reward event." }, { status: 400 });
  }

  return NextResponse.json({
    accepted: true,
    credited: data === true,
    duplicate: data === false,
  });
}
