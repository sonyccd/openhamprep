import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    forumUsername: null,
    hasExistingConsent: false,
    isProcessing: false,
    isAutoApproving: false,
    handleApprove: vi.fn(),
    handleDeny: vi.fn(),
  },
}));

vi.mock('@/hooks/useOAuthConsent', () => ({
  useOAuthConsent: () => mockHookReturn,
}));

const renderOAuthConsent = () => {
  return render(
    <BrowserRouter>
      <OAuthConsent />
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
    mockHookReturn.forumUsername = null;
    mockHookReturn.hasExistingConsent = false;
    mockHookReturn.isProcessing = false;
    mockHookReturn.isAutoApproving = false;
    mockHookReturn.handleApprove = vi.fn();
    mockHookReturn.handleDeny = vi.fn();
  });

  describe('Rendering', () => {
    it('renders the consent page with client name', () => {
      renderOAuthConsent();

      expect(screen.getByText('Authorize Test Application')).toBeInTheDocument();
    });

    it('displays the description text', () => {
      renderOAuthConsent();

      expect(screen.getByText(/requesting access to your Open Ham Prep account/)).toBeInTheDocument();
    });

    it('shows the requested scopes', () => {
      renderOAuthConsent();

      expect(screen.getByText('Verify your identity')).toBeInTheDocument();
      expect(screen.getByText('View your email address')).toBeInTheDocument();
      expect(screen.getByText('View your profile information')).toBeInTheDocument();
    });

    it('renders the forum username section', () => {
      renderOAuthConsent();

      expect(screen.getByText('Forum Username')).toBeInTheDocument();
    });

    it('shows forum username input when user has no existing username', () => {
      renderOAuthConsent();

      expect(screen.getByPlaceholderText('Choose a username for the forum')).toBeInTheDocument();
    });

    it('renders the remember decision checkbox', () => {
      renderOAuthConsent();

      expect(screen.getByText(/Remember this decision/)).toBeInTheDocument();
    });

    it('renders Authorize and Deny buttons', () => {
      renderOAuthConsent();

      expect(screen.getByRole('button', { name: /authorize/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /deny/i })).toBeInTheDocument();
    });

    it('shows unknown scope as-is when not in scopeDescriptions', () => {
      mockHookReturn.authorizationDetails = {
        client_id: 'test-client',
        client_name: 'Test App',
        redirect_uri: 'https://example.com/callback',
        scopes: ['custom_scope'],
      };

      renderOAuthConsent();

      expect(screen.getByText('custom_scope')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls handleDeny when Deny button is clicked', async () => {
      const user = userEvent.setup();
      renderOAuthConsent();

      await user.click(screen.getByRole('button', { name: /deny/i }));

      expect(mockHookReturn.handleDeny).toHaveBeenCalled();
    });

    it('calls handleApprove when Authorize button is clicked with forum username', async () => {
      const user = userEvent.setup();
      renderOAuthConsent();

      // Enter a forum username
      const input = screen.getByPlaceholderText('Choose a username for the forum');
      await user.type(input, 'testuser');

      // Click authorize
      await user.click(screen.getByRole('button', { name: /authorize/i }));

      expect(mockHookReturn.handleApprove).toHaveBeenCalledWith('testuser', true);
    });

    it('disables Authorize button when forum username is required but empty', () => {
      renderOAuthConsent();

      const authorizeButton = screen.getByRole('button', { name: /authorize/i });
      expect(authorizeButton).toBeDisabled();
    });

    it('allows unchecking the remember decision checkbox', async () => {
      const user = userEvent.setup();
      renderOAuthConsent();

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();

      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });

    it('passes rememberDecision=false when checkbox is unchecked', async () => {
      const user = userEvent.setup();
      renderOAuthConsent();

      // Uncheck the remember decision checkbox
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);

      // Enter a forum username
      const input = screen.getByPlaceholderText('Choose a username for the forum');
      await user.type(input, 'testuser');

      // Click authorize
      await user.click(screen.getByRole('button', { name: /authorize/i }));

      expect(mockHookReturn.handleApprove).toHaveBeenCalledWith('testuser', false);
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner when isLoading is true', () => {
      mockHookReturn.isLoading = true;
      mockHookReturn.authorizationDetails = null;

      renderOAuthConsent();

      expect(screen.getByText('Loading authorization request...')).toBeInTheDocument();
    });

    it('shows auto-approving message when isAutoApproving is true', () => {
      mockHookReturn.isLoading = false;
      mockHookReturn.isAutoApproving = true;

      renderOAuthConsent();

      expect(screen.getByText(/already authorized this app/)).toBeInTheDocument();
      expect(screen.getByText(/Redirecting/)).toBeInTheDocument();
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

  describe('Existing Forum Username', () => {
    it('shows existing forum username when user has one', () => {
      mockHookReturn.forumUsername = 'existinguser';

      renderOAuthConsent();

      expect(screen.getByText('existinguser')).toBeInTheDocument();
      expect(screen.getByText(/You can change this in your profile settings/)).toBeInTheDocument();
    });

    it('does not show username input when user has existing username', () => {
      mockHookReturn.forumUsername = 'existinguser';

      renderOAuthConsent();

      expect(screen.queryByPlaceholderText('Choose a username for the forum')).not.toBeInTheDocument();
    });

    it('enables Authorize button when user has existing username', () => {
      mockHookReturn.forumUsername = 'existinguser';

      renderOAuthConsent();

      const authorizeButton = screen.getByRole('button', { name: /authorize/i });
      expect(authorizeButton).not.toBeDisabled();
    });

    it('passes existing username to handleApprove when user has one', async () => {
      const user = userEvent.setup();
      mockHookReturn.forumUsername = 'existinguser';

      renderOAuthConsent();

      await user.click(screen.getByRole('button', { name: /authorize/i }));

      expect(mockHookReturn.handleApprove).toHaveBeenCalledWith('existinguser', true);
    });
  });

  describe('Processing State', () => {
    it('disables Authorize button when isProcessing is true', () => {
      mockHookReturn.forumUsername = 'testuser';
      mockHookReturn.isProcessing = true;

      renderOAuthConsent();

      expect(screen.getByRole('button', { name: /processing/i })).toBeDisabled();
    });

    it('disables Deny button when isProcessing is true', () => {
      mockHookReturn.forumUsername = 'testuser';
      mockHookReturn.isProcessing = true;

      renderOAuthConsent();

      expect(screen.getByRole('button', { name: /deny/i })).toBeDisabled();
    });

    it('shows Processing... text on Authorize button during processing', () => {
      mockHookReturn.forumUsername = 'testuser';
      mockHookReturn.isProcessing = true;

      renderOAuthConsent();

      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    it('disables username input when isProcessing is true', () => {
      mockHookReturn.isProcessing = true;

      renderOAuthConsent();

      const input = screen.getByPlaceholderText('Choose a username for the forum');
      expect(input).toBeDisabled();
    });

    it('disables remember checkbox when isProcessing is true', () => {
      mockHookReturn.isProcessing = true;

      renderOAuthConsent();

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeDisabled();
    });
  });

  describe('Null Authorization Details', () => {
    it('returns null when authorizationDetails is null and not loading/error', () => {
      mockHookReturn.authorizationDetails = null;

      const { container } = renderOAuthConsent();

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Required Username Indicator', () => {
    it('shows required indicator (*) when user needs to set forum username', () => {
      mockHookReturn.forumUsername = null;

      renderOAuthConsent();

      // The label should have a required indicator
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('does not show required indicator when user has forum username', () => {
      mockHookReturn.forumUsername = 'existinguser';

      renderOAuthConsent();

      expect(screen.queryByText('*')).not.toBeInTheDocument();
    });
  });
});
