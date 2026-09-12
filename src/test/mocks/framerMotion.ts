import React from 'react';

/**
 * A framer-motion stand-in for component tests.
 *
 * Most test files here mock framer-motion with a hand-written object exposing
 * only `motion.div`. That breaks as soon as a component is ported to MUI: the
 * `MotionBox` adapter is built with `motion.create(Box)` at module scope, so a
 * mock without `create` throws "motion.create is not a function" at import time
 * and the whole file reports "no tests" rather than a failure.
 *
 * Animation props are dropped rather than forwarded. React warns about unknown
 * DOM attributes, and those warnings are easy to miss — the same class of leak
 * as the `alignItems` one that reached a preview deploy in B1.
 *
 * Import it inside the factory, not at the top of the file: vi.mock is hoisted
 * above the import list, so a top-level binding is not initialised when the
 * factory runs ("Cannot access '__vi_import__' before initialization").
 *
 * Usage:
 * ```ts
 * vi.mock('framer-motion', async () => {
 *   const { framerMotionMock } = await import('@/test/mocks/framerMotion');
 *   return framerMotionMock();
 * });
 * ```
 */
const MOTION_PROPS = new Set([
  'initial',
  'animate',
  'exit',
  'transition',
  'variants',
  'whileHover',
  'whileTap',
  'whileFocus',
  'whileInView',
  'viewport',
  'layout',
  'layoutId',
  'drag',
  'onAnimationStart',
  'onAnimationComplete',
]);

const strip = (props: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(props).filter(([key]) => !MOTION_PROPS.has(key)));

export function framerMotionMock() {
  const render = (type: React.ElementType) => {
    const Component = ({ children, ...props }: { children?: React.ReactNode }) =>
      React.createElement(type, strip(props as Record<string, unknown>), children);
    Component.displayName = `motion(${typeof type === 'string' ? type : 'Component'})`;
    return Component;
  };

  // A Proxy so motion.div, motion.p, motion.button and anything else all work
  // without each test listing the tags its component happens to use.
  const motion = new Proxy(
    { create: render },
    {
      get: (target, prop: string) =>
        prop === 'create' ? target.create : render(prop as React.ElementType),
    }
  );

  return {
    motion,
    AnimatePresence: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    useReducedMotion: () => false,
  };
}
