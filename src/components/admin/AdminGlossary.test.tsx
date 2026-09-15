import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { AdminGlossary } from './AdminGlossary';
import { muiWrapper } from '@/test/utils/testWrappers';

const mockTerms = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({ order: () => Promise.resolve({ data: mockTerms(), error: null }) }),
      insert: (...args: unknown[]) => {
        mockInsert(...args);
        return Promise.resolve({ error: null });
      },
      update: (...args: unknown[]) => {
        mockUpdate(...args);
        return { eq: () => Promise.resolve({ error: null }) };
      },
      delete: () => {
        mockDelete();
        return { eq: () => Promise.resolve({ error: null }) };
      },
    }),
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'u1', email: 'admin@example.com' } }),
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// Both are separate screens with their own suites.
vi.mock('./BulkImportGlossary', () => ({ BulkImportGlossary: () => <div /> }));
vi.mock('./BulkExport', () => ({
  BulkExport: () => <div />,
  escapeCSVField: (v: string) => v,
}));

const term = (over: Record<string, unknown> = {}) => ({
  id: 't1',
  term: 'Antenna',
  definition: 'A device that radiates radio waves.',
  edit_history: [],
  ...over,
});

const renderAdminGlossary = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{muiWrapper({ children })}</QueryClientProvider>
  );
  return render(<AdminGlossary />, { wrapper });
};

describe('AdminGlossary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTerms.mockReturnValue([term()]);
  });

  describe('list', () => {
    it('shows the term count and each term', async () => {
      renderAdminGlossary();

      expect(await screen.findByText('Antenna')).toBeInTheDocument();
      expect(screen.getByText('Glossary Terms (1)')).toBeInTheDocument();
    });

    it('filters by term and by definition', async () => {
      const user = userEvent.setup();
      mockTerms.mockReturnValue([term(), term({ id: 't2', term: 'Dipole', definition: 'Two poles.' })]);
      renderAdminGlossary();

      await screen.findByText('Antenna');
      await user.type(screen.getByRole('textbox', { name: /search terms/i }), 'two poles');

      expect(screen.getByText('Dipole')).toBeInTheDocument();
      expect(screen.queryByText('Antenna')).not.toBeInTheDocument();
    });

    it('says so when nothing matches', async () => {
      const user = userEvent.setup();
      renderAdminGlossary();

      await screen.findByText('Antenna');
      await user.type(screen.getByRole('textbox', { name: /search terms/i }), 'zzzz');

      expect(screen.getByText('No terms found')).toBeInTheDocument();
    });

    /**
     * The edit button was a bare icon with no aria-label, so every row
     * announced as "button" and nothing else — indistinguishable from the next
     * one. Naming it after its term is the only way to tell them apart.
     */
    it('names each edit button after the term it edits', async () => {
      mockTerms.mockReturnValue([term(), term({ id: 't2', term: 'Dipole' })]);
      renderAdminGlossary();

      expect(await screen.findByRole('button', { name: 'Edit Antenna' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Edit Dipole' })).toBeInTheDocument();
    });
  });

  describe('add dialog', () => {
    it('labels both fields', async () => {
      const user = userEvent.setup();
      renderAdminGlossary();

      await screen.findByText('Antenna');
      await user.click(screen.getByRole('button', { name: /add term/i }));

      expect(screen.getByRole('textbox', { name: 'Term' })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: 'Definition' })).toBeInTheDocument();
    });

    it('keeps submit disabled until both fields are filled', async () => {
      const user = userEvent.setup();
      renderAdminGlossary();

      await screen.findByText('Antenna');
      await user.click(screen.getByRole('button', { name: /add term/i }));

      const submit = screen.getByRole('button', { name: 'Add Term' });
      expect(submit).toBeDisabled();

      await user.type(screen.getByRole('textbox', { name: 'Term' }), 'Balun');
      expect(submit).toBeDisabled();

      await user.type(screen.getByRole('textbox', { name: 'Definition' }), 'A transformer.');
      expect(submit).toBeEnabled();
    });

    /** The leak #302 found: a save closes from the caller, bypassing any close handler. */
    it('reopens blank after a successful save', async () => {
      const user = userEvent.setup();
      renderAdminGlossary();

      await screen.findByText('Antenna');
      await user.click(screen.getByRole('button', { name: /add term/i }));
      await user.type(screen.getByRole('textbox', { name: 'Term' }), 'Balun');
      await user.type(screen.getByRole('textbox', { name: 'Definition' }), 'A transformer.');
      await user.click(screen.getByRole('button', { name: 'Add Term' }));

      // MUI keeps the dialog mounted through its exit transition, and the page
      // behind it stays aria-hidden until that finishes.
      await waitForElementToBeRemoved(() => screen.queryByRole('dialog'));
      await user.click(screen.getByRole('button', { name: /add term/i }));

      expect(screen.getByRole('textbox', { name: 'Term' })).toHaveValue('');
      expect(screen.getByRole('textbox', { name: 'Definition' })).toHaveValue('');
    });
  });

  describe('edit dialog', () => {
    it('opens filled with the chosen term', async () => {
      const user = userEvent.setup();
      renderAdminGlossary();

      await user.click(await screen.findByRole('button', { name: 'Edit Antenna' }));

      expect(screen.getByRole('textbox', { name: 'Term' })).toHaveValue('Antenna');
      expect(screen.getByRole('textbox', { name: 'Definition' })).toHaveValue(
        'A device that radiates radio waves.'
      );
    });

    /**
     * Radix's AlertDialog supplied role="alertdialog" and registered its
     * Description automatically; MUI's Dialog does neither, so ConfirmDeleteDialog
     * carries both by hand (#283).
     */
    it('confirms before deleting, as a named alertdialog', async () => {
      const user = userEvent.setup();
      renderAdminGlossary();

      await user.click(await screen.findByRole('button', { name: 'Edit Antenna' }));
      await user.click(screen.getByRole('button', { name: /delete term/i }));

      const confirm = screen.getByRole('alertdialog');
      expect(confirm).toHaveAccessibleName('Delete Term');
      expect(confirm).toHaveAccessibleDescription(/cannot be undone/i);
      expect(mockDelete).not.toHaveBeenCalled();
    });
  });
});
