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

  // Cached, so motion.button is the same component type on every access.
  // Without this the Proxy hands back a fresh function each time, which makes
  // it a new component type every render — React then remounts the subtree
  // rather than updating it. Any component with state would lose its DOM nodes
  // mid-interaction: userEvent's mouseenter would trigger a re-render and the
  // click that followed would land on a detached node.
  //
  // The same defect as the in-render components found in #288 and #290,
  // arriving through a test helper instead of product code — where it is worse,
  // because the symptom is an unexplained test failure rather than a visible
  // bug.
  const cache = new Map<string, React.ElementType>();
  const forTag = (tag: string) => {
    if (!cache.has(tag)) cache.set(tag, render(tag as React.ElementType));
    return cache.get(tag);
  };

  // A Proxy so motion.div, motion.p, motion.button and anything else all work
  // without each test listing the tags its component happens to use.
  const motion = new Proxy(
    { create: render },
    {
      get: (target, prop: string) => (prop === 'create' ? target.create : forTag(prop)),
    }
  );

  return {
    motion,
    AnimatePresence: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    useReducedMotion: () => false,
  };
}
