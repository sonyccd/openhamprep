import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useUploadTopicImage } from './useTopicContentEditor';

const mockUpload = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    storage: {
      from: () => ({
        upload: (...args: unknown[]) => mockUpload(...args),
        getPublicUrl: () => ({ data: { publicUrl: 'https://example.com/i.png' } }),
      }),
    },
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(QueryClientProvider, { client: new QueryClient({ defaultOptions: { queries: { retry: false } } }) }, children);

const uploadedPath = async (name: string, type = 'image/png') => {
  const { result } = renderHook(() => useUploadTopicImage(), { wrapper });
  result.current.mutate(new File(['x'], name, { type }));
  await waitFor(() => expect(mockUpload).toHaveBeenCalled());
  return mockUpload.mock.calls[0][0] as string;
};

describe('useUploadTopicImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpload.mockResolvedValue({ error: null });
  });

  it('keeps the file extension', async () => {
    expect(await uploadedPath('antenna.PNG')).toMatch(/^topic-images\/[0-9a-f-]+\.PNG$/);
  });

  it('keeps only the last extension of a multi-dot name', async () => {
    expect(await uploadedPath('my.antenna.diagram.png')).toMatch(/\.png$/);
  });

  /** A name with no dot must not produce "<uuid>.undefined". */
  it('adds no extension when the name has none', async () => {
    const path = await uploadedPath('antenna');
    expect(path).toMatch(/^topic-images\/[0-9a-f-]+$/);
    expect(path).not.toContain('undefined');
  });
});
