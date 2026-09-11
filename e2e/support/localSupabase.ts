// The keys below are Supabase's fixed local-development keys — the same values
// `supabase status` prints for every project on every machine. They are not
// secrets and must not be swapped for real ones.
export const LOCAL_SUPABASE_URL = process.env.E2E_SUPABASE_URL ?? "http://127.0.0.1:54321";

export const LOCAL_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

export const LOCAL_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

/** Where auth.setup.ts saves the signed-in admin state; read by the config too. */
export const ADMIN_STATE_PATH = "e2e/.auth/admin.json";

export const ADMIN_EMAIL = "e2e-admin@example.com";
export const ADMIN_PASSWORD = "e2e-password-123";

const serviceHeaders = {
  apikey: LOCAL_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${LOCAL_SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
};

export const assertSupabaseReachable = async () => {
  try {
    const res = await fetch(`${LOCAL_SUPABASE_URL}/rest/v1/`, {
      headers: { apikey: LOCAL_ANON_KEY },
    });
    if (!res.ok && res.status !== 404) throw new Error(`status ${res.status}`);
  } catch (cause) {
    throw new Error(
      `Local Supabase is not reachable at ${LOCAL_SUPABASE_URL}.\n` +
        `The admin e2e tests need it for auth and seed data. Start it with:\n` +
        `  npm run supabase:start\n` +
        `Guest-route tests do not need it: npx playwright test --project=chromium-light smoke`,
      { cause },
    );
  }
};

/** Creates the e2e admin if absent and makes sure it holds the admin role. */
export const ensureAdminUser = async (): Promise<string> => {
  const created = await fetch(`${LOCAL_SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: serviceHeaders,
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
    }),
  });

  let userId: string | undefined;
  if (created.ok) {
    userId = (await created.json()).id;
  } else {
    // Already exists from an earlier run — look it up instead.
    const list = await fetch(
      `${LOCAL_SUPABASE_URL}/auth/v1/admin/users?per_page=1000`,
      { headers: serviceHeaders },
    );
    const users: Array<{ id: string; email: string }> = (await list.json()).users ?? [];
    userId = users.find((u) => u.email === ADMIN_EMAIL)?.id;
  }

  if (!userId) throw new Error(`Could not create or find ${ADMIN_EMAIL}`);

  const roles = await fetch(
    `${LOCAL_SUPABASE_URL}/rest/v1/user_roles?user_id=eq.${userId}&role=eq.admin`,
    { headers: serviceHeaders },
  );
  if (((await roles.json()) as unknown[]).length === 0) {
    const granted = await fetch(`${LOCAL_SUPABASE_URL}/rest/v1/user_roles`, {
      method: "POST",
      headers: serviceHeaders,
      body: JSON.stringify({ user_id: userId, role: "admin" }),
    });
    if (!granted.ok) {
      throw new Error(`Failed to grant admin role: ${granted.status} ${await granted.text()}`);
    }
  }

  return userId;
};
