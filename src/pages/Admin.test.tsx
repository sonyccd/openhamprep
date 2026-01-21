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

vi.mock('@/components/admin/AdminExamSessions', () => ({
  AdminExamSessions: () => <div data-testid="admin-exam-sessions">Admin Exam Sessions</div>,
}));

vi.mock('@/components/admin/AdminTopics', () => ({
  AdminTopics: () => <div data-testid="admin-topics">Admin Topics</div>,
}));

vi.mock('@/components/admin/AdminLessons', () => ({
  AdminLessons: () => <div data-testid="admin-lessons">Admin Lessons</div>,
}));

vi.mock('@/components/admin/AdminChapters', () => ({
  AdminChapters: () => <div data-testid="admin-chapters">Admin Chapters</div>,
}));

vi.mock('@/components/admin/AdminHamRadioTools', () => ({
  AdminHamRadioTools: () => <div data-testid="admin-tools">Admin Ham Radio Tools</div>,
}));

vi.mock('@/components/admin/DiscourseSyncDashboard', () => ({
  DiscourseSyncDashboard: () => <div data-testid="admin-discourse">Discourse Sync Dashboard</div>,
}));

vi.mock('@/components/admin/AdminAlerts', () => ({
  AdminAlerts: () => <div data-testid="admin-alerts">Admin Alerts</div>,
}));

vi.mock('@/components/admin/AdminAlertRules', () => ({
  AdminAlertRules: () => <div data-testid="admin-alert-rules">Admin Alert Rules</div>,
}));

vi.mock('@/hooks/useAlerts', () => ({
  useUnacknowledgedAlertCount: () => ({ data: 3 }),
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

    it('renders AppLayout wrapper', () => {
      renderAdmin();

      expect(screen.getByTestId('app-layout')).toBeInTheDocument();
    });
  });

  describe('Section Navigation', () => {
    it('displays Questions section button', () => {
      renderAdmin();

      // The nav button has icon + text (text hidden on mobile)
      expect(screen.getByRole('button', { name: /questions/i })).toBeInTheDocument();
    });

    it('displays Glossary section button', () => {
      renderAdmin();

      expect(screen.getByRole('button', { name: /glossary/i })).toBeInTheDocument();
    });

    it('displays Sessions section button', () => {
      renderAdmin();

      expect(screen.getByRole('button', { name: /sessions/i })).toBeInTheDocument();
    });

    it('shows Questions (Exam) section by default', () => {
      renderAdmin();

      expect(screen.getByTestId('admin-questions')).toBeInTheDocument();
    });

    it('switches to Glossary section when clicked', async () => {
      const user = userEvent.setup();
      renderAdmin();

      await user.click(screen.getByRole('button', { name: /glossary/i }));

      expect(screen.getByTestId('admin-glossary')).toBeInTheDocument();
    });

    it('switches to Sessions section when clicked', async () => {
      const user = userEvent.setup();
      renderAdmin();

      await user.click(screen.getByRole('button', { name: /sessions/i }));

      expect(screen.getByTestId('admin-exam-sessions')).toBeInTheDocument();
    });
  });

  describe('Exam Section', () => {
    it('shows AdminQuestions by default', () => {
      renderAdmin();

      expect(screen.getByTestId('admin-questions')).toBeInTheDocument();
    });

    it('displays exam type toggle', () => {
      renderAdmin();

      expect(screen.getByText('Tech')).toBeInTheDocument();
      expect(screen.getByText('General')).toBeInTheDocument();
      expect(screen.getByText('Extra')).toBeInTheDocument();
    });

    it('shows technician by default', () => {
      renderAdmin();

      expect(screen.getByTestId('admin-questions')).toHaveTextContent('technician');
    });

    it('changes exam type when toggle is clicked', async () => {
      const user = userEvent.setup();
      renderAdmin();

      await user.click(screen.getByText('General'));

      expect(screen.getByTestId('admin-questions')).toHaveTextContent('general');
    });
  });

  describe('Learning Section', () => {
    it('displays Learning section button', () => {
      renderAdmin();

      expect(screen.getByRole('button', { name: /learning/i })).toBeInTheDocument();
    });

    it('switches to Learning section with Lessons tab by default', async () => {
      const user = userEvent.setup();
      renderAdmin();

      await user.click(screen.getByRole('button', { name: /learning/i }));

      expect(screen.getByTestId('admin-lessons')).toBeInTheDocument();
    });

    it('shows Lessons and Topics tabs in Learning section', async () => {
      const user = userEvent.setup();
      renderAdmin();

      await user.click(screen.getByRole('button', { name: /learning/i }));

      expect(screen.getByRole('tab', { name: /lessons/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /topics/i })).toBeInTheDocument();
    });

    it('switches to Topics tab when clicked', async () => {
      const user = userEvent.setup();
      renderAdmin();

      await user.click(screen.getByRole('button', { name: /learning/i }));
      await user.click(screen.getByRole('tab', { name: /topics/i }));

      expect(screen.getByTestId('admin-topics')).toBeInTheDocument();
    });
  });

  describe('Alerts Section', () => {
    it('displays Alerts section button', () => {
      renderAdmin();

      expect(screen.getByRole('button', { name: /alerts/i })).toBeInTheDocument();
    });

    it('shows unacknowledged alert count badge', () => {
      renderAdmin();

      // The badge should show "3" from our mock
      const alertsButton = screen.getByRole('button', { name: /alerts/i });
      expect(alertsButton).toContainHTML('3');
    });

    it('switches to Alerts section with Alerts tab by default', async () => {
      const user = userEvent.setup();
      renderAdmin();

      await user.click(screen.getByRole('button', { name: /alerts/i }));

      expect(screen.getByTestId('admin-alerts')).toBeInTheDocument();
    });

    it('shows Alerts and Alert Rules tabs in Alerts section', async () => {
      const user = userEvent.setup();
      renderAdmin();

      await user.click(screen.getByRole('button', { name: /alerts/i }));

      expect(screen.getByRole('tab', { name: /^alerts$/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /alert rules/i })).toBeInTheDocument();
    });

    it('switches to Alert Rules tab when clicked', async () => {
      const user = userEvent.setup();
      renderAdmin();

      await user.click(screen.getByRole('button', { name: /alerts/i }));
      await user.click(screen.getByRole('tab', { name: /alert rules/i }));

      expect(screen.getByTestId('admin-alert-rules')).toBeInTheDocument();
    });
  });

  describe('Additional Sections', () => {
    it('displays Chapters section button', () => {
      renderAdmin();

      expect(screen.getByRole('button', { name: /chapters/i })).toBeInTheDocument();
    });

    it('switches to Chapters section when clicked', async () => {
      const user = userEvent.setup();
      renderAdmin();

      await user.click(screen.getByRole('button', { name: /chapters/i }));

      expect(screen.getByTestId('admin-chapters')).toBeInTheDocument();
    });

    it('displays Tools section button', () => {
      renderAdmin();

      expect(screen.getByRole('button', { name: /tools/i })).toBeInTheDocument();
    });

    it('switches to Tools section when clicked', async () => {
      const user = userEvent.setup();
      renderAdmin();

      await user.click(screen.getByRole('button', { name: /tools/i }));

      expect(screen.getByTestId('admin-tools')).toBeInTheDocument();
    });

    it('displays Discourse section button', () => {
      renderAdmin();

      expect(screen.getByRole('button', { name: /discourse/i })).toBeInTheDocument();
    });

    it('switches to Discourse section when clicked', async () => {
      const user = userEvent.setup();
      renderAdmin();

      await user.click(screen.getByRole('button', { name: /discourse/i }));

      expect(screen.getByTestId('admin-discourse')).toBeInTheDocument();
    });
  });
});
