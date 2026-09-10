# Material UI Migration Strategy

**Status:** Draft for discussion
**Date:** 2026-09-10
**Baseline commit:** `main` @ 181 commits (Jan 2026 – Aug 2026)

---

## 1. Executive summary

The proposal is to migrate the front end to Material UI (MUI) so we lean on
off-the-shelf components, apply a custom theme, and keep a small in-house
component library for the gaps. The stated goals: more stability, easier
collaboration, less development effort, smaller codebase.

**I measured the codebase before writing this plan, and two of those four goals
will not be met by a MUI migration.** They will be met — cheaply — by work that
is a prerequisite for a MUI migration anyway.

Recommendation: **do not run a big-bang MUI migration.** Run a three-stage
program where Stage 0 delivers most of the stability benefit at roughly 5% of
the cost, and MUI adoption follows as a strangler-fig migration starting with
Admin. Stage 0 is worth doing whether or not we ever adopt MUI.

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
| ...of which **unused** | **2,759 LOC across 23 primitives** |
| ...live primitive surface | **~1,700 LOC across 31 primitives** |
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

## 3. Where I disagree with the premise

I want to be direct about this, because the plan changes shape depending on
which parts of the premise hold up.

### 3.1 "Reduce the size of the codebase" — MUI will not do this

The shadcn layer is ~1,700 live LOC, about **4% of non-test source**. That is
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

**If codebase size is a real goal, the lever is deleting duplication (§3.3),
not swapping component libraries.**

### 3.2 "Use off-the-shelf components" — we already do

shadcn/ui *is* off-the-shelf. It is Radix primitives (a mature, accessible,
widely-used library) with a Tailwind skin, vendored into the repo. The
"hodgepodge" feeling isn't coming from the primitives; it's coming from how
feature code composes them. Swapping the primitive layer does not change how
feature code is written.

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

I don't think the idea is wrong — I think the justification is aimed at the
wrong target. There are four real arguments for it.

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

### 4.3 Collaboration and onboarding — the best argument

This is the strongest goal on the list and it is worth stating plainly. A new
contributor who knows MUI can read `<Button variant="contained" color="error">`
immediately. Our current `<Button variant="destructive">` requires reading
`button.tsx` to learn the variant vocabulary, because shadcn is vendored source
that every project forks differently. MUI has canonical docs, a stable API, and
a large hiring pool. **For an open-source project taking outside contributions,
this alone may justify the migration.**

### 4.4 Accessibility consistency

MUI ships accessible-by-default components with strong focus management. We
already have one shipped a11y bug (`fix(a11y): align mobile header focus order
with visual order`) and hand-composed Radix leaves room for more.

---

## 5. Recommended strategy

Three stages. **Each stage ships value on its own and is a valid stopping
point.** Do not start Stage 2 before Stage 0 is done.

```
Stage 0 — Stabilize          (do this regardless of MUI)
   ↓
Stage 1 — Prove MUI on Admin (reversible, low blast radius)
   ↓
Stage 2 — Strangler-fig the app surface
```

### Stage 0 — Stabilize and shrink (no MUI)

This is the work that actually delivers "more stable, less code," and it makes
any subsequent MUI port dramatically cheaper because there's less to port.

| Task | Impact |
|---|---|
| Delete 23 unused `ui/` primitives | **−2,759 LOC** |
| Drop dead deps: `leaflet`, `@types/leaflet`, `@hookform/resolvers` (0 imports); `embla-carousel-react`, `vaul`, `cmdk`, `input-otp`, `react-day-picker`, `react-resizable-panels` (only used by the deleted primitives) | smaller install + bundle |
| Extract a `useQuizSession` hook + `<QuizShell>` from the 4 practice modes | **−800 to −1,200 LOC**, one place to fix quiz bugs |
| Split the 9 files over 500 LOC | matches the repo's own 200-LOC rule |
| Move the 53 manual inputs in Admin onto RHF + Zod | fewer validation bugs, less state code |

**Expected net: −4,000 to −5,000 LOC (roughly 10% of non-test source), zero
visual change, zero new dependencies.**

This is the honest answer to "reduce the size of the codebase."

### Stage 1 — Prove MUI on Admin

Admin is behind a role gate, has the weakest UI, benefits most from DataGrid,
and is the lowest-risk place to be wrong.

1. Add `@mui/material`, `@emotion/react`, `@emotion/styled`, `@mui/x-data-grid`.
2. Build `src/theme/muiTheme.ts` — map the existing 76 CSS custom properties
   into a MUI theme with light/dark palettes so both systems render identically.
3. Run MUI's `CssVarsProvider` alongside Tailwind. They coexist; set
   `CssBaseline` to not fight Tailwind's preflight.
4. Convert **one** admin screen end-to-end (recommend `AdminQuestions` — it's
   the most table-shaped).
5. **Measure, then decide.** Record LOC delta, bundle delta, test-fix count, and
   wall-clock hours. Compare against the estimates in this document.

**Stage 1 has a real kill switch.** If converting one admin screen costs more
than projected or the LOC goes up rather than down, stop here. Tailwind +
shadcn stays, Stage 0's wins are already banked, and we've spent one screen's
worth of effort finding out.

### Stage 2 — Strangler-fig the app surface

Only if Stage 1's numbers hold. Convert leaf-first, one route at a time,
shipping continuously. Never run both libraries inside a single component;
the boundary is always a whole component.

Order (least → most coupled):
1. Leaf display components (`LessonCard`, `TopicCard`, `HamRadioToolCard`, `Glossary`)
2. Modals and dialogs (`WeeklyGoalsModal`, `LicenseSelectModal`, `ProfileModal`)
3. Layout and navigation (`AppLayout`, `DashboardSidebar`, `sidebar/*`)
4. `<QuizShell>` from Stage 0 — one port covers all six quiz modes
5. Dashboard
6. `Auth.tsx`

Delete each shadcn primitive the moment its last consumer is converted.

---

## 6. Component classification

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

Keep our call-site API; swap the implementation underneath. These go in
`src/components/ohp/`.

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
| `<QuizShell>` (from Stage 0) | ~400 | The quiz engine. Highest-value custom component in the app. |
| `GlossaryFlashcards` | 498 | Spaced-repetition card flip; framer-motion driven |
| `Calculator` | 248 | Domain tool |
| `MarkdownText` / `TopicContent` | 282 | `react-markdown` + `remark-math` + KaTeX pipeline |
| `FigureImage` / `FigureLightbox` | 158 | Exam figure zoom/pan |
| `GlossaryHighlightedText` / `GlossaryTermTooltip` | 190 | Inline term detection |
| `OHPLogo` | 76 | Brand SVG |
| `GlobalSearch` | 301 | Currently `cmdk`; MUI `Autocomplete` is a plausible port but not obviously better — evaluate, don't assume |
| `LessonPath` | 239 | Bespoke path visualization |
| `PWAInstallBanner` | 183 | Platform-specific install flows |
| Charts | — | Keep `recharts` (1 file) or move to `@mui/x-charts` if we're already paying for MUI X |
| Animation | 29 files | Keep `framer-motion`. MUI has no equivalent. |

---

## 7. Roadmap

Sizing is deliberately given as ranges. These are estimates from LOC and
call-site counts, not from a completed pilot — **Stage 1 exists specifically to
replace them with measured numbers.**

| Phase | Scope | Rough size | Exit criteria |
|---|---|---|---|
| **0.1** | Delete 23 dead primitives + 9 dead deps | Small | Build green, bundle measured |
| **0.2** | Extract `useQuizSession` + `<QuizShell>`; refit 4 practice modes | Large | All quiz tests green; net LOC negative |
| **0.3** | Split the 9 files >500 LOC | Medium | No non-generated file over ~300 LOC |
| **0.4** | Admin forms → RHF + Zod | Medium | 53 manual inputs → 0 |
| **1.1** | MUI install + `muiTheme.ts` mapping all 76 tokens | Medium | Side-by-side renders identical, light + dark |
| **1.2** | Convert `AdminQuestions` to MUI + DataGrid | Medium | **Measure & decide.** Publish LOC/bundle/hours delta. |
| **2.1** | Leaf display components | Medium | Per-component; ship each |
| **2.2** | Modals + dialogs | Medium | |
| **2.3** | Layout + navigation | Large | |
| **2.4** | `<QuizShell>` port | Medium | One port covers 6 quiz modes |
| **2.5** | Dashboard, Auth | Large | |
| **2.6** | Remove Tailwind + shadcn; delete `ui/` | Medium | Bundle re-measured against baseline |

**Gate between every phase:** `npm run test:run` green, `tsc --noEmit` clean,
`npm run lint` clean, both themes verified, mobile viewport verified.

---

## 8. Risks

| Risk | Assessment | Mitigation |
|---|---|---|
| **Test breakage** | ~318 structure-coupled assertions (122 `toHaveClass` in 20 files, 196 `querySelector`) will break. Offset by 2,145 semantic queries (`getByText`/`getByRole`/`getByLabelText`) that survive a DOM swap. | Rewrite class assertions to semantic queries *during Stage 0*, before any MUI work. Cheaper then. |
| **Bundle grows** | Likely. MUI + Emotion > Radix + Tailwind CSS. Baseline is 742.9 kB gz JS + 23.6 kB gz CSS. | Track per-phase. Emotion's runtime cost is real; consider `@mui/material-pigment-css` if it becomes a problem. |
| **LOC grows in feature layer** | Likely, 10–25%. `sx` is more verbose than utility classes. | Accept it, or use MUI's `styled()` for repeated patterns. **Don't sell this migration on LOC reduction.** |
| **Dual-library period** | Unavoidable in strangler-fig. Two theme systems live simultaneously. | Single source of truth: theme values defined once in `muiTheme.ts`, Tailwind config *derives from it*. Never both libraries inside one component. |
| **Migration stalls half-done** | The real failure mode for this kind of project. | Stage 1's kill switch. If Stage 2 stalls, Stage 0's wins are permanent and the app still works. |
| **Visual regressions across 95 files** | High, and hard to catch with unit tests. | Consider adding Playwright + visual snapshots during Stage 0. Chromium is already available in CI. |
| **`framer-motion` interop** | 29 files. MUI components need `component`/`forwardRef` bridging for motion. | Build a `MotionBox` helper once in Stage 1. |

---

## 9. Decisions needed before Stage 1

1. **Is collaboration/onboarding the primary goal?** If yes, MUI is justified on
   §4.3 alone and Stage 2 should target user-facing surfaces (which contributors
   read first). If the primary goal is stability, Stage 0 may be sufficient and
   we should reconsider whether Stage 2 is worth it.
2. **MUI X licensing.** DataGrid Community is free but lacks column pinning,
   grouping, and Excel export. Admin is the main beneficiary — is Community
   enough, or do we need a Pro license?
3. **Design direction.** Do we want to *look like* Material Design, or theme MUI
   heavily to preserve the current look? Heavy theming erodes the "off-the-shelf"
   savings — that tension should be resolved deliberately, not discovered in
   phase 2.4.
4. **Keep `sonner` and `framer-motion`?** My recommendation is yes for both.
   Purity is not a goal worth paying for.

---

## 10. If you only take one thing from this document

Stage 0 costs a fraction of the full migration, requires no new dependencies,
delivers the "more stable / less code" outcomes the proposal is aimed at, and
makes MUI adoption meaningfully cheaper if we go ahead.

**Do Stage 0 first. Decide on MUI after Stage 1 gives us a real number.**
