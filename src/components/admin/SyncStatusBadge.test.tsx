import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SyncStatusBadge } from './SyncStatusBadge';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('SyncStatusBadge', () => {
  const defaultProps = {
    status: 'synced' as const,
    syncAt: '2024-01-15T10:30:00Z',
    error: null,
    questionId: 'T1A01',
    forumUrl: 'https://forum.openhamprep.com/t/t1a01-question/123',
    onRetrySync: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render "Synced" badge when status is synced', () => {
      render(<SyncStatusBadge {...defaultProps} status="synced" />);
      expect(screen.getByText('Synced')).toBeInTheDocument();
    });

    it('should render "Sync Error" badge when status is error', () => {
      render(<SyncStatusBadge {...defaultProps} status="error" />);
      expect(screen.getByText('Sync Error')).toBeInTheDocument();
    });

    it('should render "Pending" badge when status is pending', () => {
      render(<SyncStatusBadge {...defaultProps} status="pending" />);
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('should render "Unverified" badge when status is null but forumUrl exists', () => {
      render(<SyncStatusBadge {...defaultProps} status={null} />);
      expect(screen.getByText('Unverified')).toBeInTheDocument();
    });

    it('should render "Unverified" badge when status is undefined but forumUrl exists', () => {
      render(<SyncStatusBadge {...defaultProps} status={undefined} />);
      expect(screen.getByText('Unverified')).toBeInTheDocument();
    });

    it('should not render when status is null and forumUrl is empty', () => {
      const { container } = render(<SyncStatusBadge {...defaultProps} status={null} forumUrl="" />);
      expect(container.firstChild).toBeNull();
    });

    it('should not render when status is undefined and forumUrl is empty', () => {
      const { container } = render(<SyncStatusBadge {...defaultProps} status={undefined} forumUrl="" />);
      expect(container.firstChild).toBeNull();
    });

    it('should have green styling when synced', () => {
      render(<SyncStatusBadge {...defaultProps} status="synced" />);
      const badge = screen.getByText('Synced').closest('div');
      expect(badge).toHaveClass('bg-success/20');
      expect(badge).toHaveClass('text-success');
    });

    it('should have red styling when error', () => {
      render(<SyncStatusBadge {...defaultProps} status="error" />);
      const badge = screen.getByText('Sync Error').closest('div');
      expect(badge).toHaveClass('bg-destructive/20');
      expect(badge).toHaveClass('text-destructive');
    });

    it('should have muted styling when pending', () => {
      render(<SyncStatusBadge {...defaultProps} status="pending" />);
      const badge = screen.getByText('Pending').closest('div');
      expect(badge).toHaveClass('bg-muted');
      expect(badge).toHaveClass('text-muted-foreground');
    });

    it('should have amber styling when unverified', () => {
      render(<SyncStatusBadge {...defaultProps} status={null} />);
      const badge = screen.getByText('Unverified').closest('div');
      expect(badge).toHaveClass('bg-amber-500/20');
      expect(badge).toHaveClass('text-amber-600');
    });
  });

  describe('Modal Interaction', () => {
    it('should open modal when badge is clicked', async () => {
      render(<SyncStatusBadge {...defaultProps} />);

      const badge = screen.getByText('Synced');
      fireEvent.click(badge);

      await waitFor(() => {
        expect(screen.getByText('Discourse Sync Status')).toBeInTheDocument();
      });
    });

    it('should display question ID in modal', async () => {
      render(<SyncStatusBadge {...defaultProps} />);

      fireEvent.click(screen.getByText('Synced'));

      await waitFor(() => {
        expect(screen.getByText('T1A01')).toBeInTheDocument();
      });
    });

    it('should display forum URL link in modal', async () => {
      render(<SyncStatusBadge {...defaultProps} />);

      fireEvent.click(screen.getByText('Synced'));

      await waitFor(() => {
        const link = screen.getByText('Open in Forum');
        expect(link.closest('a')).toHaveAttribute(
          'href',
          'https://forum.openhamprep.com/t/t1a01-question/123'
        );
      });
    });

    it('should display formatted sync timestamp in modal', async () => {
      render(<SyncStatusBadge {...defaultProps} syncAt="2024-01-15T10:30:00Z" />);

      fireEvent.click(screen.getByText('Synced'));

      await waitFor(() => {
        // date-fns format: "MMM d, yyyy h:mm a"
        expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
      });
    });

    it('should display error message when status is error', async () => {
      const errorMessage = 'Discourse API error: 502';
      render(
        <SyncStatusBadge
          {...defaultProps}
          status="error"
          error={errorMessage}
        />
      );

      fireEvent.click(screen.getByText('Sync Error'));

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should not display error section when no error', async () => {
      render(<SyncStatusBadge {...defaultProps} status="synced" error={null} />);

      fireEvent.click(screen.getByText('Synced'));

      await waitFor(() => {
        expect(screen.getByText('Discourse Sync Status')).toBeInTheDocument();
      });

      // Error section should not be present
      expect(screen.queryByText('Error')).not.toBeInTheDocument();
    });

    it('should display Retry Sync button in modal', async () => {
      render(<SyncStatusBadge {...defaultProps} />);

      fireEvent.click(screen.getByText('Synced'));

      await waitFor(() => {
        expect(screen.getByText('Retry Sync')).toBeInTheDocument();
      });
    });
  });

  describe('Retry Sync Functionality', () => {
    it('should call onRetrySync when retry button is clicked', async () => {
      const onRetrySync = vi.fn().mockResolvedValue(undefined);
      render(<SyncStatusBadge {...defaultProps} onRetrySync={onRetrySync} />);

      fireEvent.click(screen.getByText('Synced'));

      await waitFor(() => {
        expect(screen.getByText('Retry Sync')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Retry Sync'));

      await waitFor(() => {
        expect(onRetrySync).toHaveBeenCalledTimes(1);
      });
    });

    it('should show loading state while syncing', async () => {
      // Create a promise that we can control
      let resolveSync: () => void;
      const syncPromise = new Promise<void>((resolve) => {
        resolveSync = resolve;
      });
      const onRetrySync = vi.fn().mockReturnValue(syncPromise);

      render(<SyncStatusBadge {...defaultProps} onRetrySync={onRetrySync} />);

      fireEvent.click(screen.getByText('Synced'));

      await waitFor(() => {
        expect(screen.getByText('Retry Sync')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Retry Sync'));

      await waitFor(() => {
        expect(screen.getByText('Syncing...')).toBeInTheDocument();
      });

      // Resolve the promise to complete the sync
      resolveSync!();
    });

    it('should disable retry button while syncing', async () => {
      let resolveSync: () => void;
      const syncPromise = new Promise<void>((resolve) => {
        resolveSync = resolve;
      });
      const onRetrySync = vi.fn().mockReturnValue(syncPromise);

      render(<SyncStatusBadge {...defaultProps} onRetrySync={onRetrySync} />);

      fireEvent.click(screen.getByText('Synced'));

      await waitFor(() => {
        expect(screen.getByText('Retry Sync')).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /retry sync/i });
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(retryButton).toBeDisabled();
      });

      resolveSync!();
    });

    it('should close modal after successful sync', async () => {
      const onRetrySync = vi.fn().mockResolvedValue(undefined);
      render(<SyncStatusBadge {...defaultProps} onRetrySync={onRetrySync} />);

      fireEvent.click(screen.getByText('Synced'));

      await waitFor(() => {
        expect(screen.getByText('Discourse Sync Status')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Retry Sync'));

      await waitFor(() => {
        expect(screen.queryByText('Discourse Sync Status')).not.toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing syncAt gracefully', async () => {
      render(<SyncStatusBadge {...defaultProps} syncAt={null} />);

      fireEvent.click(screen.getByText('Synced'));

      await waitFor(() => {
        expect(screen.getByText('Discourse Sync Status')).toBeInTheDocument();
      });

      // Should not show "Last Sync" row when syncAt is null
      expect(screen.queryByText('Last Sync')).not.toBeInTheDocument();
    });

    it('should handle long error messages', async () => {
      const longError = 'This is a very long error message that could potentially overflow the modal container and should be handled gracefully by the component with proper text wrapping or truncation';
      render(
        <SyncStatusBadge
          {...defaultProps}
          status="error"
          error={longError}
        />
      );

      fireEvent.click(screen.getByText('Sync Error'));

      await waitFor(() => {
        expect(screen.getByText(longError)).toBeInTheDocument();
      });
    });

    it('should handle special characters in forumUrl', async () => {
      const specialUrl = 'https://forum.openhamprep.com/t/question-with-λ-symbol/123';
      render(<SyncStatusBadge {...defaultProps} forumUrl={specialUrl} />);

      fireEvent.click(screen.getByText('Synced'));

      await waitFor(() => {
        const link = screen.getByText('Open in Forum').closest('a');
        expect(link).toHaveAttribute('href', specialUrl);
      });
    });

    it('should open forum link in new tab', async () => {
      render(<SyncStatusBadge {...defaultProps} />);

      fireEvent.click(screen.getByText('Synced'));

      await waitFor(() => {
        const link = screen.getByText('Open in Forum').closest('a');
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have cursor-pointer class for clickable badge', () => {
      render(<SyncStatusBadge {...defaultProps} />);
      const badge = screen.getByText('Synced').closest('div');
      expect(badge).toHaveClass('cursor-pointer');
    });

    it('should have proper dialog role for modal', async () => {
      render(<SyncStatusBadge {...defaultProps} />);

      fireEvent.click(screen.getByText('Synced'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });
});
