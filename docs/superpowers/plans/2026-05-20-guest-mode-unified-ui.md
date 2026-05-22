# Guest Mode: Unified UI — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the separate guest dashboard with the real authenticated UI — guests see the same chrome and layout as logged-in users, with empty states handling the difference.

**Architecture:** Remove AppLayout's `!user` early return so the full sidebar renders for everyone. Sidebar adapts when `userId` is undefined (disabled auth-gated items, "Sign in →" footer). Delete the ~115-line guest dashboard block from Dashboard.tsx and move the guest banner into the main render. Four focused changes, one commit each.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, Vitest

---

## File Map

| File | What changes |
|---|---|
| `src/components/AppLayout.tsx` | Remove 3-line guest early return; make `userInfo` conditional on `!!user` |
| `src/components/sidebar/SidebarFooter.tsx` | Add "Sign in →" guest branch when `!userInfo` |
| `src/components/DashboardSidebar.tsx` | Add `disabled: !userId` to `bookmarks` nav item |
| `src/pages/Dashboard.tsx` | Delete ~115-line guest block; move banner into main render; remove orphaned imports |
| `src/pages/Dashboard.test.tsx` | Update guest mode test assertion to match new render |

---

## Task 1: AppLayout — Remove Guest Early Return

**Files:**
- Modify: `src/components/AppLayout.tsx`

- [ ] **Step 1: Read the file**

Open `src/components/AppLayout.tsx`. Locate the block at lines 79–81:
```typescript
if (!user) {
  return <>{children}</>;
}
```
And the `userInfo` assignment below it (around line 83–87):
```typescript
const userInfo = {
  displayName: profile?.display_name || null,
  email: user.email || null,
  forumUsername: profile?.forum_username || null,
};
```

- [ ] **Step 2: Delete the guest early return and fix userInfo**

Replace both blocks so guests get the sidebar and `userInfo` is safe when `user` is null:

```typescript
// Remove the three-line if (!user) block entirely.

// Change the userInfo assignment to:
const userInfo = user ? {
  displayName: profile?.display_name || null,
  email: user.email || null,
  forumUsername: profile?.forum_username || null,
} : undefined;
```

`DashboardSidebar` already accepts `userInfo?: UserInfo` and `userId?: string` — passing `undefined` is safe.

Also update the `DashboardSidebar` call to pass `userId={user?.id}` and `onProfileUpdate={user ? handleProfileUpdate : undefined}` (find these props in the `<DashboardSidebar ... />` JSX below and adjust):

```tsx
<DashboardSidebar
  currentView={currentView}
  onViewChange={onViewChange}
  onSignOut={handleSignOut}
  isCollapsed={sidebarCollapsed}
  onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
  weakQuestionCount={weakQuestionIds.length}
  bookmarkCount={filteredBookmarks.length}
  isTestAvailable={isTestAvailable}
  userInfo={userInfo}
  userId={user?.id}
  onProfileUpdate={user ? handleProfileUpdate : undefined}
  selectedTest={selectedTest}
  onTestChange={onTestChange}
  onSearch={onSearch}
/>
```

- [ ] **Step 3: Run the test suite to verify nothing breaks**

```bash
npm run test:run -- --reporter=verbose 2>&1 | tail -30
```

Expected: all existing tests pass. The only behavioral change so far is that guests now get the sidebar rendered — visual in-browser verification comes in a later task.

- [ ] **Step 4: Commit**

```bash
git add src/components/AppLayout.tsx
git commit -m "feat: show sidebar for guest users in AppLayout"
```

---

## Task 2: SidebarFooter — Guest Sign-In State

**Files:**
- Modify: `src/components/sidebar/SidebarFooter.tsx`
- Test: `src/components/sidebar/SidebarFooter.test.tsx`

- [ ] **Step 1: Write the failing test**

Open (or create) `src/components/sidebar/SidebarFooter.test.tsx`. Add this test:

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SidebarFooter } from './SidebarFooter';

// SidebarFooter uses useAdmin internally
vi.mock('@/hooks/useAdmin', () => ({ useAdmin: () => ({ isAdmin: false }) }));

describe('SidebarFooter', () => {
  const baseProps = {
    isAdmin: false,
    isOnAdminPage: false,
    isCollapsed: false,
    isMobile: false,
    onProfileClick: vi.fn(),
    onAdminClick: vi.fn(),
  };

  it('shows Sign in link when userInfo is undefined', () => {
    render(<SidebarFooter {...baseProps} userInfo={undefined} />);
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/auth');
  });

  it('shows user profile button when userInfo is provided', () => {
    render(
      <SidebarFooter
        {...baseProps}
        userInfo={{ displayName: 'Ada Lovelace', email: 'ada@example.com', forumUsername: null }}
      />
    );
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /sign in/i })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run src/components/sidebar/SidebarFooter.test.tsx --reporter=verbose
```

Expected: FAIL — "Sign in link when userInfo is undefined" fails because the component currently shows a profile button with "U" initials instead.

- [ ] **Step 3: Add the guest branch to SidebarFooter**

Open `src/components/sidebar/SidebarFooter.tsx`. In the `SidebarFooter` function, add a guest branch at the top of the returned JSX, just before the user profile section. The `SidebarFooter` currently renders an outer `<div className="border-t border-border">`. Replace the entire component body with:

```tsx
export function SidebarFooter({
  userInfo,
  isAdmin,
  isOnAdminPage,
  isCollapsed,
  isMobile,
  onProfileClick,
  onAdminClick,
}: SidebarFooterProps) {
  const showExpanded = isMobile || !isCollapsed;

  const getInitials = () => {
    if (userInfo?.displayName) {
      return userInfo.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (userInfo?.email) {
      return userInfo.email[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="border-t border-border">
      {/* Admin Link */}
      {isAdmin && (
        <div
          className={cn(
            'p-2 border-b border-border',
            !isMobile && isCollapsed && 'flex justify-center'
          )}
        >
          {!showExpanded ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onAdminClick}
                  className={cn(
                    'w-full h-10',
                    isOnAdminPage
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-primary'
                  )}
                >
                  <Shield className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-popover border-border">
                <p>Admin Dashboard</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              onClick={onAdminClick}
              className={cn(
                'w-full justify-start gap-3',
                isOnAdminPage
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-primary'
              )}
            >
              <Shield className="w-5 h-5" />
              <span className="text-base font-medium">Admin</span>
            </Button>
          )}
        </div>
      )}

      {/* Guest: Sign in link */}
      {!userInfo && (
        <div className="p-3">
          <a
            href="/auth"
            className="text-sm font-medium text-primary hover:underline"
          >
            Sign in →
          </a>
        </div>
      )}

      {/* Authenticated: User Profile Section */}
      {userInfo && (
        <div
          className={cn(
            'p-3',
            !isMobile && isCollapsed && 'flex justify-center'
          )}
        >
          {showExpanded ? (
            <button
              onClick={onProfileClick}
              className="w-full flex items-center gap-3 p-2 -m-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-foreground truncate">
                  {userInfo.displayName || 'User'}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {userInfo.email || ''}
                </p>
              </div>
            </button>
          ) : (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={onProfileClick}
                  className="rounded-full hover:ring-2 hover:ring-primary/20 transition-all"
                >
                  <Avatar className="h-8 w-8 cursor-pointer">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-popover border-border">
                <p className="font-medium">{userInfo.displayName || 'User'}</p>
                <p className="text-xs text-muted-foreground">{userInfo.email}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run src/components/sidebar/SidebarFooter.test.tsx --reporter=verbose
```

Expected: both tests PASS.

- [ ] **Step 5: Run full suite to check for regressions**

```bash
npm run test:run 2>&1 | tail -20
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/sidebar/SidebarFooter.tsx src/components/sidebar/SidebarFooter.test.tsx
git commit -m "feat: show Sign in link in sidebar footer for guests"
```

---

## Task 3: DashboardSidebar — Disable Bookmarks for Guests

**Files:**
- Modify: `src/components/DashboardSidebar.tsx`

The `weakQuestionCount` is already `0` for guests (query disabled → empty data), and the item already has `disabled: !isTestAvailable || weakQuestionCount === 0` — so it is naturally disabled. Only `bookmarks` needs an explicit guest guard.

- [ ] **Step 1: Add disabled condition to the bookmarks nav item**

In `src/components/DashboardSidebar.tsx`, find the `studyGroup` definition and locate the `bookmarks` item:

```typescript
{ id: 'bookmarks', label: 'Bookmarked', icon: Bookmark, badge: bookmarkCount, badgeAriaLabel: bookmarkCount === 1 ? '1 bookmark' : `${bookmarkCount} bookmarks` },
```

Replace it with:

```typescript
{ id: 'bookmarks', label: 'Bookmarked', icon: Bookmark, badge: userId ? bookmarkCount : undefined, badgeAriaLabel: bookmarkCount === 1 ? '1 bookmark' : `${bookmarkCount} bookmarks`, disabled: !userId },
```

This disables the item and suppresses the badge when there is no authenticated user.

- [ ] **Step 2: Run the test suite**

```bash
npm run test:run 2>&1 | tail -20
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/DashboardSidebar.tsx
git commit -m "feat: disable bookmarks nav item for unauthenticated users"
```

---

## Task 4: Dashboard.tsx — Delete Guest Block, Move Banner

**Files:**
- Modify: `src/pages/Dashboard.tsx`

- [ ] **Step 1: Remove orphaned lucide imports**

In `src/pages/Dashboard.tsx`, find the import line that includes `BookOpen`, `Shuffle`, `GraduationCap`, `BookMarked` (added in the original PR for the guest-only study mode cards). Remove only those four from the import:

```typescript
// Before
import { Loader2, AlertTriangle, Zap, Brain, Target, MapPin, BookOpen, Shuffle, GraduationCap, BookMarked } from 'lucide-react';

// After
import { Loader2, AlertTriangle, Zap, Brain, Target, MapPin } from 'lucide-react';
```

- [ ] **Step 2: Delete the entire guest dashboard block**

In `renderContent()`, find and delete the entire block starting at `if (!user) {` and ending at the matching `}` (approximately 115 lines). It starts just after the `authLoading` loading check and ends before `// Calculate weekly goal progress`.

The block to delete looks like this (condensed to show start/end):

```typescript
// DELETE FROM HERE:
if (!user) {
  return (
    <PageContainer width="standard" radioWaveBg>
      {!guestBannerDismissed && (
        // ... guest banner ...
      )}
      // ... guest study mode cards ...
      // ... guest placeholder sections ...
    </PageContainer>
  );
}
// TO HERE (inclusive of the closing brace)
```

After deletion, `renderContent()` should flow from the loading check directly to `// Calculate weekly goal progress`.

- [ ] **Step 3: Move the guest banner into the main dashboard render**

The main dashboard `return` starts at `return (` and the first child is `<PageContainer width="standard" radioWaveBg>`. Inside that, the first rendered component is `<DashboardHero .../>`.

Add the guest banner as the first child inside `<PageContainer>`, before `<DashboardHero>`:

```tsx
return (
  <PageContainer width="standard" radioWaveBg>
    {/* Guest banner — shown to unauthenticated users, dismissible */}
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

    <DashboardHero
      readinessLevel={readinessLevel}
      readinessTitle={readinessTitle}
      readinessMessage={readinessMessage}
      recentAvgScore={recentAvgScore}
      nextAction={nextAction}
      onAction={handlePrimaryAction}
    />

    <DashboardNotifications
      examType={selectedTest}
      userId={user?.id}
      thisWeekQuestions={thisWeekQuestions}
      questionsGoal={questionsGoal}
      userTarget={userTarget}
      onNavigate={changeView}
      maxVisible={1}
    />

    <div className="mb-6">
      <StreakDisplay onAction={() => changeView('random-practice')} />
    </div>

    <DashboardNextSteps steps={getNextSteps()} />

    <DashboardSectionInsights
      subelementMetrics={readinessData?.subelement_metrics}
      testType={selectedTest}
      onPracticeSection={navigateToSubelementPractice}
    />

    <DashboardProgress
      thisWeekQuestions={thisWeekQuestions}
      questionsGoal={questionsGoal}
      thisWeekTests={thisWeekTests}
      testsGoal={testsGoal}
      examDate={userTarget?.exam_session?.exam_date || userTarget?.custom_exam_date}
      examLocation={
        userTarget?.exam_session
          ? `${userTarget.exam_session.city}, ${userTarget.exam_session.state}`
          : userTarget?.custom_exam_date
            ? 'Custom date'
            : undefined
      }
      onOpenGoalsModal={() => setShowGoalsModal(true)}
      onFindTestSite={() => changeView('find-test-site')}
    />
  </PageContainer>
);
```

Keep `guestBannerDismissed` state and its `localStorage` initialization exactly as-is in the component.

- [ ] **Step 4: Run the test suite**

```bash
npm run test:run 2>&1 | tail -20
```

Expected: most tests pass; `Dashboard.test.tsx` guest mode test will fail because it still looks for 'Start Studying' from the deleted block. That is expected — fix it in Task 5.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Dashboard.tsx
git commit -m "feat: remove separate guest dashboard, guests now use main dashboard"
```

---

## Task 5: Update Dashboard Test

**Files:**
- Modify: `src/pages/Dashboard.test.tsx`

- [ ] **Step 1: Find and read the failing guest mode test**

In `src/pages/Dashboard.test.tsx`, find the `describe('Guest mode', ...)` block. It currently looks like:

```typescript
describe('Guest mode', () => {
  it('shows guest dashboard (not redirect) when user is not authenticated', async () => {
    mockAuthHook.mockReturnValueOnce({
      user: null,
      loading: false,
      signOut: vi.fn(),
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Start Studying')).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalledWith('/auth');
  });
});
```

`'Start Studying'` was in the deleted guest block. It no longer renders.

- [ ] **Step 2: Update the assertion to match the new render**

The new guest dashboard renders the full main dashboard. The guest banner reads "You're studying as a guest". Replace the test:

```typescript
describe('Guest mode', () => {
  it('renders main dashboard (not a redirect) when user is not authenticated', async () => {
    mockAuthHook.mockReturnValueOnce({
      user: null,
      loading: false,
      signOut: vi.fn(),
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/you're studying as a guest/i)).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalledWith('/auth');
  });
});
```

- [ ] **Step 3: Run just the Dashboard test to verify it passes**

```bash
npx vitest run src/pages/Dashboard.test.tsx --reporter=verbose
```

Expected: all tests in this file PASS.

- [ ] **Step 4: Run the full test suite**

```bash
npm run test:run 2>&1 | tail -20
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Dashboard.test.tsx
git commit -m "test: update guest mode test to match unified dashboard"
```

---

## Task 6: Manual Verification

These checks cannot be covered by unit tests — run the dev server and verify in browser.

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Verify guest flow end-to-end**

Open `http://localhost:8080` in an incognito/private window (ensures no cached auth).

1. `http://localhost:8080` → should land on `/auth`
2. Click "Continue as guest" → should land on `/dashboard` **with the full sidebar visible**
3. Sidebar: Practice Test, Random Practice, Topics, Glossary — all clickable and functional
4. Sidebar: Bookmarks and Weak Areas — visible but greyed out / non-clickable
5. Sidebar footer: shows "Sign in →" link (not a user profile)
6. Guest banner at top of dashboard — visible, dismisses on ✕, does not reappear on refresh (localStorage key `guest_banner_dismissed`)
7. Click "Practice Test" in sidebar → navigates into PracticeTest; sidebar still visible; clicking "Dashboard" in sidebar returns to dashboard
8. Same for Random Practice, Topics, Glossary
9. Complete a practice test as guest → inline save card appears below score
10. Sign in from any "Sign in →" link → authenticated user sees full dashboard with profile in sidebar footer

- [ ] **Step 3: Commit any fixes found during verification**

If step 2 reveals broken behavior, fix it and commit before marking this task done.
