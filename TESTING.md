# Testing Guide

Comprehensive guide for writing and running tests in Open Ham Prep.

## Table of Contents

- [Overview](#overview)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Test Coverage](#test-coverage)
- [CI/CD](#cicd)
- [Best Practices](#best-practices)

## Overview

This project uses:
- **Vitest** - Fast unit test framework
- **React Testing Library** - Component testing utilities
- **@testing-library/user-event** - User interaction simulation
- **@testing-library/jest-dom** - Custom DOM matchers

## Running Tests

### Basic Commands

```bash
# Run all tests in watch mode
npm test

# Run tests once (CI mode)
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage

# Run tests with local Supabase
npm run test:local

# Watch mode for specific file
npm test -- useQuestions.test.ts
```

### Coverage Report

After running `npm run test:coverage`, open `coverage/index.html` in your browser to see detailed coverage reports.

## Test Structure

### File Organization

Tests are colocated with the files they test:

```
src/
├── hooks/
│   ├── useQuestions.ts
│   └── useQuestions.test.ts      # ✓ Hook tests
├── components/
│   ├── QuestionCard.tsx
│   └── QuestionCard.test.tsx     # ✓ Component tests
└── lib/
    ├── utils.ts
    └── utils.test.ts             # ✓ Utility tests
```

### Naming Convention

- Test files: `*.test.ts` or `*.test.tsx`
- Test suites: `describe('ComponentName', () => {...})`
- Test cases: `it('should do something', () => {...})`

## Writing Tests

### Hook Tests

Testing custom React hooks with TanStack Query:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useYourHook } from './useYourHook';

// Create test wrapper
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useYourHook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches data successfully', async () => {
    // Mock Supabase call
    const mockData = [{ id: '1', name: 'Test' }];
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
      }),
    });

    const { result } = renderHook(() => useYourHook(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
  });
});
```

### Component Tests

Testing React components with user interactions:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { YourComponent } from './YourComponent';

describe('YourComponent', () => {
  it('renders correctly', () => {
    render(<YourComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const onClickMock = vi.fn();
    const user = userEvent.setup();

    render(<YourComponent onClick={onClickMock} />);

    await user.click(screen.getByRole('button'));
    expect(onClickMock).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', async () => {
    render(<YourComponent isLoading={true} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
```

### Utility Function Tests

Testing pure functions:

```typescript
import { describe, it, expect } from 'vitest';
import { yourFunction } from './utils';

describe('yourFunction', () => {
  it('transforms input correctly', () => {
    const input = { foo: 'bar' };
    const result = yourFunction(input);
    expect(result).toEqual({ foo: 'BAR' });
  });

  it('handles edge cases', () => {
    expect(yourFunction(null)).toBeNull();
    expect(yourFunction(undefined)).toBeUndefined();
  });
});
```

## Mocking

### Mocking Supabase

```typescript
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    })),
    auth: {
      getSession: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));
```

### Mocking Hooks

```typescript
vi.mock('./useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'test-user-id' },
    loading: false,
  })),
}));
```

### Mocking External Libraries

```typescript
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));
```

## Test Coverage

### Current Coverage

Run `npm run test:coverage` to see current coverage:

```
----------------------|---------|----------|---------|---------|
File                  | % Stmts | % Branch | % Funcs | % Lines |
----------------------|---------|----------|---------|---------|
All files             |   78.45 |    71.23 |   82.11 |   78.90 |
 hooks/               |   85.32 |    79.45 |   88.23 |   86.12 |
  useQuestions.ts     |   92.15 |    87.50 |   95.00 |   93.20 |
  useProgress.ts      |   88.45 |    82.30 |   91.67 |   89.10 |
  useBookmarks.ts     |   90.20 |    85.10 |   93.75 |   91.50 |
 components/          |   73.21 |    65.89 |   77.45 |   74.32 |
 lib/                 |   95.67 |    91.23 |   97.50 |   96.12 |
----------------------|---------|----------|---------|---------|
```

### Coverage Goals

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

### What to Test

**High Priority:**
- ✅ Core business logic (hooks)
- ✅ Data transformations
- ✅ User interactions
- ✅ Error handling
- ✅ Edge cases

**Medium Priority:**
- ⚠️ Component rendering
- ⚠️ Conditional logic
- ⚠️ Form validation

**Low Priority:**
- ⬜ UI-only components
- ⬜ Simple presentational components
- ⬜ Third-party integrations

### Excluded from Coverage

As configured in `vitest.config.ts`:
- `node_modules/`
- `src/test/` - Test utilities
- `**/*.d.ts` - Type definitions
- `src/integrations/supabase/types.ts` - Auto-generated types

## CI/CD

### GitHub Actions Workflow

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests targeting `main` or `develop`

The workflow:
1. Runs tests on Node 18 and 20
2. Checks linting (`npm run lint`)
3. Checks types (`npx tsc --noEmit`)
4. Runs test suite (`npm run test:run`)
5. Generates coverage report
6. Uploads to Codecov
7. Checks build (`npm run build`)

See `.github/workflows/test.yml` for details.

### Pre-commit Hooks

Consider adding pre-commit hooks with Husky:

```bash
npm install --save-dev husky lint-staged

# Add to package.json:
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "npm run lint:fix",
      "npm run test -- --related"
    ]
  }
}
```

## Best Practices

### DO ✅

1. **Test behavior, not implementation**
   ```typescript
   // ✅ Good - tests what user sees
   expect(screen.getByText('Question 1 of 35')).toBeInTheDocument();

   // ❌ Bad - tests internal state
   expect(component.state.currentIndex).toBe(0);
   ```

2. **Use Testing Library queries correctly**
   ```typescript
   // ✅ Preferred order:
   screen.getByRole('button', { name: /submit/i });
   screen.getByLabelText('Email');
   screen.getByPlaceholderText('Enter email');
   screen.getByText(/loading/i);

   // ❌ Avoid:
   screen.getByTestId('submit-button'); // Only as last resort
   ```

3. **Test async operations properly**
   ```typescript
   // ✅ Good - waits for async updates
   await waitFor(() => {
     expect(screen.getByText('Success!')).toBeInTheDocument();
   });

   // ❌ Bad - might pass before update
   expect(screen.queryByText('Success!')).toBeInTheDocument();
   ```

4. **Mock external dependencies**
   ```typescript
   // ✅ Good - isolated test
   vi.mock('@/integrations/supabase/client');

   // ❌ Bad - depends on real API
   // (no mocking)
   ```

5. **Clean up after each test**
   ```typescript
   beforeEach(() => {
     vi.clearAllMocks();
   });
   ```

### DON'T ❌

1. **Don't test implementation details**
2. **Don't rely on test execution order**
3. **Don't use arbitrary timeouts**
4. **Don't mock what you're testing**
5. **Don't ignore TypeScript errors in tests**

### Test Organization

```typescript
describe('ComponentName', () => {
  // Setup
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Group related tests
  describe('rendering', () => {
    it('renders with default props', () => {});
    it('renders loading state', () => {});
  });

  describe('user interactions', () => {
    it('handles click', () => {});
    it('handles form submission', () => {});
  });

  describe('edge cases', () => {
    it('handles empty data', () => {});
    it('handles errors', () => {});
  });
});
```

## Common Patterns

### Testing Forms

```typescript
it('submits form with valid data', async () => {
  const onSubmit = vi.fn();
  const user = userEvent.setup();

  render(<Form onSubmit={onSubmit} />);

  await user.type(screen.getByLabelText('Email'), 'test@example.com');
  await user.type(screen.getByLabelText('Password'), 'password123');
  await user.click(screen.getByRole('button', { name: /submit/i }));

  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });
});
```

### Testing Error States

```typescript
it('displays error message on failure', async () => {
  vi.mocked(supabase.from).mockReturnValue({
    select: vi.fn().mockResolvedValue({
      data: null,
      error: new Error('Network error'),
    }),
  });

  render(<Component />);

  await waitFor(() => {
    expect(screen.getByText(/error loading data/i)).toBeInTheDocument();
  });
});
```

### Testing Loading States

```typescript
it('shows loading spinner while fetching', () => {
  render(<Component isLoading={true} />);
  expect(screen.getByRole('status')).toBeInTheDocument();
});
```

## Troubleshooting

### Tests Timing Out

```typescript
// Increase timeout for slow operations
it('handles slow operation', async () => {
  // ...
}, 10000); // 10 second timeout
```

### Act Warnings

```typescript
// Wrap state updates in act()
await act(async () => {
  await result.current.mutateAsync();
});
```

### Mock Not Working

```typescript
// Ensure mock is defined before import
vi.mock('./module');
// Then import
import { useHook } from './module';
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [Common Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Examples

See existing test files for examples:
- `src/hooks/useQuestions.test.ts` - Hook testing
- `src/hooks/useProgress.test.ts` - Async operations
- `src/hooks/useBookmarks.test.ts` - Mutations
- `src/components/QuestionCard.test.tsx` - Component testing
- `src/lib/utils.test.ts` - Utility functions

## Contributing

When adding new code:

1. Write tests for new features
2. Maintain or improve coverage
3. Follow existing test patterns
4. Run tests before committing:
   ```bash
   npm run test:run
   npm run lint
   npm run build
   ```

For questions or issues with tests, open a GitHub issue or check existing test files for patterns.
