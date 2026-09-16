import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { muiTheme } from '@/theme/muiTheme';
import OAuthConsent from './OAuthConsent';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Mock the useOAuthConsent hook with vi.hoisted
const { mockHookReturn } = vi.hoisted(() => ({
  mockHookReturn: {
    isLoading: false,
    error: null,
    authorizationDetails: {
      client_id: 'test-client',
      client_name: 'Test Application',
      redirect_uri: 'https://example.com/callback',
      scopes: ['openid', 'email', 'profile'],
    },
    isProcessing: false,
    isAutoApproving: false,
    handleApprove: vi.fn(),
    handleCancel: vi.fn(),
  },
}));

vi.mock('@/hooks/useOAuthConsent', () => ({
  useOAuthConsent: () => mockHookReturn,
}));

const renderOAuthConsent = () => {
  return render(
    <BrowserRouter>
      <MuiThemeProvider theme={muiTheme} defaultMode="light" noSsr>
        <OAuthConsent />
      </MuiThemeProvider>
    </BrowserRouter>
  );
};

describe('OAuthConsent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default state
    mockHookReturn.isLoading = false;
    mockHookReturn.error = null;
    mockHookReturn.authorizationDetails = {
      client_id: 'test-client',
      client_name: 'Test Application',
      redirect_uri: 'https://example.com/callback',
      scopes: ['openid', 'email', 'profile'],
    };
    mockHookReturn.isProcessing = false;
    mockHookReturn.isAutoApproving = false;
    mockHookReturn.handleApprove = vi.fn();
    mockHookReturn.handleCancel = vi.fn();
  });

  describe('Rendering', () => {
    it('renders the username creation page', () => {
      renderOAuthConsent();

      expect(screen.getByText('Create Your Forum Username')).toBeInTheDocument();
    });

    it('displays the description text', () => {
      renderOAuthConsent();

      expect(screen.getByText(/Choose a username to use on the Open Ham Prep forum/)).toBeInTheDocument();
    });

    it('renders the forum username input', () => {
      renderOAuthConsent();

      // Queried by role, not text: MUI's outlined TextField renders the label
      // twice — once as the <label>, once in the <legend> that notches the
      // border — so getByText finds two.
      expect(screen.getByRole('textbox', { name: 'Forum Username' })).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Choose a username')).toBeInTheDocument();
    });

    it('renders Continue and Cancel buttons', () => {
      renderOAuthConsent();

      expect(screen.getByRole('button', { name: /continue to forum/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('shows username requirements hint', () => {
      renderOAuthConsent();

      expect(screen.getByText(/3-20 characters/)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls handleCancel when Cancel button is clicked', async () => {
      const user = userEvent.setup();
      renderOAuthConsent();

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(mockHookReturn.handleCancel).toHaveBeenCalled();
    });

    it('calls handleApprove when Continue button is clicked with forum username', async () => {
      const user = userEvent.setup();
      renderOAuthConsent();

      // Enter a forum username
      const input = screen.getByPlaceholderText('Choose a username');
      await user.type(input, 'testuser');

      // Click continue
      await user.click(screen.getByRole('button', { name: /continue to forum/i }));

      expect(mockHookReturn.handleApprove).toHaveBeenCalledWith('testuser');
    });

    it('disables Continue button when forum username is empty', () => {
      renderOAuthConsent();

      const continueButton = screen.getByRole('button', { name: /continue to forum/i });
      expect(continueButton).toBeDisabled();
    });

    it('enables Continue button when forum username is entered', async () => {
      const user = userEvent.setup();
      renderOAuthConsent();

      const input = screen.getByPlaceholderText('Choose a username');
      await user.type(input, 'testuser');

      const continueButton = screen.getByRole('button', { name: /continue to forum/i });
      expect(continueButton).not.toBeDisabled();
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner when isLoading is true', () => {
      mockHookReturn.isLoading = true;
      mockHookReturn.authorizationDetails = null;

      renderOAuthConsent();

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('shows connecting message when isAutoApproving is true', () => {
      mockHookReturn.isLoading = false;
      mockHookReturn.isAutoApproving = true;

      renderOAuthConsent();

      expect(screen.getByText('Connecting to the forum...')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('displays error message when there is an error', () => {
      mockHookReturn.error = 'Test error message';
      mockHookReturn.authorizationDetails = null;

      renderOAuthConsent();

      expect(screen.getByText('Authorization Error')).toBeInTheDocument();
      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    it('shows Go Back button in error state', () => {
      mockHookReturn.error = 'Test error message';
      mockHookReturn.authorizationDetails = null;

      renderOAuthConsent();

      expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument();
    });
  });

  describe('Processing State', () => {
    it('disables Continue button when isProcessing is true', async () => {
      const user = userEvent.setup();
      mockHookReturn.isProcessing = false;

      renderOAuthConsent();

      // Enter username first
      const input = screen.getByPlaceholderText('Choose a username');
      await user.type(input, 'testuser');

      // Now set processing
      mockHookReturn.isProcessing = true;

      // Re-render to pick up change
      renderOAuthConsent();

      expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
    });

    it('disables Cancel button when isProcessing is true', () => {
      mockHookReturn.isProcessing = true;

      renderOAuthConsent();

      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    });

    it('shows Saving... text on Continue button during processing', () => {
      mockHookReturn.isProcessing = true;

      renderOAuthConsent();

      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('disables username input when isProcessing is true', () => {
      mockHookReturn.isProcessing = true;

      renderOAuthConsent();

      const input = screen.getByPlaceholderText('Choose a username');
      expect(input).toBeDisabled();
    });
  });

  describe('Null Authorization Details', () => {
    it('returns null when authorizationDetails is null and not loading/error', () => {
      mockHookReturn.authorizationDetails = null;

      const { container } = renderOAuthConsent();

      expect(container.firstChild).toBeNull();
    });
  });
});
