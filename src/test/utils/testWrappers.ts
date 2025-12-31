import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

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
