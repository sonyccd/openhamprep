# Material UI Migration Strategy

**Status:** Draft for discussion
**Date:** 2026-09-10
**Baseline commit:** `main` @ 181 commits (Jan 2026 – Aug 2026)

---

## 1. Executive summary

The driver for this migration is **component coverage and vendor consolidation**:
the current design system is an abstract layer stitched over a large number of
separate UI libraries, and as the interface expands there is no single
externally-maintained library to reach into for the next component. The goal is
one complete off-the-shelf library with a theme on top, and a small in-house
library only where nothing off-the-shelf exists.

**That justification holds up, and the measurements support it more strongly
than I expected.** The front end currently depends on **20 distinct UI-layer
libraries**, including 27 separate Radix packages and **two toast systems
mounted simultaneously in `App.tsx`**. MUI + MUI X would realistically
consolidate that to five or six.

Two secondary goals in the original framing will *not* be met, and the plan
should not be sold on them: MUI will not shrink the codebase, and it will not
fix the current instability. Both are addressed by separate work (§3), which is
worth doing anyway because it makes the migration cheaper.

**Recommendation:** proceed with MUI, as a strangler-fig migration in three
stages. Land the theme foundation early so new features stop accruing onto the
system we're leaving. Extract the duplicated quiz engine *before* porting quiz
screens, or we port four copies of it. And **theme MUI lightly** — heavy theming
rebuilds the abstract design layer we're trying to escape (§5).

---

## 2. What the baseline actually looks like

Measured on the current `main`:

| Metric | Value |
|---|---|
| Non-test source | 42,203 LOC across 396 files |
| Test source | 53,654 LOC across 153 files |
| Tests | 3,335 — **all passing** |
| `tsc --noEmit` | **clean** |
| shadcn/ui primitive layer (`src/components/ui/`) | 4,459 LOC |
| ...of which **unused** | **2,295 LOC across 17 primitives** |
| ...live primitive surface | **~2,160 LOC across 37 primitives** |
| Feature components (`src/components/*.tsx`) | 10,766 LOC |
| Admin (`src/components/admin/`) | 10,184 LOC |
| Hooks | ~14,000 LOC non-test |
| Production JS | 742.9 kB gzipped |
| Production CSS | 23.6 kB gzipped |
| Design-token violations (`bg-white`, `text-black`, …) | **8 occurrences in 42k LOC** |
| Hardcoded Tailwind palette colors | 43 occurrences, 14 distinct |
| Arbitrary Tailwind values (`p-[17px]`, `[#abc]`) | 53 occurrences |

### Read of the baseline

This is not, by the usual objective measures, an unstable codebase. Full type
safety, 3,335 green tests, and a design-token discipline that is 99.98% clean.
Whatever "unstable" feels like day to day, it is **not** coming from the
component primitives.

---

## 3. Two goals MUI will not deliver

These are not objections to the migration — the coverage argument (§4) stands on
its own. They are cautions about *justification*. If the project is sold on
"less code and more stability," it will be judged against outcomes it cannot
produce, and the work in §3.3 that *would* produce them will get skipped.

### 3.1 "Reduce the size of the codebase" — MUI will not do this

The shadcn layer is ~2,160 live LOC, about **5% of non-test source**. That is
the only part MUI replaces outright. The other 96% — feature components, admin,
hooks, services — gets *rewritten*, not deleted.

And it will likely get *bigger*. MUI's idiomatic styling is the `sx` prop, which
is more verbose than Tailwind utility strings for the same result:

```tsx
// Tailwind, today
<div className="flex items-center gap-2 p-4 rounded-lg border bg-card">

// MUI equivalent
<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2,
           borderRadius: 2, border: 1, borderColor: 'divider',
           bgcolor: 'background.paper' }}>
```

Expect the feature layer to grow 10–25% in LOC. Bundle size will also grow:
MUI core + Emotion is heavier than Radix primitives + a Tailwind stylesheet, and
we would carry Emotion's runtime CSS-in-JS cost on top of the existing 743 kB.

**If codebase size matters, the lever is deleting duplication (§3.3), not
swapping component libraries. Budget for growth here, don't promise shrinkage.**

### 3.2 Swapping the primitive layer won't change how feature code is written

shadcn/ui is Radix with a Tailwind skin, vendored into the repo. It is
individually fine. The 700-line components and the duplicated quiz engine
(§3.3) are a *composition* problem, and they will survive the port unchanged
unless we address them directly. MUI raises the floor on what a single component
looks like; it does nothing about how they are assembled.

### 3.3 The real instability is duplication and God components

Four practice modes are four near-copies of the same quiz engine:

| Component | LOC |
|---|---|
| `ChapterPractice.tsx` | 526 |
| `SubelementPractice.tsx` | 497 |
| `RandomPractice.tsx` | 461 |
| `WeakQuestionsReview.tsx` | 456 |
| **Total** | **1,940** |

Their import lists are nearly identical (`QuestionCard`, `useQuestions`,
`useProgress`, `useAppNavigation`, `useKeyboardShortcuts`, `useQuestionTimer`,
`KeyboardShortcutsHelp`, `framer-motion`, `PageContainer`), and they hold
structurally identical state: current index, selected answer, history stack,
answered set, view mode. `TopicQuiz.tsx` (378 LOC) and `PracticeTest.tsx`
(423 LOC) are a fifth and sixth variation on the same theme.

**There is no shared quiz-session abstraction.** A fix to answer-recording,
keyboard handling, or the history stack has to be made in four to six places, or
it silently isn't. *That* is what "unstable" feels like.

Porting these to MUI without extracting the engine produces **four duplicated
MUI components** — same bug surface, new syntax, weeks of work.

Alongside it: `ProfileModal.tsx` at 724 LOC, `AdminAlertRules.tsx` at 858,
`BulkImportQuestions.tsx` at 681, `TopicResourceManager.tsx` at 630,
`BulkImportGlossary.tsx` at 630, `Auth.tsx` at 600. The project's own CLAUDE.md
says "keep component files under ~200 lines." Nine files are over 500.

### 3.4 Bug history points away from the UI layer

Sampling `fix:` commits: importer silently corrupting correct answers,
`handle_new_user()` writing to a dropped column, rate-limit throttle helpers,
mobile header focus order, topic sidebar not resetting on navigation. These are
parsing bugs, data bugs, security bugs, and state-management bugs. **MUI fixes
none of them.**

---

## 4. Where MUI genuinely wins

Five real arguments. §4.5 is the decisive one and the stated driver; the rest
are supporting benefits that come along with it.

### 4.1 Admin is the strongest case (10,184 LOC)

Admin has **zero `<table>` elements** — it manages questions, glossary terms,
chapters, topics, alert rules, and Discourse sync entirely through hand-rolled
card lists and bespoke layouts. It also has **53 manually-controlled inputs**
(`onChange={(e) => setX(...)}`) and uses `react-hook-form` in exactly **one
file** despite RHF + Zod + `@hookform/resolvers` being installed.

MUI's DataGrid (sorting, filtering, pagination, column resize, CSV export,
row selection — all free) plus MUI form components against RHF would plausibly
**delete several thousand lines here**. This is where the "off-the-shelf
components reduce effort" argument is actually true.

### 4.2 One theme object beats three styling systems

Today theming lives in three places: 76 CSS custom properties in `index.css`
(641 lines), `tailwind.config.ts` (122 lines), and per-component `cva` variant
maps. A MUI `createTheme()` call consolidates all of it into one typed object
with autocomplete. That is a genuine reduction in the number of places you have
to look to answer "why is this button that color."

### 4.3 Collaboration and onboarding

A close second to §4.5, and the same problem viewed from the contributor's
side. A new contributor who knows MUI can read `<Button variant="contained" color="error">`
immediately. Our current `<Button variant="destructive">` requires reading
`button.tsx` to learn the variant vocabulary, because shadcn is vendored source
that every project forks differently. MUI has canonical docs, a stable API, and
a large hiring pool. For an open-source project taking outside contributions,
that legibility compounds with the consolidation argument below.

### 4.4 Accessibility consistency

MUI ships accessible-by-default components with strong focus management. We
already have one shipped a11y bug (`fix(a11y): align mobile header focus order
with visual order`) and hand-composed Radix leaves room for more.

### 4.5 Vendor consolidation — the strongest argument, and the actual driver

The front end depends on **20 distinct UI-layer libraries**:

```
@radix-ui (27 packages)   lucide-react        framer-motion      sonner
cmdk                      vaul *              embla-carousel *    recharts *
react-day-picker *        input-otp *         react-resizable-panels *
@dnd-kit                  next-themes         class-variance-authority
clsx                      tailwind-merge      tailwindcss-animate
leaflet (0 imports)       katex               react-markdown
```

`*` = reachable only from a `ui/` primitive that nothing imports. Seven of the
twenty are already dead weight, `recharts` among them — **the app currently
renders no charts at all.**

The symptom is visible in `App.tsx`, which mounts **two toast systems at once**:

```tsx
import { Toaster } from "@/components/ui/toaster";        // Radix toast
import { Toaster as Sonner } from "@/components/ui/sonner"; // Sonner
…
<Toaster />
<Sonner />
```

Sonner is used in 29 files, the Radix toast in 4. Nobody decided this; it
accumulated. That is what an abstract design system over many vendors produces
under growth — and it is the real problem statement.

**The cost isn't the packages, it's the decision each time the UI expands.**
Today, adding a component means: does shadcn have it? If not, which of the
20 libraries does? If none, hand-roll it and add a 21st. Each answer is a
research task with no default, and each new vendor brings its own theming
model, a11y posture, and upgrade cadence.

Realistic end state after migration:

| Today | After |
|---|---|
| 27 × `@radix-ui/*` | `@mui/material` |
| `recharts` *, `react-day-picker` * | deleted now; `@mui/x-charts` / `@mui/x-date-pickers` available if ever needed |
| `cva`, `clsx`, `tailwind-merge`, `tailwindcss-animate`, `tailwindcss` | MUI `sx` / `styled` |
| `next-themes` | MUI `CssVarsProvider` |
| `cmdk` (live — powers `GlobalSearch`) | MUI `Autocomplete` — evaluate, not an automatic win |
| `vaul` *, `embla` *, `input-otp` *, `react-resizable-panels` * | deleted in A2a; nothing to port |
| `lucide-react` | `@mui/icons-material` |
| `sonner`, Radix toast | **pick one** — see §5.3 |
| `framer-motion`, `react-markdown`, `katex`, `@dnd-kit` | **unchanged — no MUI equivalent** |
| `leaflet` | deleted (unused) |
| **20 libraries** | **~6 libraries** |

**Be honest that it is 6, not 1.** MUI is not a complete answer to every UI
need — it has no animation system, no markdown/math renderer, and no
drag-and-drop. But going from 20 vendors to 6, with one of them covering the
great majority of call sites and having a documented answer for the next
component, is a real and defensible win. It is the reason to do this project.

---

## 5. Theming philosophy: theme lightly

This deserves its own section because it is the decision most likely to quietly
undo the whole effort.

### 5.1 The trap

The instinct after adopting MUI is to theme it heavily so the app keeps its
current look. **Resist this.** A heavily-themed MUI is an abstract design system
over MUI — the same structure we're leaving, with a different vendor
underneath. Every new component then needs bespoke theming work before it can
be used, which is exactly the friction the migration is meant to remove.

### 5.2 Recommended posture

Since the current design is itself part of what we want to move away from, we
have an unusually free hand. Recommended:

- **Adopt Material's defaults for shape, elevation, spacing, and motion.**
  Don't fight them.
- **Theme only the brand surface:** palette (primary/secondary/error/success),
  typography family and scale, and border radius. That is roughly 30–40 lines
  of `createTheme()`.
- **Cap `styleOverrides`.** Propose a hard rule: if a component needs more than
  a few lines of override, either accept Material's default or the component
  belongs in Tier C as a deliberate custom piece. Review overrides like code.
- **Zero `sx` for anything the theme should own.** Colors, spacing, and radii
  come from theme tokens, never literals.

The measurable test: **`muiTheme.ts` should stay under ~150 lines.** If it grows
past that, we are rebuilding the thing we left.

### 5.3 Corollary: pick one toast system

Whatever else happens, `App.tsx` should mount one. Both are genuinely in use:
`sonner` in 29 files, the Radix toast in three real consumers (`HelpButton`,
`useAuth`, `useCommunityPromoToast`) plus its `Toaster` and a 3-line re-export
shim at `ui/use-toast.ts`.

Recommendation: keep `sonner` (better stacking than MUI `Snackbar`, which shows
one at a time) and migrate those three consumers off the Radix toast. That is a
small, well-bounded change — and it makes `sonner` a **deliberate, documented
exception** to the one-library rule rather than an accident. The current state,
where both are mounted and nobody chose, is the actual bug.

---

## 6. Recommended strategy

Three stages. The ordering below differs from a stability-driven plan: because
the goal is **coverage for a growing UI**, the theme foundation is urgent —
every feature shipped before it lands is one more thing built on the system
we're leaving.

```
Stage A — Foundation        (theme + deletions; unblocks all new work)
   ↓
Stage B — Prove it on Admin (reversible, low blast radius)
   ↓
Stage C — Strangler-fig     (with one hard prerequisite: C0 before C4)
```

### Stage A — Foundation

Two independent tracks; run them in parallel.

**A1 — Theme foundation (the urgent one).** Install `@mui/material`,
`@emotion/react`, `@emotion/styled`. Write `src/theme/muiTheme.ts` per §5:
brand palette, typography, radius, light + dark. Mount `CssVarsProvider`
alongside Tailwind with `CssBaseline` configured not to fight Tailwind's
preflight. **From this point, all new UI is built in MUI.** Nothing is ported
yet; we just stop making the problem bigger.

**A2 — Reduce the surface to port.** Every line deleted here is a line we
don't pay to migrate:

| Task | Impact |
|---|---|
| Delete 17 unused `ui/` primitives + the `ui/use-toast` re-export shim | **−2,295 LOC never ported** |
| Drop 9 dead deps: `leaflet`, `@types/leaflet`, `@hookform/resolvers` (zero imports); `recharts`, `vaul`, `embla-carousel-react`, `input-otp`, `react-day-picker`, `react-resizable-panels` (reachable only from the deleted primitives). **Keep `cmdk`** — it is live via `GlobalSearch`. | **20 → 13 libraries before MUI lands** |
| Resolve the dual toast system (§5.3) | one vendor, deliberately chosen |
| Rewrite the 122 `toHaveClass` assertions to semantic queries | prevents ~318 test breaks later; far cheaper now |

### Stage B — Prove it on Admin

Admin is role-gated, has the weakest UI, benefits most from DataGrid, and is
the safest place to be wrong. Convert **one** screen end-to-end — recommend
`AdminQuestions`, the most table-shaped.

**Gate criteria, matched to the actual goal.** Do not gate on LOC or bundle
size; those will move the wrong way (§3.1) and that is expected:

1. **Coverage** — how many components did MUI supply outright, vs. need a Tier B
   adapter, vs. have no answer at all? A high "no answer" count is the signal
   that MUI is not the complete library we're betting on.
2. **Theme discipline** — did `muiTheme.ts` stay under ~150 lines, or did the
   screen demand a pile of `styleOverrides`? Overrides sprawl is the early
   warning that we're rebuilding an abstract design layer.
3. **Brand fidelity** — is the result acceptable *without* heavy theming? If it
   is not, that is a design decision to make now (§10.2), not in Stage C.

If coverage is poor or the theme balloons, stop. Stage A's wins are permanent
and the app still works.

### Stage C — Strangler-fig the app surface

Leaf-first, one route at a time, shipping continuously. Never mix both
libraries inside a single component; the boundary is always a whole component.
Delete each shadcn primitive the moment its last consumer is converted.

| Step | Scope |
|---|---|
| **C0** | **Prerequisite:** extract `useQuizSession` + `<QuizShell>` from the four duplicated practice modes (§3.3) |
| C1 | Leaf display components (`LessonCard`, `TopicCard`, `HamRadioToolCard`, `Glossary`) |
| C2 | Modals and dialogs (`WeeklyGoalsModal`, `LicenseSelectModal`, `ProfileModal`) |
| C3 | Layout and navigation (`AppLayout`, `DashboardSidebar`, `sidebar/*`) |
| C4 | `<QuizShell>` — **one port covers all six quiz modes** |
| C5 | Dashboard |
| C6 | `Auth.tsx` |
| C7 | Remove Tailwind + shadcn; delete `ui/` |

**C0 is not optional.** Porting C4 without it means writing four near-identical
MUI components and keeping a six-way bug surface. It is the single highest-
leverage item in the plan.

---

## 7. Component classification

### Tier A — Mechanical port (near-1:1 API map)

These are prop renames. A codemod plus review handles most of them.
~833 JSX call sites total across the tier.

| Current | MUI target | Sites | Notes |
|---|---|---|---|
| `Button` | `Button` / `IconButton` | 121 | `default→contained`, `destructive→contained color="error"`, `outline→outlined`, `secondary→contained color="secondary"`, `ghost→text`, `link→text` + underline. `size="icon"` → `IconButton`. |
| `Label` | (absorbed by `TextField`) | 103 | **Deletable** — MUI `TextField` bundles label + input + helper text |
| `Badge` | `Chip` | 64 | `size="small"`; variant map needed |
| `PageContainer` | `Container` + `Box` | 48 | 4 width tiers → `maxWidth` prop; keep as a thin wrapper |
| `CardContent` / `Card` / `CardHeader` | `Card*` (same names) | 100 | Names match; `CardHeader` takes `title`/`subheader` props instead of children |
| `Skeleton` | `Skeleton` | 36 | Direct |
| `Dialog` | `Dialog` | 26 | `open`/`onClose` instead of `onOpenChange` |
| `Tooltip` | `Tooltip` | 24 | **Simpler** — no `TooltipProvider` wrapper needed |
| `Separator` | `Divider` | 16 | Direct |
| `AlertDialog` | `Dialog` + `DialogActions` | 13 | Small in-house wrapper preserves the call-site API |
| `Tabs` | `Tabs` / `Tab` | 7 | `value` moves to `<Tabs>`; needs `TabPanel` shim |
| `Select` | `Select` / `Autocomplete` | 5 | Direct |
| `Progress` | `LinearProgress` | 5 | `value` prop identical |
| `Collapsible` | `Collapse` | 5 | Direct |
| `ScrollArea` | `Box` + `overflow` | 5 | **Deletable** |
| `Popover` | `Popover` | 3 | Anchor-element API differs from Radix's trigger pattern |
| `Switch`, `Checkbox` | same | 6 | Direct |
| `Sheet` | `Drawer` | 2 | Direct |
| `Alert` | `Alert` | 4 | Direct |
| `Input` / `Textarea` | `TextField` | 85 | `multiline` prop for textarea; absorbs the 103 `Label` sites |
| `Table`, `Command`, `DropdownMenu`, `Avatar`, `Slider`, `RadioGroup`, `ToggleGroup` | `DataGrid`, `Autocomplete`, `Menu`, `Avatar`, `Slider`, `RadioGroup`, `ToggleButtonGroup` | 1 each | Direct |

### Tier B — Adapter needed (in-house wrapper over MUI)

Keep our call-site API; swap the implementation underneath. These go in `src/components/ohp/`.

| Component | Why |
|---|---|
| `CircularProgress` (ours) | Custom framer-motion arc animation + centered children slot. MUI's `CircularProgress` has no children slot. Wrap MUI's or keep the SVG and theme it. |
| `AlertDialog` | MUI has no confirm-dialog primitive; wrap `Dialog` to preserve the trigger/action API |
| Toasts (`sonner`) | **Recommend keeping `sonner`.** MUI `Snackbar` is one-at-a-time and worse for our use. Not everything must be MUI. |
| `PageContainer` | Encodes our own layout tiers + `radio-wave-bg`; wrap `Container` |
| `Tabs` panel shim | MUI ships `Tabs` but not a `TabPanel` in core |

### Tier C — Stays custom (our component library)

Domain-specific or third-party-anchored. MUI has no equivalent and shouldn't.
These belong in `src/components/ohp/` as the "own library" from the proposal.

| Component | LOC | Why custom |
|---|---|---|
| `QuestionCard` | 430 | Core domain object — answer states, figures, bookmarking, glossary tooltips |
| `<QuizShell>` (from C0) | ~400 | The quiz engine. Highest-value custom component in the app. |
| `GlossaryFlashcards` | 498 | Spaced-repetition card flip; framer-motion driven |
| `Calculator` | 248 | Domain tool |
| `MarkdownText` / `TopicContent` | 282 | `react-markdown` + `remark-math` + KaTeX pipeline |
| `FigureImage` / `FigureLightbox` | 158 | Exam figure zoom/pan |
| `GlossaryHighlightedText` / `GlossaryTermTooltip` | 190 | Inline term detection |
| `OHPLogo` | 76 | Brand SVG |
| `GlobalSearch` | 301 | Built on `cmdk` via `ui/command`. MUI `Autocomplete` is a plausible port but not obviously better — evaluate, don't assume. This is the one live non-Radix vendor that survives A2a. |
| `LessonPath` | 239 | Bespoke path visualization |
| `PWAInstallBanner` | 183 | Platform-specific install flows |
| Charts | 0 | **None exist.** `recharts` reaches only dead code and is deleted in A2a. Use `@mui/x-charts` if charts are ever added. |
| Animation | 29 files | Keep `framer-motion`. MUI has no equivalent. |

---

## 8. Roadmap

Sizing is given as ranges. These are estimates from LOC and call-site counts,
not from a completed pilot — **Stage B exists to replace them with measured
numbers.**

| Phase | Scope | Rough size | Exit criteria |
|---|---|---|---|
| **A1** | MUI install + `muiTheme.ts` (all 76 tokens → brand palette, light + dark) | Medium | Both providers coexist; **all new UI is MUI from here** |
| **A2a** | Delete 17 dead primitives + 9 dead deps | Small | Build green; 20 → 13 UI libraries |
| **A2b** | Resolve dual toast system | Small | One `<Toaster>` in `App.tsx` |
| **A2c** | 122 `toHaveClass` → semantic queries | Medium | Class-coupled assertions at 0 |
| **B1** | Convert `AdminQuestions` to MUI + DataGrid | Medium | **Measure & decide** on the three §6 gate criteria |
| **C0** | Extract `useQuizSession` + `<QuizShell>` | Large | Quiz tests green; net LOC negative |
| **C1** | Leaf display components | Medium | Ship each independently |
| **C2** | Modals + dialogs | Medium | |
| **C3** | Layout + navigation | Large | |
| **C4** | `<QuizShell>` port | Medium | Covers 6 quiz modes in one port |
| **C5–C6** | Dashboard, Auth | Large | |
| **C7** | Remove Tailwind + shadcn; delete `ui/` | Medium | **~6 UI libraries**; bundle re-measured |

Remaining Stage-0 items from the stability track — splitting the 9 files over
500 LOC, and moving Admin's 53 manual inputs onto RHF + Zod — are **not on the
critical path** for this goal. Fold them into whichever phase touches the file,
rather than running them as their own project.

**Gate between every phase:** `npm run test:run` green, `tsc --noEmit` clean,
`npm run lint` clean, both themes verified, mobile viewport verified.

---

## 9. Risks

| Risk | Assessment | Mitigation |
|---|---|---|
| **Test breakage** | ~318 structure-coupled assertions (122 `toHaveClass` in 20 files, 196 `querySelector`) will break. Offset by 2,145 semantic queries (`getByText`/`getByRole`/`getByLabelText`) that survive a DOM swap. | Rewrite class assertions to semantic queries in **A2c**, before any MUI work. Far cheaper then. |
| **Bundle grows** | Likely. MUI + Emotion > Radix + Tailwind CSS. Baseline is 742.9 kB gz JS + 23.6 kB gz CSS. | Track per-phase, but **do not gate on it** — it is an accepted cost of consolidation. Consider `@mui/material-pigment-css` if Emotion's runtime cost becomes a real problem. |
| **LOC grows in feature layer** | Likely, 10–25%. `sx` is more verbose than utility classes. | Accept it, or use MUI's `styled()` for repeated patterns. **Don't sell this migration on LOC reduction.** |
| **Dual-library period** | Unavoidable in strangler-fig. Two theme systems live simultaneously. | Single source of truth: theme values defined once in `muiTheme.ts`, Tailwind config *derives from it*. Never both libraries inside one component. |
| **Migration stalls half-done** | The real failure mode, and the dual-vendor period makes the codebase *more* fragmented while it lasts. | Stage B's gate. If Stage C stalls, Stage A's wins are permanent, new work is already on MUI, and the app still runs. |
| **Visual regressions across 95 files** | High, and hard to catch with unit tests. | Add Playwright + visual snapshots in Stage A, before the first port. Chromium is already available in CI. |
| **Over-theming** | **The highest risk given the goal.** Recreating the current look in `styleOverrides` reproduces the abstract design layer on a new vendor, and every new component again needs bespoke work before use. | The §5 rules, enforced in review: ~150-line theme cap, overrides reviewed like code, §10.2 decided up front. |
| **MUI coverage gaps** | MUI has no animation, markdown/math, or drag-and-drop story. The end state is ~6 libraries, not 1. | Accept it explicitly (Tier C). Measure the gap count in Stage B before committing to Stage C. |
| **`framer-motion` interop** | 29 files. MUI components need `component`/`forwardRef` bridging for motion. | Build a `MotionBox` helper once in A1. |

---

## 10. Decisions still open

Two of the original four are now settled: the driver is coverage and vendor
consolidation (§4.5), and `sonner` + `framer-motion` stay (§5.3, Tier C).

1. **MUI X licensing.** DataGrid Community is free but lacks column pinning,
   row grouping, and Excel export. Admin is the main beneficiary and the Stage B
   pilot depends on it — is Community enough, or do we need Pro? **Decide before
   B1**, since it changes what the pilot proves.
2. **How far from Material do we want to land?** §5 recommends theming lightly
   and accepting Material's defaults for shape, elevation, and motion. That is
   the posture that actually delivers the "reach for an existing component"
   benefit. If the app must keep its current visual identity closely, say so now
   — it is a legitimate call, but it costs a meaningful share of the benefit and
   the plan should be re-scoped accordingly rather than discovering it at C5.
3. **Icons.** `lucide-react` → `@mui/icons-material` is one fewer vendor, but
   the icon sets differ visually and it is a large mechanical change with no
   functional payoff. Reasonable to defer to C7 or skip entirely.

---

## 11. If you only take one thing from this document

The case for MUI is **20 UI libraries becoming 6, with a documented default for
the next component you need** — not less code and not fewer bugs. Plan, measure,
and defend the project on that basis.

Two things will decide whether it works:

- **Theme lightly.** If `muiTheme.ts` grows past ~150 lines, we have rebuilt the
  abstract design system we set out to escape, on a new vendor.
- **Do C0 before C4.** Extract the quiz engine first, or the migration ports
  four copies of the same component and inherits a six-way bug surface.
