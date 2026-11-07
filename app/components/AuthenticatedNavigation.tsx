import BottomNavigation from "@/app/components/BottomNavigation";
import { getCurrentMember } from "@/lib/supabase/server";

export default async function AuthenticatedNavigation() {
  const member = await getCurrentMember();
  if (!member.configured || !member.user || member.profile?.account_status !== "active") {
    return null;
  }
  return <BottomNavigation />;
}
