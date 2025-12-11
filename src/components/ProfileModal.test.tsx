import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfileModal } from './ProfileModal';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Mock react-router-dom's useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock supabase client - use vi.hoisted to ensure mocks are available
const { mockRpc, mockSignOut } = vi.hoisted(() => ({
  mockRpc: vi.fn(),
  mockSignOut: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
    auth: {
      updateUser: vi.fn(() => Promise.resolve({ error: null })),
      resetPasswordForEmail: vi.fn(() => Promise.resolve({ error: null })),
      signOut: mockSignOut,
    },
    rpc: mockRpc,
  },
}));

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  userInfo: {
    displayName: 'Test User',
    email: 'test@example.com',
  },
  userId: 'test-user-id',
  onProfileUpdate: vi.fn(),
};

const renderProfileModal = (props = {}) => {
  return render(
    <BrowserRouter>
      <ProfileModal {...defaultProps} {...props} />
    </BrowserRouter>
  );
};

describe('ProfileModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignOut.mockResolvedValue({ error: null });
  });

  describe('Account Deletion', () => {
    it('shows delete confirmation when Delete Account is clicked', async () => {
      const user = userEvent.setup();
      renderProfileModal();

      const deleteButton = screen.getByRole('button', { name: /delete account/i });
      await user.click(deleteButton);

      expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('DELETE')).toBeInTheDocument();
    });

    it('requires typing DELETE to confirm deletion', async () => {
      const user = userEvent.setup();
      renderProfileModal();

      // Open delete confirmation
      await user.click(screen.getByRole('button', { name: /delete account/i }));

      // Try to delete without typing DELETE
      const deleteForeverButton = screen.getByRole('button', { name: /delete forever/i });
      expect(deleteForeverButton).toBeDisabled();

      // Type partial text
      const confirmInput = screen.getByPlaceholderText('DELETE');
      await user.type(confirmInput, 'DEL');
      expect(deleteForeverButton).toBeDisabled();

      // Type correct text
      await user.clear(confirmInput);
      await user.type(confirmInput, 'DELETE');
      expect(deleteForeverButton).not.toBeDisabled();
    });

    it('calls RPC delete_own_account when confirmed', async () => {
      const user = userEvent.setup();
      mockRpc.mockResolvedValue({ data: { success: true }, error: null });

      renderProfileModal();

      // Open delete confirmation
      await user.click(screen.getByRole('button', { name: /delete account/i }));

      // Type DELETE and confirm
      const confirmInput = screen.getByPlaceholderText('DELETE');
      await user.type(confirmInput, 'DELETE');
      await user.click(screen.getByRole('button', { name: /delete forever/i }));

      await waitFor(() => {
        expect(mockRpc).toHaveBeenCalledWith('delete_own_account');
      });
    });

    it('signs out user after successful deletion', async () => {
      const user = userEvent.setup();
      mockRpc.mockResolvedValue({ data: { success: true }, error: null });

      renderProfileModal();

      await user.click(screen.getByRole('button', { name: /delete account/i }));
      const confirmInput = screen.getByPlaceholderText('DELETE');
      await user.type(confirmInput, 'DELETE');
      await user.click(screen.getByRole('button', { name: /delete forever/i }));

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
      });
    });

    it('navigates to home after successful deletion', async () => {
      const user = userEvent.setup();
      mockRpc.mockResolvedValue({ data: { success: true }, error: null });

      renderProfileModal();

      await user.click(screen.getByRole('button', { name: /delete account/i }));
      const confirmInput = screen.getByPlaceholderText('DELETE');
      await user.type(confirmInput, 'DELETE');
      await user.click(screen.getByRole('button', { name: /delete forever/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    it('handles RPC error gracefully', async () => {
      const user = userEvent.setup();
      const { toast } = await import('sonner');
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      renderProfileModal();

      await user.click(screen.getByRole('button', { name: /delete account/i }));
      const confirmInput = screen.getByPlaceholderText('DELETE');
      await user.type(confirmInput, 'DELETE');
      await user.click(screen.getByRole('button', { name: /delete forever/i }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Database error');
      });
    });

    it('handles function returning success: false', async () => {
      const user = userEvent.setup();
      const { toast } = await import('sonner');
      mockRpc.mockResolvedValue({
        data: { success: false, error: 'Not authenticated' },
        error: null
      });

      renderProfileModal();

      await user.click(screen.getByRole('button', { name: /delete account/i }));
      const confirmInput = screen.getByPlaceholderText('DELETE');
      await user.type(confirmInput, 'DELETE');
      await user.click(screen.getByRole('button', { name: /delete forever/i }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Not authenticated');
      });

      // Should NOT sign out on failure
      expect(mockSignOut).not.toHaveBeenCalled();
    });

    it('can cancel deletion', async () => {
      const user = userEvent.setup();
      renderProfileModal();

      // Open delete confirmation
      await user.click(screen.getByRole('button', { name: /delete account/i }));
      expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument();

      // Cancel
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      // Confirmation should be hidden
      expect(screen.queryByText(/this action cannot be undone/i)).not.toBeInTheDocument();
    });
  });
});
