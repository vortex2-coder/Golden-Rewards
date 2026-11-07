import type { Metadata } from "next";
import { AuthenticatedPage } from "../components/AuthenticatedPage";

export const metadata: Metadata = {
  title: "Wallet",
  description:
    "Golden Rewards wallet status. Standard AdSense views do not create a payable balance.",
};

export default function WalletPage() {
  return (
    <AuthenticatedPage>
    <main className="app-page public-page wallet-page">
      <header className="public-page__heading">
        <span className="eyebrow">WALLET</span>
        <h1>Your wallet.</h1>
        <p>
          Review your balance, payment settings, and transaction activity.
        </p>
      </header>
      <section className="wallet-balance-card" id="availability">
        <div className="wallet-balance-card__top">
          <span>AVAILABLE BALANCE</span>
          <span className="wallet-balance-card__chip" aria-hidden="true" />
        </div>
        <strong>$—</strong>
        <small>No rewards ledger is connected to this website</small>
        <button className="button button--muted" type="button" disabled>
          Withdraw
        </button>
      </section>
      <div className="summary-grid wallet-summary-grid">
        <article className="summary-card"><span>Pending balance</span><strong>—</strong><small>Not tracked</small></article>
        <article className="summary-card"><span>Total earnings</span><strong>—</strong><small>Not tracked</small></article>
        <article className="summary-card"><span>Total withdrawals</span><strong>—</strong><small>Not tracked</small></article>
        <article className="summary-card"><span>Payment methods</span><strong>None</strong><small>Not configured</small></article>
      </div>
      <section className="wallet-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">PAYMENT METHODS</span>
            <h2>Payment methods</h2>
          </div>
          <span className="status-pill">Not configured</span>
        </div>
        <p className="supporting-copy">Payment details are not collected until a verified rewards and payout service is available.</p>
        <button className="button button--muted" type="button" disabled>Add payment method</button>
      </section>
      <section className="wallet-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">TRANSACTIONS</span>
            <h2>Transaction history</h2>
          </div>
          <span className="status-pill">No ledger</span>
        </div>
        <div className="empty-state-card">
          <h3>No transactions yet</h3>
          <p>There are no reward credits or withdrawals recorded in this account.</p>
        </div>
        <div className="withdrawal-states">
          <span className="withdrawal-states__label">Possible withdrawal statuses</span>
          <div className="withdrawal-states__list" aria-label="Possible withdrawal statuses">
            <span>Pending</span>
            <span>Processing</span>
            <span>Approved</span>
            <span>Rejected</span>
            <span>Completed</span>
          </div>
        </div>
      </section>
    </main>
    </AuthenticatedPage>
  );
}
