# Guest Mode: Unified UI

**Date:** 2026-05-20
**Status:** Approved

## Context

The initial guest mode implementation created a completely separate guest dashboard (a ~115-line `if (!user)` branch in `Dashboard.tsx`). This means every future change to the real dashboard must be made in two places. It also strips the sidebar from guests entirely (`AppLayout` returns bare `<>{children}</>` for unauthenticated users), which leaves guests with no navigation once they enter a study mode.

The fix: guests see the same UI as authenticated users. Empty states handle the difference. One UI to maintain.

---

## 1. AppLayout — Show Sidebar for Guests

**File:** `src/components/AppLayout.tsx`

Remove the early return at lines 79–81:

```typescript
// DELETE THIS
if (!user) {
  return <>{children}</>;
}
```

Guests now receive the full sidebar/nav wrapper. The `DashboardSidebar` already reads `useAuth` internally for user-specific data — the only change needed is how it renders when `!user` (see Section 2).

---

## 2. DashboardSidebar — Greyed Auth-Gated Items

**File:** `src/components/DashboardSidebar.tsx` (and relevant sidebar sub-components)

When `!user`:

- **Bookmarks** nav item: renders at reduced opacity (`opacity-40`), no count badge, `disabled` (pointer-events none or `onClick` suppressed). Do not navigate — clicking does nothing.
- **Weak Questions** nav item: same treatment — visible but muted, no count badge, disabled.
- **User profile footer**: `DashboardSidebar` already guards the profile block with `{userId && userInfo && onProfileUpdate && (...)}` (line 309). When `AppLayout` passes `userId={undefined}` for guests, that block doesn't render. Add a fallback directly below it: a `Sign in →` link to `/auth` that only renders when `!userId`.
- All other nav items (Practice Test, Random Practice, Topics, Glossary, Find Test Site, Tools): unchanged — fully functional for guests.

The sidebar receives `weakQuestionCount` and `bookmarkCount` as props from `AppLayout`. Those are already derived from hooks that use `enabled: !!user`, so they'll be `0`/empty for guests — no special casing needed for the counts themselves, just suppress the badge render when the count is `0` and `!user`.

---

## 3. Dashboard.tsx — Delete Guest Block, Add Empty States

**File:** `src/pages/Dashboard.tsx`

### 3a. Delete the guest block

Remove the entire `if (!user) { return (<PageContainer>...</PageContainer>) }` block (~115 lines, starting around line 308). The dashboard renders for everyone.

Also remove these imports that are only used in the deleted block:
- `BookOpen`, `Shuffle`, `GraduationCap`, `BookMarked` from `lucide-react` (added in the original PR for the guest-only cards)

### 3b. Keep the guest banner

The dismissible blue guest banner stays. Move it from the deleted guest block into the top of the main dashboard render (inside the authenticated section, guarded by `!user`):

```tsx
{!user && !guestBannerDismissed && (
  <div className="flex items-center justify-between gap-3 bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 mb-6">
    <p className="text-sm text-foreground">
      You're studying as a guest — progress isn't being saved.{' '}
      <a href="/auth" className="text-primary hover:underline font-medium">
        Create a free account
      </a>
    </p>
    <button
      onClick={() => {
        localStorage.setItem('guest_banner_dismissed', 'true');
        setGuestBannerDismissed(true);
      }}
      aria-label="Dismiss banner"
      className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
    >
      ✕
    </button>
  </div>
)}
```

The `guestBannerDismissed` state and `localStorage` logic stays as-is.

### 3c. Empty states for data-dependent sections

Each section that depends on user data already has `enabled: !!user` on its query, so it returns `undefined`/empty for guests. Replace any spinner-only or null fallbacks with the **Empty State** pattern:

**Pattern:** Real widget structure, dashes/flat bars where numbers would go, `Sign in →` link at the bottom.

Apply to these sections (identify each by its current loading/empty handling):
- **Readiness Score**: show `—%`, flat progress bar, `Sign in →`
- **Streak**: show `—` day streak, `Sign in →`
- **Weak Questions**: show `0 weak questions` placeholder or `—`, `Sign in →`
- **Recent Tests**: show the section header + an empty state message ("No tests recorded yet — sign in to save results"), `Sign in →`
- **Bookmarks widget**: show `—` bookmarks, `Sign in →`

Each `Sign in →` links to `/auth`.

---

## 4. Back Navigation — Solved for Free

Once guests have the sidebar, navigating back from any study mode works identically to the authenticated experience — via the sidebar nav. No changes needed to `PracticeTest`, `RandomPractice`, or any other study mode component.

---

## 5. What Stays Unchanged

These pieces from the original guest mode PR are correct and stay as-is:

- `src/components/TestResults.tsx` — inline save card for guests after completing a test
- `src/components/QuestionCard.tsx` — guest bookmark popover
- `src/components/RandomPractice.tsx` — guest toast on session end
- `src/pages/Auth.tsx` — "Continue as guest" entry point
- `src/pages/Dashboard.test.tsx` — guest mode test (may need minor update to reflect new render path)
- `src/components/TestResults.test.tsx` — no changes needed

---

## 6. Files to Modify

| File | Change |
|---|---|
| `src/components/AppLayout.tsx` | Remove guest early return (3 lines) |
| `src/components/DashboardSidebar.tsx` | Mute Bookmarks + Weak Questions when `!user`; swap profile footer for Sign in link |
| `src/components/sidebar/SidebarNavItem.tsx` (or equivalent) | Support disabled/muted state for locked items |
| `src/pages/Dashboard.tsx` | Delete guest block; add banner + empty states to main render |

---

## 7. Verification

1. Visit `/` unauthenticated → lands on `/auth`
2. Click "Continue as guest" → lands on `/dashboard` with full sidebar visible
3. Sidebar shows Practice Test, Random Practice, Topics, Glossary as active nav items
4. Bookmarks and Weak Questions are visible in sidebar but muted (no count, non-clickable)
5. Sidebar footer shows "Sign in →" instead of user profile
6. Guest banner appears at top of dashboard, dismisses on ✕, doesn't reappear on refresh
7. Readiness Score, Streak, Weak Questions, Recent Tests, Bookmarks widgets all show empty states with "Sign in →" — not spinners, not broken
8. Click "Practice Test" → navigates into PracticeTest; sidebar is present; clicking "Dashboard" in sidebar returns to dashboard
9. Same for Random Practice, Topics, Glossary
10. Sign in from any "Sign in →" or "Create free account" link → returns to dashboard as authenticated user; sidebar now shows full user profile and counts
11. No Supabase API calls for user-scoped data while in guest mode (Network tab)
