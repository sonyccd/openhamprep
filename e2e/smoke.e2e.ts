import { test, expect } from "@playwright/test";

// Guest-accessible routes only. Nothing here needs Supabase auth, so these run
// against a plain `npm run dev` with no local database.

const collectErrors = (page: import("@playwright/test").Page) => {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
};

test("/ sends guests to the sign-in page", async ({ page }) => {
  const errors = collectErrors(page);

  await page.goto("/");

  // Index is a pure redirect: guests to /auth, signed-in users to /dashboard.
  await expect(page).toHaveURL(/\/auth$/);
  await expect(page.getByRole("textbox", { name: /email/i })).toBeVisible();
  await expect(page.getByRole("textbox", { name: /password/i })).toBeVisible();

  expect(errors, "console errors on /auth").toEqual([]);
});

test("/dashboard renders for a guest", async ({ page }) => {
  const errors = collectErrors(page);

  await page.goto("/dashboard");

  // Guest mode: the dashboard renders placeholders rather than redirecting.
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 15_000 });

  expect(errors, "console errors on /dashboard").toEqual([]);
});

test("the light/dark class the whole app keys off is applied", async ({ page }) => {
  // next-themes owns this class; Tailwind's dark: variants and the MUI theme's
  // CSS variables both read it, so a regression here is app-wide.
  await page.goto("/dashboard");

  await page.waitForFunction(
    () => {
      const c = document.documentElement.classList;
      return c.contains("light") || c.contains("dark");
    },
    null,
    { timeout: 15_000 },
  );

  const applied = await page.evaluate(() => ({
    classes: Array.from(document.documentElement.classList),
    background: getComputedStyle(document.body).backgroundColor,
  }));

  expect(applied.classes.some((c) => c === "light" || c === "dark")).toBe(true);
  // A transparent body means the theme never painted.
  expect(applied.background).not.toBe("rgba(0, 0, 0, 0)");
});
