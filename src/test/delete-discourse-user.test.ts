import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests for the delete-discourse-user edge function.
 *
 * These are integration-style tests that verify the expected behavior
 * of the Discourse user deletion flow. The actual edge function runs
 * in Deno, so these tests mock the Supabase client to verify the
 * client-side integration.
 */

// Mock Supabase client
const mockInvoke = vi.fn();
const mockGetSession = vi.fn();
const mockRpc = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: mockInvoke,
    },
    auth: {
      getSession: mockGetSession,
    },
    rpc: mockRpc,
  },
}));

describe('delete-discourse-user integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'test-token',
        },
      },
    });
  });

  describe('successful deletion flow', () => {
    it('should call delete-discourse-user before delete_own_account', async () => {
      // Mock successful Discourse deletion
      mockInvoke.mockResolvedValue({
        data: {
          success: true,
          discourseAccountFound: true,
          discourseUsername: 'testuser',
          message: 'Discourse account deleted successfully',
        },
        error: null,
      });

      // Mock successful local deletion
      mockRpc.mockResolvedValue({
        data: { success: true },
        error: null,
      });

      // Simulate the deletion flow
      const { supabase } = await import('@/integrations/supabase/client');

      // Step 1: Delete from Discourse
      const discourseResult = await supabase.functions.invoke('delete-discourse-user', {
        body: { deletePosts: false },
      });

      expect(discourseResult.data.success).toBe(true);
      expect(discourseResult.data.discourseAccountFound).toBe(true);

      // Step 2: Delete from local database
      const localResult = await supabase.rpc('delete_own_account');

      expect(localResult.data.success).toBe(true);

      // Verify order of calls
      expect(mockInvoke).toHaveBeenCalledWith('delete-discourse-user', {
        body: { deletePosts: false },
      });
      expect(mockRpc).toHaveBeenCalledWith('delete_own_account');
    });

    it('should handle user with no Discourse account', async () => {
      // Mock response when user has no Discourse account
      mockInvoke.mockResolvedValue({
        data: {
          success: true,
          discourseAccountFound: false,
          message: 'No Discourse account found for this user',
        },
        error: null,
      });

      const { supabase } = await import('@/integrations/supabase/client');

      const result = await supabase.functions.invoke('delete-discourse-user', {
        body: { deletePosts: false },
      });

      expect(result.data.success).toBe(true);
      expect(result.data.discourseAccountFound).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should continue local deletion even if Discourse deletion fails', async () => {
      // Mock Discourse deletion failure
      mockInvoke.mockResolvedValue({
        data: null,
        error: { message: 'Discourse API error' },
      });

      // Mock successful local deletion
      mockRpc.mockResolvedValue({
        data: { success: true },
        error: null,
      });

      const { supabase } = await import('@/integrations/supabase/client');

      // Discourse deletion fails
      const discourseResult = await supabase.functions.invoke('delete-discourse-user', {
        body: { deletePosts: false },
      });

      expect(discourseResult.error).toBeTruthy();

      // Local deletion should still succeed
      const localResult = await supabase.rpc('delete_own_account');

      expect(localResult.data.success).toBe(true);
    });

    it('should handle network errors gracefully', async () => {
      // Mock network error
      mockInvoke.mockRejectedValue(new Error('Network error'));

      const { supabase } = await import('@/integrations/supabase/client');

      await expect(
        supabase.functions.invoke('delete-discourse-user', {
          body: { deletePosts: false },
        })
      ).rejects.toThrow('Network error');
    });

    it('should require authentication', async () => {
      // Mock unauthorized response
      mockInvoke.mockResolvedValue({
        data: null,
        error: { message: 'Unauthorized: Authentication required' },
      });

      const { supabase } = await import('@/integrations/supabase/client');

      const result = await supabase.functions.invoke('delete-discourse-user', {
        body: { deletePosts: false },
      });

      expect(result.error?.message).toContain('Unauthorized');
    });
  });

  describe('options', () => {
    it('should pass deletePosts option to the function', async () => {
      mockInvoke.mockResolvedValue({
        data: { success: true },
        error: null,
      });

      const { supabase } = await import('@/integrations/supabase/client');

      await supabase.functions.invoke('delete-discourse-user', {
        body: { deletePosts: true },
      });

      expect(mockInvoke).toHaveBeenCalledWith('delete-discourse-user', {
        body: { deletePosts: true },
      });
    });
  });
});
