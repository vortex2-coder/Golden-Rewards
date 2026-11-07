import { signOutAction } from "@/app/actions/auth";

export default function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button className="button button--outline" type="submit">Log out</button>
    </form>
  );
}
