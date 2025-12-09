# Contributing to RARS Ham Radio Test Prep

Thank you for your interest in contributing to the RARS Ham Radio Test Prep application! This guide will help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style Guide](#code-style-guide)
- [Pull Request Process](#pull-request-process)
- [Content Contributions](#content-contributions)

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the issue, not the person
- Help newcomers learn and grow

## Getting Started

### Prerequisites

1. Node.js 18+ installed
2. Git configured with your GitHub account
3. Familiarity with React, TypeScript, and Tailwind CSS

### Local Setup

```bash
# Fork the repository on GitHub first, then:
git clone https://github.com/YOUR_USERNAME/rars-test-prep.git
cd rars-test-prep
npm install
npm run dev
```

### Understanding the Codebase

Before contributing, familiarize yourself with:

1. **Project Structure** - See README.md for directory layout
2. **Design System** - Review `src/index.css` and `tailwind.config.ts`
3. **Component Patterns** - Look at existing components in `src/components/`
4. **Data Fetching** - See hooks in `src/hooks/` using TanStack Query

## Development Workflow

### Branch Naming

Use descriptive branch names with prefixes:

- `feature/` - New features (e.g., `feature/flashcard-shuffle`)
- `fix/` - Bug fixes (e.g., `fix/timer-reset-issue`)
- `docs/` - Documentation changes (e.g., `docs/api-examples`)
- `refactor/` - Code refactoring (e.g., `refactor/question-card`)
- `style/` - UI/styling changes (e.g., `style/dark-mode-contrast`)

### Commit Messages

Follow conventional commits format:

```
type(scope): brief description

[optional body with more details]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples:**
```
feat(practice): add question shuffle option
fix(auth): resolve session expiration redirect
docs(readme): update local setup instructions
style(buttons): improve hover state contrast
```

### Testing Your Changes

1. **Manual Testing** - Test all affected user flows
2. **Responsive Design** - Verify on mobile and desktop viewports
3. **Theme Testing** - Check both light and dark modes
4. **Edge Cases** - Test empty states, loading states, error states

## Code Style Guide

### TypeScript

```typescript
// ✅ Use explicit typing for props
interface QuestionCardProps {
  question: Question;
  onAnswer: (answerId: number) => void;
  showExplanation?: boolean;
}

// ✅ Use const arrow functions for components
const QuestionCard = ({ question, onAnswer, showExplanation = false }: QuestionCardProps) => {
  // ...
};

// ❌ Avoid 'any' type
const handleData = (data: any) => {}; // Bad

// ✅ Define proper types
const handleData = (data: QuestionAttempt) => {}; // Good
```

### React Patterns

```typescript
// ✅ Extract logic into custom hooks
const useQuestionProgress = (questionId: string) => {
  // Data fetching and state logic here
};

// ✅ Keep components focused on UI
const ProgressDisplay = () => {
  const { progress, isLoading } = useQuestionProgress(id);
  return <div>{/* UI only */}</div>;
};

// ✅ Use early returns for loading/error states
if (isLoading) return <Skeleton />;
if (error) return <ErrorMessage error={error} />;
```

### Styling with Tailwind

```typescript
// ❌ Never use direct colors
<div className="bg-white text-black" />

// ✅ Always use semantic tokens
<div className="bg-background text-foreground" />

// ❌ Avoid inline color values
<div className="bg-[#1a1a1a]" />

// ✅ Define colors in design system if needed
// Add to index.css first, then use the token
<div className="bg-card" />

// ✅ Use consistent spacing
<div className="p-4 space-y-2" />  // Good
<div className="p-[17px]" />       // Avoid arbitrary values
```

### Component Organization

```
src/components/
├── ui/                 # Base shadcn components (rarely modified)
├── admin/              # Admin-only components
├── FeatureName.tsx     # Feature components
└── FeatureNamePart.tsx # Sub-components for large features
```

**When to create a new file:**
- Component exceeds ~150 lines
- Logic can be reused elsewhere
- Component has distinct responsibility

## Pull Request Process

### Before Submitting

- [ ] Code follows the style guide
- [ ] No TypeScript errors (`npm run build`)
- [ ] Tested on mobile and desktop
- [ ] Tested in light and dark mode
- [ ] No console errors or warnings
- [ ] Commits are clean and descriptive

### PR Template

When creating a PR, use this template:

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature causing existing functionality to change)
- [ ] Documentation update
- [ ] Style/UI update
- [ ] Refactoring (no functional changes)

## Changes Made
- List specific changes
- One item per line
- Be concise but complete

## Screenshots (if applicable)
Add screenshots for UI changes, showing before/after if relevant.

## Testing Done
- [ ] Tested locally
- [ ] Tested on mobile viewport
- [ ] Tested light/dark mode
- [ ] Tested relevant user flows

## Related Issues
Closes #[issue number]

## Checklist
- [ ] My code follows the project's style guide
- [ ] I have performed a self-review
- [ ] I have tested my changes thoroughly
- [ ] My changes don't break existing functionality
```

### Code Review Process

1. **Submit PR** - Create PR with completed template
2. **Automated Checks** - Wait for build to pass
3. **Review** - Maintainer reviews code and functionality
4. **Feedback** - Address any requested changes
5. **Approval** - Once approved, maintainer merges

**Review Criteria:**
- Follows code style guide
- No unnecessary changes outside scope
- Maintains existing functionality
- Accessible and responsive
- No security vulnerabilities

## Content Contributions

### Adding Questions

Questions can be bulk imported via CSV in the admin interface:

```csv
id,question,option_a,option_b,option_c,option_d,correct_answer,subelement,question_group
```

**ID Format:**
- Technician: `T1A01`, `T1A02`, etc.
- General: `G1A01`, `G1A02`, etc.
- Extra: `E1A01`, `E1A02`, etc.

**Guidelines:**
- Use official FCC question pool as source
- Include accurate correct_answer (0-3 for options A-D)
- Categorize by correct subelement and group

### Adding Glossary Terms

```csv
term,definition
```

**Guidelines:**
- Keep definitions concise but complete
- Use plain language accessible to beginners
- Avoid circular definitions

### Adding Learning Resources

Admins can add learning resource links to questions via the admin interface:
- YouTube videos
- Articles and tutorials
- Reference websites

Links are automatically unfurled to fetch metadata (title, description, thumbnail).

## Questions?

- Check existing issues for similar questions
- Open a new issue for bugs or feature requests
- Use the in-app help button for general support

Thank you for contributing! 🎉
