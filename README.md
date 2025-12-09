# Open Ham Prep

A modern web application for studying and preparing for FCC Amateur Radio license exams—a community-driven open-source project born in North Carolina.

## Overview

This application helps users prepare for their Technician, General, and Extra class ham radio license exams through:

- **Practice Tests** - Simulated exam experience with optional timer
- **Random Practice** - Study questions in random order with instant feedback
- **Study by Topics** - Focus on specific subelements with topic overviews and learning resources
- **Weak Questions Review** - Target questions you've previously answered incorrectly
- **Glossary & Flashcards** - Learn key terms with spaced repetition
- **Progress Tracking** - Dashboard with test readiness metrics, streaks, and weekly goals
- **Bookmarks** - Save questions for later review with personal notes

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for styling with a custom design system
- **shadcn/ui** components built on Radix UI primitives
- **React Router** for client-side routing
- **TanStack Query** for server state management
- **Framer Motion** for animations

### Backend (Lovable Cloud / Supabase)
- **PostgreSQL** database with Row Level Security (RLS)
- **Supabase Auth** for user authentication
- **Edge Functions** for serverless backend logic
- **PostHog** for analytics (authenticated users only)

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui base components
│   │   ├── admin/           # Admin dashboard components
│   │   └── *.tsx            # Feature components
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.tsx      # Authentication context
│   │   ├── useQuestions.ts  # Question data fetching
│   │   ├── useProgress.ts   # User progress tracking
│   │   └── ...
│   ├── pages/               # Route page components
│   ├── integrations/
│   │   └── supabase/        # Supabase client & types (auto-generated)
│   ├── lib/                 # Utility functions
│   └── index.css            # Design system tokens
├── supabase/
│   ├── functions/           # Edge functions
│   └── migrations/          # Database migrations (read-only)
└── public/                  # Static assets
```

## Architecture

### Data Flow
1. **Questions** are stored in the database with subelement/group categorization
2. **User attempts** are tracked per question for progress analytics
3. **Practice test results** are saved for historical review
4. **Glossary progress** tracks term mastery with spaced repetition

### Key Patterns
- **Global License Filter** - The test type selector (Technician/General/Extra) filters all content app-wide
- **Lazy Loading** - Pages are code-split for faster initial load
- **Optimistic Updates** - UI updates immediately while syncing with backend
- **RLS Policies** - All user data is protected at the database level

### Design System
The app uses semantic design tokens defined in `src/index.css` and `tailwind.config.ts`:
- Never use direct colors in components (e.g., `text-white`)
- Always use semantic tokens (e.g., `text-foreground`, `bg-muted`)
- HSL color format throughout for theme consistency

## Local Development

### Prerequisites
- Node.js 18+ (recommend using [nvm](https://github.com/nvm-sh/nvm))
- npm or bun

### Setup

```bash
# Clone the repository
git clone https://github.com/sonyccd/openhamprep.git
cd openhamprep

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:8080`.

### Environment Variables
The `.env` file is auto-configured when connected to Lovable Cloud. For local development without Lovable:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Your Supabase anon key

## Contributing

### Guidelines

1. **Keep changes focused** - One feature or fix per PR
2. **Follow the design system** - Use semantic tokens, not direct colors
3. **Create small components** - Avoid monolithic files; extract reusable pieces
4. **Maintain type safety** - TypeScript strict mode is enabled
5. **Test on mobile** - The app is responsive; verify mobile layouts

### Code Style

- Use functional components with hooks
- Prefer `const` arrow functions for component definitions
- Keep business logic in hooks, UI logic in components
- Use TanStack Query for all data fetching
- Follow existing patterns in the codebase

### Admin Features

Admin access is granted via database role assignment (no UI for role management). Admins can:
- Manage questions and glossary terms
- Bulk import/export content via CSV/JSON
- View usage statistics and identify content gaps
- Track edit history for accountability

### Bulk Content Import

Questions and glossary terms can be bulk imported via CSV:

**Questions CSV format:**
```csv
id,question,option_a,option_b,option_c,option_d,correct_answer,subelement,question_group
T1A01,What is...?,Answer A,Answer B,Answer C,Answer D,0,T1,T1A
```

**Glossary CSV format:**
```csv
term,definition
Antenna,A device for transmitting or receiving radio waves
```

## Deployment

The app is deployed via Lovable's publish feature:
- **Frontend changes** require clicking "Update" in the publish dialog
- **Backend changes** (edge functions, migrations) deploy automatically

## License

© Brad Bazemore

## Support

- File issues via the in-app help button (Bug Report / Feature Request)
- Visit [ARRL.org](https://www.arrl.org/) for general ham radio learning resources
