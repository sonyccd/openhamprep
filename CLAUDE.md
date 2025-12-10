# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Open Ham Prep is a React-based web application for studying FCC Amateur Radio license exams (Technician, General, Extra). Built with React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, and Supabase.

## Essential Commands

### Development
```bash
npm run dev          # Start dev server on http://localhost:8080
npm run build        # Production build
npm run build:dev    # Development build
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### Testing
```bash
npx vitest           # Run tests in watch mode
npx vitest run       # Run tests once
npx vitest --ui      # Open Vitest UI
```

## Architecture Overview

### Core Data Flow
1. **Global License Context**: The app has a global license filter (Technician/General/Extra) managed in `useAppNavigation.tsx` that filters all questions and content app-wide
2. **Authentication**: Managed via `useAuth.tsx` context provider wrapping the entire app, using Supabase Auth
3. **Data Fetching**: All server state is managed via TanStack Query with dedicated hooks in `src/hooks/`
4. **Progress Tracking**: User attempts are saved per-question in `question_attempts` table for analytics and weak question identification

### Key Patterns

**Context Providers (App.tsx)**:
The app is wrapped in multiple providers in this order:
1. ThemeProvider (next-themes)
2. QueryClientProvider (TanStack Query)
3. AuthProvider (custom Supabase auth)
4. PostHogProvider (analytics)
5. AppNavigationProvider (global license filter state)

**Data Hooks Pattern**:
- `useQuestions()` - Fetches all questions, caches for 1 hour
- `useProgress()` - Saves test results and question attempts
- `useAuth()` - Provides user session and auth methods
- `useAppNavigation()` - Provides global license filter and navigation helpers

**Component Organization**:
- `src/components/ui/` - Base shadcn components (rarely modified)
- `src/components/admin/` - Admin-only components
- `src/components/*.tsx` - Feature components
- `src/pages/*.tsx` - Route page components
- `src/hooks/*.tsx` - Custom React hooks

### Design System (Critical)

**Never use direct colors in components**. Always use semantic tokens defined in `src/index.css`:

```typescript
// ❌ WRONG - Direct colors break theme switching
<div className="bg-white text-black">

// ✅ CORRECT - Semantic tokens work in light/dark mode
<div className="bg-background text-foreground">
```

**Available Semantic Tokens**:
- Layout: `background`, `foreground`, `border`
- Components: `card`, `popover`, `input`, `muted`, `accent`
- States: `primary`, `secondary`, `destructive`, `success`
- Sidebar: `sidebar-background`, `sidebar-foreground`, etc.

All colors are HSL format defined as CSS custom properties. The design system supports both light and dark themes via the `dark` class.

### Supabase Integration

**Database Client**: Auto-generated client at `src/integrations/supabase/client.ts`
- Import: `import { supabase } from "@/integrations/supabase/client"`
- Types are auto-generated in `src/integrations/supabase/types.ts`
- Never manually edit files in `src/integrations/supabase/`

**Environment Variables**:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase anon key
- Auto-configured when connected to Lovable Cloud

**Key Database Tables**:
- `questions` - Question pool (id, question, options[], correct_answer, subelement, question_group)
- `question_attempts` - User answers (user_id, question_id, is_correct, attempt_type)
- `practice_test_results` - Complete test results (user_id, score, percentage, passed)
- `glossary_terms` - Study terms with spaced repetition tracking
- `bookmarks` - User-saved questions with personal notes

**Row Level Security (RLS)**: All user data is protected. Users can only access their own attempts/results/bookmarks.

### TypeScript Configuration

The project uses relaxed TypeScript settings for rapid development:
- `noImplicitAny: false` - Implicit any is allowed
- `strictNullChecks: false` - Null checks are not strict
- `noUnusedParameters: false` - Unused params allowed
- `noUnusedLocals: false` - Unused locals allowed

When adding new code, prefer explicit typing but don't be overly strict to match existing patterns.

## Code Style Guidelines

### React Components

```typescript
// ✅ Use const arrow functions
const QuestionCard = ({ question, onAnswer }: QuestionCardProps) => {
  // Extract logic into custom hooks
  const { saveAttempt } = useProgress();

  // Early returns for loading/error states
  if (!question) return <Skeleton />;

  return <div className="bg-card text-card-foreground">{/* ... */}</div>;
};

// ✅ Define explicit prop interfaces
interface QuestionCardProps {
  question: Question;
  onAnswer: (answerId: string) => void;
  showExplanation?: boolean;
}
```

### Data Fetching

```typescript
// ✅ All data fetching uses TanStack Query via custom hooks
const { data: questions, isLoading, error } = useQuestions();

// ✅ Mutations are defined in hooks
const { saveTestResult } = useProgress();
await saveTestResult(questions, answers);
```

### Styling

```typescript
// ✅ Use Tailwind with semantic tokens
<button className="bg-primary text-primary-foreground hover:bg-primary/90">

// ✅ Use consistent spacing from Tailwind's scale
<div className="p-4 space-y-2">

// ❌ Avoid arbitrary values unless absolutely necessary
<div className="p-[17px]">  // Bad
```

## Admin Features

Admin access is granted via database role (no UI). Admins can:
- Manage questions and glossary terms via admin dashboard
- Bulk import/export via CSV/JSON
- View edit history for accountability
- See usage statistics

**Admin Routes**: Protected by `useAdmin()` hook checking user role.

## Important Context

### License Filter Scope
The license selector (Technician/General/Extra) is global state in `AppNavigationProvider`. When filtering questions:
- Technician: Show questions starting with 'T'
- General: Show questions starting with 'G'
- Extra: Show questions starting with 'E'

### Question ID Format
- Technician: `T1A01`, `T1B02`, etc. (T + subelement + group + number)
- General: `G1A01`, `G2B03`, etc.
- Extra: `E1A01`, `E3C12`, etc.

### Attempt Types
When saving question attempts, use these `attempt_type` values:
- `'practice_test'` - From full 35-question exam simulation
- `'random_practice'` - From random practice mode
- `'subelement_practice'` - From subelement-focused study
- `'weak_questions'` - From weak questions review

## Deployment

The app uses Supabase as the backend:
- **Database**: PostgreSQL via Supabase
- **Auth**: Supabase Auth
- **Edge Functions**: Deployed via `supabase functions deploy`
- **Migrations**: Applied via `supabase db push`
- **Production URL**: https://openhamprep.app

### Migration from Lovable Cloud

To migrate from Lovable Cloud to a standalone Supabase project:
1. Run the migration script: `./migrate-to-supabase.sh`
2. Follow the prompts to link your project and apply migrations
3. See `docs/SUPABASE_MIGRATION.md` for detailed instructions

## Testing Philosophy

Tests focus on:
- Critical user flows (auth, question answering, progress tracking)
- Complex hooks with business logic
- UI components with conditional rendering

Tests are colocated with components (e.g., `QuestionCard.test.tsx` next to `QuestionCard.tsx`).

## Common Pitfalls

1. **Don't bypass the global license filter** - Always respect the license context from `useAppNavigation`
2. **Don't use direct colors** - Always use semantic tokens from the design system
3. **Don't edit Supabase integration files** - They're auto-generated
4. **Don't create monolithic components** - Extract reusable pieces, keep files under 200 lines
5. **Don't forget mobile** - The app is responsive; test on mobile viewports
6. **Don't skip theme testing** - Verify both light and dark modes work

## Useful Patterns

### Filtering Questions by License
```typescript
const { selectedLicense } = useAppNavigation();
const filteredQuestions = questions.filter(q =>
  q.id.startsWith(selectedLicense[0]) // T, G, or E
);
```

### Saving Progress
```typescript
const { user } = useAuth();
const { saveTestResult, saveRandomAttempt } = useProgress();

// For full tests
await saveTestResult(questions, answers);

// For individual questions
await saveRandomAttempt(question, selectedAnswer);
```

### Protected Routes
```typescript
const { user, loading } = useAuth();

if (loading) return <PageLoader />;
if (!user) return <Navigate to="/auth" />;
```
