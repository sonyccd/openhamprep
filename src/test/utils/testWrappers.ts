import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { muiTheme } from '@/theme/muiTheme';

/**
 * Creates a new QueryClient configured for testing.
 * Disables retries and sets short cache times for predictable tests.
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Creates a wrapper component for React Testing Library's render function.
 * Includes QueryClientProvider with a fresh QueryClient.
 *
 * Usage:
 * ```tsx
 * const { wrapper } = createQueryClientWrapper();
 * render(<MyComponent />, { wrapper });
 * ```
 */
export function createQueryClientWrapper() {
  const queryClient = createTestQueryClient();

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  return { wrapper, queryClient };
}

/**
 * Creates a wrapper component that includes both QueryClient and Router.
 * Useful for testing components that use both TanStack Query and React Router.
 *
 * Usage:
 * ```tsx
 * const { wrapper } = createRouterWrapper('/some-path');
 * render(<MyComponent />, { wrapper });
 * ```
 */
export function createRouterWrapper(
  initialPath = '/',
  routes?: Array<{ path: string; element: React.ReactNode }>
) {
  const queryClient = createTestQueryClient();

  const wrapper = ({ children }: { children: React.ReactNode }) => {
    const routeElements = routes
      ? routes.map((r) =>
          React.createElement(Route, { key: r.path, path: r.path, element: r.element })
        )
      : [React.createElement(Route, { key: '*', path: '*', element: children })];

    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(
        MemoryRouter,
        { initialEntries: [initialPath] },
        React.createElement(Routes, null, ...routeElements)
      )
    );
  };

  return { wrapper, queryClient };
}

/**
 * Creates a simple MemoryRouter wrapper for testing router-dependent components.
 * Does NOT include QueryClient - use createRouterWrapper if you need both.
 *
 * Usage:
 * ```tsx
 * const { wrapper } = createMemoryRouterWrapper('/test-path');
 * render(<MyComponent />, { wrapper });
 * ```
 */
export function createMemoryRouterWrapper(initialPath = '/') {
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      MemoryRouter,
      { initialEntries: [initialPath] },
      children
    );

  return { wrapper };
}

/**
 * Wraps a component in the app's real MUI theme.
 *
 * Needed by any ported component that reads a palette token, and required
 * rather than optional for the custom keys — `muted` and `accent` exist only in
 * our theme (#284), so without a provider MUI falls back to its default palette
 * where they are undefined, and a token read throws rather than degrading.
 *
 * Uses the real `muiTheme` instead of a stub on purpose: a test that renders
 * against the actual palette fails if a token is removed from under it.
 *
 * Usage:
 * ```tsx
 * render(<LessonCard … />, { wrapper: muiWrapper });
 * ```
 */
export function muiWrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(
    MuiThemeProvider,
    { theme: muiTheme, defaultMode: 'light', noSsr: true },
    children
  );
}

/**
 * Creates a complete test wrapper with QueryClient and an optional custom wrapper.
 * Useful when you need to add additional providers.
 *
 * Usage:
 * ```tsx
 * const { wrapper } = createCompleteWrapper({
 *   additionalWrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>
 * });
 * render(<MyComponent />, { wrapper });
 * ```
 */
export function createCompleteWrapper(options: {
  initialPath?: string;
  additionalWrapper?: React.ComponentType<{ children: React.ReactNode }>;
} = {}) {
  const { initialPath = '/', additionalWrapper: AdditionalWrapper } = options;
  const queryClient = createTestQueryClient();

  const wrapper = ({ children }: { children: React.ReactNode }) => {
    let content = children;

    if (AdditionalWrapper) {
      content = React.createElement(AdditionalWrapper, null, content);
    }

    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(
        MemoryRouter,
        { initialEntries: [initialPath] },
        content
      )
    );
  };

  return { wrapper, queryClient };
}
