# End-to-end tests

Playwright drives the real app in a browser. These exist because the MUI
migration's acceptance criteria are things unit tests cannot answer: does the
screen still work, in light *and* dark mode, on a phone-sized viewport.

## Running

```bash
npm run e2e                  # everything (needs local Supabase, see below)
npm run e2e:ui               # interactive runner
npm run e2e:report           # open the last HTML report
npm run e2e:install          # one-time: download Chromium
```

Two groups of tests, with different requirements:

| Project | Needs Supabase? | Covers |
|---|---|---|
| `chromium-light`, `chromium-dark`, `mobile` | no | guest-accessible routes |
| `admin-light`, `admin-dark`, `admin-mobile` | **yes** | role-gated Admin screens |

Guest routes only:

```bash
npx playwright test --project=chromium-light --project=chromium-dark --project=mobile
```

Everything, including Admin:

```bash
npm run supabase:start
npm run e2e
```

The dev server is always pointed at local Supabase (see `webServer.env` in
`playwright.config.ts`), so a run never touches a hosted project.

## How Admin auth works

`auth.setup.ts` runs before the admin projects and:

1. Creates `e2e-admin@example.com` if it does not exist, using the local
   service-role key, and grants it the `admin` role in `user_roles`.
2. Signs in **through the real form** rather than injecting a session, so the
   saved `storageState` is whatever the app itself persists.
3. Writes that state to `e2e/.auth/admin.json` (gitignored).

Step 2 matters: injecting a session would let the tests pass even if login were
broken.

The keys in `e2e/support/localSupabase.ts` are Supabase's fixed
local-development keys — the same values `supabase status` prints on every
machine. They are not secrets, and they must not be replaced with real ones.

## CI

`.github/workflows/e2e.yml` runs the three guest projects on every PR. The admin
projects are deliberately excluded: standing up Supabase per-PR is not worth the
runtime, so run them locally before merging an Admin change.

## Conventions

- Test files are `*.e2e.ts`; setup files are `*.setup.ts`. Vitest owns
  `src/**/*.test.tsx` and the two runners must not collect each other's files.
- Prefer role- and label-based locators, matching the semantic queries the unit
  tests were converted to in #257.
- Assert no console errors on any page you navigate to; that has already caught
  real problems.
