import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DiscourseSyncDashboard } from './DiscourseSyncDashboard';
import type { VerifyResult } from '@/hooks/useDiscourseSyncStatus';
import { muiWrapper } from '@/test/utils';

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
  return ({ children }: { children: React.ReactNode }) =>
    muiWrapper({ children: <QueryClientProvider client={queryClient}>{children}</QueryClientProvider> });
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

  describe('Progress', () => {
    it('shows the synced share overall and per licence', () => {
      render(<DiscourseSyncDashboard />, { wrapper: createWrapper() });

      // 820 of 885 overall; 380 of 423 for Technician. MUI 9 reports the raw
      // value; a tolerance of half a point keeps this true if it ever rounds.
      const valueOf = (name: RegExp) =>
        Number(screen.getByRole('progressbar', { name }).getAttribute('aria-valuenow'));
      expect(valueOf(/synced share of all questions/i)).toBeCloseTo((820 / 885) * 100, 0);
      expect(valueOf(/technician synced share/i)).toBeCloseTo((380 / 423) * 100, 0);
    });
  });

  describe('Discrepancy lists', () => {
    const verifyWithEverything = () =>
      mockVerify.mutateAsync.mockResolvedValueOnce(
        createMockVerifyResult({
          action: 'repair',
          repaired: 1,
          orphanedInDiscourse: [
            { questionDisplayName: 'T1A05', topicId: 1, topicUrl: 'https://forum.example.com/t/1', action: 'repaired' },
            { questionDisplayName: 'T1A06', topicId: 2, topicUrl: 'https://forum.example.com/t/2', action: 'skipped' },
          ],
          brokenForumUrl: [
            { questionId: 'q7', questionDisplayName: 'T1A07', forumUrl: 'https://forum.example.com/t/7', error: '404 Not Found' },
          ],
          missingStatus: [
            { questionId: 'q8', questionDisplayName: 'T1A08', forumUrl: 'https://forum.example.com/t/8' },
          ],
        })
      );

    it('lists every kind of problem with its count', async () => {
      verifyWithEverything();
      render(<DiscourseSyncDashboard />, { wrapper: createWrapper() });

      fireEvent.click(screen.getByText('Verify Sync Status'));

      expect(await screen.findByRole('heading', { name: /topics in discourse without forum_url \(2\)/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /broken forum urls \(1\)/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /missing sync status \(1\)/i })).toBeInTheDocument();
      expect(screen.getByText('404 Not Found')).toBeInTheDocument();
      expect(screen.getByText('Repaired 1 items')).toBeInTheDocument();
      expect(screen.queryByText('All synced questions are in good shape!')).not.toBeInTheDocument();
    });

    it('marks what a repair did to each orphaned topic', async () => {
      verifyWithEverything();
      render(<DiscourseSyncDashboard />, { wrapper: createWrapper() });

      fireEvent.click(screen.getByText('Verify Sync Status'));

      expect(await screen.findByText('repaired')).toBeInTheDocument();
      expect(screen.getByText('skipped')).toBeInTheDocument();
    });

    it('names each topic link after its question', async () => {
      verifyWithEverything();
      render(<DiscourseSyncDashboard />, { wrapper: createWrapper() });

      fireEvent.click(screen.getByText('Verify Sync Status'));

      const link = await screen.findByRole('link', { name: 'View topic for T1A08' });
      expect(link).toHaveAttribute('href', 'https://forum.example.com/t/8');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      expect(screen.getAllByRole('link', { name: /view topic for/i })).toHaveLength(3);
    });
  });

  describe('Repair Confirmation Dialog', () => {
    it('is an alertdialog that says how much it will touch', async () => {
      mockVerify.mutateAsync.mockResolvedValueOnce(
        createMockVerifyResult({
          orphanedInDiscourse: [
            { questionDisplayName: 'T1A05', topicId: 1, topicUrl: 'https://forum.example.com/t/1' },
            { questionDisplayName: 'T1A06', topicId: 2, topicUrl: 'https://forum.example.com/t/2' },
          ],
          missingStatus: [{ questionId: 'q8', questionDisplayName: 'T1A08', forumUrl: 'https://forum.example.com/t/8' }],
        })
      );
      render(<DiscourseSyncDashboard />, { wrapper: createWrapper() });

      fireEvent.click(screen.getByText('Verify Sync Status'));
      await waitFor(() => expect(screen.getByText('Repair Missing URLs').closest('button')).not.toBeDisabled());
      fireEvent.click(screen.getByText('Repair Missing URLs'));

      const dialog = await screen.findByRole('alertdialog');
      expect(dialog).toHaveAccessibleName('Repair Discourse Sync?');
      expect(dialog).toHaveAccessibleDescription(/2 missing URLs will be repaired and 1 sync statuses will be updated/);
    });

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
