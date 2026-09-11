import { test, expect } from "@playwright/test";
import { collectAppErrors } from "./support/consoleErrors";

// Baseline for the B1 pilot (#258): these assert what the Admin questions
// screen must still do once it is rebuilt on MUI DataGrid, so the same file
// covers the before and after.

test.beforeEach(async ({ page }) => {
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: /admin/i }).first()).toBeVisible({
    timeout: 20_000,
  });
});

test("an admin can see the question pool", async ({ page }) => {
  await expect(page.getByText("T1A01").first()).toBeVisible({ timeout: 20_000 });
});

test("searching narrows the questions shown", async ({ page }) => {
  const search = page.getByPlaceholder(/search/i).first();
  await search.fill("T1A01");

  await expect(page.getByText("T1A01").first()).toBeVisible();
  await expect(page.getByText("T1A02")).toHaveCount(0);
});

test("the edit dialog opens for a question", async ({ page }) => {
  await expect(page.getByText("T1A01").first()).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "Edit T1A01" }).click();

  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText(/Edit Question: T1A01/i)).toBeVisible();
});

test("no console errors while browsing and filtering", async ({ page }) => {
  const errors = collectAppErrors(page);

  await page.getByPlaceholder(/search/i).first().fill("T1");
  await expect(page.getByText("T1A01").first()).toBeVisible({ timeout: 20_000 });

  expect(errors).toEqual([]);
});
