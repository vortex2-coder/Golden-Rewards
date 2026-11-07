"use client";

import { useActionState } from "react";
import { updateDisplayName, updatePassword } from "../actions/account";
import type { AuthFormState } from "../actions/auth";

const initialState: AuthFormState = {};

export default function ProfileSettings({ displayName }: { displayName: string }) {
  const [profileState, profileAction, profilePending] = useActionState(
    updateDisplayName,
    initialState,
  );
  const [passwordState, passwordAction, passwordPending] = useActionState(
    updatePassword,
    initialState,
  );

  return (
    <>
      <form className="settings-form" action={profileAction}>
        <label>
          <span>Display name</span>
          <input
            autoComplete="name"
            defaultValue={displayName}
            maxLength={40}
            minLength={2}
            name="displayName"
            required
          />
        </label>
        {profileState.error && <p className="form-message form-message--error" role="alert">{profileState.error}</p>}
        {profileState.message && <p className="form-message" role="status">{profileState.message}</p>}
        <button className="button button--gold" disabled={profilePending} type="submit">
          {profilePending ? "Saving…" : "Save profile"}
        </button>
      </form>

      <form className="settings-form settings-form--security" action={passwordAction}>
        <div>
          <span className="eyebrow">PASSWORD &amp; SECURITY</span>
          <h3>Change password</h3>
          <p>Verify your current password before choosing a new one.</p>
        </div>
        <label>
          <span>Current password</span>
          <input autoComplete="current-password" name="currentPassword" required type="password" />
        </label>
        <label>
          <span>New password</span>
          <input autoComplete="new-password" minLength={8} name="newPassword" required type="password" />
        </label>
        <label>
          <span>Confirm new password</span>
          <input autoComplete="new-password" minLength={8} name="confirmPassword" required type="password" />
        </label>
        {passwordState.error && <p className="form-message form-message--error" role="alert">{passwordState.error}</p>}
        {passwordState.message && <p className="form-message" role="status">{passwordState.message}</p>}
        <button className="button button--outline" disabled={passwordPending} type="submit">
          {passwordPending ? "Updating…" : "Update password"}
        </button>
      </form>
    </>
  );
}
