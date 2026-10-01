# Open Ham Prep

![Website](https://img.shields.io/website?url=https%3A%2F%2Fopenhamprep.com)
![App](https://status.openhamprep.com/api/badge/5/uptime)
![GitHub branch status](https://img.shields.io/github/checks-status/sonyccd/openhamprep/main)
[![codecov](https://codecov.io/gh/sonyccd/openhamprep/graph/badge.svg?token=SGUGokGdG1)](https://codecov.io/gh/sonyccd/openhamprep)
![GitHub last commit (branch)](https://img.shields.io/github/last-commit/sonyccd/openhamprep/main)
![GitHub License](https://img.shields.io/github/license/sonyccd/openhamprep)

A modern web application for studying US Amateur Radio license exams. Open source, community-driven, born in North Carolina.

**Live App:** [app.openhamprep.com](https://app.openhamprep.com)

## Features

- **Practice Tests** - Simulated exam experience with optional timer
- **Random Practice** - Study questions with instant feedback
- **Study by Topics** - Focus on specific subelements with topic mastery quizzes
- **Lessons** - Curated, guided study units
- **ARRL Chapters** - Practice scoped to ARRL study-book chapters
- **Weak Questions** - Review questions you've missed
- **Glossary & Flashcards** - Learn key terms with spaced repetition
- **Exam Sessions** - Find upcoming in-person VE exam sessions near you
- **Ham Radio Tools** - Curated gallery of external ham radio tools
- **Progress Tracking** - Dashboard with test readiness, streaks, and goals
- **Bookmarks** - Save questions with personal notes
- **Guest Mode + PWA** - Study without an account; installable as a Progressive Web App

Supports all three license classes: Technician, General, and Extra.

## Quick Start

**Prerequisites:** Node.js 20+, Docker Desktop

```bash
git clone https://github.com/sonyccd/openhamprep.git
cd openhamprep
npm install
npm run dev:full
```

- App: http://localhost:8080
- Database GUI: http://localhost:54323

See [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md) for details.

## Tech Stack

**Frontend:** React 18, TypeScript, Vite, MUI (Material UI) with Emotion, MUI X Charts & Data Grid (Community), TanStack Query, React Router, Framer Motion, lucide icons, next-themes

**Backend:** Supabase (PostgreSQL, Auth, Edge Functions)

**Tooling:** Vitest + Testing Library (happy-dom), Playwright (e2e), ESLint, Amplitude & Pendo (product analytics), Sentry (error tracking), Vercel Analytics & Speed Insights

## Architecture

### Core Data Flow

1. **Global License Context** - App-wide filter (Technician/General/Extra) via `useAppNavigation`
2. **Authentication** - Supabase Auth via `useAuth` context
3. **Data Fetching** - TanStack Query with custom hooks in `src/hooks/`
4. **Progress Tracking** - User attempts saved per-question for analytics

### Context Providers

The app wraps components in this provider order, outermost → innermost (see `App.tsx`):
1. ThemeProvider (next-themes) — sole writer of the `light`/`dark` class on `<html>`
2. MuiThemeProvider (MUI) + CssBaseline — mounted with `colorSchemeNode={null}` so it follows next-themes instead of competing with it
3. AccessibilityProvider (a11y prefs)
4. QueryClientProvider (TanStack Query)
5. AuthProvider (Supabase auth — gates user-scoped queries)
6. PendoProvider → AmplitudeProvider (product analytics)
7. AppNavigationProvider (global license filter)

### Project Structure

```
src/
├── components/      # React components
│   ├── ohp/         # Shared presentational primitives (PageContainer, Icon, ScoreRing, …)
│   ├── admin/       # Admin-only components
│   ├── <feature>/   # Sub-components grouped by feature (dashboard/, question/, …)
│   └── *.tsx        # Feature components
├── hooks/           # Custom React hooks
├── pages/           # Route page components
├── services/        # Service layer + centralized query keys
├── theme/           # MUI theme (palette, typography, component overrides)
├── lib/             # Utilities
├── integrations/    # Supabase client (auto-generated)
├── assets/          # Static assets
├── test/            # Test setup and helpers
└── types/           # TypeScript types
```

Outside `src/`: `supabase/` (migrations, seed data, Edge Functions), `e2e/` (Playwright tests), `website/` (static marketing site), `docs/` (guides and design specs).

## Design System

The UI is built entirely with [MUI](https://mui.com/material-ui/), styled through the `sx` prop. Use the library's components rather than hand-rolling your own, and never use direct colors — always use the theme's palette tokens so light and dark mode both work:

```tsx
// Correct - palette tokens follow light/dark
<Box sx={{ bgcolor: "background.default", color: "text.primary" }}>

// Wrong - a literal color breaks theme switching
<Box sx={{ bgcolor: "#fff", color: "#000" }}>
```

| what you want | `sx` path |
|---|---|
| page background | `background.default` |
| card / surface | `background.paper` |
| body text | `text.primary` / `text.secondary` |
| hairlines, borders | `divider` |
| subtle surface / green accent | `muted` / `accent` (flat keys, no `.main`) |
| brand | `primary.main`, `secondary.main` |
| states | `error.main`, `warning.main`, `info.main`, `success.main` |

Colors live in `src/theme/muiTheme.ts`, which is the source of truth. Icons come from lucide and are rendered through `ohp/Icon`, which hides decorative icons from screen readers.

## Commands

```bash
npm run dev              # Start dev server
npm run dev:full         # Start Supabase + dev server
npm run supabase:stop    # Stop Supabase
npm run supabase:reset   # Reset database
npm run lint             # Run ESLint
npm test                 # Run unit tests (watch mode)
npm run test:run         # Run unit tests once (CI mode)
npm run e2e              # Run Playwright end-to-end tests
npm run build            # Production build
```

## Environment Setup

### Local Development (Recommended)

Uses local Supabase via Docker - no hosted account needed:

```bash
npm run dev:full    # Start Supabase + dev server
```

### Hosted Supabase

For production or if you have Supabase project access:

```bash
cp .env.example .env.local
# Edit .env.local with your credentials
npm run dev
```

## Documentation

- [Local Development Guide](LOCAL_DEVELOPMENT.md) - Setup with local Supabase
- [Testing Guide](docs/TESTING.md) - Vitest testing patterns
- [Contributing Guidelines](CONTRIBUTING.md) - Code style and PR process
- [Deployment Guide](docs/DEPLOYMENT_STEPS.md) - GitHub Pages (marketing site) + Vercel (app) setup
- [MUI Migration Strategy](docs/MUI_MIGRATION_STRATEGY.md) - How and why the UI moved from Tailwind/shadcn to MUI
- [Readiness Scoring Model](docs/Readiness_Scoring_Model.md) - How the readiness percentage is computed
- [OAuth Setup](docs/OAUTH_SETUP.md) - Open Ham Prep as an OAuth provider (Discourse forum SSO)
- [Claude Code Instructions](CLAUDE.md) - AI assistant guidelines

## Contributing

1. Fork the repo
2. Run locally with `npm install && npm run dev:full`
3. Make your changes
4. Submit a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

Licensed under the [GNU General Public License v3.0](LICENSE). © Brad Bazemore

## Support

- File issues on [GitHub](https://github.com/sonyccd/openhamprep/issues)
- Visit [ARRL.org](https://www.arrl.org/) for ham radio learning resources
