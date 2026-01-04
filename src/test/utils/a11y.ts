import { axe, toHaveNoViolations, JestAxeConfigureOptions } from 'jest-axe';
import { RenderResult } from '@testing-library/react';

// Extend Jest matchers with axe-core
expect.extend(toHaveNoViolations);

/**
 * Default axe configuration for accessibility testing.
 * Configured for WCAG 2.1 Level AA compliance.
 */
const defaultAxeConfig: JestAxeConfigureOptions = {
  rules: {
    // Ensure color contrast meets WCAG AA standards
    'color-contrast': { enabled: true },
    // Check for proper heading hierarchy
    'heading-order': { enabled: true },
    // Ensure all images have alt text
    'image-alt': { enabled: true },
    // Check for keyboard accessibility
    'keyboard': { enabled: true },
    // Ensure form inputs have labels
    'label': { enabled: true },
    // Check for proper link text
    'link-name': { enabled: true },
    // Ensure buttons have accessible names
    'button-name': { enabled: true },
    // Check for duplicate IDs
    'duplicate-id': { enabled: true },
    // Ensure ARIA attributes are valid
    'aria-valid-attr': { enabled: true },
    'aria-valid-attr-value': { enabled: true },
  },
};

/**
 * Runs accessibility audit on a rendered component.
 *
 * @param container - The container element from React Testing Library render
 * @param options - Optional axe configuration overrides
 * @returns Promise that resolves with axe results
 *
 * @example
 * ```tsx
 * import { render } from '@testing-library/react';
 * import { checkA11y } from '@/test/utils/a11y';
 *
 * test('MyComponent has no accessibility violations', async () => {
 *   const { container } = render(<MyComponent />);
 *   await checkA11y(container);
 * });
 * ```
 */
export async function checkA11y(
  container: Element | RenderResult['container'],
  options?: JestAxeConfigureOptions
) {
  const results = await axe(container as Element, {
    ...defaultAxeConfig,
    ...options,
  });

  expect(results).toHaveNoViolations();

  return results;
}

/**
 * Runs accessibility audit and returns violations without throwing.
 * Useful for debugging or when you want to handle violations manually.
 *
 * @param container - The container element from React Testing Library render
 * @param options - Optional axe configuration overrides
 * @returns Promise that resolves with array of violations
 *
 * @example
 * ```tsx
 * const violations = await getA11yViolations(container);
 * console.log(violations); // Debug specific issues
 * expect(violations).toHaveLength(0);
 * ```
 */
export async function getA11yViolations(
  container: Element | RenderResult['container'],
  options?: JestAxeConfigureOptions
) {
  const results = await axe(container as Element, {
    ...defaultAxeConfig,
    ...options,
  });

  return results.violations;
}

/**
 * Creates a custom axe configuration for specific testing scenarios.
 *
 * @param overrides - Rules to override from default config
 * @returns Merged axe configuration
 *
 * @example
 * ```tsx
 * const config = createA11yConfig({
 *   rules: {
 *     'color-contrast': { enabled: false }, // Skip color contrast for this test
 *   },
 * });
 * await checkA11y(container, config);
 * ```
 */
export function createA11yConfig(
  overrides: Partial<JestAxeConfigureOptions>
): JestAxeConfigureOptions {
  return {
    ...defaultAxeConfig,
    ...overrides,
    rules: {
      ...defaultAxeConfig.rules,
      ...overrides.rules,
    },
  };
}

/**
 * Format accessibility violations for readable console output.
 * Useful for debugging accessibility issues during development.
 *
 * @param violations - Array of axe violations
 * @returns Formatted string describing violations
 */
export function formatViolations(violations: Array<{
  id: string;
  impact?: string;
  description: string;
  help: string;
  nodes: Array<{ html: string; failureSummary?: string }>;
}>): string {
  if (violations.length === 0) {
    return 'No accessibility violations found.';
  }

  return violations
    .map((violation) => {
      const nodeInfo = violation.nodes
        .map((node) => `  - ${node.html}\n    ${node.failureSummary || ''}`)
        .join('\n');

      return `
[${violation.impact?.toUpperCase() || 'UNKNOWN'}] ${violation.id}
${violation.help}
${violation.description}
Affected elements:
${nodeInfo}
`;
    })
    .join('\n---\n');
}
