# Guest Mode Design

**Date:** 2026-05-20  
**Status:** Approved

## Context

Users are abandoning the app before trying it because they're required to create an account before seeing any content. The ask: let anyone walk into the app, use every study mode, and experience the product without signing up. Progress simply doesn't get saved, and the app is transparent about why — not pushy about converting.

The core principle: **feature-honest framing, not sales pressure.** Every sign-up nudge explains what an account enables technically, not why the user should "unlock" something.

---

## Approach: Progressive Auth Prompts

Guests access the full app. Auth prompts appear inline at meaningful save moments. The app earns the ask rather than front-loading friction.

---

## 1. Entry & Routing

**Current behavior:** `Index.tsx` redirects unauthenticated users to `/auth`, which has no escape — users must create an account to proceed.

**New behavior:**
- `Index.tsx` keeps its existing logic: authenticated users → `/dashboard`, unauthenticated → `/auth`
- `/auth` page gains a **"Continue as guest"** option (see Section 2)
- `/dashboard` removes its auth redirect guard — `!user` means guest mode, not a redirect
- `/admin` stays fully protected, no change

**Files to modify:**
- `src/pages/Auth.tsx` — add guest entry point
- `src/pages/Dashboard.tsx` — remove auth redirect (lines 130-134)

---

## 2. Auth Page: Guest Entry Point

A "Continue as guest" option is added **below** the existing sign-in form and Google button, separated by a divider. It uses a dashed border to visually signal it's a secondary path.

**Layout:**
```
[Sign in form]
[Continue with Google]
────── or ──────
┌ - - - - - - - - - - - - - - - ┐
  Continue as guest →
  Progress won't be saved
└ - - - - - - - - - - - - - - - ┘
```

**Behavior:** Clicking it navigates to `/dashboard`. No session is created, no backend calls are made. The user is now in guest mode.

**File to modify:** `src/pages/Auth.tsx`

---

## 3. Dashboard: Guest State

### What works for guests (no auth needed)
All study mode action cards render and function normally:
- Practice Test
- Random Practice
- Study by Topic
- Glossary

These work because `useQuestions` has no auth requirement — questions are public data.

### What requires an account (data-dependent sections)
The following sections replace their content with a **feature-honest placeholder** when `!user`:
- Readiness score / psychometrics
- Streak counter
- Weak questions
- Recent test results
- Bookmarks widget

**Placeholder pattern (copy principle):**
> *"[Feature name] requires an account because [honest technical reason]."*

Examples:
- *"Tracking your progress over time requires an account — there's nowhere to save it without one."*
- *"Identifying weak areas requires a history of your answers, which needs an account."*
- *"Bookmarks need an account to persist — otherwise they disappear when you close the tab."*

Each placeholder includes a **"Create free account"** link — not a button styled like a CTA, just a link. Tone: informational, not promotional.

### Why no backend calls fire
All user-scoped TanStack Query hooks already use `enabled: !!user`. When `user` is null, the queries never execute — no requests, no errors, no broken states. This pattern is documented in `src/services/queryKeys.ts` and used consistently across all hooks in `src/hooks/`.

### Dismissible top banner
A one-time blue info banner appears at the top of the dashboard for all guest sessions:

> *"You're studying as a guest — progress isn't being saved. [Create a free account](link) to save your results."*

Dismissible via ✕. Dismissed state stored in `localStorage` so it doesn't reappear on refresh.

**File to modify:** `src/pages/Dashboard.tsx` and the relevant dashboard section components

---

## 4. Progressive Auth Prompts (Save Moments)

Auth prompts appear at three specific save moments. All are dismissible and non-blocking.

### 4a. After completing a practice test
An inline card renders **below the score** on the test results screen.

**Copy:** *"Test results require an account to save — there's nowhere to put them without one."*

**Actions:**
- `Create free account` (links to `/auth?returnTo=/dashboard`)
- `Continue without saving` (dismisses the card)

The score and full results are always visible — the card is additive, never a gate.

**File to modify:** `src/components/PracticeTest.tsx`

### 4b. Clicking a bookmark icon
A small tooltip/popover appears on the bookmark icon instead of triggering a save.

**Copy:** *"Bookmarks need an account to persist — they'd disappear when you close the tab."*

**Actions:**
- `Create free account` link
- Tooltip dismisses on click-away

**Files to modify:** bookmark icon component(s) in `src/components/`

### 4c. Random practice session end
A Sonner toast appears using the existing toast pattern.

**Copy:** *"Your practice session wasn't saved — create a free account to track your progress."*

No action button — just the message with a link. Uses the existing `toast()` call pattern from `src/hooks/use-toast.ts`.

**File to modify:** `src/components/RandomPractice.tsx`

---

## 5. Copy Principles (Global)

All guest-facing copy follows this rule: **explain what an account enables technically, not why the user should want to sign up.**

| ❌ Don't write | ✓ Write instead |
|---|---|
| "Sign up to unlock your stats" | "Stats require an account — there's nowhere to store them without one" |
| "Create an account to get started" | "Continue as guest" (on auth page) |
| "You're missing out on features" | "This feature tracks X over time, which needs an account" |
| "Sign up free — it only takes a second" | "Create a free account" (plain link, no pressure) |

---

## 6. Scope Boundaries

**In scope:**
- Auth page guest entry point
- Dashboard auth guard removal + guest placeholders
- Dismissible guest banner
- Post-test inline save card
- Bookmark guest tooltip
- Random practice guest toast

**Out of scope (no change needed):**
- `useProgress` save operations already return early on `!user` — no changes needed
- `progressService.requireUserId()` already handles unauthenticated gracefully
- All user-scoped query hooks already have `enabled: !!user` — no changes needed
- `/admin` route — stays protected

---

## 7. Verification

1. Visit `/` without being logged in → should land on `/auth`
2. Click "Continue as guest" → should land on `/dashboard`
3. Guest banner appears at top of dashboard, dismisses on ✕, doesn't reappear on refresh
4. All study mode cards are clickable and launch their respective modes
5. Data-dependent sections (readiness, streaks, weak questions) show placeholder copy, not errors or empty states
6. Complete a practice test as guest → inline save card appears below score, results are fully visible
7. Click a bookmark icon as guest → tooltip appears, no save attempt made, no console errors
8. Complete a random practice session as guest → toast notification appears
9. Sign in from any "Create free account" link → `returnTo` param returns user to the correct page after auth
10. Verify no Supabase API calls are made for user-scoped data while in guest mode (Network tab)
