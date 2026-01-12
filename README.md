# Open Ham Prep

![Website](https://img.shields.io/website?url=https%3A%2F%2Fopenhamprep.com)
![GitHub branch status](https://img.shields.io/github/checks-status/sonyccd/openhamprep/main)
[![codecov](https://codecov.io/gh/sonyccd/openhamprep/graph/badge.svg?token=SGUGokGdG1)](https://codecov.io/gh/sonyccd/openhamprep)
![GitHub last commit (branch)](https://img.shields.io/github/last-commit/sonyccd/openhamprep/main)
![GitHub License](https://img.shields.io/github/license/sonyccd/openhamprep)

A modern web application for studying US Amateur Radio license exams. Open source, community-driven, born in North Carolina.

**Live App:** [app.openhamprep.com](https://app.openhamprep.com)

## Features

- **Practice Tests** - Simulated exam experience with optional timer
- **Random Practice** - Study questions with instant feedback
- **Study by Topics** - Focus on specific subelements with learning resources
- **Weak Questions** - Review questions you've missed
- **Glossary & Flashcards** - Learn key terms with spaced repetition
- **Progress Tracking** - Dashboard with test readiness, streaks, and goals
- **Bookmarks** - Save questions with personal notes

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

**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query, Framer Motion

**Backend:** Supabase (PostgreSQL, Auth, Edge Functions, Realtime)

**Tooling:** Vitest, ESLint, Pendo (analytics), Sentry (error tracking)

## Architecture

### Core Data Flow

1. **Global License Context** - App-wide filter (Technician/General/Extra) via `useAppNavigation`
2. **Authentication** - Supabase Auth via `useAuth` context
3. **Data Fetching** - TanStack Query with custom hooks in `src/hooks/`
4. **Progress Tracking** - User attempts saved per-question for analytics

### Context Providers

The app wraps components in this provider order (see `App.tsx`):
1. ThemeProvider (next-themes)
2. QueryClientProvider (TanStack Query)
3. AuthProvider (Supabase auth)
4. AppNavigationProvider (license filter)

### Project Structure

```
src/
├── components/      # React components
│   ├── ui/          # Base shadcn components
│   ├── admin/       # Admin-only components
│   └── *.tsx        # Feature components
├── hooks/           # Custom React hooks
├── pages/           # Route page components
├── lib/             # Utilities
├── integrations/    # Supabase client (auto-generated)
└── types/           # TypeScript types
```

## Design System

**Important:** Never use direct colors. Always use semantic tokens:

```tsx
// Correct - works in light/dark mode
<div className="bg-background text-foreground">

// Wrong - breaks theme switching
<div className="bg-white text-black">
```

Available tokens: `background`, `foreground`, `card`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `success`, `border`

See `src/index.css` for all token definitions.

## Commands

```bash
npm run dev              # Start dev server
npm run dev:full         # Start Supabase + dev server
npm run supabase:stop    # Stop Supabase
npm run supabase:reset   # Reset database
npm test                 # Run tests
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
- [Deployment Guide](docs/DEPLOYMENT_STEPS.md) - GitHub Pages + Vercel setup
- [Claude Code Instructions](CLAUDE.md) - AI assistant guidelines
- [OAuth Setup](docs/OAUTH_SETUP.md) - Social login configuration

## Contributing

1. Fork the repo
2. Run locally with `npm install && npm run dev:full`
3. Make your changes
4. Submit a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

© Brad Bazemore

## Support

- File issues on [GitHub](https://github.com/sonyccd/openhamprep/issues)
- Visit [ARRL.org](https://www.arrl.org/) for ham radio learning resources
