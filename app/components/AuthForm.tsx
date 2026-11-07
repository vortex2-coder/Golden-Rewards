"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { AuthFormState } from "../actions/auth";

type AuthAction = (
  previousState: AuthFormState,
  formData: FormData,
) => Promise<AuthFormState>;

type AuthFormProps = {
  action: AuthAction;
  mode: "login" | "register";
  nextPath?: string;
  referralCode?: string;
};

const initialState: AuthFormState = {};

export default function AuthForm({
  action,
  mode,
  nextPath,
  referralCode,
}: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const isRegister = mode === "register";

  return (
    <main className="app-page public-page auth-page">
      <header className="public-page__heading">
        <span className="eyebrow">{isRegister ? "JOIN GOLDEN REWARDS" : "WELCOME BACK"}</span>
        <h1>{isRegister ? "Create your account." : "Sign in to your account."}</h1>
        <p>Secure account access is provided by Supabase.</p>
      </header>
      <form className="auth-form" action={formAction}>
        {isRegister && (
          <label>
            <span>Name</span>
            <input autoComplete="name" name="displayName" maxLength={40} required />
          </label>
        )}
        <label>
          <span>Email address</span>
          <input autoComplete="email" name="email" type="email" required />
        </label>
        <label>
          <span>Password</span>
          <input
            autoComplete={isRegister ? "new-password" : "current-password"}
            name="password"
            type="password"
            minLength={8}
            required
          />
        </label>
        {isRegister && (
          <label>
            <span>Referral code <small>(optional)</small></span>
            <input
              autoCapitalize="characters"
              defaultValue={referralCode}
              maxLength={10}
              name="referralCode"
              pattern="[A-Za-z0-9]{10}"
            />
          </label>
        )}
        {!isRegister && <input name="next" type="hidden" value={nextPath ?? "/"} />}
        {state.error && <p className="form-message form-message--error" role="alert">{state.error}</p>}
        {state.message && <p className="form-message" role="status">{state.message}</p>}
        <button className="button button--gold" disabled={pending} type="submit">
          {pending ? "Please wait…" : isRegister ? "Create account" : "Sign in"}
        </button>
      </form>
      <p className="auth-switch">
        {isRegister ? "Already have an account?" : "New to Golden Rewards?"}{" "}
        <Link href={isRegister ? "/login" : "/register"}>
          {isRegister ? "Sign in" : "Create account"}
        </Link>
      </p>
    </main>
  );
}
