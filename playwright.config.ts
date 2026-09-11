import { defineConfig, devices } from "@playwright/test";
import {
  ADMIN_STATE_PATH,
  LOCAL_ANON_KEY,
  LOCAL_SUPABASE_URL,
} from "./e2e/support/localSupabase";

const PORT = 8080;
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

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
    // Guest routes need no database. They must also skip auth.setup.ts, which
    // does — otherwise running only these projects (as CI does) drags the admin
    // login in with them and fails with no Supabase.
    { name: "chromium-light", testMatch: /smoke\.e2e\.ts/, use: { ...devices["Desktop Chrome"], colorScheme: "light" } },
    { name: "chromium-dark", testMatch: /smoke\.e2e\.ts/, use: { ...devices["Desktop Chrome"], colorScheme: "dark" } },
    { name: "mobile", testMatch: /smoke\.e2e\.ts/, use: { ...devices["Pixel 7"] } },

    { name: "setup", testMatch: /auth\.setup\.ts/ },

    // Admin screens are role-gated, so these reuse the signed-in state and run
    // in all three viewports/themes for the migration's acceptance criteria.
    {
      name: "admin-light",
      testMatch: /admin.*\.e2e\.ts/,
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], colorScheme: "light", storageState: ADMIN_STATE_PATH },
    },
    {
      name: "admin-dark",
      testMatch: /admin.*\.e2e\.ts/,
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], colorScheme: "dark", storageState: ADMIN_STATE_PATH },
    },
    {
      name: "admin-mobile",
      testMatch: /admin.*\.e2e\.ts/,
      dependencies: ["setup"],
      use: { ...devices["Pixel 7"], storageState: ADMIN_STATE_PATH },
    },
  ],

  // Always point the app at local Supabase: e2e needs the seeded question pool
  // and an admin it can create, neither of which should touch a hosted project.
  webServer: {
    // --strictPort so a busy 8080 fails immediately. Without it Vite quietly
    // binds the next free port and Playwright polls 8080 until it times out.
    command: "npm run dev -- --strictPort",
    url: BASE_URL,
    // Never reuse: webServer.env is only applied to a server Playwright starts
    // itself. Reusing one left over from `npm run dev:hosted` would run the
    // whole suite against the hosted project while still seeding local
    // Supabase - a confusing half-broken state rather than a clean failure.
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: LOCAL_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: LOCAL_ANON_KEY,
    },
  },
});
