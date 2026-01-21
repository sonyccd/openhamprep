import { describe, it, expect, vi, beforeEach } from 'vitest';
import { safeGetItem, safeSetItem, safeRemoveItem } from './localStorage';

describe('localStorage utilities', () => {
  // Mock localStorage
  let mockStorage: Record<string, string> = {};
  const mockLocalStorage = {
    getItem: vi.fn((key: string) => mockStorage[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      mockStorage[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete mockStorage[key];
    }),
    clear: vi.fn(() => {
      mockStorage = {};
    }),
    length: 0,
    key: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockStorage = {};

    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
  });

  describe('safeGetItem', () => {
    it('returns stored value', () => {
      mockStorage['test-key'] = 'test-value';
      expect(safeGetItem('test-key')).toBe('test-value');
    });

    it('returns null for missing key', () => {
      expect(safeGetItem('missing-key')).toBeNull();
    });

    it('returns null when localStorage throws', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      expect(safeGetItem('test-key')).toBeNull();
    });
  });

  describe('safeSetItem', () => {
    it('stores value in localStorage', () => {
      safeSetItem('test-key', 'test-value');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('test-key', 'test-value');
    });

    it('handles errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });

      // Should not throw
      expect(() => safeSetItem('test-key', 'test-value')).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to save to localStorage:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('safeRemoveItem', () => {
    it('removes item from localStorage', () => {
      mockStorage['test-key'] = 'test-value';
      safeRemoveItem('test-key');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test-key');
    });

    it('handles errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      // Should not throw
      expect(() => safeRemoveItem('test-key')).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to remove from localStorage:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });
});
