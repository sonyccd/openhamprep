import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DiscourseSyncDashboard } from './DiscourseSyncDashboard';
import type { VerifyResult } from '@/hooks/useDiscourseSyncStatus';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// =============================================================================
// TEST FACTORIES
// =============================================================================

/**
 * Factory for creating mock VerifyResult objects
 * Reduces verbosity in tests by providing sensible defaults
 */
function createMockVerifyResult(overrides?: {
  action?: 'verify' | 'repair';
  orphanedInDiscourse?: VerifyResult['discrepancies']['orphanedInDiscourse'];
  brokenForumUrl?: VerifyResult['discrepancies']['brokenForumUrl'];
  missingStatus?: VerifyResult['discrepancies']['missingStatus'];
  repaired?: number;
}): VerifyResult {
  return {
    success: true,
    action: overrides?.action || 'verify',
    summary: {
      totalQuestionsInDb: 885,
      totalTopicsInDiscourse: 850,
      questionsWithForumUrl: 850,
      questionsWithoutForumUrl: 35,
      syncedCorrectly: 820,
    },
    discrepancies: {
      orphanedInDiscourse: overrides?.orphanedInDiscourse || [],
      brokenForumUrl: overrides?.brokenForumUrl || [],
      missingStatus: overrides?.missingStatus || [],
    },
    ...(overrides?.repaired !== undefined && { repaired: overrides.repaired }),
  };
}

// =============================================================================
// MOCKS
// =============================================================================

const mockVerify = {
  mutateAsync: vi.fn(),
  isPending: false,
};
const mockRepair = {
  mutateAsync: vi.fn(),
  isPending: false,
};
const mockRefreshOverview = vi.fn();

vi.mock('@/hooks/useDiscourseSyncStatus', () => ({
  useDiscourseSyncStatus: vi.fn(() => ({
    overview: [
      {
        license_type: 'Technician',
        total_questions: 423,
        with_forum_url: 400,
        without_forum_url: 23,
        synced: 380,
        errors: 5,
        pending: 10,
        needs_verification: 5,
      },
      {
        license_type: 'General',
        total_questions: 462,
        with_forum_url: 450,
        without_forum_url: 12,
        synced: 440,
        errors: 2,
        pending: 5,
        needs_verification: 3,
      },
    ],
    totals: {
      totalQuestions: 885,
      withForumUrl: 850,
      withoutForumUrl: 35,
      synced: 820,
      errors: 7,
      pending: 15,
      needsVerification: 8,
    },
    isLoading: false,
    isError: false,
    error: null,
    verify: mockVerify,
    repair: mockRepair,
    refreshOverview: mockRefreshOverview,
  })),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('DiscourseSyncDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Overview Cards', () => {
    it('displays total questions count', () => {
      render(<DiscourseSyncDashboard />, { wrapper: createWrapper() });

      expect(screen.getByText('885')).toBeInTheDocument();
      expect(screen.getByText('Total Questions')).toBeInTheDocument();
    });

    it('displays questions with forum topics count', () => {
      render(<DiscourseSyncDashboard />, { wrapper: createWrapper() });

      expect(screen.getByText('850')).toBeInTheDocument();
      expect(screen.getByText('With Forum Topics')).toBeInTheDocument();
    });

    it('displays synced successfully count', () => {
      render(<DiscourseSyncDashboard />, { wrapper: createWrapper() });

      expect(screen.getByText('820')).toBeInTheDocument();
      expect(screen.getByText('Synced Successfully')).toBeInTheDocument();
    });

    it('displays issues (errors and unverified)', () => {
      render(<DiscourseSyncDashboard />, { wrapper: createWrapper() });

      expect(screen.getByText('7')).toBeInTheDocument(); // errors
      expect(screen.getByText('8')).toBeInTheDocument(); // unverified
      expect(screen.getByText('Issues')).toBeInTheDocument();
    });
  });

  describe('License Type Breakdown', () => {
    it('displays Sync Status by License Type section', () => {
      render(<DiscourseSyncDashboard />, { wrapper: createWrapper() });

      expect(screen.getByText('Sync Status by License Type')).toBeInTheDocument();
    });

    it('displays Technician license row', () => {
      render(<DiscourseSyncDashboard />, { wrapper: createWrapper() });

      expect(screen.getByText('Technician')).toBeInTheDocument();
      expect(screen.getByText('423 questions')).toBeInTheDocument();
    });

    it('displays General license row', () => {
      render(<DiscourseSyncDashboard />, { wrapper: createWrapper() });

      expect(screen.getByText('General')).toBeInTheDocument();
      expect(screen.getByText('462 questions')).toBeInTheDocument();
    });

    it('displays synced count per license', () => {
      render(<DiscourseSyncDashboard />, { wrapper: createWrapper() });

      // Check for synced counts (380 for Technician, 440 for General)
      expect(screen.getByText('380')).toBeInTheDocument();
      expect(screen.getByText('440')).toBeInTheDocument();
    });
  });

  describe('Sync Actions', () => {
    it('displays Verify Sync Status button', () => {
      render(<DiscourseSyncDashboard />, { wrapper: createWrapper() });

      expect(screen.getByText('Verify Sync Status')).toBeInTheDocument();
    });

    it('displays Repair Missing URLs button (initially disabled)', () => {
      render(<DiscourseSyncDashboard />, { wrapper: createWrapper() });

      const repairButton = screen.getByText('Repair Missing URLs').closest('button');
      expect(repairButton).toBeDisabled();
    });

    it('displays Refresh button', () => {
      render(<DiscourseSyncDashboard />, { wrapper: createWrapper() });

      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    it('calls verify mutation when Verify button is clicked', async () => {
      mockVerify.mutateAsync.mockResolvedValueOnce(createMockVerifyResult());

      render(<DiscourseSyncDashboard />, { wrapper: createWrapper() });

      const verifyButton = screen.getByText('Verify Sync Status');
      fireEvent.click(verifyButton);

      await waitFor(() => {
        expect(mockVerify.mutateAsync).toHaveBeenCalled();
      });
    });

    it('calls refreshOverview when Refresh button is clicked', () => {
      render(<DiscourseSyncDashboard />, { wrapper: createWrapper() });

      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);

      expect(mockRefreshOverview).toHaveBeenCalled();
    });
  });

  describe('Verification Results', () => {
    it('displays verification results after verify is called', async () => {
      mockVerify.mutateAsync.mockResolvedValueOnce(createMockVerifyResult());

      render(<DiscourseSyncDashboard />, { wrapper: createWrapper() });

      const verifyButton = screen.getByText('Verify Sync Status');
      fireEvent.click(verifyButton);

      await waitFor(() => {
        expect(screen.getByText('Verification Results')).toBeInTheDocument();
      });
    });

    it('displays success message when no discrepancies', async () => {
      mockVerify.mutateAsync.mockResolvedValueOnce(createMockVerifyResult());

      render(<DiscourseSyncDashboard />, { wrapper: createWrapper() });

      fireEvent.click(screen.getByText('Verify Sync Status'));

      await waitFor(() => {
        expect(screen.getByText('All synced questions are in good shape!')).toBeInTheDocument();
      });
    });

    it('displays orphaned in Discourse section when discrepancies exist', async () => {
      mockVerify.mutateAsync.mockResolvedValueOnce(createMockVerifyResult({
        orphanedInDiscourse: [
          {
            questionDisplayName: 'T1A05',
            topicId: 123,
            topicUrl: 'https://forum.example.com/t/t1a05/123',
          },
        ],
      }));

      render(<DiscourseSyncDashboard />, { wrapper: createWrapper() });

      fireEvent.click(screen.getByText('Verify Sync Status'));

      await waitFor(() => {
        expect(screen.getByText(/Topics in Discourse without forum_url/)).toBeInTheDocument();
        expect(screen.getByText('T1A05')).toBeInTheDocument();
      });
    });

    it('enables repair button when discrepancies exist', async () => {
      mockVerify.mutateAsync.mockResolvedValueOnce(createMockVerifyResult({
        orphanedInDiscourse: [
          {
            questionDisplayName: 'T1A05',
            topicId: 123,
            topicUrl: 'https://forum.example.com/t/t1a05/123',
          },
        ],
      }));

      render(<DiscourseSyncDashboard />, { wrapper: createWrapper() });

      fireEvent.click(screen.getByText('Verify Sync Status'));

      await waitFor(() => {
        const repairButton = screen.getByText('Repair Missing URLs').closest('button');
        expect(repairButton).not.toBeDisabled();
      });
    });
  });

  describe('Repair Confirmation Dialog', () => {
    it('shows confirmation dialog when repair button is clicked', async () => {
      mockVerify.mutateAsync.mockResolvedValueOnce({
        success: true,
        action: 'verify',
        summary: {
          totalQuestionsInDb: 885,
          totalTopicsInDiscourse: 850,
          questionsWithForumUrl: 850,
          questionsWithoutForumUrl: 35,
          syncedCorrectly: 820,
        },
        discrepancies: {
          orphanedInDiscourse: [
            {
              questionDisplayName: 'T1A05',
              topicId: 123,
              topicUrl: 'https://forum.example.com/t/t1a05/123',
            },
          ],
          brokenForumUrl: [],
          missingStatus: [
            {
              questionId: 'uuid-t1a06',
              questionDisplayName: 'T1A06',
              forumUrl: 'https://forum.example.com/t/t1a06/124',
            },
          ],
        },
      });

      render(<DiscourseSyncDashboard />, { wrapper: createWrapper() });

      fireEvent.click(screen.getByText('Verify Sync Status'));

      await waitFor(() => {
        expect(screen.getByText('Repair Missing URLs').closest('button')).not.toBeDisabled();
      });

      fireEvent.click(screen.getByText('Repair Missing URLs'));

      await waitFor(() => {
        expect(screen.getByText('Repair Discourse Sync?')).toBeInTheDocument();
      });
    });

    it('calls repair mutation when confirmed', async () => {
      mockVerify.mutateAsync.mockResolvedValueOnce({
        success: true,
        action: 'verify',
        summary: {
          totalQuestionsInDb: 885,
          totalTopicsInDiscourse: 850,
          questionsWithForumUrl: 850,
          questionsWithoutForumUrl: 35,
          syncedCorrectly: 820,
        },
        discrepancies: {
          orphanedInDiscourse: [
            {
              questionDisplayName: 'T1A05',
              topicId: 123,
              topicUrl: 'https://forum.example.com/t/t1a05/123',
            },
          ],
          brokenForumUrl: [],
          missingStatus: [],
        },
      });

      mockRepair.mutateAsync.mockResolvedValueOnce({
        success: true,
        action: 'repair',
        summary: {
          totalQuestionsInDb: 885,
          totalTopicsInDiscourse: 850,
          questionsWithForumUrl: 851,
          questionsWithoutForumUrl: 34,
          syncedCorrectly: 821,
        },
        discrepancies: {
          orphanedInDiscourse: [],
          brokenForumUrl: [],
          missingStatus: [],
        },
        repaired: 1,
      });

      render(<DiscourseSyncDashboard />, { wrapper: createWrapper() });

      fireEvent.click(screen.getByText('Verify Sync Status'));

      await waitFor(() => {
        expect(screen.getByText('Repair Missing URLs').closest('button')).not.toBeDisabled();
      });

      fireEvent.click(screen.getByText('Repair Missing URLs'));

      await waitFor(() => {
        expect(screen.getByText('Repair Discourse Sync?')).toBeInTheDocument();
      });

      // Click the Repair button in the dialog
      const dialogRepairButton = screen.getByRole('button', { name: /^Repair$/i });
      fireEvent.click(dialogRepairButton);

      await waitFor(() => {
        expect(mockRepair.mutateAsync).toHaveBeenCalled();
      });
    });
  });

  describe('Repaired Items Display', () => {
    it('shows repaired count after repair action', async () => {
      mockVerify.mutateAsync.mockResolvedValueOnce({
        success: true,
        action: 'verify',
        summary: {
          totalQuestionsInDb: 885,
          totalTopicsInDiscourse: 850,
          questionsWithForumUrl: 850,
          questionsWithoutForumUrl: 35,
          syncedCorrectly: 820,
        },
        discrepancies: {
          orphanedInDiscourse: [
            {
              questionDisplayName: 'T1A05',
              topicId: 123,
              topicUrl: 'https://forum.example.com/t/t1a05/123',
            },
          ],
          brokenForumUrl: [],
          missingStatus: [],
        },
      });

      mockRepair.mutateAsync.mockResolvedValueOnce({
        success: true,
        action: 'repair',
        summary: {
          totalQuestionsInDb: 885,
          totalTopicsInDiscourse: 850,
          questionsWithForumUrl: 851,
          questionsWithoutForumUrl: 34,
          syncedCorrectly: 821,
        },
        discrepancies: {
          orphanedInDiscourse: [
            {
              questionDisplayName: 'T1A05',
              topicId: 123,
              topicUrl: 'https://forum.example.com/t/t1a05/123',
              action: 'repaired',
            },
          ],
          brokenForumUrl: [],
          missingStatus: [],
        },
        repaired: 1,
      });

      render(<DiscourseSyncDashboard />, { wrapper: createWrapper() });

      // First verify
      fireEvent.click(screen.getByText('Verify Sync Status'));
      await waitFor(() => {
        expect(screen.getByText('Repair Missing URLs').closest('button')).not.toBeDisabled();
      });

      // Then repair
      fireEvent.click(screen.getByText('Repair Missing URLs'));
      await waitFor(() => {
        expect(screen.getByText('Repair Discourse Sync?')).toBeInTheDocument();
      });

      const dialogRepairButton = screen.getByRole('button', { name: /^Repair$/i });
      fireEvent.click(dialogRepairButton);

      await waitFor(() => {
        expect(screen.getByText('Repaired 1 items')).toBeInTheDocument();
      });
    });
  });
});
