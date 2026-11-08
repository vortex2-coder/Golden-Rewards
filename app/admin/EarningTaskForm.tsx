"use client";

import { useActionState } from "react";
import {
  saveEarningTask,
  type EarningTaskActionState,
} from "./earning-actions";

const initialState: EarningTaskActionState = {};

export type EarningTaskFormValues = {
  id: string;
  partner_name: string;
  title: string;
  description: string;
  destination_url: string;
  reward_usd: number;
  tracking_parameter: string;
  is_active: boolean;
};

export default function EarningTaskForm({
  task,
  defaultRewardUsd,
}: {
  task?: EarningTaskFormValues;
  defaultRewardUsd: number | null;
}) {
  const [state, formAction, pending] = useActionState(
    saveEarningTask,
    initialState,
  );

  return (
    <form className="admin-ads-form admin-task-form" action={formAction}>
      {task && <input type="hidden" name="taskId" value={task.id} />}
      <label className="admin-ads-form__field">
        <span>Partner name</span>
        <input
          name="partnerName"
          required
          minLength={2}
          maxLength={80}
          defaultValue={task?.partner_name ?? ""}
          placeholder="Your approved offer partner"
        />
      </label>
      <label className="admin-ads-form__field">
        <span>Offer title</span>
        <input
          name="title"
          required
          minLength={3}
          maxLength={120}
          defaultValue={task?.title ?? ""}
          placeholder="Complete a verified partner offer"
        />
      </label>
      <label className="admin-ads-form__field">
        <span>Description and completion terms</span>
        <textarea
          name="description"
          maxLength={500}
          rows={3}
          defaultValue={task?.description ?? ""}
        />
      </label>
      <label className="admin-ads-form__field">
        <span>Partner offer URL</span>
        <input
          name="destinationUrl"
          type="url"
          required
          defaultValue={task?.destination_url ?? ""}
          placeholder="https://partner.example/offer"
        />
      </label>
      <label className="admin-ads-form__field">
        <span>Reward amount (USD)</span>
        <input
          name="rewardUsd"
          type="number"
          required
          min="0.01"
          max="99999999.99"
          step="0.01"
          defaultValue={task?.reward_usd ?? defaultRewardUsd ?? ""}
          placeholder="0.25"
        />
      </label>
      <label className="admin-ads-form__field">
        <span>Partner tracking parameter</span>
        <input
          name="trackingParameter"
          required
          maxLength={40}
          pattern="[A-Za-z][A-Za-z0-9_]{0,39}"
          defaultValue={task?.tracking_parameter ?? "subid"}
        />
        <small>The click ID is added to the partner URL using this parameter.</small>
      </label>
      <label className="admin-ads-form__toggle">
        <input name="isActive" type="checkbox" defaultChecked={task?.is_active ?? false} />
        <span>Make this partner offer available to members</span>
      </label>
      {state.error && <p className="form-message" role="alert">{state.error}</p>}
      {state.success && <p className="form-message form-message--success" role="status">{state.success}</p>}
      <button className="button button--primary" type="submit" disabled={pending}>
        {pending ? "Saving…" : task ? "Save task" : "Add earning task"}
      </button>
    </form>
  );
}
