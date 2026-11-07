"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/app/actions/auth";

export default function ProfileEditForm({
  firstName,
  lastName,
}: {
  firstName: string;
  lastName: string;
}) {
  const [state, formAction, pending] = useActionState(updateProfileAction, {});

  return (
    <form className="profile-edit-form" action={formAction}>
      <div className="auth-name-grid">
        <div className="auth-field">
          <label htmlFor="profile-first-name">First name</label>
          <input id="profile-first-name" name="firstName" defaultValue={firstName} maxLength={80} required />
        </div>
        <div className="auth-field">
          <label htmlFor="profile-last-name">Surname</label>
          <input id="profile-last-name" name="lastName" defaultValue={lastName} maxLength={80} required />
        </div>
      </div>
      {state.error && <p className="auth-feedback auth-feedback--error" role="alert">{state.error}</p>}
      {state.success && <p className="auth-feedback auth-feedback--success" role="status">{state.success}</p>}
      <button className="button button--outline" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
