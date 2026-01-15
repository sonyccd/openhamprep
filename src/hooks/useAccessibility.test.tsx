import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AccessibilityProvider, useAccessibility, FontFamily } from './useAccessibility';
import React from 'react';

// Test component that exposes hook values
function TestComponent() {
  const { fontFamily, setFontFamily, boldText, setBoldText, largeFont, setLargeFont } = useAccessibility();
  return (
    <div>
      <span data-testid="fontFamily">{fontFamily}</span>
      <span data-testid="boldText">{String(boldText)}</span>
      <span data-testid="largeFont">{String(largeFont)}</span>
      <button data-testid="setDyslexic" onClick={() => setFontFamily('dyslexic')}>Set Dyslexic</button>
      <button data-testid="setArimo" onClick={() => setFontFamily('arimo')}>Set Arimo</button>
      <button data-testid="setDefault" onClick={() => setFontFamily('default')}>Set Default</button>
      <button data-testid="toggleBold" onClick={() => setBoldText(!boldText)}>Toggle Bold</button>
      <button data-testid="toggleLarge" onClick={() => setLargeFont(!largeFont)}>Toggle Large</button>
    </div>
  );
}

describe('useAccessibility', () => {
  beforeEach(() => {
    // Clear localStorage and document classes before each test
    localStorage.clear();
    document.documentElement.classList.remove('font-dyslexic', 'font-arimo', 'font-bold', 'font-xl');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('default values', () => {
    it('returns default values when localStorage is empty', () => {
      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      expect(screen.getByTestId('fontFamily')).toHaveTextContent('default');
      expect(screen.getByTestId('boldText')).toHaveTextContent('false');
      expect(screen.getByTestId('largeFont')).toHaveTextContent('false');
    });
  });

  describe('loading from localStorage', () => {
    it('loads fontFamily from localStorage', () => {
      localStorage.setItem('accessibility-font-family', 'dyslexic');

      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      expect(screen.getByTestId('fontFamily')).toHaveTextContent('dyslexic');
    });

    it('loads boldText from localStorage', () => {
      localStorage.setItem('accessibility-bold-text', 'true');

      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      expect(screen.getByTestId('boldText')).toHaveTextContent('true');
    });

    it('loads largeFont from localStorage', () => {
      localStorage.setItem('accessibility-large-font', 'true');

      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      expect(screen.getByTestId('largeFont')).toHaveTextContent('true');
    });
  });

  describe('invalid stored values', () => {
    it('falls back to default for invalid fontFamily', () => {
      localStorage.setItem('accessibility-font-family', 'invalid-font');

      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      expect(screen.getByTestId('fontFamily')).toHaveTextContent('default');
    });

    it('falls back to false for invalid boolean values', () => {
      localStorage.setItem('accessibility-bold-text', 'not-a-boolean');

      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      expect(screen.getByTestId('boldText')).toHaveTextContent('false');
    });
  });

  describe('setting values', () => {
    it('updates fontFamily and persists to localStorage', async () => {
      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      await act(async () => {
        screen.getByTestId('setDyslexic').click();
      });

      expect(screen.getByTestId('fontFamily')).toHaveTextContent('dyslexic');
      expect(localStorage.getItem('accessibility-font-family')).toBe('dyslexic');
    });

    it('removes fontFamily from localStorage when set to default', async () => {
      localStorage.setItem('accessibility-font-family', 'dyslexic');

      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      await act(async () => {
        screen.getByTestId('setDefault').click();
      });

      expect(screen.getByTestId('fontFamily')).toHaveTextContent('default');
      expect(localStorage.getItem('accessibility-font-family')).toBeNull();
    });

    it('updates boldText and persists to localStorage', async () => {
      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      await act(async () => {
        screen.getByTestId('toggleBold').click();
      });

      expect(screen.getByTestId('boldText')).toHaveTextContent('true');
      expect(localStorage.getItem('accessibility-bold-text')).toBe('true');
    });

    it('removes boldText from localStorage when disabled', async () => {
      localStorage.setItem('accessibility-bold-text', 'true');

      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      await act(async () => {
        screen.getByTestId('toggleBold').click();
      });

      expect(screen.getByTestId('boldText')).toHaveTextContent('false');
      expect(localStorage.getItem('accessibility-bold-text')).toBeNull();
    });

    it('updates largeFont and persists to localStorage', async () => {
      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      await act(async () => {
        screen.getByTestId('toggleLarge').click();
      });

      expect(screen.getByTestId('largeFont')).toHaveTextContent('true');
      expect(localStorage.getItem('accessibility-large-font')).toBe('true');
    });
  });

  describe('CSS class application', () => {
    it('adds font-dyslexic class when dyslexic font is selected', async () => {
      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      await act(async () => {
        screen.getByTestId('setDyslexic').click();
      });

      expect(document.documentElement.classList.contains('font-dyslexic')).toBe(true);
    });

    it('adds font-arimo class when arimo font is selected', async () => {
      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      await act(async () => {
        screen.getByTestId('setArimo').click();
      });

      expect(document.documentElement.classList.contains('font-arimo')).toBe(true);
    });

    it('removes font classes when default is selected', async () => {
      localStorage.setItem('accessibility-font-family', 'dyslexic');

      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      // Initial state should have dyslexic class
      expect(document.documentElement.classList.contains('font-dyslexic')).toBe(true);

      await act(async () => {
        screen.getByTestId('setDefault').click();
      });

      expect(document.documentElement.classList.contains('font-dyslexic')).toBe(false);
      expect(document.documentElement.classList.contains('font-arimo')).toBe(false);
    });

    it('adds font-bold class when bold is enabled', async () => {
      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      await act(async () => {
        screen.getByTestId('toggleBold').click();
      });

      expect(document.documentElement.classList.contains('font-bold')).toBe(true);
    });

    it('adds font-xl class when large font is enabled', async () => {
      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      await act(async () => {
        screen.getByTestId('toggleLarge').click();
      });

      expect(document.documentElement.classList.contains('font-xl')).toBe(true);
    });
  });

  describe('localStorage unavailable', () => {
    it('handles localStorage errors gracefully', async () => {
      // Mock localStorage to throw
      const originalGetItem = localStorage.getItem;
      const originalSetItem = localStorage.setItem;

      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('localStorage unavailable');
      });
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('localStorage unavailable');
      });

      // Should not throw, should use defaults
      render(
        <AccessibilityProvider>
          <TestComponent />
        </AccessibilityProvider>
      );

      expect(screen.getByTestId('fontFamily')).toHaveTextContent('default');
      expect(screen.getByTestId('boldText')).toHaveTextContent('false');

      // Setting values should not throw either
      await act(async () => {
        screen.getByTestId('setDyslexic').click();
      });

      // State should still update even if localStorage fails
      expect(screen.getByTestId('fontFamily')).toHaveTextContent('dyslexic');
    });
  });

  describe('hook usage outside provider', () => {
    it('throws error when used outside AccessibilityProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAccessibility must be used within an AccessibilityProvider');

      consoleSpy.mockRestore();
    });
  });
});
