import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Admin from './Admin';

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user-123' },
    loading: false,
  })),
}));

// Mock useAdmin
vi.mock('@/hooks/useAdmin', () => ({
  useAdmin: vi.fn(() => ({
    isAdmin: true,
    isLoading: false,
  })),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock admin components
vi.mock('@/components/admin/AdminGlossary', () => ({
  AdminGlossary: () => <div data-testid="admin-glossary">Admin Glossary Component</div>,
}));

vi.mock('@/components/admin/AdminQuestions', () => ({
  AdminQuestions: ({ testType }: { testType: string }) => (
    <div data-testid="admin-questions">Admin Questions - {testType}</div>
  ),
}));

vi.mock('@/components/admin/AdminStats', () => ({
  AdminStats: ({ testType }: { testType: string }) => (
    <div data-testid="admin-stats">Admin Stats - {testType}</div>
  ),
}));

vi.mock('@/components/admin/AdminExamSessions', () => ({
  AdminExamSessions: () => <div data-testid="admin-exam-sessions">Admin Exam Sessions</div>,
}));

// Mock AppLayout
vi.mock('@/components/AppLayout', () => ({
  AppLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="app-layout">{children}</div>,
}));

import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';

describe('Admin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'user-123' },
      loading: false,
    } as ReturnType<typeof useAuth>);
    vi.mocked(useAdmin).mockReturnValue({
      isAdmin: true,
      isLoading: false,
    });
  });

  const renderAdmin = () => {
    return render(
      <MemoryRouter>
        <Admin />
      </MemoryRouter>
    );
  };

  describe('Loading State', () => {
    it('shows loading spinner when auth is loading', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        loading: true,
      } as ReturnType<typeof useAuth>);

      renderAdmin();

      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('shows loading spinner when admin check is loading', () => {
      vi.mocked(useAdmin).mockReturnValue({
        isAdmin: false,
        isLoading: true,
      });

      renderAdmin();

      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Access Denied', () => {
    it('shows access denied message when user is not admin', () => {
      vi.mocked(useAdmin).mockReturnValue({
        isAdmin: false,
        isLoading: false,
      });

      renderAdmin();

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.getByText(/do not have permission/i)).toBeInTheDocument();
    });
  });

  describe('Redirect to Auth', () => {
    it('redirects to auth when user is not logged in', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        loading: false,
      } as ReturnType<typeof useAuth>);

      renderAdmin();

      expect(mockNavigate).toHaveBeenCalledWith('/auth');
    });
  });

  describe('Admin Page Content', () => {
    it('displays admin page title', () => {
      renderAdmin();

      expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    it('displays admin page description', () => {
      renderAdmin();

      expect(screen.getByText(/manage glossary terms/i)).toBeInTheDocument();
    });

    it('renders AppLayout wrapper', () => {
      renderAdmin();

      expect(screen.getByTestId('app-layout')).toBeInTheDocument();
    });
  });

  describe('Section Navigation', () => {
    it('displays Exam Content section button', () => {
      renderAdmin();

      expect(screen.getByText('Exam Content')).toBeInTheDocument();
    });

    it('displays Glossary Terms section button', () => {
      renderAdmin();

      expect(screen.getByText('Glossary Terms')).toBeInTheDocument();
    });

    it('displays Exam Sessions section button', () => {
      renderAdmin();

      expect(screen.getByText('Exam Sessions')).toBeInTheDocument();
    });

    it('shows Exam Content section by default', () => {
      renderAdmin();

      expect(screen.getByTestId('admin-stats')).toBeInTheDocument();
    });

    it('switches to Glossary section when clicked', async () => {
      const user = userEvent.setup();
      renderAdmin();

      await user.click(screen.getByText('Glossary Terms'));

      expect(screen.getByTestId('admin-glossary')).toBeInTheDocument();
    });

    it('switches to Exam Sessions section when clicked', async () => {
      const user = userEvent.setup();
      renderAdmin();

      await user.click(screen.getByText('Exam Sessions'));

      expect(screen.getByTestId('admin-exam-sessions')).toBeInTheDocument();
    });
  });

  describe('Tabs in Exam Content', () => {
    it('displays Statistics tab', () => {
      renderAdmin();

      expect(screen.getByRole('tab', { name: /statistics/i })).toBeInTheDocument();
    });

    it('displays Questions tab', () => {
      renderAdmin();

      expect(screen.getByRole('tab', { name: /questions/i })).toBeInTheDocument();
    });

    it('shows Statistics tab content by default', () => {
      renderAdmin();

      expect(screen.getByTestId('admin-stats')).toBeInTheDocument();
    });

    it('switches to Questions tab when clicked', async () => {
      const user = userEvent.setup();
      renderAdmin();

      await user.click(screen.getByRole('tab', { name: /questions/i }));

      expect(screen.getByTestId('admin-questions')).toBeInTheDocument();
    });
  });

  describe('Exam Type Selection', () => {
    it('displays exam type toggle', () => {
      renderAdmin();

      expect(screen.getByText('Tech')).toBeInTheDocument();
      expect(screen.getByText('General')).toBeInTheDocument();
      expect(screen.getByText('Extra')).toBeInTheDocument();
    });

    it('shows technician by default in stats', () => {
      renderAdmin();

      expect(screen.getByTestId('admin-stats')).toHaveTextContent('technician');
    });

    it('changes exam type when toggle is clicked', async () => {
      const user = userEvent.setup();
      renderAdmin();

      await user.click(screen.getByText('General'));

      expect(screen.getByTestId('admin-stats')).toHaveTextContent('general');
    });
  });
});
