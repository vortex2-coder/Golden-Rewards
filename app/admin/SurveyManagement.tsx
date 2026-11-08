"use client";

import { useActionState } from "react";
import {
  reviewSurveySubmission,
  saveSurvey,
  saveSurveyCategory,
  type AdminPointsActionState,
} from "./points-actions";
import type {
  AdminAuditEntry,
  AdminSurvey,
  AdminSurveyCategory,
  AdminSurveySubmission,
} from "@/lib/points-admin";

const initialState: AdminPointsActionState = {};

function ActionMessage({ state }: { state: AdminPointsActionState }) {
  return (
    <>
      {state.error && <p className="form-message" role="alert">{state.error}</p>}
      {state.success && <p className="form-message form-message--success" role="status">{state.success}</p>}
    </>
  );
}

function CategoryForm({ category }: { category?: AdminSurveyCategory }) {
  const [state, action, pending] = useActionState(saveSurveyCategory, initialState);
  return (
    <form className="admin-ads-form admin-task-form" action={action}>
      {category && <input type="hidden" name="categoryId" value={category.id} />}
      <label className="admin-ads-form__field">
        <span>Category name</span>
        <input name="name" required minLength={2} maxLength={80} defaultValue={category?.name ?? ""} />
      </label>
      <div className="admin-survey-range">
        <label className="admin-ads-form__field">
          <span>Minimum Cash Balance (USD, inclusive)</span>
          <input name="minCashUsd" type="number" min="0" step="0.01" required defaultValue={category?.min_cash_usd ?? 0} />
        </label>
        <label className="admin-ads-form__field">
          <span>Maximum Cash Balance (USD, exclusive)</span>
          <input name="maxCashUsd" type="number" min="0.01" step="0.01" defaultValue={category?.max_cash_usd ?? ""} placeholder="No upper limit" />
        </label>
      </div>
      <small className="supporting-copy">Ranges may not overlap. Membership updates automatically as Cash Balance changes; no cash is reserved or deducted.</small>
      <ActionMessage state={state} />
      <button className="button button--primary" disabled={pending}>{pending ? "Saving…" : category ? "Update category" : "Add category"}</button>
    </form>
  );
}

function SurveyForm({
  survey,
  categories,
}: {
  survey?: AdminSurvey;
  categories: AdminSurveyCategory[];
}) {
  const [state, action, pending] = useActionState(saveSurvey, initialState);
  return (
    <form className="admin-ads-form admin-task-form" action={action}>
      {survey && <input type="hidden" name="surveyId" value={survey.id} />}
      <label className="admin-ads-form__field">
        <span>Survey title</span>
        <input name="title" required minLength={3} maxLength={120} defaultValue={survey?.title ?? ""} />
      </label>
      <label className="admin-ads-form__field">
        <span>Description</span>
        <textarea name="description" maxLength={1000} rows={2} defaultValue={survey?.description ?? ""} />
      </label>
      <label className="admin-ads-form__field">
        <span>Eligible Cash Balance category</span>
        <select name="categoryId" defaultValue={survey?.category_id ?? ""}>
          <option value="">All categories (within current survey access)</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
      </label>
      <label className="admin-ads-form__field">
        <span>Cash reward after admin approval (USD)</span>
        <input name="rewardUsd" type="number" min="0.01" max="99999999.99" step="0.01" required defaultValue={survey?.reward_usd ?? ""} />
      </label>
      <label className="admin-ads-form__field">
        <span>Questions (one per line)</span>
        <textarea name="questions" rows={5} required defaultValue={survey?.questions.join("\n") ?? ""} placeholder={"What do you think about this product?\nHow likely are you to recommend it?"} />
        <small>1–30 questions. User responses stay pending until reviewed by an administrator.</small>
      </label>
      <label className="admin-ads-form__toggle">
        <input name="isPublished" type="checkbox" defaultChecked={survey?.is_published ?? false} />
        <span>Publish for eligible users</span>
      </label>
      <ActionMessage state={state} />
      <button className="button button--primary" disabled={pending}>{pending ? "Saving…" : survey ? "Save survey" : "Create survey"}</button>
    </form>
  );
}

function ReviewForm({ submission }: { submission: AdminSurveySubmission }) {
  const [state, action, pending] = useActionState(reviewSurveySubmission, initialState);
  return (
    <form className="admin-ads-form admin-survey-review-form" action={action}>
      <input type="hidden" name="submissionId" value={submission.id} />
      <label className="admin-ads-form__field">
        <span>Review note (optional)</span>
        <textarea name="note" maxLength={500} rows={2} />
      </label>
      <ActionMessage state={state} />
      <div className="admin-survey-review-actions">
        <button className="button button--primary" name="decision" value="approved" disabled={pending}>Approve and credit</button>
        <button className="button button--outline" name="decision" value="rejected" disabled={pending}>Reject</button>
      </div>
    </form>
  );
}

export default function SurveyManagement({
  categories,
  surveys,
  submissions,
  audit,
}: {
  categories: AdminSurveyCategory[];
  surveys: AdminSurvey[];
  submissions: AdminSurveySubmission[];
  audit: AdminAuditEntry[];
}) {
  const pendingSubmissions = submissions.filter((submission) => submission.status === "pending");
  return (
    <>
      <section className="wallet-section" aria-labelledby="survey-categories-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">LIVE CASH BALANCE BANDS</span>
            <h2 id="survey-categories-title">Survey categories</h2>
          </div>
          <span className="status-pill">{categories.length} configured</span>
        </div>
        <p className="supporting-copy">
          Category is derived from a member’s current net Cash Balance. Editing or changing categories never deducts, reserves, or locks cash.
        </p>
        <div className="admin-earning-task-list">
          {categories.map((category) => (
            <details className="admin-earning-task" key={category.id}>
              <summary>
                <span>
                  <strong>{category.name}</strong>
                  <small>${category.min_cash_usd.toFixed(2)} inclusive – {category.max_cash_usd === null ? "no upper limit" : `$${category.max_cash_usd.toFixed(2)} exclusive`}</small>
                </span>
                <span className="status-pill">Edit</span>
              </summary>
              <CategoryForm category={category} />
            </details>
          ))}
        </div>
        <details className="admin-earning-task admin-earning-task--new">
          <summary><strong>Add a survey category</strong></summary>
          <CategoryForm />
        </details>
      </section>

      <section className="wallet-section" aria-labelledby="surveys-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">SURVEY AUTHORING</span>
            <h2 id="surveys-title">Surveys</h2>
          </div>
          <span className="status-pill">{surveys.length} configured</span>
        </div>
        <div className="admin-earning-task-list">
          {surveys.map((survey) => (
            <details className="admin-earning-task" key={survey.id}>
              <summary>
                <span>
                  <strong>{survey.title}</strong>
                  <small>${survey.reward_usd.toFixed(2)} USD · {survey.questions.length} questions</small>
                </span>
                <span className="status-pill">{survey.is_published ? "Published" : "Draft"}</span>
              </summary>
              <SurveyForm survey={survey} categories={categories} />
            </details>
          ))}
        </div>
        <details className="admin-earning-task admin-earning-task--new">
          <summary><strong>Create a survey</strong></summary>
          <SurveyForm categories={categories} />
        </details>
      </section>

      <section className="wallet-section" aria-labelledby="survey-review-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">MANUAL RESPONSE REVIEW</span>
            <h2 id="survey-review-title">Survey submissions</h2>
          </div>
          <span className="status-pill">{pendingSubmissions.length} pending</span>
        </div>
        {pendingSubmissions.length ? (
          <div className="admin-earning-task-list">
            {pendingSubmissions.map((submission) => (
              <details className="admin-earning-task" key={submission.id}>
                <summary>
                  <span>
                    <strong>{submission.survey_title}</strong>
                    <small>@{submission.username} · {submission.email} · {new Date(submission.created_at).toLocaleString()}</small>
                  </span>
                  <span className="status-pill">Pending · ${submission.reward_usd.toFixed(2)}</span>
                </summary>
                <div className="admin-survey-answers">
                  {submission.answers.map((answer, index) => (
                    <div key={`${submission.id}-${index}`}>
                      <strong>{submission.survey_questions[index] ?? `Question ${index + 1}`}</strong>
                      <p>{answer}</p>
                    </div>
                  ))}
                </div>
                <ReviewForm submission={submission} />
              </details>
            ))}
          </div>
        ) : (
          <div className="empty-state-card">
            <h3>No responses awaiting review</h3>
            <p>Survey rewards are credited to Cash Balance only after approval.</p>
          </div>
        )}
      </section>

      <section className="wallet-section" aria-labelledby="admin-audit-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">ADMINISTRATOR ACTIVITY</span>
            <h2 id="admin-audit-title">Audit log</h2>
          </div>
          <span className="status-pill">Latest {audit.length}</span>
        </div>
        {audit.length ? (
          <div className="admin-earning-task-list">
            {audit.map((entry) => (
              <article className="admin-earning-task" key={entry.id}>
                <div className="admin-survey-answers">
                  <strong>{entry.event_type.replaceAll("_", " ")}</strong>
                  <small>
                    {entry.entity_type}
                    {entry.entity_id ? ` · ${entry.entity_id}` : ""}
                    {" · "}
                    {new Date(entry.created_at).toLocaleString()}
                  </small>
                  <small>Administrator: {entry.actor_user_id}</small>
                  <pre>{JSON.stringify(entry.details, null, 2)}</pre>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state-card">
            <h3>No administrator activity recorded</h3>
            <p>Changes to points, campaigns, survey categories, surveys, and reviews will appear here.</p>
          </div>
        )}
      </section>
    </>
  );
}