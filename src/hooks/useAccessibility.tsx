import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Storage keys for localStorage persistence
const STORAGE_KEY_FONT = 'accessibility-font-family';
const STORAGE_KEY_BOLD = 'accessibility-bold-text';
const STORAGE_KEY_LARGE = 'accessibility-large-font';

export type FontFamily = 'default' | 'dyslexic' | 'arimo';

interface AccessibilityContextType {
  fontFamily: FontFamily;
  setFontFamily: (font: FontFamily) => void;
  boldText: boolean;
  setBoldText: (enabled: boolean) => void;
  largeFont: boolean;
  setLargeFont: (enabled: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

// Helper to safely get localStorage value
function getStoredValue<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const stored = localStorage.getItem(key);
    if (stored === null) return defaultValue;
    if (typeof defaultValue === 'boolean') {
      return (stored === 'true') as T;
    }
    return stored as T;
  } catch {
    return defaultValue;
  }
}

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  // Initialize state from localStorage
  const [fontFamily, setFontFamilyState] = useState<FontFamily>(() =>
    getStoredValue(STORAGE_KEY_FONT, 'default') as FontFamily
  );
  const [boldText, setBoldTextState] = useState(() =>
    getStoredValue(STORAGE_KEY_BOLD, false)
  );
  const [largeFont, setLargeFontState] = useState(() =>
    getStoredValue(STORAGE_KEY_LARGE, false)
  );

  // Apply font family class to document
  useEffect(() => {
    const root = document.documentElement;
    // Remove all font classes first
    root.classList.remove('font-dyslexic', 'font-arimo');
    // Add the appropriate class
    if (fontFamily === 'dyslexic') {
      root.classList.add('font-dyslexic');
    } else if (fontFamily === 'arimo') {
      root.classList.add('font-arimo');
    }
  }, [fontFamily]);

  // Apply bold text class
  useEffect(() => {
    const root = document.documentElement;
    if (boldText) {
      root.classList.add('font-bold');
    } else {
      root.classList.remove('font-bold');
    }
  }, [boldText]);

  // Apply large font class
  useEffect(() => {
    const root = document.documentElement;
    if (largeFont) {
      root.classList.add('font-xl');
    } else {
      root.classList.remove('font-xl');
    }
  }, [largeFont]);

  // Setters that persist to localStorage
  const setFontFamily = (font: FontFamily) => {
    setFontFamilyState(font);
    try {
      if (font === 'default') {
        localStorage.removeItem(STORAGE_KEY_FONT);
      } else {
        localStorage.setItem(STORAGE_KEY_FONT, font);
      }
    } catch {
      // localStorage may be unavailable
    }
  };

  const setBoldText = (enabled: boolean) => {
    setBoldTextState(enabled);
    try {
      if (enabled) {
        localStorage.setItem(STORAGE_KEY_BOLD, 'true');
      } else {
        localStorage.removeItem(STORAGE_KEY_BOLD);
      }
    } catch {
      // localStorage may be unavailable
    }
  };

  const setLargeFont = (enabled: boolean) => {
    setLargeFontState(enabled);
    try {
      if (enabled) {
        localStorage.setItem(STORAGE_KEY_LARGE, 'true');
      } else {
        localStorage.removeItem(STORAGE_KEY_LARGE);
      }
    } catch {
      // localStorage may be unavailable
    }
  };

  return (
    <AccessibilityContext.Provider value={{
      fontFamily,
      setFontFamily,
      boldText,
      setBoldText,
      largeFont,
      setLargeFont,
    }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}
