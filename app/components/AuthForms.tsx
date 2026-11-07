"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import type { AuthFormState } from "@/app/actions/auth";
import { loginAction, requestPasswordResetAction, signUpAction, updatePasswordAction } from "@/app/actions/auth";
import { countryFlag, phoneCountries } from "@/lib/countries";

const initialState: AuthFormState = {};

function Feedback({ state }: { state: AuthFormState }) {
  if (state.error) {
    return <p className="auth-feedback auth-feedback--error" role="alert">{state.error}</p>;
  }
  if (state.success) {
    return <p className="auth-feedback auth-feedback--success" role="status">{state.success}</p>;
  }
  return null;
}

function PasswordInput({
  id,
  name,
  label,
  autoComplete,
  onValueChange,
}: {
  id: string;
  name: string;
  label: string;
  autoComplete: string;
  onValueChange?: (value: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className="auth-password-wrap">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          onChange={onValueChange ? (event) => onValueChange(event.target.value) : undefined}
          required
        />
        <button
          className="auth-password-toggle"
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}

function CountryPhoneField() {
  const [selectedCode, setSelectedCode] = useState("KE");
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selectedCountry = phoneCountries.find((country) => country.code === selectedCode) ?? phoneCountries[0];
  const matchingCountries = useMemo(() => {
    const query = search.trim().toLowerCase().replace(/^\+/, "");
    if (!query) return phoneCountries;
    return phoneCountries.filter((country) =>
      country.name.toLowerCase().includes(query) ||
      country.code.toLowerCase().includes(query) ||
      country.dialCode.replace("+", "").includes(query),
    );
  }, [search]);

  return (
    <>
      <input type="hidden" name="countryIsoCode" value={selectedCountry.code} />
      <input type="hidden" name="countryName" value={selectedCountry.name} />
      <div className="auth-field auth-country-field">
        <label id="country-label">Country and phone number</label>
        <div className="auth-phone-control">
          <div className="auth-country-picker">
            <button
              className="auth-country-trigger"
              type="button"
              aria-labelledby="country-label"
              aria-expanded={isOpen}
              onClick={() => setIsOpen((open) => !open)}
            >
              <span>{countryFlag(selectedCountry.code)}</span>
              <span className="auth-country-trigger__name">{selectedCountry.name}</span>
              <strong>{selectedCountry.dialCode || "N/A"}</strong>
              <span aria-hidden="true">⌄</span>
            </button>
            {isOpen && (
              <div className="auth-country-menu">
                <input
                  aria-label="Search countries and dialing codes"
                  autoFocus
                  type="search"
                  placeholder="Search country or code"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <div className="auth-country-results" role="listbox" aria-label="Countries">
                  {matchingCountries.map((country) => (
                    <button
                      type="button"
                      role="option"
                      aria-selected={country.code === selectedCode}
                      key={country.code}
                      onClick={() => {
                        setSelectedCode(country.code);
                        setIsOpen(false);
                        setSearch("");
                      }}
                    >
                      <span>{countryFlag(country.code)}</span>
                      <span>{country.name}</span>
                      <strong>{country.dialCode || "Phone unavailable"}</strong>
                    </button>
                  ))}
                  {matchingCountries.length === 0 && (
                    <p className="auth-country-empty">No matching countries found.</p>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="auth-national-phone">
            <span>{selectedCountry.dialCode || "—"}</span>
            <input
              aria-label={`Phone number for ${selectedCountry.name}, without country code`}
              name="phoneNumberNational"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="Phone number"
              required
            />
          </div>
        </div>
        <small>Enter the local number only. We’ll validate and store it in international format.</small>
      </div>
    </>
  );
}

function UsernameAvailability({ configured }: { configured: boolean }) {
  const [username, setUsername] = useState("");
  const [result, setResult] = useState<{
    username: string;
    available: boolean | null;
    message: string;
  } | null>(null);

  const normalized = username.trim().toLowerCase();
  const valid = /^[a-z0-9_]{3,30}$/.test(normalized);
  const currentResult = result?.username === normalized ? result : null;

  useEffect(() => {
    if (!configured || !valid) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setResult({ username: normalized, available: null, message: "Checking availability…" });
      try {
        const response = await fetch(
          `/api/auth/username-availability?username=${encodeURIComponent(normalized)}`,
          { cache: "no-store", signal: controller.signal },
        );
        if (!response.ok) throw new Error("Username availability check failed.");
        const result = (await response.json()) as { available: boolean };
        setResult({
          username: normalized,
          available: result.available,
          message: result.available ? "Username is available." : "That username is unavailable.",
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setResult({
          username: normalized,
          available: null,
          message: "Availability check is temporarily unavailable.",
        });
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [configured, normalized, valid]);

  const message = !configured
    ? "Live availability checks activate after account setup."
    : valid
      ? currentResult?.message ?? "Checking availability…"
      : normalized
        ? "Use 3–30 letters, numbers, or underscores."
        : "Letters, numbers, and underscores only.";

  return (
    <div className="auth-field">
      <label htmlFor="signup-username">Desired username</label>
      <input
        id="signup-username"
        name="username"
        type="text"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        minLength={3}
        maxLength={30}
        pattern="[A-Za-z0-9_]{3,30}"
        value={username}
        onChange={(event) => setUsername(event.target.value)}
        required
      />
      <small className={currentResult?.available === false ? "auth-field__message--error" : currentResult?.available ? "auth-field__message--success" : ""} aria-live="polite">
        {message}
      </small>
    </div>
  );
}

function ReferralField({
  initialValue,
  configured,
}: {
  initialValue: string;
  configured: boolean;
}) {
  const [value, setValue] = useState(initialValue);
  const [result, setResult] = useState<{
    reference: string;
    valid: boolean;
    username: string;
    message: string;
  } | null>(null);
  const reference = value.trim();
  const currentResult = result?.reference === reference ? result : null;

  useEffect(() => {
    if (!configured || !reference || reference.length > 64) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setResult({
        reference,
        valid: false,
        username: "",
        message: "Checking invitation…",
      });
      try {
        const response = await fetch(
          `/api/auth/referral?reference=${encodeURIComponent(reference)}`,
          { cache: "no-store", signal: controller.signal },
        );
        if (!response.ok) throw new Error("Referral lookup failed.");
        const result = (await response.json()) as { valid: boolean; username?: string };
        setResult({
          reference,
          valid: result.valid,
          username: result.username ?? "",
          message: result.valid ? `Invited by ${result.username}.` : "Referral code or username not found.",
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setResult({
          reference,
          valid: false,
          username: "",
          message: "Referral check is temporarily unavailable.",
        });
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [configured, reference]);

  const message = !configured
    ? "Referral validation activates after account setup."
    : !reference
    ? "You can leave this blank to join directly."
    : reference.length > 64
      ? "Referral code or username is too long."
      : currentResult?.message ?? "Checking invitation…";

  return (
    <div className="auth-field">
      <label htmlFor="signup-referral">Referral code or username <span>(optional)</span></label>
      <input
        id="signup-referral"
        name="referralReference"
        type="text"
        autoCapitalize="none"
        maxLength={64}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Enter an invitation code or username"
      />
      <small className={currentResult?.valid ? "auth-field__message--success" : reference && currentResult ? "auth-field__message--error" : ""} aria-live="polite">
        {message}
      </small>
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters", valid: password.length >= 8 },
    { label: "Upper- and lowercase", valid: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { label: "A number", valid: /\d/.test(password) },
    { label: "A symbol", valid: /[^A-Za-z0-9]/.test(password) },
  ];

  return (
    <ul className="auth-password-checks" aria-label="Password requirements">
      {checks.map((check) => (
        <li className={check.valid ? "is-valid" : ""} key={check.label}>
          <span aria-hidden="true">{check.valid ? "✓" : "·"}</span> {check.label}
        </li>
      ))}
    </ul>
  );
}

export function SignupForm({ initialReferral = "", configured }: { initialReferral?: string; configured: boolean }) {
  const [state, formAction, pending] = useActionState(signUpAction, initialState);
  const [password, setPassword] = useState("");

  return (
    <form className="auth-form" action={formAction}>
      {!configured && (
        <div className="auth-setup-notice" role="status">
          Supabase is not configured yet. The form is ready, but account creation becomes active after the site owner adds the Supabase project settings.
        </div>
      )}
      <div className="auth-name-grid">
        <div className="auth-field">
          <label htmlFor="signup-first-name">First name</label>
          <input id="signup-first-name" name="firstName" autoComplete="given-name" maxLength={80} required />
        </div>
        <div className="auth-field">
          <label htmlFor="signup-last-name">Surname</label>
          <input id="signup-last-name" name="lastName" autoComplete="family-name" maxLength={80} required />
        </div>
      </div>
      <UsernameAvailability configured={configured} />
      <div className="auth-field">
        <label htmlFor="signup-email">Email address</label>
        <input id="signup-email" name="email" type="email" autoComplete="email" maxLength={254} required />
        <small>Email addresses are not verified during registration.</small>
      </div>
      <CountryPhoneField />
      <ReferralField initialValue={initialReferral} configured={configured} />
      <div className="auth-field">
        <PasswordInput
          id="signup-password"
          name="password"
          label="Create password"
          autoComplete="new-password"
          onValueChange={setPassword}
        />
        <PasswordStrength password={password} />
      </div>
      <PasswordInput
        id="signup-confirm-password"
        name="confirmPassword"
        label="Confirm password"
        autoComplete="new-password"
      />
      <label className="auth-terms">
        <input type="checkbox" name="acceptedTerms" required />
        <span>
          I agree to the Golden Rewards <Link href="/terms" target="_blank">Terms and Conditions</Link> and <Link href="/privacy" target="_blank">Privacy Policy</Link>.
        </span>
      </label>
      <Feedback state={state} />
      {state.success ? (
        <Link className="button button--gold auth-submit" href="/login">
          Continue to log in
        </Link>
      ) : (
        <button className="button button--gold auth-submit" type="submit" disabled={pending}>
          {pending ? "Creating account…" : "Create account"}
        </button>
      )}
      <p className="auth-switch">
        Already have an account? <Link href={`/login${initialReferral ? `?ref=${encodeURIComponent(initialReferral)}` : ""}`}>Log in</Link>
      </p>
    </form>
  );
}

export function LoginForm({
  referral = "",
  configured,
  notice = "",
}: {
  referral?: string;
  configured: boolean;
  notice?: string;
}) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const referralParam = referral ? `?ref=${encodeURIComponent(referral)}` : "";

  return (
    <form className="auth-form" action={formAction}>
      {!configured && (
        <div className="auth-setup-notice" role="status">
          Supabase is not configured yet. Ask the site owner to create a project and add its keys before signing in.
        </div>
      )}
      {notice && <p className="auth-feedback auth-feedback--notice" role="status">{notice}</p>}
      <div className="auth-field">
        <label htmlFor="login-identifier">Username or email</label>
        <input
          id="login-identifier"
          name="identifier"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
        />
      </div>
      <PasswordInput id="login-password" name="password" label="Password" autoComplete="current-password" />
      <div className="auth-login-options">
        <label className="auth-remember">
          <input type="checkbox" name="rememberMe" />
          <span>Remember me</span>
        </label>
        <Link href="/forgot-password">Forgot password?</Link>
      </div>
      <Feedback state={state} />
      <button className="button button--gold auth-submit" type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Log in"}
      </button>
      <p className="auth-switch">
        New to Golden Rewards? <Link href={`/register${referralParam}`}>Create an account</Link>
      </p>
    </form>
  );
}

export function ForgotPasswordForm({ configured }: { configured: boolean }) {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, initialState);

  return (
    <form className="auth-form" action={formAction}>
      {!configured && <div className="auth-setup-notice" role="status">Password recovery becomes available after Supabase is configured.</div>}
      {configured && (
        <div className="auth-setup-notice" role="status">
          Supabase’s default email service is restricted to organization team addresses. Public password reset emails may not be delivered.
        </div>
      )}
      <div className="auth-field">
        <label htmlFor="reset-email">Email address</label>
        <input id="reset-email" name="email" type="email" autoComplete="email" required />
      </div>
      <Feedback state={state} />
      <button className="button button--gold auth-submit" type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </button>
      <p className="auth-switch"><Link href="/login">Back to log in</Link></p>
    </form>
  );
}

export function UpdatePasswordForm() {
  const [state, formAction, pending] = useActionState(updatePasswordAction, initialState);

  return (
    <form className="auth-form" action={formAction}>
      <PasswordInput id="new-password" name="password" label="New password" autoComplete="new-password" />
      <PasswordInput id="confirm-new-password" name="confirmPassword" label="Confirm new password" autoComplete="new-password" />
      <Feedback state={state} />
      <button className="button button--gold auth-submit" type="submit" disabled={pending}>
        {pending ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
