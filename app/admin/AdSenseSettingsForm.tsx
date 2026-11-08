"use client";

import { useActionState } from "react";
import {
  saveAdSenseSettings,
  type AdSenseSettingsActionState,
} from "./actions";

const initialState: AdSenseSettingsActionState = {};

export default function AdSenseSettingsForm({
  enabled,
  clientId,
  slotId,
}: {
  enabled: boolean;
  clientId: string;
  slotId: string;
}) {
  const [state, formAction, pending] = useActionState(
    saveAdSenseSettings,
    initialState,
  );

  return (
    <form className="admin-ads-form" action={formAction}>
      <label className="admin-ads-form__field">
        <span>AdSense publisher ID</span>
        <input
          name="clientId"
          type="text"
          autoComplete="off"
          placeholder="ca-pub-1234567890123456"
          defaultValue={clientId}
          pattern="ca-pub-[0-9]{16}"
          title="Use the publisher ID shown in your AdSense account."
        />
      </label>
      <label className="admin-ads-form__field">
        <span>Ad unit slot ID</span>
        <input
          name="slotId"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="1234567890"
          defaultValue={slotId}
          pattern="[0-9]{1,20}"
          title="Use the numeric ad slot ID from your AdSense ad unit."
        />
      </label>
      <label className="admin-ads-form__toggle">
        <input name="enabled" type="checkbox" defaultChecked={enabled} />
        <span>Show this ad unit on the Earn page</span>
      </label>
      <p className="supporting-copy">
        Only use standard publisher ads. Never pay or reward users for viewing,
        clicking, or interacting with AdSense ads. Enable ads only after your
        AdSense account and required consent setup are approved and configured.
      </p>
      {state.error && <p className="form-message" role="alert">{state.error}</p>}
      {state.success && <p className="form-message form-message--success" role="status">{state.success}</p>}
      <button className="button button--primary" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save AdSense settings"}
      </button>
    </form>
  );
}
