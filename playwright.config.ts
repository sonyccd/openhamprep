import { defineConfig, devices } from "@playwright/test";
import { LOCAL_ANON_KEY, LOCAL_SUPABASE_URL } from "./e2e/support/localSupabase";

const PORT = 8080;
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;
const ADMIN_STATE = "e2e/.auth/admin.json";

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./e2e/.artifacts",
  // Vitest owns src/**/*.test.tsx; keep the two runners from collecting each
  // other's files.
  testMatch: /.*\.(e2e|setup)\.ts/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    // Guest routes need no database, so they stay independent of the setup step.
    { name: "chromium-light", testIgnore: /admin/, use: { ...devices["Desktop Chrome"], colorScheme: "light" } },
    { name: "chromium-dark", testIgnore: /admin/, use: { ...devices["Desktop Chrome"], colorScheme: "dark" } },
    { name: "mobile", testIgnore: /admin/, use: { ...devices["Pixel 7"] } },

    { name: "setup", testMatch: /auth\.setup\.ts/ },

    // Admin screens are role-gated, so these reuse the signed-in state and run
    // in all three viewports/themes for the migration's acceptance criteria.
    {
      name: "admin-light",
      testMatch: /admin.*\.e2e\.ts/,
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], colorScheme: "light", storageState: ADMIN_STATE },
    },
    {
      name: "admin-dark",
      testMatch: /admin.*\.e2e\.ts/,
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], colorScheme: "dark", storageState: ADMIN_STATE },
    },
    {
      name: "admin-mobile",
      testMatch: /admin.*\.e2e\.ts/,
      dependencies: ["setup"],
      use: { ...devices["Pixel 7"], storageState: ADMIN_STATE },
    },
  ],

  // Always point the app at local Supabase: e2e needs the seeded question pool
  // and an admin it can create, neither of which should touch a hosted project.
  webServer: {
    command: "npm run dev",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: LOCAL_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: LOCAL_ANON_KEY,
    },
  },
});
