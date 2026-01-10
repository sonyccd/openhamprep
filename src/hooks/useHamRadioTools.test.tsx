import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import {
  useHamRadioToolCategories,
  useHamRadioTools,
  useAdminHamRadioTools,
  getToolImageUrl,
  HamRadioTool,
  HamRadioToolCategory,
} from './useHamRadioTools';

// Mock Supabase client
const mockFrom = vi.fn();
const mockGetPublicUrl = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    storage: {
      from: vi.fn(() => ({
        getPublicUrl: mockGetPublicUrl,
      })),
    },
  },
}));

// Import mocked supabase for getToolImageUrl tests
import { supabase } from '@/integrations/supabase/client';

// Sample test data
const mockCategories: HamRadioToolCategory[] = [
  {
    id: 'cat-1',
    name: 'Digital Modes',
    slug: 'digital-modes',
    description: 'Software for FT8, JS8Call, RTTY',
    display_order: 1,
    icon_name: 'Radio',
  },
  {
    id: 'cat-2',
    name: 'Logging',
    slug: 'logging',
    description: 'Station logging software',
    display_order: 2,
    icon_name: 'ClipboardList',
  },
];

const mockTools: HamRadioTool[] = [
  {
    id: 'tool-1',
    title: 'WSJT-X',
    description: 'Weak signal communication software supporting FT8, FT4, JT65',
    url: 'https://wsjt.sourceforge.io/',
    image_url: null,
    storage_path: 'tool-1.png',
    is_published: true,
    display_order: 1,
    category: mockCategories[0],
    edit_history: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'tool-2',
    title: 'Log4OM',
    description: 'Free logging software with DX cluster integration',
    url: 'https://www.log4om.com/',
    image_url: 'https://example.com/log4om.png',
    storage_path: null,
    is_published: true,
    display_order: 1,
    category: mockCategories[1],
    edit_history: [],
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
  {
    id: 'tool-3',
    title: 'Unpublished Tool',
    description: 'This tool is not published yet',
    url: 'https://example.com/unpublished',
    image_url: null,
    storage_path: null,
    is_published: false,
    display_order: 3,
    category: null,
    edit_history: [],
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
  },
];

describe('useHamRadioTools Hooks', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  describe('useHamRadioToolCategories', () => {
    it('should fetch all categories ordered by display_order', async () => {
      mockFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockCategories,
            error: null,
          }),
        }),
      }));

      const { result } = renderHook(() => useHamRadioToolCategories(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.[0].name).toBe('Digital Modes');
      expect(result.current.data?.[1].name).toBe('Logging');
    });

    it('should handle errors gracefully', async () => {
      mockFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      }));

      const { result } = renderHook(() => useHamRadioToolCategories(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useHamRadioTools', () => {
    it('should fetch only published tools', async () => {
      mockFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockTools.filter(t => t.is_published),
              error: null,
            }),
          }),
        }),
      }));

      const { result } = renderHook(() => useHamRadioTools(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.every(t => t.is_published)).toBe(true);
    });

    it('should include category data', async () => {
      mockFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockTools.filter(t => t.is_published),
              error: null,
            }),
          }),
        }),
      }));

      const { result } = renderHook(() => useHamRadioTools(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.[0].category?.name).toBe('Digital Modes');
    });

    it('should handle errors gracefully', async () => {
      mockFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      }));

      const { result } = renderHook(() => useHamRadioTools(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useAdminHamRadioTools', () => {
    it('should fetch all tools including unpublished', async () => {
      mockFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockTools,
            error: null,
          }),
        }),
      }));

      const { result } = renderHook(() => useAdminHamRadioTools(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(3);
      expect(result.current.data?.some(t => !t.is_published)).toBe(true);
    });
  });

  describe('getToolImageUrl', () => {
    it('should return storage URL when storage_path is set', () => {
      const mockPublicUrl = 'https://storage.example.com/ham-radio-tools/tool-1.png';
      mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: mockPublicUrl },
      });

      const tool: HamRadioTool = {
        ...mockTools[0],
        storage_path: 'tool-1.png',
        image_url: null,
      };

      const result = getToolImageUrl(tool);

      expect(result).toBe(mockPublicUrl);
    });

    it('should return image_url when storage_path is null', () => {
      const tool: HamRadioTool = {
        ...mockTools[1],
        storage_path: null,
        image_url: 'https://example.com/image.png',
      };

      const result = getToolImageUrl(tool);

      expect(result).toBe('https://example.com/image.png');
    });

    it('should return null when both storage_path and image_url are null', () => {
      const tool: HamRadioTool = {
        ...mockTools[2],
        storage_path: null,
        image_url: null,
      };

      const result = getToolImageUrl(tool);

      expect(result).toBeNull();
    });

    it('should prioritize storage_path over image_url', () => {
      const mockPublicUrl = 'https://storage.example.com/ham-radio-tools/tool.png';
      mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: mockPublicUrl },
      });

      const tool: HamRadioTool = {
        ...mockTools[0],
        storage_path: 'tool.png',
        image_url: 'https://example.com/fallback.png',
      };

      const result = getToolImageUrl(tool);

      expect(result).toBe(mockPublicUrl);
    });
  });
});
