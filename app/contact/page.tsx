import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Golden Rewards",
  description: "Contact information for Golden Rewards.",
};

export default function ContactPage() {
  return (
    <main className="public-page article-page">
      <header className="public-page__heading">
        <span className="eyebrow">CONTACT</span>
        <h1>Get in touch</h1>
        <p>
          A working contact address has not yet been provided for this
          website.
        </p>
      </header>
      <aside className="legal-draft">
        <strong>Owner action required before launch</strong>
        <p>
          Add an email address that you control, and confirm who operates the
          site. Do not publish a guessed address or ask visitors to send
          passwords, payment details, or identity documents.
        </p>
      </aside>
    </main>
  );
}
