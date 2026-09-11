import { test as setup, expect } from "@playwright/test";
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  assertSupabaseReachable,
  ensureAdminUser,
} from "./support/localSupabase";

export const ADMIN_STATE = "e2e/.auth/admin.json";

// Signs in through the real form rather than injecting a session, so the saved
// storageState is whatever the app itself persists.
setup("authenticate as admin", async ({ page }) => {
  await assertSupabaseReachable();
  await ensureAdminUser();

  await page.goto("/auth");
  await page.getByRole("textbox", { name: /email/i }).fill(ADMIN_EMAIL);
  await page.getByRole("textbox", { name: /password/i }).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /^sign in$/i }).click();

  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 });
  await page.context().storageState({ path: ADMIN_STATE });
});
