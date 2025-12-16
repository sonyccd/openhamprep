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
    forumUsername: null,
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

  describe('Rendering', () => {
    it('renders the profile modal when open', () => {
      renderProfileModal();

      expect(screen.getByText('Profile Settings')).toBeInTheDocument();
      expect(screen.getByText('Display Name')).toBeInTheDocument();
      expect(screen.getByText('Email Address')).toBeInTheDocument();
      expect(screen.getByText('Password')).toBeInTheDocument();
      expect(screen.getByText('Theme')).toBeInTheDocument();
      expect(screen.getByText('Danger Zone')).toBeInTheDocument();
    });

    it('displays user info', () => {
      renderProfileModal();

      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText(/Current: test@example.com/)).toBeInTheDocument();
    });

    it('shows "Not set" when display name is null', () => {
      renderProfileModal({
        userInfo: { displayName: null, email: 'test@example.com', forumUsername: null },
      });

      expect(screen.getAllByText('Not set').length).toBeGreaterThanOrEqual(1);
    });

    it('renders the Forum Username section', () => {
      renderProfileModal();

      expect(screen.getByText('Forum Username')).toBeInTheDocument();
    });
  });

  describe('Display Name Update', () => {
    it('allows editing display name', async () => {
      const user = userEvent.setup();
      renderProfileModal();

      // Get all Edit buttons and click the first one (Display Name)
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await user.click(editButtons[0]);

      const input = screen.getByPlaceholderText('Enter your display name');
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue('Test User');
    });

    it('allows cancelling edit', async () => {
      const user = userEvent.setup();
      renderProfileModal();

      // Get all Edit buttons and click the first one (Display Name)
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await user.click(editButtons[0]);
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(screen.queryByPlaceholderText('Enter your display name')).not.toBeInTheDocument();
    });
  });

  describe('Email Update', () => {
    it('has email input field', () => {
      renderProfileModal();

      const emailInput = screen.getByPlaceholderText('Enter new email address');
      expect(emailInput).toBeInTheDocument();
    });

    it('change button is disabled when email is empty', () => {
      renderProfileModal();

      const changeButton = screen.getByRole('button', { name: /change/i });
      expect(changeButton).toBeDisabled();
    });

    it('enables change button when email is entered', async () => {
      const user = userEvent.setup();
      renderProfileModal();

      const emailInput = screen.getByPlaceholderText('Enter new email address');
      await user.type(emailInput, 'new@example.com');

      const changeButton = screen.getByRole('button', { name: /change/i });
      expect(changeButton).not.toBeDisabled();
    });
  });

  describe('Password Reset', () => {
    it('has password reset button', () => {
      renderProfileModal();

      const resetButton = screen.getByRole('button', { name: /send password reset email/i });
      expect(resetButton).toBeInTheDocument();
    });
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
