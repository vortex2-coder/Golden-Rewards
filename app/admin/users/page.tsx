import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Admin users",
  description: "Registered Golden Rewards user accounts.",
};

const pageSize = 30;

export default async function AdminUsersPage({
  searchParams,
}: PageProps<"/admin/users">) {
  const params = await searchParams;
  const requestedPage = Number(params.page);
  const page =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return (
      <main className="app-page public-page admin-page">
        <header className="public-page__heading">
          <span className="eyebrow">ADMIN · USERS</span>
          <h1>Registered users</h1>
        </header>
        <div className="empty-state-card">
          <h2>User data is not configured</h2>
          <p>The server-side Supabase service key is missing.</p>
        </div>
      </main>
    );
  }

  const from = (page - 1) * pageSize;
  const { data: users, count, error } = await supabase
    .from("profiles")
    .select(
      "id, first_name, last_name, username, email, country, account_status, created_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (error) {
    throw new Error("Could not load registered users from Supabase.");
  }

  const totalUsers = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalUsers / pageSize));

  return (
    <main className="app-page public-page admin-page">
      <header className="public-page__heading">
        <span className="eyebrow">ADMIN · USERS</span>
        <h1>Registered users</h1>
        <p>{totalUsers} total user{totalUsers === 1 ? "" : "s"} registered.</p>
      </header>

      <section className="wallet-section admin-users-list" aria-label="Registered users">
        {users?.length ? (
          users.map((user) => (
            <article className="admin-user-row" key={user.id}>
              <span className="profile-avatar profile-avatar--small" aria-hidden="true">
                {user.username.slice(0, 1).toUpperCase()}
              </span>
              <span className="admin-user-row__identity">
                <strong>{user.first_name} {user.last_name}</strong>
                <small>@{user.username} · {user.email}</small>
                <small>{user.country} · Joined {new Date(user.created_at).toLocaleDateString()}</small>
              </span>
              <span className="status-pill">
                {user.account_status === "active" ? "Active" : "Suspended"}
              </span>
            </article>
          ))
        ) : (
          <div className="empty-state-card">
            <h2>No registered users</h2>
            <p>New accounts will appear here.</p>
          </div>
        )}
      </section>

      <nav className="admin-pagination" aria-label="User list pages">
        {page > 1 ? (
          <Link className="button button--outline" href={`/admin/users?page=${page - 1}`}>
            Previous
          </Link>
        ) : <span />}
        <span>Page {Math.min(page, totalPages)} of {totalPages}</span>
        {page < totalPages ? (
          <Link className="button button--outline" href={`/admin/users?page=${page + 1}`}>
            Next
          </Link>
        ) : <span />}
      </nav>
    </main>
  );
}
