import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  description: string;
  action: () => void;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  disabled?: boolean;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
}

export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {}
) {
  const { enabled = true } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Ignore if user is typing in an input, textarea, or contenteditable
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        if (shortcut.disabled) continue;

        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = !shortcut.ctrlKey || (event.ctrlKey || event.metaKey);
        const shiftMatch = !shortcut.shiftKey || event.shiftKey;
        const altMatch = !shortcut.altKey || event.altKey;

        // For shortcuts without modifiers, make sure no modifiers are pressed
        const noModifiersNeeded = !shortcut.ctrlKey && !shortcut.shiftKey && !shortcut.altKey;
        const noModifiersPressed = !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey;

        if (keyMatch && (noModifiersNeeded ? noModifiersPressed : (ctrlMatch && shiftMatch && altMatch))) {
          event.preventDefault();
          shortcut.action();
          return;
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);
}

// Standard shortcut definitions for reuse
export const SHORTCUT_KEYS = {
  ANSWER_A: 'a',
  ANSWER_B: 'b',
  ANSWER_C: 'c',
  ANSWER_D: 'd',
  NEXT: 'ArrowRight',
  PREVIOUS: 'ArrowLeft',
  SKIP: 's',
  BOOKMARK: 'b',
  CALCULATOR: 'c',
  HELP: '?',
  ESCAPE: 'Escape',
} as const;
