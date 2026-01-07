import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
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
    functions: {
      invoke: vi.fn(() => Promise.resolve({ data: null, error: null })),
    },
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

// Helper to click a menu item by its label text
const clickMenuItem = async (user: ReturnType<typeof userEvent.setup>, label: string) => {
  const menuItems = screen.getAllByRole('button');
  const menuItem = menuItems.find(btn => {
    const textContent = btn.textContent || '';
    return textContent.includes(label) && !textContent.includes('Forever');
  });
  if (menuItem) {
    await user.click(menuItem);
  }
};

describe('ProfileModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignOut.mockResolvedValue({ error: null });
  });

  describe('Rendering', () => {
    it('renders the profile modal when open', () => {
      renderProfileModal();

      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Account')).toBeInTheDocument();
      expect(screen.getByText('Appearance')).toBeInTheDocument();
      // The delete account menu item
      expect(screen.getByText('Delete Account')).toBeInTheDocument();
    });

    it('displays user info', () => {
      renderProfileModal();

      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('shows "User" when display name is null', () => {
      renderProfileModal({
        userInfo: { displayName: null, email: 'test@example.com', forumUsername: null },
      });

      expect(screen.getByText('User')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('navigates to Account view when Account menu item is clicked', async () => {
      const user = userEvent.setup();
      renderProfileModal();

      // Find and click the Account menu item (has "Name, email, password" description)
      const accountMenuItem = screen.getByText('Name, email, password').closest('button');
      await user.click(accountMenuItem!);

      expect(screen.getByText('Display Name')).toBeInTheDocument();
      expect(screen.getByText('Forum Username')).toBeInTheDocument();
      expect(screen.getByText('Email Address')).toBeInTheDocument();
      expect(screen.getByText('Password')).toBeInTheDocument();
    });

    it('navigates to Appearance view when Appearance is clicked', async () => {
      const user = userEvent.setup();
      renderProfileModal();

      // Find and click the Appearance menu item (has "Theme preferences" description)
      const appearanceMenuItem = screen.getByText('Theme preferences').closest('button');
      await user.click(appearanceMenuItem!);

      expect(screen.getByText('Theme')).toBeInTheDocument();
    });

    it('navigates to Delete Account view when Delete Account is clicked', async () => {
      const user = userEvent.setup();
      renderProfileModal();

      // Find the Delete Account menu item in main view (not the destructive button in danger view)
      const deleteMenuItem = screen.getByText('Delete Account').closest('button');
      await user.click(deleteMenuItem!);

      expect(screen.getByText(/delete your account permanently/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('DELETE')).toBeInTheDocument();
    });

    it('can navigate back from sub-views', async () => {
      const user = userEvent.setup();
      renderProfileModal();

      // Navigate to Account view
      const accountMenuItem = screen.getByText('Name, email, password').closest('button');
      await user.click(accountMenuItem!);
      expect(screen.getByText('Display Name')).toBeInTheDocument();

      // Find and click back button (has rotate-180 chevron)
      const backButtons = screen.getAllByRole('button');
      const backButton = backButtons.find(btn => btn.querySelector('.rotate-180'));
      await user.click(backButton!);

      // Should be back on main view
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Manage your profile and preferences')).toBeInTheDocument();
    });
  });

  describe('Display Name Update', () => {
    it('allows editing display name in Account view', async () => {
      const user = userEvent.setup();
      renderProfileModal();

      // Navigate to Account view
      const accountMenuItem = screen.getByText('Name, email, password').closest('button');
      await user.click(accountMenuItem!);

      // Click on the display name field to edit (contains "Test User" and "Edit")
      const displayNameSection = screen.getByText('Test User').closest('button');
      await user.click(displayNameSection!);

      const input = screen.getByPlaceholderText('Enter your name');
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue('Test User');
    });

    it('allows cancelling edit', async () => {
      const user = userEvent.setup();
      renderProfileModal();

      // Navigate to Account view
      const accountMenuItem = screen.getByText('Name, email, password').closest('button');
      await user.click(accountMenuItem!);

      // Click on the display name field to edit
      const displayNameSection = screen.getByText('Test User').closest('button');
      await user.click(displayNameSection!);

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(screen.queryByPlaceholderText('Enter your name')).not.toBeInTheDocument();
    });
  });

  describe('Email Update', () => {
    it('has email input field in Account view', async () => {
      const user = userEvent.setup();
      renderProfileModal();

      // Navigate to Account view
      const accountMenuItem = screen.getByText('Name, email, password').closest('button');
      await user.click(accountMenuItem!);

      const emailInput = screen.getByPlaceholderText('Enter new email');
      expect(emailInput).toBeInTheDocument();
    });

    it('change button is disabled when email is empty', async () => {
      const user = userEvent.setup();
      renderProfileModal();

      // Navigate to Account view
      const accountMenuItem = screen.getByText('Name, email, password').closest('button');
      await user.click(accountMenuItem!);

      const changeButton = screen.getByRole('button', { name: /change email/i });
      expect(changeButton).toBeDisabled();
    });

    it('enables change button when email is entered', async () => {
      const user = userEvent.setup();
      renderProfileModal();

      // Navigate to Account view
      const accountMenuItem = screen.getByText('Name, email, password').closest('button');
      await user.click(accountMenuItem!);

      const emailInput = screen.getByPlaceholderText('Enter new email');
      await user.type(emailInput, 'new@example.com');

      const changeButton = screen.getByRole('button', { name: /change email/i });
      expect(changeButton).not.toBeDisabled();
    });
  });

  describe('Password Reset', () => {
    it('has password reset button in Account view', async () => {
      const user = userEvent.setup();
      renderProfileModal();

      // Navigate to Account view
      const accountMenuItem = screen.getByText('Name, email, password').closest('button');
      await user.click(accountMenuItem!);

      const resetButton = screen.getByRole('button', { name: /send reset link/i });
      expect(resetButton).toBeInTheDocument();
    });
  });

  describe('Account Deletion', () => {
    it('shows delete confirmation when navigating to Delete Account', async () => {
      const user = userEvent.setup();
      renderProfileModal();

      // Find and click the Delete Account menu item
      const deleteMenuItem = screen.getByText('Delete Account').closest('button');
      await user.click(deleteMenuItem!);

      expect(screen.getByText(/delete your account permanently/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('DELETE')).toBeInTheDocument();
    });

    it('requires typing DELETE to confirm deletion', async () => {
      const user = userEvent.setup();
      renderProfileModal();

      // Navigate to Delete Account view
      const deleteMenuItem = screen.getByText('Delete Account').closest('button');
      await user.click(deleteMenuItem!);

      // The delete button should be disabled initially
      expect(screen.getByRole('button', { name: /delete account forever/i })).toBeDisabled();

      // The input should have DELETE placeholder
      expect(screen.getByPlaceholderText('DELETE')).toBeInTheDocument();
    });

    it('calls RPC delete_own_account when confirmed', async () => {
      const user = userEvent.setup();
      mockRpc.mockResolvedValue({ data: { success: true }, error: null });

      renderProfileModal();

      // Navigate to Delete Account view
      const deleteMenuItem = screen.getByText('Delete Account').closest('button');
      await user.click(deleteMenuItem!);

      // Type DELETE and confirm
      const confirmInput = screen.getByRole('textbox');
      fireEvent.change(confirmInput, { target: { value: 'DELETE' } });
      await user.click(screen.getByRole('button', { name: /delete account forever/i }));

      await waitFor(() => {
        expect(mockRpc).toHaveBeenCalledWith('delete_own_account');
      });
    });

    it('signs out user after successful deletion', async () => {
      const user = userEvent.setup();
      mockRpc.mockResolvedValue({ data: { success: true }, error: null });

      renderProfileModal();

      const deleteMenuItem = screen.getByText('Delete Account').closest('button');
      await user.click(deleteMenuItem!);
      const confirmInput = screen.getByRole('textbox');
      fireEvent.change(confirmInput, { target: { value: 'DELETE' } });
      await user.click(screen.getByRole('button', { name: /delete account forever/i }));

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
      });
    });

    it('navigates to home after successful deletion', async () => {
      const user = userEvent.setup();
      mockRpc.mockResolvedValue({ data: { success: true }, error: null });

      renderProfileModal();

      const deleteMenuItem = screen.getByText('Delete Account').closest('button');
      await user.click(deleteMenuItem!);
      const confirmInput = screen.getByRole('textbox');
      fireEvent.change(confirmInput, { target: { value: 'DELETE' } });
      await user.click(screen.getByRole('button', { name: /delete account forever/i }));

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

      const deleteMenuItem = screen.getByText('Delete Account').closest('button');
      await user.click(deleteMenuItem!);
      const confirmInput = screen.getByRole('textbox');
      fireEvent.change(confirmInput, { target: { value: 'DELETE' } });
      await user.click(screen.getByRole('button', { name: /delete account forever/i }));

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

      const deleteMenuItem = screen.getByText('Delete Account').closest('button');
      await user.click(deleteMenuItem!);
      const confirmInput = screen.getByRole('textbox');
      fireEvent.change(confirmInput, { target: { value: 'DELETE' } });
      await user.click(screen.getByRole('button', { name: /delete account forever/i }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Not authenticated');
      });

      // Should NOT sign out on failure
      expect(mockSignOut).not.toHaveBeenCalled();
    });

    it('can go back from delete view', async () => {
      const user = userEvent.setup();
      renderProfileModal();

      // Navigate to Delete Account view
      const deleteMenuItem = screen.getByText('Delete Account').closest('button');
      await user.click(deleteMenuItem!);
      expect(screen.getByText(/delete your account permanently/i)).toBeInTheDocument();

      // Find and click back button
      const backButtons = screen.getAllByRole('button');
      const backButton = backButtons.find(btn => btn.querySelector('.rotate-180'));
      await user.click(backButton!);

      // Should be back on main view
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });
  });
});
