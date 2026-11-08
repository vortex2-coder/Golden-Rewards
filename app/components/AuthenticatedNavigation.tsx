import BottomNavigation from "@/app/components/BottomNavigation";
import { getCurrentMember } from "@/lib/supabase/server";
import NavigationVisibility from "./NavigationVisibility";

export default async function AuthenticatedNavigation() {
  const member = await getCurrentMember();
  const authenticated =
    member.configured &&
    Boolean(member.user) &&
    member.profile?.account_status === "active";
  const admin = member.user?.app_metadata?.role === "admin";
  return (
    <NavigationVisibility
      authenticated={authenticated}
      admin={admin}
      navigation={<BottomNavigation />}
    />
  );
}
